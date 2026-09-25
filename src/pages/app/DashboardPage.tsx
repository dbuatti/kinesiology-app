
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { format, isToday, differenceInMinutes, subDays, startOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AppointmentWithClient } from "@/types/crm";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import ClinicalDashboard from "../../components/crm/dashboards/ClinicalDashboard";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";

const Index = () => {
  const [stats, setStats] = useState({
    clients: 0, 
    appointments: 0,
    newClients30d: 0,
    sessions30d: 0,
    sessionsThisWeek: 0,
    avgBolt: 0,
    avgCoherence: 0,
    imperativeAlerts: 0
  });
  const [todaySessions, setTodaySessions] = useState<AppointmentWithClient[]>([]);
  const [activeSession, setActiveSession] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [morningProgress, setMorningProgress] = useState(0);
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("rk_morning_program");
    if (saved) {
      try {
        const { tasks, date } = JSON.parse(saved);
        if (isToday(new Date(date))) {
          setMorningProgress(Math.round((tasks.length / 6) * 100)); // 6 = RITUAL_STEPS.length in MorningProgramPage
        }
      } catch (e) {}
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { count: clientCount }, 
        { count: appCount }, 
        { data: allAppsRaw },
        { data: clinicalClients }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('id, date, status, bolt_score, client_id, name, tag, goal, issue, is_paid, payment_received, price_amount, clients!inner(name, is_practitioner)').neq('status', 'Cancelled').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('id, name, created_at, appointments(bolt_score, date)').or('is_practitioner.eq.false,is_practitioner.is.null')
      ]);

      const allApps = (allAppsRaw || []).map(a => ({
        ...a,
        clientId: (a as any).client_id,
        date: new Date(a.date)
      })) as unknown as AppointmentWithClient[];

      const boltScores = allApps.filter(a => a.bolt_score).map(a => a.bolt_score as number);
      const avgBolt = boltScores.length > 0 ? Math.round(boltScores.reduce((a, b) => a + b, 0) / boltScores.length) : 0;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      let imperativeAlerts = 0;
      let newClients30d = 0;
      clinicalClients?.forEach(client => {
        const sortedApps = (client.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedApps.length > 0) {
          const latestBolt = (sortedApps[0] as any).bolt_score;
          if (latestBolt < 25) imperativeAlerts++;
        }

        if ((client as any).created_at && new Date((client as any).created_at) >= thirtyDaysAgo) {
          newClients30d++;
        }
      });

      const sessions30d = allApps.filter(a => a.date >= thirtyDaysAgo).length;
      const sessionsThisWeek = allApps.filter(a => a.date >= weekStart).length;

      setStats({
        clients: clientCount || 0,
        appointments: appCount || 0,
        newClients30d,
        sessions30d,
        sessionsThisWeek,
        avgBolt,
        avgCoherence: 0,
        imperativeAlerts
      });

      const today = allApps.filter(app => isToday(app.date));
      setTodaySessions(today);

      const active = today.find(app => {
        const diff = differenceInMinutes(now, app.date);
        return diff >= 0 && diff < 60 && app.status !== 'Completed';
      });
      setActiveSession(active || null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

   if (loading) return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-64 rounded-2xl" />
          <Skeleton className="lg:col-span-4 h-64 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-destructive" />
        </div>
        <p className="text-destructive font-semibold text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); fetchDashboardData(); }} className="rounded-xl text-xs gap-2">
          <RefreshCw size={14} /> Retry
        </Button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-muted-foreground">
              <time dateTime={currentTime.toISOString()}>{format(currentTime, "EEEE d MMMM")}</time>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <span className="tabular-nums">{format(currentTime, "h:mm a")}</span>
            </p>
            <h1 className="mt-1 font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.025em] text-foreground sm:text-[34px]">
              {greeting}, Daniele
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {todaySessions.length === 0
                ? "No sessions booked today — a good day for practice and admin."
                : `${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} on today${activeSession ? " · one is live now" : ""}.`}
            </p>
          </div>
          <Button
            onClick={() => setQuickSessionOpen(true)}
            className="h-10 shrink-0 gap-2 rounded-xl px-4 text-sm font-medium shadow-[inset_0_1px_0_hsl(0_0%_100%/0.16),0_1px_2px_hsl(var(--shadow-color)/0.2),0_8px_20px_-8px_hsl(var(--primary)/0.5)]"
          >
            <Zap size={16} className="shrink-0" />
            Start quick session
          </Button>
        </div>

        <ClinicalDashboard
          stats={stats}
          todaySessions={todaySessions}
          activeSession={activeSession}
          morningProgress={morningProgress}
        />

        <figure className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 shadow-xs sm:px-8">
          <span aria-hidden className="absolute -left-1 -top-6 select-none font-serif text-[120px] leading-none text-primary/10">“</span>
          <blockquote className="relative font-serif text-lg leading-relaxed text-foreground/90 sm:text-xl">
            Thank you for your valuable work yesterday — I slept well and now feeling relaxed and balanced today!!
          </blockquote>
          <figcaption className="relative mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="h-px w-5 bg-border" /> A client, July 14
          </figcaption>
        </figure>
      </div>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
    </AppLayout>
  );
};

export default Index;
