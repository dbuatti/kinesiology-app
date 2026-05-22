"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Grid, 
  LayoutDashboard, 
  Activity, 
  ArrowRight, 
  Zap, 
  BookOpen,
  Sparkles,
  Loader2
} from "lucide-react";
import { format, isToday, differenceInMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentWithClient } from "@/types/crm";
import AppLayout from "@/components/crm/AppLayout";
import { useAppMode } from "@/components/ModeProvider";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

// Mode-specific Dashboards
import ClinicalDashboard from "../../components/crm/dashboards/ClinicalDashboard";
import LabDashboard from "../../components/crm/dashboards/LabDashboard";
import LibraryDashboard from "../../components/crm/dashboards/LibraryDashboard";

const Index = () => {
  const { mode, setMode } = useAppMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'dashboard';
  
  const setView = (newView: 'hub' | 'dashboard') => {
    setSearchParams({ view: newView });
  };

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
  const [lastJournalDate, setLastJournalDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [morningProgress, setMorningProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("antigravity_morning_program");
    if (saved) {
      try {
        const { tasks, date } = JSON.parse(saved);
        if (isToday(new Date(date))) {
          setMorningProgress(Math.round((tasks.length / 6) * 100));
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
        { data: clinicalClients },
        { data: lastJournal }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('*, clients!inner(name, is_practitioner)').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('id, name, appointments(bolt_score, date)').or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('practitioner_reflections').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      if (lastJournal) setLastJournalDate(lastJournal.created_at);

      const allApps = (allAppsRaw || []).map(a => ({
        ...a,
        clientId: (a as any).client_id,
        date: new Date(a.date)
      })) as unknown as AppointmentWithClient[];

      const boltScores = allApps.filter(a => a.bolt_score).map(a => a.bolt_score as number);
      const avgBolt = boltScores.length > 0 ? Math.round(boltScores.reduce((a, b) => a + b, 0) / boltScores.length) : 0;

      let imperativeAlerts = 0;
      clinicalClients?.forEach(client => {
        const sortedApps = (client.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (sortedApps.length > 0) {
          const latestBolt = (sortedApps[0] as any).bolt_score;
          if (latestBolt < 25) imperativeAlerts++;
        }
      });

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0,
        newClients30d: 0,
        sessions30d: 0,
        sessionsThisWeek: 0,
        avgBolt,
        avgCoherence: 0,
        imperativeAlerts
      });

      const today = allApps.filter(app => isToday(app.date));
      setTodaySessions(today);

      const now = new Date();
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
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  const handleEnterMode = (newMode: 'clinical' | 'lab' | 'library') => {
    setMode(newMode);
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'hub') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl w-full space-y-24 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Resonance Practice Suite</p>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Select your focus.
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
            {/* CLINICAL HUB */}
            <button onClick={() => handleEnterMode('clinical')} className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              <div className={cn("relative h-full border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden transition-all duration-700 group-hover:border-indigo-200 group-hover:shadow-3xl group-hover:shadow-indigo-500/10 p-12 flex flex-col bg-white dark:bg-slate-900")}>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center mb-12 transition-all duration-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
                  <Activity size={32} />
                </div>
                <div className="space-y-4 mb-12">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Clinical Hub</h3>
                  <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Manage clients, track progress, and execute high-precision sessions.</p>
                </div>
                <div className="mt-auto pt-10 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Enter Workspace</span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </button>

            {/* PRACTICE LAB */}
            <button onClick={() => handleEnterMode('lab')} className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <div className={cn("relative h-full border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden transition-all duration-700 group-hover:border-emerald-200 group-hover:shadow-3xl group-hover:shadow-indigo-500/10 p-12 flex flex-col bg-white dark:bg-slate-900")}>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center mb-12 transition-all duration-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
                  <Zap size={32} />
                </div>
                <div className="space-y-4 mb-12">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Practice Lab</h3>
                  <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Ground yourself, journal reflections, and shift your internal constructs.</p>
                </div>
                <div className="mt-auto pt-10 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors">Enter Workspace</span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </button>

            {/* KNOWLEDGE HUB */}
            <button onClick={() => handleEnterMode('library')} className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
              <div className={cn("relative h-full border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden transition-all duration-700 group-hover:border-amber-200 group-hover:shadow-3xl group-hover:shadow-emerald-500/10 p-12 flex flex-col bg-white dark:bg-slate-900")}>
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center mb-12 transition-all duration-700 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3">
                  <BookOpen size={32} />
                </div>
                <div className="space-y-4 mb-12">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Knowledge Hub</h3>
                  <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">The clinical oracle. Master protocols and study the definitive bible.</p>
                </div>
                <div className="mt-auto pt-10 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-600 transition-colors">Enter Workspace</span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-12">
        <PageHeader
          title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Dashboard`}
          subtitle={
            mode === 'clinical' ? "Welcome back, Daniele. Here is your clinical landscape for today." :
            mode === 'lab' ? "Focus on your personal integration and practitioner state." :
            "Deepen your clinical knowledge and master the FNH protocols."
          }
          icon={LayoutDashboard}
          breadcrumbs={[{ label: "Dashboard" }]}
          badge={mode === 'clinical' ? "Clinical Command" : mode === 'lab' ? "Practice Lab" : "Knowledge Hub"}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('hub')}
                className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 gap-2"
              >
                <Grid size={14} className="text-slate-400" />
                Switch Hub
              </Button>

              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="pr-4 border-r border-slate-100 dark:border-slate-800">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{format(currentTime, "MMM d")}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{format(currentTime, "h:mm a")}</p>
                </div>
              </div>
            </div>
          }
        />

        {mode === 'clinical' && (
          <ClinicalDashboard 
            stats={stats} 
            todaySessions={todaySessions} 
            activeSession={activeSession} 
            morningProgress={morningProgress} 
          />
        )}

        {mode === 'lab' && (
          <LabDashboard 
            morningProgress={morningProgress} 
            lastJournalDate={lastJournalDate} 
          />
        )}

        {mode === 'library' && (
          <LibraryDashboard 
            morningProgress={morningProgress} 
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Index;