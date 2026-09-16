import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmailTemplatePicker from "@/components/assistant/EmailTemplatePicker";
import { Mail, Loader2, Send, RefreshCw, CalendarClock, Sparkles, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

type Status = "needs_reply" | "awaiting_client" | "resolved";

const STATUS_LABELS: Record<Status, string> = {
  needs_reply: "🔴 Needs Reply",
  awaiting_client: "🟡 Waiting on Them",
  resolved: "🟢 Resolved",
};

const NEW_EMAIL_VALUE = "__new__";

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Melbourne" }) +
    " · " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
}

export default function ClientEmailThread({ clientId, clientEmail, clientName }: Props) {
  const firstName = clientName.split(" ")[0];
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadMeta, setThreadMeta] = useState<{ threadId: string | null; lastMessageId: string | null; references: string | null; lastSubject: string | null }>({ threadId: null, lastMessageId: null, references: null, lastSubject: null });
  const [status, setStatus] = useState<Status | null>(null);
  const [subject, setSubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<{ iso: string; label: string }[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const load = useCallback(async (explicitThreadId?: string) => {
    if (!clientEmail) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: threadData, error: threadErr }, { data: statusRow }] = await Promise.all([
        supabase.functions.invoke("gmail-get-client-thread", { body: { client_email: clientEmail, thread_id: explicitThreadId || undefined } }),
        supabase.from("client_email_status").select("status").eq("client_id", clientId).maybeSingle(),
      ]);
      if (threadErr) throw threadErr;
      if (threadData?.error) throw new Error(threadData.error);

      setThreads(threadData.threads || []);
      setMessages(threadData.messages || []);
      setSelectedThreadId(threadData.thread_id || null);
      setThreadMeta({
        threadId: threadData.thread_id,
        lastMessageId: threadData.last_message_id_header,
        references: threadData.last_references_header,
        lastSubject: threadData.last_subject,
      });
      const resolvedStatus = statusRow?.status || threadData.suggested_status || null;
      setStatus(resolvedStatus);
      setSubject(threadData.last_subject ? (/^re:/i.test(threadData.last_subject) ? threadData.last_subject : `Re: ${threadData.last_subject}`) : `Hi ${firstName}`);
    } catch (err: any) {
      showError(err.message || "Couldn't load the email thread.");
    } finally {
      setLoading(false);
    }
  }, [clientEmail, clientId, firstName]);

  useEffect(() => { load(); }, [load]);

  const handleThreadSelect = (value: string) => {
    setReplyBody("");
    setSuggestedSlots(null);
    if (value === NEW_EMAIL_VALUE) {
      setSelectedThreadId(null);
      setMessages([]);
      setThreadMeta({ threadId: null, lastMessageId: null, references: null, lastSubject: null });
      setSubject(`Hi ${firstName}`);
    } else {
      load(value);
    }
  };

  const handleStatusChange = async (next: Status) => {
    setStatus(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("client_email_status").upsert(
      { client_id: clientId, user_id: user.id, status: next, updated_at: new Date().toISOString() },
      { onConflict: "client_id" },
    );
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
          client_id: clientId,
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

  const handleSuggestTimes = async () => {
    setLoadingSlots(true);
    setSuggestedSlots(null);
    try {
      // The practitioner's diary can be fully booked for the next couple of
      // weeks — widen the search progressively rather than coming back empty
      // for what's usually the most common case (busy period).
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
          if (flat.length >= 8) break;
        }
        if (flat.length > 0) break;
      }
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
      const { data, error } = await supabase.functions.invoke("suggest-email-reply", {
        body: {
          client_id: clientId,
          client_name: clientName,
          thread_messages: messages.map((m) => ({ direction: m.direction, body: m.body })),
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Couldn't draft a reply.");
      setReplyBody(data.body || "");
      if (data.subject) setSubject(data.subject);
      showSuccess("Draft ready — review before sending.");
    } catch (err: any) {
      showError(err.message || "Couldn't draft a reply.");
    } finally {
      setLoadingSuggestion(false);
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
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{clientEmail}</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status || undefined} onValueChange={(v) => handleStatusChange(v as Status)}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => load(selectedThreadId || undefined)} disabled={loading}>
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

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1">
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
                <div className="text-[10px] opacity-70 mb-1 uppercase tracking-wide font-semibold">{m.direction === "outbound" ? "You" : firstName} · {fmtDate(m.date)}</div>
                {m.body || <span className="italic opacity-60">(no readable body)</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-border mt-3 space-y-2">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="text-base md:text-sm h-9" disabled={isSending} />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={handleSuggestTimes} disabled={loadingSlots}>
            {loadingSlots ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarClock className="h-3 w-3" />}
            Suggest times
          </Button>
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
        <div className="flex items-end gap-2">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Message to ${firstName}...`}
            rows={3}
            disabled={isSending}
            className="resize-none text-base md:text-sm"
          />
          <Button onClick={handleSend} disabled={isSending || !replyBody.trim()} size="icon" className="shrink-0">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          This sends a real email to {clientEmail} (cc: info@danielebuatti.com) — {selectedThreadId && threadMeta.threadId ? "threaded into your existing conversation." : "as a new email."}
        </p>
      </div>
    </div>
  );
}
