import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Loader2, Send, RefreshCw } from "lucide-react";
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

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Melbourne" }) +
    " · " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
}

export default function ClientEmailThread({ clientId, clientEmail, clientName }: Props) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadMeta, setThreadMeta] = useState<{ threadId: string | null; lastMessageId: string | null; references: string | null; lastSubject: string | null }>({ threadId: null, lastMessageId: null, references: null, lastSubject: null });
  const [status, setStatus] = useState<Status | null>(null);
  const [subject, setSubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!clientEmail) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: threadData, error: threadErr }, { data: statusRow }] = await Promise.all([
        supabase.functions.invoke("gmail-get-client-thread", { body: { client_email: clientEmail } }),
        supabase.from("client_email_status").select("status").eq("client_id", clientId).maybeSingle(),
      ]);
      if (threadErr) throw threadErr;
      if (threadData?.error) throw new Error(threadData.error);

      setMessages(threadData.messages || []);
      setThreadMeta({
        threadId: threadData.thread_id,
        lastMessageId: threadData.last_message_id_header,
        references: threadData.last_references_header,
        lastSubject: threadData.last_subject,
      });
      const resolvedStatus = statusRow?.status || threadData.suggested_status || null;
      setStatus(resolvedStatus);
      setSubject(threadData.last_subject ? (/^re:/i.test(threadData.last_subject) ? threadData.last_subject : `Re: ${threadData.last_subject}`) : `Hi ${clientName.split(" ")[0]}`);
    } catch (err: any) {
      showError(err.message || "Couldn't load the email thread.");
    } finally {
      setLoading(false);
    }
  }, [clientEmail, clientId, clientName]);

  useEffect(() => { load(); }, [load]);

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
          thread_id: threadMeta.threadId || undefined,
          in_reply_to: threadMeta.lastMessageId || undefined,
          references: threadMeta.references || undefined,
          client_id: clientId,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Send failed.");
      showSuccess(`Sent to ${clientName}.`);
      setReplyBody("");
      await load();
    } catch (err: any) {
      showError(err.message || "Failed to send the email.");
    } finally {
      setIsSending(false);
    }
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
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No email history with {clientName} yet — send the first message below.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex max-w-[85%]", m.direction === "outbound" ? "ml-auto flex-row-reverse" : "mr-auto")}>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
                m.direction === "outbound" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm",
              )}>
                <div className="text-[10px] opacity-70 mb-1 uppercase tracking-wide font-semibold">{m.direction === "outbound" ? "You" : clientName.split(" ")[0]} · {fmtDate(m.date)}</div>
                {m.body || <span className="italic opacity-60">(no readable body)</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-border mt-3 space-y-2">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="text-base md:text-sm h-9" disabled={isSending} />
        <div className="flex items-end gap-2">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={`Reply to ${clientName.split(" ")[0]}...`}
            rows={3}
            disabled={isSending}
            className="resize-none text-base md:text-sm"
          />
          <Button onClick={handleSend} disabled={isSending || !replyBody.trim()} size="icon" className="shrink-0">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">This sends a real email to {clientEmail} — {threadMeta.threadId ? "threaded into your existing conversation." : "as a new email."}</p>
      </div>
    </div>
  );
}
