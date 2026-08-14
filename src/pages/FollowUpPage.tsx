
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Calendar, ChevronRight, Loader2, RefreshCw, ArrowLeft } from "lucide-react";

const FOLLOW_UP_OPTIONS = [3, 5, 7, 14];

interface ClientSession {
  id: string;
  name: string;
  email?: string;
  lastSession: string;
  daysSince: number;
}

export function FollowUpTool() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("appointments")
        .select("id, client_id, date, status, clients(id, name, email)")
        .in("status", ["Completed", "Scheduled", "No Show"])
        .lte("date", new Date().toISOString())
        .order("date", { ascending: false });

      if (!data) return;

      const latest = new Map<string, ClientSession>();
      const now = new Date();

      for (const a of data as any[]) {
        if (!a.client_id || latest.has(a.client_id)) continue;
        const daysSince = differenceInDays(now, new Date(a.date));
        latest.set(a.client_id, {
          id: a.client_id,
          name: a.clients?.name || "Unknown",
          email: a.clients?.email,
          lastSession: a.date,
          daysSince,
        });
      }

      setClients(
        Array.from(latest.values()).sort((a, b) => b.daysSince - a.daysSince)
      );
    } catch (err) {
      console.error("Failed to fetch follow-up data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dueClients = clients.filter((c) => c.daysSince >= daysThreshold);
  const upcomingClients = clients.filter(
    (c) => c.daysSince < daysThreshold && c.daysSince > 0
  );

  const mailToLink = (c: ClientSession) =>
    `mailto:${c.email || ""}?subject=Checking in — how are you feeling%3F&body=Hi ${c.name}%2C%0A%0AI wanted to check in and see how you're feeling since our last session. Let me know if anything has come up or if you have any questions.%0A%0AHere if you need anything%2C%0ADaniele`;

  if (loading) {
    return (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <PageHeader
          title="Client Follow-Up"
          subtitle="Check in on clients at the right time after their sessions."
          icon={MessageSquare}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button onClick={fetchData} variant="outline" size="sm" className="rounded-xl h-10 px-4 gap-2">
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
          }
        />

        {/* Threshold Selector */}
        <div className="flex items-center gap-3 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Due threshold</span>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {FOLLOW_UP_OPTIONS.map((days) => (
              <button
                key={days}
                onClick={() => setDaysThreshold(days)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  daysThreshold === days
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* Due for Follow-Up */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-destructive" />
            Due for Check-In ({dueClients.length})
          </h3>

          {dueClients.length === 0 ? (
            <Card className="border border-border shadow-sm rounded-xl bg-muted/30">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground font-medium">Everyone is up to date.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">No clients at or beyond the {daysThreshold}-day threshold.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dueClients.map((c) => (
                <Card key={c.id} className="border border-chart-destructive/20 shadow-sm rounded-xl bg-card overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/clients/${c.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate no-underline">
                          {c.name}
                        </Link>
                        <span className="text-[9px] font-black uppercase tracking-wider text-chart-destructive bg-chart-destructive/10 px-1.5 py-0.5 rounded-full shrink-0">
                          {c.daysSince}d
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Last session {format(new Date(c.lastSession), "MMM d")}
                      </p>
                    </div>
                    <Button asChild size="sm" className="h-8 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-chart-destructive hover:bg-chart-destructive/90 shrink-0 gap-1.5">
                      <a href={mailToLink(c)}>
                        <Mail size={12} /> Email
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        {upcomingClients.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              Within Window ({upcomingClients.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingClients.slice(0, 10).map((c) => (
                <Card key={c.id} className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link to={`/clients/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary truncate no-underline">
                        {c.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {c.daysSince}d ago · {format(new Date(c.lastSession), "MMM d")}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
  );
};

const FollowUpPage = () => (
  <AppLayout>
    <FollowUpTool />
  </AppLayout>
);

export default FollowUpPage;
