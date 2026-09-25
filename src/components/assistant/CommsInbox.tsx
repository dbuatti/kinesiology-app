import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ClientEmailThread from "./ClientEmailThread";
import ClientPicker from "./ClientPicker";
import { voiceStudentIdFor, isVoiceStudentId, emailFromVoiceStudentId } from "@/lib/voice-student-id";
import { VoiceStudentOption } from "@/types/assistant";
import { Loader2, RefreshCw, ArrowUpDown, Mic, Brain, Mail, ChevronDown, PenSquare, X } from "lucide-react";

interface InboxMessage {
  id: string;
  thread_id: string;
  client_id: string | null;
  voice_student_email: string | null;
  name: string;
  from_display_name: string;
  email: string;
  kind: "kinesiology" | "voice";
  subject: string;
  snippet: string;
  date_iso: string;
  needs_reply: boolean;
}

interface Props {
  clients: { id: string; name: string; email: string | null }[];
  voiceStudents: VoiceStudentOption[];
}

interface ComposeTarget {
  clientId: string;
  clientEmail: string | null;
  clientName: string;
}

export default function CommsInbox({ clients, voiceStudents }: Props) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newestFirst, setNewestFirst] = useState(true);
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composePickerValue, setComposePickerValue] = useState<string | null>(null);
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);

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
      setMessages(data.messages || []);
    } catch (err: any) {
      showError(err.message || "Couldn't load recent client emails.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // One row per THREAD, not per message — the underlying fetch returns every
  // individual message in the last 90 days, so a client with a 3-message
  // back-and-forth showed up as 3 separate rows ("I'm not seeing multiple
  // from the same chain" — real complaint, they were). Keep only each
  // thread's most recent message; needs_reply is already computed per-thread
  // server-side, so every message sharing a thread_id agrees on it anyway.
  const latestPerThread = new Map<string, InboxMessage>();
  for (const m of messages) {
    const existing = latestPerThread.get(m.thread_id);
    if (!existing || new Date(m.date_iso) > new Date(existing.date_iso)) latestPerThread.set(m.thread_id, m);
  }
  const threadMessages = [...latestPerThread.values()];

  const needsReplyCount = threadMessages.filter((m) => m.needs_reply).length;

  const sorted = threadMessages
    .filter((m) => !needsReplyOnly || m.needs_reply)
    .sort((a, b) => {
      const diff = new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime();
      return newestFirst ? diff : -diff;
    });

  // Collapsing after a reply re-syncs needs_reply/badges without the person
  // having to remember to hit refresh themselves.
  const toggle = (id: string) => {
    if (expandedId === id) { setExpandedId(null); load(); }
    else setExpandedId(id);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail className="h-4 w-4 text-chart-primary" /> Client inbox
          {needsReplyCount > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-destructive bg-chart-destructive/10 px-1.5 py-0.5 rounded-full">
              {needsReplyCount} need{needsReplyCount === 1 ? "s" : ""} reply
            </span>
          )}
          <span className="text-[10px] font-normal text-muted-foreground">last 90 days</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="default"
            size="sm"
            className="h-7 text-[11px] gap-1.5"
            onClick={() => setComposing((v) => !v)}
          >
            <PenSquare className="h-3 w-3" /> Compose
          </Button>
          <Button
            variant={needsReplyOnly ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-[11px]", needsReplyOnly && "bg-chart-destructive hover:bg-chart-destructive/90 text-white")}
            onClick={() => setNeedsReplyOnly((v) => !v)}
          >
            Needs reply only
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setNewestFirst((v) => !v)}>
            <ArrowUpDown className="h-3 w-3" /> {newestFirst ? "Newest first" : "Oldest first"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {composing && (
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <PenSquare className="h-4 w-4 text-chart-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">Compose new email</span>
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
              <div className="h-[560px]">
                <ClientEmailThread
                  key={composeTarget.clientId + ":" + composeTarget.clientEmail}
                  composeMode
                  clientId={composeTarget.clientId}
                  clientEmail={composeTarget.clientEmail}
                  clientName={composeTarget.clientName}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">
                Pick a recipient above to start composing.
              </p>
            )}
          </div>
        )}
        {loading && sorted.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">
            {needsReplyOnly ? "Nothing needs a reply right now." : "No client emails in the last 90 days."}
          </p>
        ) : (
          sorted.map((m) => {
            const isOpen = expandedId === m.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl border overflow-hidden transition-colors",
                  m.needs_reply ? "border-chart-destructive/30 bg-chart-destructive/5" : "border-chart-emerald/20 bg-chart-emerald/5",
                )}
              >
                <button onClick={() => toggle(m.id)} className={cn("w-full text-left p-3", !isOpen && (m.needs_reply ? "hover:bg-chart-destructive/10" : "hover:bg-chart-emerald/10"))}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {m.kind === "voice"
                        ? <Mic className="h-3.5 w-3.5 text-chart-destructive shrink-0" />
                        : <Brain className="h-3.5 w-3.5 text-chart-purple shrink-0" />}
                      <span className="text-sm font-semibold text-foreground truncate">{m.name}</span>
                      <span className={cn(
                        "text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                        m.needs_reply ? "bg-chart-destructive/15 text-chart-destructive" : "bg-chart-emerald/15 text-chart-emerald",
                      )}>
                        {m.needs_reply ? "Needs reply" : "Replied"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(m.date_iso), { addSuffix: true })}
                      </span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate mt-1">{m.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{m.snippet}</p>
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Replying to <span className="font-semibold text-foreground">{m.name}</span> — {m.subject}
                    </p>
                    <div className="h-[500px] flex flex-col">
                      <ClientEmailThread
                        clientId={m.client_id || voiceStudentIdFor(m.voice_student_email || "")}
                        clientEmail={m.email}
                        clientName={m.name}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
