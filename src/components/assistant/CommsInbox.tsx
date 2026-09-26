import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ClientEmailThread from "./ClientEmailThread";
import ClientPicker from "./ClientPicker";
import { voiceStudentIdFor, isVoiceStudentId, emailFromVoiceStudentId } from "@/lib/voice-student-id";
import {
  buildInboxPeople, FOLLOW_UP_AFTER_DAYS,
  type InboundMessage, type SentMessage, type ManualSend, type ContactInfo, type ContactMark,
  type InboxPerson, type PersonStatus,
} from "@/lib/inbox-conversations";
import { VoiceStudentOption } from "@/types/assistant";
import {
  Loader2, RefreshCw, Mic, Brain, PenSquare, X, Search, Check, CalendarCheck, ChevronDown, RotateCcw, Reply, Send,
} from "lucide-react";

interface Props {
  clients: { id: string; name: string; email: string | null }[];
  voiceStudents: VoiceStudentOption[];
}

interface ComposeTarget {
  clientId: string;
  clientEmail: string | null;
  clientName: string;
}

type Filter = "all" | PersonStatus;

const SECTIONS: { id: PersonStatus; title: string; hint: string; dot: string }[] = [
  { id: "needs_reply", title: "Needs your reply", hint: "They wrote last.", dot: "bg-chart-destructive" },
  { id: "follow_up", title: "Follow up", hint: `You wrote last and haven't heard back in ${FOLLOW_UP_AFTER_DAYS}+ days.`, dot: "bg-chart-amber" },
  { id: "waiting", title: "Waiting on them", hint: "You replied recently, or they're already booked in.", dot: "bg-chart-primary" },
  { id: "done", title: "Done", hint: "Marked done or booked, or nothing outstanding. Reopens if they email again.", dot: "bg-chart-emerald" },
];

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  needs_reply: "Needs reply",
  follow_up: "Follow up",
  waiting: "Waiting",
  done: "Done",
};

// ── Done / Booked marks ──────────────────────────────────────────────────────
// Stored in inbox_contact_state (supabase_inbox_contact_state.sql). Until that
// migration is applied the table doesn't exist, so fall back to this browser.
const LOCAL_MARKS_KEY = "inbox_contact_marks";

function readLocalMarks(): Record<string, ContactMark> {
  try { return JSON.parse(localStorage.getItem(LOCAL_MARKS_KEY) || "{}"); } catch { return {}; }
}
function writeLocalMarks(marks: Record<string, ContactMark>) {
  try { localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(marks)); } catch { /* private mode */ }
}

function useContactMarks() {
  const [marks, setMarks] = useState<Record<string, ContactMark>>({});
  const [useLocal, setUseLocal] = useState(false);

  const loadMarks = useCallback(async () => {
    const { data, error } = await supabase.from("inbox_contact_state").select("contact_email, state, resolved_at");
    if (error) {
      setUseLocal(true);
      setMarks(readLocalMarks());
      return;
    }
    const next: Record<string, ContactMark> = {};
    for (const row of data || []) next[row.contact_email] = { state: row.state, resolved_at: row.resolved_at };
    setMarks(next);
  }, []);

  useEffect(() => { loadMarks(); }, [loadMarks]);

  const setMark = useCallback(async (email: string, state: ContactMark["state"] | null) => {
    const next = { ...marks };
    if (state) next[email] = { state, resolved_at: new Date().toISOString() };
    else delete next[email];
    setMarks(next);
    if (useLocal) { writeLocalMarks(next); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = state
      ? await supabase.from("inbox_contact_state").upsert(
        { user_id: user.id, contact_email: email, state, resolved_at: next[email].resolved_at },
        { onConflict: "user_id,contact_email" },
      )
      : await supabase.from("inbox_contact_state").delete().eq("contact_email", email);
    if (error) {
      setUseLocal(true);
      writeLocalMarks(next);
    }
  }, [marks, useLocal]);

  return { marks, setMark };
}

// ── Formatting ───────────────────────────────────────────────────────────────
const ago = (d: Date) => formatDistanceToNowStrict(d, { addSuffix: false });

function upcomingLabel(value: string): string {
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return isNaN(d.getTime()) ? value : format(d, "EEE d MMM");
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function statusLine(p: InboxPerson): { text: string; className: string } {
  if (p.status === "needs_reply" && p.waitingSince) return { text: `Waiting on you · ${ago(p.waitingSince)}`, className: "text-chart-destructive" };
  if (p.status === "follow_up" && p.waitingSince) return { text: `No reply for ${ago(p.waitingSince)}`, className: "text-chart-amber" };
  if (p.status === "waiting" && p.waitingSince) return { text: `You replied ${ago(p.waitingSince)} ago`, className: "text-muted-foreground" };
  if (p.mark) return { text: p.mark.state === "booked" ? "Marked booked" : "Marked done", className: "text-chart-emerald" };
  return { text: "Nothing outstanding", className: "text-muted-foreground" };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CommsInbox({ clients, voiceStudents }: Props) {
  const [inbound, setInbound] = useState<InboundMessage[]>([]);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [manualSends, setManualSends] = useState<ManualSend[]>([]);
  const [contacts, setContacts] = useState<Record<string, ContactInfo>>({});
  const [upcoming, setUpcoming] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composePickerValue, setComposePickerValue] = useState<string | null>(null);
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);
  const { marks, setMark } = useContactMarks();

  // Only clients with an email on file can be addressed — the rest would just
  // hit ClientEmailThread's "no email address on file" empty state.
  const emailClients = clients.filter((c) => c.email);

  const pickComposeRecipient = (id: string | null) => {
    setComposePickerValue(id);
    if (!id) { setComposeTarget(null); return; }
    if (isVoiceStudentId(id)) {
      const email = emailFromVoiceStudentId(id);
      const st = voiceStudents.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (!st) return;
      setComposeTarget({ clientId: id, clientEmail: st.email, clientName: st.name });
    } else {
      const c = clients.find((c) => c.id === id);
      if (!c) return;
      setComposeTarget({ clientId: c.id, clientEmail: c.email, clientName: c.name });
    }
  };

  const closeCompose = () => {
    setComposing(false);
    setComposePickerValue(null);
    setComposeTarget(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-list-client-inbox");
      if (error || data?.error) throw new Error(data?.error || error?.message || "Failed to load inbox.");
      setInbound(data.messages || []);
      // Older deployments of the function return inbound only — everything
      // below degrades to thread-level needs-reply in that case.
      setSent(data.sent || []);
      setManualSends(data.manual_sends || []);
      setContacts(data.contacts || {});
      setUpcoming(data.upcoming || {});
    } catch (err: any) {
      showError(err.message || "Couldn't load recent client emails.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const people = useMemo(
    () => buildInboxPeople({ inbound, sent, manualSends, contacts, upcoming, marks }),
    [inbound, sent, manualSends, contacts, upcoming, marks],
  );

  const counts = useMemo(() => {
    const c: Record<PersonStatus, number> = { needs_reply: 0, follow_up: 0, waiting: 0, done: 0 };
    for (const p of people) c[p.status]++;
    return c;
  }, [people]);

  const q = query.trim().toLowerCase();
  const visible = people.filter((p) =>
    (filter === "all" || p.status === filter) &&
    (!q || p.name.toLowerCase().includes(q) || p.email.includes(q) || p.conversations.some((c) => c.subject.toLowerCase().includes(q))),
  );

  // Collapsing after a reply re-syncs statuses without the person having to
  // remember to hit refresh themselves.
  const toggle = (email: string) => {
    if (expandedEmail === email) { setExpandedEmail(null); load(); }
    else setExpandedEmail(email);
  };

  const mark = (p: InboxPerson, state: ContactMark["state"] | null) => {
    setMark(p.email, state);
    if (expandedEmail === p.email && state) setExpandedEmail(null);
    const first = p.name.split(" ")[0];
    if (state === "booked") showSuccess(`${first} marked as booked in.`);
    else if (state === "done") showSuccess(`${first} marked done.`);
  };

  const summary = [
    counts.needs_reply ? `${counts.needs_reply} waiting on your reply` : null,
    counts.follow_up ? `${counts.follow_up} to follow up` : null,
  ].filter(Boolean).join(" · ");

  const renderRow = (p: InboxPerson) => {
    const isOpen = expandedEmail === p.email;
    const line = statusLine(p);
    const last = p.focus.last;
    const lastIsYou = last.direction === "outbound";
    const threadCount = p.focus.threadIds.length;
    return (
      <li key={p.email} className={cn("group", isOpen && "bg-muted/30")}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggle(p.email)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(p.email); } }}
          className="flex gap-3 px-1 py-3 cursor-pointer rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className={cn(
            "relative h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold",
            p.kind === "voice" ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-purple/10 text-chart-purple",
          )}>
            {initials(p.name)}
            {(p.status === "needs_reply" || p.status === "follow_up") && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                p.status === "needs_reply" ? "bg-chart-destructive" : "bg-chart-amber",
              )} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className={cn("truncate text-sm text-foreground", p.status === "needs_reply" ? "font-semibold" : "font-medium")}>{p.name}</span>
              {p.kind === "voice"
                ? <Mic className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Voice student" />
                : <Brain className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Kinesiology client" />}
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{ago(p.lastActivity)}</span>
            </div>
            <p className="truncate text-xs text-foreground/90 mt-0.5">
              {p.focus.subject}
              {threadCount > 1 && <span className="text-muted-foreground"> · {threadCount} threads merged</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {lastIsYou && <span className="font-medium text-foreground/70">You: </span>}
              {last.snippet || "(no preview)"}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className={cn("text-[11px] font-medium", line.className)}>{line.text}</span>
              {p.upcoming && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-chart-emerald">
                  <CalendarCheck className="h-3 w-3" /> Booked {upcomingLabel(p.upcoming)}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>
            {p.status === "follow_up" && !isOpen && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => setExpandedEmail(p.email)}>
                <Send className="h-3 w-3" /> <span className="hidden sm:inline">Follow up</span>
              </Button>
            )}
            {p.status === "needs_reply" && !isOpen && (
              <Button variant="outline" size="sm" className="hidden sm:inline-flex h-7 gap-1 text-[11px]" onClick={() => setExpandedEmail(p.email)}>
                <Reply className="h-3 w-3" /> Reply
              </Button>
            )}
            {p.status !== "done" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground" title="Mark as done">
                    <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Done</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => mark(p, "booked")} className="gap-2 text-xs">
                    <CalendarCheck className="h-3.5 w-3.5 text-chart-emerald" /> Booked in
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => mark(p, "done")} className="gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-chart-emerald" /> Sorted, no reply needed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : p.mark ? (
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-muted-foreground" onClick={() => mark(p, null)} title="Move back out of Done">
                <RotateCcw className="h-3 w-3" /> <span className="hidden sm:inline">Reopen</span>
              </Button>
            ) : null}
          </div>
        </div>

        {isOpen && (
          <div className="pb-4 pl-0 sm:pl-12">
            <div className="h-[560px] flex flex-col">
              <ClientEmailThread
                clientId={p.clientId || voiceStudentIdFor(p.email)}
                clientEmail={p.email}
                clientName={p.name}
                threadIds={p.focus.threadIds}
                hideStatus
                initialGoal={p.status === "follow_up"
                  ? `Gentle follow-up — they haven't replied to my last email (${ago(p.waitingSince ?? p.lastActivity)} ago). Keep it short and warm.`
                  : ""}
              />
            </div>
          </div>
        )}
      </li>
    );
  };

  const sectionsToShow = filter === "all" ? SECTIONS : SECTIONS.filter((s) => s.id === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Client inbox</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading && people.length === 0 ? "Loading…" : summary || "You're all caught up."}
            <span className="opacity-70"> · last 90 days</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="default" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setComposing((v) => !v)}>
            <PenSquare className="h-3.5 w-3.5" /> Compose
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0">
          {(["all", "needs_reply", "follow_up", "waiting", "done"] as Filter[]).map((f) => {
            const n = f === "all" ? people.length : counts[f];
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-7 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {FILTER_LABELS[f]}
                {n > 0 && <span className={cn("ml-1.5 tabular-nums", active ? "opacity-70" : "opacity-60")}>{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people or subjects" className="h-8 pl-8 text-base md:text-xs" />
        </div>
      </div>

      {composing && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <PenSquare className="h-4 w-4 text-chart-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">New email</span>
              <ClientPicker
                clients={emailClients}
                voiceStudents={voiceStudents}
                value={composePickerValue}
                onChange={pickComposeRecipient}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={closeCompose} title="Close composer">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {composeTarget ? (
            <div className="h-[560px] p-3 flex flex-col">
              <ClientEmailThread
                key={composeTarget.clientId + ":" + composeTarget.clientEmail}
                composeMode
                clientId={composeTarget.clientId}
                clientEmail={composeTarget.clientEmail}
                clientName={composeTarget.clientName}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Pick a recipient above to start writing.</p>
          )}
        </div>
      )}

      {loading && people.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">
          {q ? "No one matches that search." : filter === "needs_reply" ? "Nothing needs a reply right now." : filter === "follow_up" ? "No one to follow up with." : "No client emails in the last 90 days."}
        </p>
      ) : (
        <div className="space-y-6">
          {sectionsToShow.map((section) => {
            const rows = visible.filter((p) => p.status === section.id);
            if (rows.length === 0) return null;
            const collapsible = section.id === "done" && filter === "all";
            const open = !collapsible || showDone || !!q;
            return (
              <section key={section.id}>
                <button
                  type="button"
                  disabled={!collapsible}
                  onClick={() => setShowDone((v) => !v)}
                  className="flex w-full items-center gap-2 border-b border-border pb-2 text-left disabled:cursor-default"
                >
                  <span className={cn("h-2 w-2 rounded-full", section.dot)} />
                  <span className="text-sm font-semibold text-foreground">{section.title}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{rows.length}</span>
                  <span className="hidden sm:inline text-xs text-muted-foreground truncate">— {section.hint}</span>
                  {collapsible && (
                    <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                  )}
                </button>
                {open && <ul className="divide-y divide-border/60">{rows.map(renderRow)}</ul>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
