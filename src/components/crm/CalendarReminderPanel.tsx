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
      
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, reminder_sent, reminder_sent_at")
        .gte("date", today)
        .lte("date", nextWeek)
        .eq("status", "Scheduled");
      
      if (apptError) throw apptError;
      
      const total = appointments?.length || 0;
      const sent = appointments?.filter(a => a.reminder_sent).length || 0;
      const failed = total - sent;
      const lastSent = appointments?.find(a => a.reminder_sent)?.reminder_sent_at;
      
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-session-reminders`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reminders");
      }
      
      const result = await response.json();
      
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-session-reminders`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ debug: true }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send test email");
      }
      
      const result = await response.json();
      
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Session Reminders</CardTitle>
              <CardDescription>Manage appointment reminders</CardDescription>
            </div>
          </div>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {stats.total} total
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-green-600">{stats.sent}</div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Last run info */}
        {lastRun && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last sent: {format(lastRun, "MMM d, h:mm a")}</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={sendReminders}
            disabled={isSending || isTestSending || stats.total === 0}
            className="flex-1"
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
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Test Email Button */}
        <Button
          onClick={sendTestEmail}
          disabled={isSending || isTestSending}
          variant="ghost"
          size="sm"
          className="w-full text-xs"
        >
          {isTestSending ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : (
            <Mail className="h-3 w-3 mr-2" />
          )}
          Send Test Email to Me ({session?.user?.email})
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Targets appointments in next 7 days</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Only sends to clients with email addresses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}