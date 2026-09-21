import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { voiceStudentIdFor } from "@/lib/voice-student-id";
import { Loader2, RefreshCw, ArrowUpDown, Mic, Brain, Mail } from "lucide-react";

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
}

interface Props {
  onOpenClient: (clientId: string) => void;
}

export default function CommsInbox({ onOpenClient }: Props) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newestFirst, setNewestFirst] = useState(true);

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

  const sorted = [...messages].sort((a, b) => {
    const diff = new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime();
    return newestFirst ? diff : -diff;
  });

  const openFor = (m: InboxMessage) => onOpenClient(m.client_id || voiceStudentIdFor(m.voice_student_email || ""));

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail className="h-4 w-4 text-chart-primary" /> Client inbox
          <span className="text-[10px] font-normal text-muted-foreground">last 90 days</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setNewestFirst((v) => !v)}>
            <ArrowUpDown className="h-3 w-3" /> {newestFirst ? "Newest first" : "Oldest first"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {loading && sorted.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No client emails in the last 90 days.</p>
        ) : (
          sorted.map((m) => (
            <button
              key={m.id}
              onClick={() => openFor(m)}
              className="w-full text-left rounded-xl border border-border p-3 hover:border-chart-primary/40 hover:bg-chart-primary/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {m.kind === "voice"
                    ? <Mic className="h-3.5 w-3.5 text-chart-destructive shrink-0" />
                    : <Brain className="h-3.5 w-3.5 text-chart-purple shrink-0" />}
                  <span className="text-sm font-semibold text-foreground truncate">{m.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(m.date_iso), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground truncate mt-1">{m.subject}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{m.snippet}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
