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
  Sparkles
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
          setMorningProgress(Math.round((tasks.length / 4) * 100));
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
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-3 w-64 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      </div>
    </AppLayout>
  );

  const handleEnterMode = (newMode: 'clinical' | 'lab' | 'library') => {
    setMode(newMode);
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'hub') {
    const nextSession = todaySessions.find(s => s.status !== 'Completed' && s.date > new Date());

    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/20 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-400/20 blur-[150px] rounded-full animate-pulse delay-1000" />
          <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-amber-400/20 blur-[150px] rounded-full animate-pulse delay-2000" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="max-w-7xl w-full space-y-20 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 dark:text-slate-400">Resonance Practice Suite v2.0</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-slate-900 dark:text-white tracking-tight leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              Set your focus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-emerald-600 to-amber-600">for today</span>.
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
            {/* CLINICAL HUB */}
            <button onClick={() => handleEnterMode('clinical')} className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <div className={cn("absolute inset-0 bg-indigo-600 rounded-[3.5rem] translate-y-6 translate-x-6 transition-all duration-700 blur-3xl", mode === 'clinical' ? "opacity-30" : "opacity-0 group-hover:opacity-20")} />
              <div className={cn("relative h-full border-none shadow-2xl rounded-[3.5rem] overflow-hidden transition-all duration-700 group-hover:-translate-y-6 p-12 flex flex-col", mode === 'clinical' ? "bg-indigo-50/90 dark:bg-indigo-900/20 ring-2 ring-indigo-500" : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl")}>
                <div className="flex justify-between items-start mb-12">
                  <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center mb-12 shadow-2xl shadow-indigo-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <Activity size={40} />
                  </div>
                </div>
                <div className="space-y-6 mb-12">
                  <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Clinical Hub</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Manage clients, track progress, and execute sessions.</p>
                  {nextSession && (
                    <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 flex items-center gap-3 animate-in fade-in duration-1000">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Next: {nextSession.clients.name} in {differenceInMinutes(nextSession.date, new Date())}m</p>
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-600 transition-colors">{mode === 'clinical' ? 'CONTINUE' : 'SWITCH TO THIS'}</span>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg", mode === 'clinical' ? "bg-indigo-600 text-white" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 group-hover:bg-indigo-600 group-hover:text-white")}>
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </button>

            {/* PRACTICE LAB */}
            <button onClick={() => handleEnterMode('lab')} className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-600">
              <div className={cn("absolute inset-0 bg-emerald-600 rounded-[3.5rem] translate-y-6 translate-x-6 transition-all duration-700 blur-3xl", mode === 'lab' ? "opacity-30" : "opacity-0 group-hover:opacity-20")} />
              <div className={cn("relative h-full border-none shadow-2xl rounded-[3.5rem] overflow-hidden transition-all duration-700 group-hover:-translate-y-6 p-12 flex flex-col", mode === 'lab' ? "bg-emerald-50/90 dark:bg-emerald-900/20 ring-2 ring-emerald-500" : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl")}>
                <div className="flex justify-between items-start mb-12">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
                    <Zap size={40} />
                  </div>
                </div>
                <div className="space-y-6 mb-12">
                  <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Practice Lab</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Ground yourself, journal reflections, and shift your identity.</p>
                </div>
                <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-emerald-600 transition-colors">{mode === 'lab' ? 'CONTINUE' : 'SWITCH TO THIS'}</span>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg", mode === 'lab' ? "bg-emerald-600 text-white" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 group-hover:bg-emerald-600 group-hover:text-white")}>
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </button>

            {/* KNOWLEDGE HUB */}
            <button onClick={() => handleEnterMode('library')} className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
              <div className={cn("absolute inset-0 bg-amber-600 rounded-[3.5rem] translate-y-6 translate-x-6 transition-all duration-700 blur-3xl", mode === 'library' ? "opacity-30" : "opacity-0 group-hover:opacity-20")} />
              <div className={cn("relative h-full border-none shadow-2xl rounded-[3.5rem] overflow-hidden transition-all duration-700 group-hover:-translate-y-6 p-12 flex flex-col", mode === 'library' ? "bg-amber-50/90 dark:bg-amber-900/20 ring-2 ring-amber-500" : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl")}>
                <div className="flex justify-between items-start mb-12">
                  <div className="w-20 h-20 rounded-[2rem] bg-amber-600 text-white flex items-center justify-center shadow-2xl shadow-amber-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <BookOpen size={40} />
                  </div>
                </div>
                <div className="space-y-6 mb-12">
                  <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Knowledge Hub</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">The clinical oracle. Master protocols and study the bible.</p>
                </div>
                <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-amber-600 transition-colors">{mode === 'library' ? 'CONTINUE' : 'SWITCH TO THIS'}</span>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg", mode === 'library' ? "bg-amber-600 text-white" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 group-hover:bg-amber-600 group-hover:text-white")}>
                    <ArrowRight size={24} />
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
      <div className="space-y-12">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('hub')}
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 gap-2"
              >
                <Grid size={14} className="text-indigo-600" />
                Switch Hub
              </Button>

              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="pr-4 border-r border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Today</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{format(currentTime, "EEEE, MMM d")}</p>
                </div>
                <div className="pl-1">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                  <p className="text-sm font-bold text-indigo-600">{format(currentTime, "h:mm a")}</p>
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