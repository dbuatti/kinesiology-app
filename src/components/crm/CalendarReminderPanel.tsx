import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Calendar, Clock, CheckCircle, AlertCircle, Loader2, Send, RefreshCw, Mail } from "lucide-react";
import { format, addDays } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

// supabase.functions.invoke wraps non-2xx responses in a generic FunctionsHttpError
// whose real message sits in `.context` (the raw Response). Pull it out so the
// toast shows the actual server error (e.g. "Gmail Auth Error: invalid_grant").
async function extractFnError(fnError: any, fallback: string): Promise<string> {
  try {
    const ctx = fnError?.context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.clone().json();
      if (body?.error) return body.error;
    } else if (ctx && typeof ctx.text === "function") {
      const t = await ctx.clone().text();
      if (t) return t;
    }
  } catch {
    /* fall through */
  }
  return fnError?.message || fallback;
}

interface ReminderStats {
  total: number;
  sent: number;
  failed: number;
  lastSent?: string;
}

interface CalendarReminderPanelProps {
  onReminderSent?: (stats: ReminderStats) => void;
}

export default function CalendarReminderPanel({ onReminderSent }: CalendarReminderPanelProps) {
  const { session } = useAuth();
  const [stats, setStats] = useState<ReminderStats>({ total: 0, sent: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTestSending, setIsTestSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Fetch reminder statistics
  const fetchStats = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get appointments that need reminders
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = addDays(new Date(), 7).toISOString().split("T")[0];
      
      // FNH appointments needing reminders this week.
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, reminder_sent, reminder_sent_at")
        .gte("date", today)
        .lte("date", nextWeek)
        .eq("status", "Scheduled");

      if (apptError) throw apptError;

      // Voice/piano lessons this week (the send covers these too, so the stats must as well).
      const { data: voice } = await supabase
        .from("voice_bookings")
        .select("id, reminder_sent, reminder_sent_at, status")
        .gte("lesson_date", today)
        .lte("lesson_date", nextWeek);

      const activeVoice = (voice || []).filter(
        (v) => !String(v.status || "").toLowerCase().includes("cancel"),
      );

      const rows = [...(appointments || []), ...activeVoice];
      const total = rows.length;
      const sent = rows.filter((r) => r.reminder_sent).length;
      const failed = 0; // Unsent rows are pending, not failed — failures surface in logs.
      const lastSent = rows
        .filter((r) => r.reminder_sent_at)
        .map((r) => r.reminder_sent_at)
        .sort()
        .pop();
      
      const newStats: ReminderStats = {
        total,
        sent,
        failed,
        lastSent,
      };
      
      setStats(newStats);
      setLastRun(lastSent ? new Date(lastSent) : null);
      onReminderSent?.(newStats);
      
    } catch (err: any) {
      console.error("Error fetching reminder stats:", err);
      setError(err.message || "Failed to fetch reminder statistics");
    } finally {
      setIsLoading(false);
    }
  };

  // Send reminders
  const sendReminders = async () => {
    if (!session?.user?.id) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "send-session-reminders",
        { body: {} }
      );

      if (fnError) throw new Error(await extractFnError(fnError, "Failed to send reminders"));

      showSuccess(`Reminders sent: ${result.result.success} successful, ${result.result.failed} failed`);

      // Refresh stats after sending
      await fetchStats();

    } catch (err: any) {
      console.error("Error sending reminders:", err);
      showError(err.message || "Failed to send reminders");
      setError(err.message || "Failed to send reminders");
    } finally {
      setIsSending(false);
    }
  };

  // Send test/debug email to the current user
  const sendTestEmail = async () => {
    if (!session?.user?.id) return;
    
    setIsTestSending(true);
    setError(null);
    
    try {
      const { error: fnError } = await supabase.functions.invoke(
        "send-session-reminders",
        { body: { debug: true } }
      );

      if (fnError) throw new Error(await extractFnError(fnError, "Failed to send test email"));

      showSuccess(`Test email sent to ${session.user.email}`);

    } catch (err: any) {
      console.error("Error sending test email:", err);
      showError(err.message || "Failed to send test email");
      setError(err.message || "Failed to send test email");
    } finally {
      setIsTestSending(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [session?.user?.id]);

  const getStatusColor = () => {
    if (stats.failed > 0) return "destructive";
    if (stats.sent > 0) return "default";
    return "secondary";
  };

  const getStatusIcon = () => {
    if (isSending) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (stats.failed > 0) return <AlertCircle className="h-4 w-4" />;
    if (stats.sent > 0) return <CheckCircle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const pending = Math.max(0, stats.total - stats.sent);

  return (
    <Card className="w-full max-w-md rounded-[1.75rem] border-border/60 shadow-[0_10px_34px_-14px_rgba(120,80,40,0.22)] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 shadow-sm">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif tracking-tight">Session Reminders</CardTitle>
              <CardDescription>A gentle nudge before the week ahead</CardDescription>
            </div>
          </div>
          {pending > 0 && (
            <Badge className="shrink-0 rounded-full border-none bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold px-2.5 py-0.5">
              {pending} to send
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="text-center p-3 rounded-2xl bg-muted/40 border border-border/40">
            <div className="text-xl font-bold text-foreground font-serif">{stats.total}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">This week</div>
          </div>
          <div className="text-center p-3 rounded-2xl bg-chart-emerald/10 border border-chart-emerald/20">
            <div className="text-xl font-bold text-chart-emerald font-serif">{stats.sent}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Reminded</div>
          </div>
          <div className="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-500 font-serif">{pending}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Pending</div>
          </div>
        </div>

        {/* Last run info */}
        {lastRun && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last sent {format(lastRun, "MMM d, h:mm a")}</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={sendReminders}
            disabled={isSending || isTestSending || stats.total === 0}
            className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-white border-none shadow-sm active:scale-95 transition-transform"
            size="sm"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? "Sending..." : "Send Reminders"}
          </Button>
          <Button
            onClick={fetchStats}
            disabled={isLoading || isSending || isTestSending}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Test Email Button */}
        <Button
          onClick={sendTestEmail}
          disabled={isSending || isTestSending}
          variant="ghost"
          size="sm"
          className="w-full text-xs rounded-full hover:bg-amber-500/10 hover:text-amber-700"
        >
          {isTestSending ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : (
            <Mail className="h-3 w-3 mr-2" />
          )}
          Send a test to myself ({session?.user?.email})
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-amber-500" />
            <span>Covers FNH + voice sessions in the next 7 days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-chart-emerald" />
            <span>Sends automatically every Sunday at 4pm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}