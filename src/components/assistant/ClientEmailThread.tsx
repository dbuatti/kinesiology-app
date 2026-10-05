import { useState, useEffect, useCallback, useRef } from "react";
import { fetchContactMarks, saveContactMark } from "@/lib/inbox-marks";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { extractFnError } from "@/lib/function-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmailTemplatePicker from "@/components/assistant/EmailTemplatePicker";
import BookingProposalCard from "@/components/assistant/BookingProposalCard";
import { PendingBooking } from "@/types/assistant";
import { Mail, Loader2, Send, RefreshCw, CalendarClock, Sparkles, PenSquare, LayoutDashboard, Zap, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { splitQuotedReply, TIME_HINTS } from "@/lib/inbox-conversations";

// A simple, deliberately conservative confirmation hint — never auto-books,
// just draws the eye to a reply that LOOKS like a yes so the practitioner can
// confirm in one click instead of having to notice the connection themselves.
const CONFIRMATION_HINTS = /\b(yes|yep|yeah|sounds (great|good|perfect)|works? for me|that works|perfect|great,? (see|thanks)|book(ed)? it|confirmed?|sure|great)\b/i;

interface ThreadMessage {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  subject: string;
  date: string;
  body: string;
  messageIdHeader: string;
}

interface ThreadSummary {
  id: string;
  subject: string;
  lastDate: string;
  lastDirection: "inbound" | "outbound";
  messageCount: number;
}

interface Props {
  clientId: string;
  clientEmail: string | null;
  clientName: string;
  // Fresh-compose mode (Inbox → Compose): the composer opens on a blank new
  // email instead of auto-loading the client's latest thread. Past threads
  // are still listed in the dropdown to dip into, and picking one switches to
  // a normal threaded view.
  composeMode?: boolean;
  // Inbox rows: open on exactly this conversation — possibly several Gmail
  // threads merged — rather than whatever thread with the client is newest
  // (which could be an unrelated booking confirmation, so replies landed in
  // the wrong thread and the original stayed "Needs reply").
  threadIds?: string[];
  // The inbox shows its own status; hide the per-client status picker there.
  hideStatus?: boolean;
  // Pre-fills the "Suggest reply" steer, e.g. for a follow-up.
  initialGoal?: string;
  // Inline in page flow (Inbox rows, Compose) instead of filling a fixed-height
  // parent: the messages get their own capped scroll area and the booking
  // card + composer flow below, so a proposal can't squeeze the history away.
  inline?: boolean;
}

// One conversation status for everyone (Phase 5): needs reply / waiting on
// them come from the thread itself; Done and Booked are the Inbox's marks
// (inbox_contact_state, keyed by email), which reopen when the person writes again.
type Status = "needs_reply" | "awaiting_client" | "done" | "booked";

const STATUS_META: Record<Status, { label: string; dotClass: string }> = {
  needs_reply: { label: "Needs reply", dotClass: "bg-chart-destructive" },
  awaiting_client: { label: "Waiting on them", dotClass: "bg-chart-amber" },
  done: { label: "Done", dotClass: "bg-chart-emerald" },
  booked: { label: "Booked in", dotClass: "bg-chart-primary" },
};

const NEW_EMAIL_VALUE = "__new__";

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Melbourne" }) +
    " · " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
}

export default function ClientEmailThread({ clientId, clientEmail, clientName, composeMode = false, threadIds, hideStatus = false, initialGoal = "", inline = false }: Props) {
  const firstName = clientName.split(" ")[0];
  // Voice-only students are still addressed by a "voice:<email>" pseudo-id here.
  const hasClientRecord = !clientId.startsWith("voice:");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadMeta, setThreadMeta] = useState<{ threadId: string | null; lastMessageId: string | null; references: string | null; lastSubject: string | null; practitionerFrom: string | null }>({ threadId: null, lastMessageId: null, references: null, lastSubject: null, practitionerFrom: null });
  const [status, setStatus] = useState<Status | null>(null);
  const [subject, setSubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<{ iso: string; label: string }[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  // Free-text steer for "Suggest reply" — e.g. "offer Thu/Fri this week,
  // then Mon/Tue next week, pencil him in for 10am if he goes for that".
  // The backend already supported a `goal` param for this; nothing in the
  // UI ever sent one until now.
  const [suggestGoal, setSuggestGoal] = useState(initialGoal);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  // Stable across renders so `load` doesn't re-run on every parent render.
  const threadIdsKey = (threadIds || []).join(",");
  const [pendingProposal, setPendingProposal] = useState<PendingBooking | null>(null);
  const [bookingFromEmail, setBookingFromEmail] = useState(false);
  // What "Book the time they asked for" found — shown above the confirm card.
  const [bookedFrom, setBookedFrom] = useState<{ when: string; quote: string | null; available: boolean | null; note: string | null } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Without this, a loaded thread renders scrolled to the OLDEST message —
  // the practitioner's own latest reply sits below the fold and looks
  // missing ("Lauren still doesn't show my reply" was this, not a data bug:
  // the reply was in the DOM, just never scrolled into view). Depends only on
  // messages.length (a genuinely new load/reply), same convention as
  // MessageList.tsx's own scroll effect, to avoid re-triggering on unrelated
  // state changes.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Surfaces an existing pencilled-in slot (from propose_booking, in chat)
  // right here next to their real reply, so confirming a client's "yes that
  // works" is one click instead of hunting back through the AI Chat tab to
  // find the proposal card again.
  const loadPendingProposal = useCallback(async () => {
    const isVoice = clientId.startsWith("voice:");
    // A person with a record can have kinesiology proposals (by client_id) and
    // lesson proposals (by email) — look for either, upcoming only.
    const emails = [...new Set([clientEmail, clientEmail?.toLowerCase()].filter(Boolean))] as string[];
    const filters = [
      !isVoice ? `client_id.eq.${clientId}` : null,
      ...emails.map((e) => `student_email.eq."${e.replace(/"/g, "")}"`),
    ].filter(Boolean).join(",");
    if (!filters) { setPendingProposal(null); return; }
    const { data } = await supabase.from("booking_proposals").select("*")
      .eq("status", "proposed")
      .gte("slot_start", new Date().toISOString())
      .or(filters)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) { setPendingProposal(null); return; }
    setPendingProposal({
      client_id: data.client_id,
      voice_student_email: data.student_email,
      client_name: data.student_name || clientName,
      start_iso: data.slot_start,
      event_type_id: data.event_type_id ? Number(data.event_type_id) : null,
      notes: data.reason,
      discipline: data.discipline ?? null,
      proposal_id: data.id,
      reschedule_uid: data.reschedule_uid ?? null,
      reschedule_from: data.reschedule_from ?? null,
    });
  }, [clientId, clientEmail, clientName]);

  useEffect(() => { loadPendingProposal(); }, [loadPendingProposal]);

  // `explicitThreadId` (the dropdown) wins; otherwise the inbox's merged
  // conversation; otherwise the client's most recent thread.
  const load = useCallback(async (explicitThreadId?: string) => {
    if (!clientEmail) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: threadData, error: threadErr }, statusResult] = await Promise.all([
        supabase.functions.invoke("gmail-get-client-thread", {
          body: {
            client_email: clientEmail,
            thread_id: explicitThreadId || undefined,
            thread_ids: !explicitThreadId && threadIdsKey ? threadIdsKey.split(",") : undefined,
          },
        }),
        fetchContactMarks(),
      ]);
      const mark = clientEmail ? statusResult.marks[clientEmail.toLowerCase()] : undefined;
      if (threadErr) throw threadErr;
      if (threadData?.error) throw new Error(threadData.error);

      // In compose mode the load with no explicit thread (initial mount, or
      // after sending) must NOT yank the client's latest conversation into the
      // view — that's what made "Compose → Maria" land on her old thread notes
      // instead of a blank composer. Keep the thread list populated so the
      // dropdown still offers past conversations, but select none of them.
      const isComposeFresh = composeMode && !explicitThreadId;
      setThreads(threadData.threads || []);
      setMessages(isComposeFresh ? [] : (threadData.messages || []));
      setSelectedThreadId(isComposeFresh ? null : (threadData.thread_id || null));
      setThreadMeta(isComposeFresh
        ? { threadId: null, lastMessageId: null, references: null, lastSubject: null, practitionerFrom: null }
        : {
          threadId: threadData.thread_id,
          lastMessageId: threadData.last_message_id_header,
          references: threadData.last_references_header,
          lastSubject: threadData.last_subject,
          practitionerFrom: threadData.practitioner_from || null,
        });
      // A Done / Booked mark holds until they write again, same as the Inbox.
      const lastInbound = ((threadData.messages || []) as ThreadMessage[])
        .filter((m) => m.direction === "inbound")
        .reduce((t, m) => Math.max(t, new Date(m.date).getTime() || 0), 0);
      const markHolds = mark && lastInbound <= new Date(mark.resolved_at).getTime();
      const suggested = threadData.suggested_status === "needs_reply" || threadData.suggested_status === "awaiting_client" ? threadData.suggested_status : null;
      setStatus(markHolds ? mark.state : suggested);
      setSubject(isComposeFresh
        ? `Hi ${firstName}`
        : threadData.last_subject && threadData.last_subject !== "(no subject)"
          // Portal messages carry an internal subject ("Message from X (Client
          // Portal)") that reads oddly echoed back to the client.
          ? /\(Client Portal\)/.test(threadData.last_subject)
            ? "Re: Your message"
            : (/^re:/i.test(threadData.last_subject) ? threadData.last_subject : `Re: ${threadData.last_subject}`)
          : `Hi ${firstName}`);
    } catch (err: any) {
      showError(err.message || "Couldn't load the email thread.");
    } finally {
      setLoading(false);
    }
  }, [clientEmail, clientId, hasClientRecord, firstName, composeMode, threadIdsKey]);

  useEffect(() => { load(); }, [load]);

  const handleThreadSelect = (value: string) => {
    setReplyBody("");
    setSuggestedSlots(null);
    if (value === NEW_EMAIL_VALUE) {
      setSelectedThreadId(null);
      setMessages([]);
      setThreadMeta({ threadId: null, lastMessageId: null, references: null, lastSubject: null, practitionerFrom: null });
      setSubject(`Hi ${firstName}`);
    } else {
      load(value);
    }
  };

  const handleStatusChange = async (next: Status) => {
    setStatus(next);
    if (!clientEmail) return;
    // Needs reply / waiting are read from the thread; choosing one just clears a mark.
    await saveContactMark(clientEmail, next === "done" || next === "booked" ? next : null);
  };

  const handleSend = async () => {
    if (!clientEmail) return;
    if (!replyBody.trim() || !subject.trim()) {
      showError("Fill in both subject and message.");
      return;
    }
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-send-threaded-reply", {
        body: {
          to: clientEmail,
          subject,
          body: replyBody,
          client_name: clientName,
          thread_id: threadMeta.threadId || undefined,
          in_reply_to: threadMeta.lastMessageId || undefined,
          references: threadMeta.references || undefined,
          reply_from: threadMeta.practitionerFrom || undefined,
          client_id: hasClientRecord ? clientId : null,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Send failed.");
      showSuccess(data?.note ? `Sent to ${clientName}. ${data.note}` : `Sent to ${clientName}.`);
      setReplyBody("");
      await load();
    } catch (err: any) {
      showError(err.message || "Failed to send the email.");
    } finally {
      setIsSending(false);
    }
  };

  // Shared by "Suggest times" (renders as chips) and "Suggest reply" (needs
  // real availability to embed concrete times in the drafted text instead
  // of a vague "let me know what works"). The practitioner's diary can be
  // fully booked for the next couple of weeks — widen the search
  // progressively rather than coming back empty for what's usually the most
  // common case (busy period).
  const fetchAvailableSlots = async (): Promise<{ iso: string; label: string }[]> => {
    const windowsToTry = [14, 45, 90];
    let flat: { iso: string; label: string }[] = [];
    for (const days of windowsToTry) {
      const start = new Date();
      const end = new Date(); end.setDate(end.getDate() + days);
      const { data, error } = await supabase.functions.invoke("get-calcom-slots", {
        body: { start: start.toISOString(), end: end.toISOString(), timeZone: "Australia/Melbourne" },
      });
      if (error || data?.status === "error") throw new Error(data?.message || error?.message || "Couldn't load slots.");
      flat = [];
      for (const entries of Object.values<any>(data.data || {})) {
        for (const e of entries || []) {
          const iso = e.start || e.time;
          if (!iso) continue;
          const d = new Date(iso);
          const label = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" }) +
            " " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
          flat.push({ iso, label });
        }
        if (flat.length >= 20) break;
      }
      if (flat.length > 0) break;
    }
    return flat;
  };

  const handleSuggestTimes = async () => {
    setLoadingSlots(true);
    setSuggestedSlots(null);
    try {
      const flat = await fetchAvailableSlots();
      setSuggestedSlots(flat.length ? flat.slice(0, 8) : null);
      if (flat.length === 0) showError("No open slots found in the next 90 days — check the calendar directly.");
    } catch (err: any) {
      showError(err.message || "Couldn't load suggested times.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSuggestReply = async () => {
    setLoadingSuggestion(true);
    try {
      // Real availability, not invented — lets the model actually answer a
      // scheduling ask in the thread ("do you have Mon/Tue in October?")
      // with concrete matching times instead of a vague "let me know what
      // works", and the optional instruction below lets Daniele steer it
      // directly ("offer Thu/Fri this week, then Mon/Tue next week...")
      // rather than only ever getting the model's own generic guess.
      //
      // Slots are resolved server-side now (suggest-email-reply fetches Cal.com
      // in parallel with the client profile/session context), so this no longer
      // blocks on up to three sequential get-calcom-slots round-trips.
      const { data, error } = await supabase.functions.invoke("suggest-email-reply", {
        body: {
          client_id: hasClientRecord ? clientId : null,
          client_name: clientName,
          client_email: clientEmail || null,
          is_voice: !hasClientRecord,
          thread_messages: messages.map((m) => ({ direction: m.direction, body: m.body })),
          goal: suggestGoal.trim() || undefined,
        },
      });
      // A failed draft comes back as a non-2xx whose real reason is in the
      // response body — show that, not "Edge Function returned a non-2xx…".
      if (error) throw new Error(await extractFnError(error, "Couldn't draft a reply."));
      if (data?.error) throw new Error(data.error);
      setReplyBody(data.body || "");
      if (data.subject) setSubject(data.subject);
      showSuccess("Draft ready — review before sending.");
    } catch (err: any) {
      showError(err.message || "Couldn't draft a reply.");
    } finally {
      setLoadingSuggestion(false);
    }
  };

  // Reads their latest reply, works out the time (and session type/length)
  // they asked for, and pencils it in — then it's one click on Confirm.
  const handleBookFromEmail = async () => {
    setBookingFromEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("assistant-chat", {
        body: {
          mode: "book_from_email",
          client_id: hasClientRecord ? clientId : null,
          voice_student_email: clientEmail || null,
          voice_student_name: clientName,
          thread_messages: messages.map((m) => ({ direction: m.direction, date: m.date, body: m.body })),
        },
      });
      if (error) throw new Error(await extractFnError(error, "Couldn't book from their email."));
      if (data?.error) throw new Error(data.error);
      // "Can't make the 26th" with no new time: say which booking they mean,
      // so the next step (Suggest reply) is obvious.
      if (data?.none) { showError(data.note || "No specific time found in their latest message."); return; }
      if (!data?.pending_booking) throw new Error("Couldn't pencil that in.");
      setPendingProposal(data.pending_booking);
      setBookedFrom({ when: data.summary?.when || "", quote: data.summary?.quote || null, available: data.summary?.available ?? null, note: data.summary?.note || null });
      showSuccess(data.summary?.moving
        ? `Pencilled a move from ${data.summary.moving.when} to ${data.summary?.when || ""} — confirm below to move it.`
        : `Pencilled in ${data.summary?.when || ""} — confirm below to book it.`);
    } catch (err) {
      showError((err as Error)?.message || "Couldn't book from their email.");
    } finally {
      setBookingFromEmail(false);
    }
  };

  const insertSlot = (slot: { iso: string; label: string }) => {
    const sentence = `Would ${slot.label} work for you?`;
    setReplyBody((prev) => (prev.trim() ? `${prev.trim()} ${sentence}` : sentence));
    setSuggestedSlots(null);
  };

  if (!clientEmail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground gap-2 py-16">
        <Mail className="h-8 w-8 opacity-40" />
        <p className="text-sm">This client has no email address on file.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", !inline && "flex-1 min-h-0")}>
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{clientEmail}</span>
        </div>
        <div className="flex items-center gap-2">
          {!hideStatus && <Select value={status || undefined} onValueChange={(v) => handleStatusChange(v as Status)}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[s].dotClass)} />
                    {STATUS_META[s].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { load(selectedThreadId || undefined); loadPendingProposal(); }} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="pb-3">
        <Select value={selectedThreadId || NEW_EMAIL_VALUE} onValueChange={handleThreadSelect}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Choose a conversation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEW_EMAIL_VALUE} className="text-xs">
              <span className="flex items-center gap-1.5"><PenSquare className="h-3 w-3" /> New email (not linked to a previous thread)</span>
            </SelectItem>
            {threads.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                {t.subject} · {fmtDate(t.lastDate)} {t.messageCount > 1 ? `(${t.messageCount})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={scrollContainerRef} className={cn("overflow-y-auto space-y-3 px-1", inline ? "max-h-[min(520px,60vh)]" : "flex-1 min-h-0")}>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {selectedThreadId === null && threads.length > 0
              ? `Starting a new email to ${clientName} — not linked to previous conversations. Use the dropdown above to see past threads.`
              : `No email history with ${clientName} yet — send the first message below.`}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex max-w-[85%]", m.direction === "outbound" ? "ml-auto flex-row-reverse" : "mr-auto")}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                m.direction === "outbound" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm",
              )}>
                <div className="text-[10px] opacity-70 mb-1 font-semibold">{m.direction === "outbound" ? "You" : firstName} · {fmtDate(m.date)}</div>
                {(() => {
                  if (!m.body) return <span className="italic opacity-60">(no readable body)</span>;
                  const { main, quoted } = splitQuotedReply(m.body);
                  const open = expandedQuotes.has(m.id);
                  return (
                    <>
                      {main || quoted}
                      {main && quoted && (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpandedQuotes((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                              return next;
                            })}
                            className="block mt-1.5 text-[11px] font-medium opacity-60 hover:opacity-100"
                            title={open ? "Hide earlier messages" : "Show earlier messages"}
                          >
                            {open ? "Hide quoted text" : "•••"}
                          </button>
                          {open && <div className="mt-1.5 text-xs opacity-70">{quoted}</div>}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* They named a time and nothing's pencilled yet: make booking it the obvious next step. */}
      {!pendingProposal && (() => {
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.direction !== "inbound" || !TIME_HINTS.test(splitQuotedReply(lastMsg.body || "").main || lastMsg.body || "")) return null;
        return (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-chart-emerald/40 bg-chart-emerald/5 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs text-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-chart-emerald" />
              {firstName || clientName} may have picked a time.
            </p>
            <Button size="sm" className="h-7 gap-1.5 bg-chart-emerald text-[11px] hover:bg-chart-emerald/90" onClick={handleBookFromEmail} disabled={bookingFromEmail}>
              {bookingFromEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarPlus className="h-3 w-3" />}
              Book the time they asked for
            </Button>
          </div>
        );
      })()}

      {pendingProposal && (() => {
        const lastMsg = messages[messages.length - 1];
        const looksConfirmed = !!lastMsg && lastMsg.direction === "inbound" && CONFIRMATION_HINTS.test(lastMsg.body || "");
        return (
          <div className="pt-3">
            {bookedFrom && (
              <p className="text-[11px] text-muted-foreground mb-2">
                Read from their email{bookedFrom.quote ? <> — “{bookedFrom.quote}”</> : null}.{" "}
                {pendingProposal.reschedule_uid && <span>This moves their existing booking, it doesn't add a second one. </span>}
                {bookedFrom.note && <span>{bookedFrom.note} </span>}
                {bookedFrom.available === false && (
                  <span className="font-semibold text-chart-destructive">That time isn't open in Cal.com — check the calendar before confirming.</span>
                )}
                {bookedFrom.available === true && <span className="text-chart-emerald">It's free in Cal.com.</span>}
              </p>
            )}
            {looksConfirmed && !bookedFrom && (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-chart-emerald mb-2">
                <Zap className="h-3 w-3" /> Their last reply looks like a yes — confirm below if so.
              </p>
            )}
            <BookingProposalCard
              bookings={[pendingProposal]}
              onResolved={() => { setBookedFrom(null); loadPendingProposal(); }}
            />
          </div>
        );
      })()}

      <div className="pt-3 border-t border-border mt-3 space-y-2">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="text-base md:text-sm h-9" disabled={isSending} />
        {/* Optional steer for "Suggest reply" — the backend already accepted
            a `goal` param, nothing in the UI ever sent one before. Enter
            triggers the same suggestion, same as pressing the button. */}
        <Input
          value={suggestGoal}
          onChange={(e) => setSuggestGoal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSuggestReply(); } }}
          placeholder={'Optional: tell the AI what to suggest, e.g. "offer Thu/Fri this week, then Mon/Tue next week at 10am"'}
          className="text-xs h-8"
          disabled={loadingSuggestion}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={handleSuggestTimes} disabled={loadingSlots}>
            {loadingSlots ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarClock className="h-3 w-3" />}
            Suggest times
          </Button>
          {messages.some((m) => m.direction === "inbound") && !pendingProposal && (
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={handleBookFromEmail} disabled={bookingFromEmail}
              title="Read their latest reply and pencil in the time they asked for">
              {bookingFromEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarPlus className="h-3 w-3" />}
              Book from email
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={handleSuggestReply} disabled={loadingSuggestion}>
            {loadingSuggestion ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Suggest reply
          </Button>
          <EmailTemplatePicker
            clientFirstName={firstName}
            currentSubject={subject}
            currentBody={replyBody}
            onApply={(subj, body) => { if (subj) setSubject(subj); setReplyBody(body); }}
          />
          <Button
            variant="outline" size="sm" className="h-7 text-[11px] gap-1.5"
            onClick={() => {
              const sentence = `You can also view your upcoming sessions and book directly at ${window.location.origin}/portal/login — just enter your email and I'll send you a login link, no password needed.`;
              setReplyBody((prev) => (prev.trim() ? `${prev.trim()} ${sentence}` : sentence));
            }}
          >
            <LayoutDashboard className="h-3 w-3" /> Insert portal link
          </Button>
        </div>
        {suggestedSlots && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {suggestedSlots.map((s) => (
              <button
                key={s.iso}
                onClick={() => insertSlot(s)}
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border border-chart-primary/30 bg-chart-primary/5 text-chart-primary hover:bg-chart-primary/10 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-md">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Message to ${firstName}...`}
            rows={3}
            disabled={isSending}
            className="min-h-0 max-h-40 resize-none border-0 bg-transparent px-3 py-2.5 text-base shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
          />
          <Button onClick={handleSend} disabled={isSending || !replyBody.trim()} size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label="Send email">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          This sends a real email to {clientEmail} — {selectedThreadId && threadMeta.threadId ? "threaded into your existing conversation." : "as a new email."} "Hi {firstName}," and "All the best, Daniele" are added unless your message already has its own greeting or sign-off.
        </p>
      </div>
    </div>
  );
}
