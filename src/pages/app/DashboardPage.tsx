"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Activity, 
  ArrowRight, 
  Zap, 
  BookOpen 
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
      <div className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-3 w-64" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
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
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-background">
        <div className="max-w-5xl w-full space-y-16">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground">Clinical Hub v2.0</p>
            <h1 className="text-4xl md:text-6xl font-medium tracking-tight uppercase">Select Workspace</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
            {/* CLINICAL HUB */}
            <button onClick={() => handleEnterMode('clinical')} className="group flex flex-col text-left p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors">
              <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mb-8">
                <Activity size={24} />
              </div>
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-medium uppercase tracking-tight">Clinical Hub</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Manage clients, track progress, and execute sessions.</p>
                {nextSession && (
                  <div className="p-3 bg-success/10 border border-success/20 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-success" />
                    <p className="text-[10px] font-bold uppercase text-success">Next: {nextSession.clients.name} in {differenceInMinutes(nextSession.date, new Date())}M</p>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Enter Workspace</span>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            {/* PRACTICE LAB */}
            <button onClick={() => handleEnterMode('lab')} className="group flex flex-col text-left p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors">
              <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mb-8">
                <Zap size={24} />
              </div>
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-medium uppercase tracking-tight">Practice Lab</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Ground yourself, journal reflections, and shift your identity.</p>
              </div>
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Enter Workspace</span>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>

            {/* KNOWLEDGE HUB */}
            <button onClick={() => handleEnterMode('library')} className="group flex flex-col text-left p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors">
              <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mb-8">
                <BookOpen size={24} />
              </div>
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-medium uppercase tracking-tight">Knowledge Hub</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">The clinical oracle. Master protocols and study the bible.</p>
              </div>
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Enter Workspace</span>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-8">
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-primary">{mode} Workspace</p>
            <h1 className="text-4xl font-medium tracking-tight uppercase">{mode} Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Current Time</p>
              <p className="text-xl font-medium uppercase">{format(currentTime, "EEEE, MMM d")} · {format(currentTime, "h:mm a")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('hub')}
              className="h-12 px-6 border-border font-medium text-[10px] uppercase tracking-widest hover:bg-muted gap-2"
            >
              Switch Hub
            </Button>
          </div>
        </div>

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