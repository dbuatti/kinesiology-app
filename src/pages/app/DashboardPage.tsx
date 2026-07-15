
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Zap } from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [morningProgress, setMorningProgress] = useState(0);
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);

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
        <Skeleton className="h-40 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-64 rounded-[2rem]" />
          <Skeleton className="lg:col-span-4 h-64 rounded-[2rem]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[2rem]" />
          ))}
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome back, Daniele. Here is your clinical landscape for today."
          icon={LayoutDashboard}
          actions={
            <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
              <div className="pr-4 border-r border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today</p>
                <p className="text-xs font-medium text-foreground">{format(currentTime, "MMM d")}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Time</p>
                <p className="text-xs font-medium text-primary">{format(currentTime, "h:mm a")}</p>
              </div>
            </div>
          }
        />

        <Button
          onClick={() => setQuickSessionOpen(true)}
          className="w-full bg-amber-500 hover:bg-amber-600 h-16 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-100 flex items-center justify-center gap-3"
        >
          <Zap size={22} />
          Quick Session — Start instantly, no booking needed
        </Button>

        <ClinicalDashboard
          stats={stats}
          todaySessions={todaySessions}
          activeSession={activeSession}
          morningProgress={morningProgress}
        />

        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-lg">
              💬
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Client Love</p>
              <p className="text-sm text-emerald-900/80 font-medium leading-relaxed italic">
                "Thank you for your valuable work yesterday — I slept well and now feeling relaxed and balanced today!!"
              </p>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">— Client (Jul 14)</p>
            </div>
          </div>
        </div>
      </div>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
    </AppLayout>
  );
};

export default Index;
