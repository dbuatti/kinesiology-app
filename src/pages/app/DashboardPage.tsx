"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar, Activity, Loader2,
  UserPlus, Zap, Wind,
  ArrowRight, Clock,
  ClipboardCheck, Link as LinkIcon, Check,
  Coffee, CalendarPlus, Target, GraduationCap, Sun, Heart, MessageSquare, Brain, Layers, Sparkles,
  ChevronRight, Fingerprint, ShieldAlert, BookOpen, ShieldCheck, Trophy, LayoutDashboard, Grid
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "@/components/crm/ClientForm";
import AppointmentForm from "@/components/crm/AppointmentForm";
import RecentActivity from "@/components/crm/RecentActivity";
import UpcomingAppointments from "@/components/crm/UpcomingAppointments";
import { format, isToday, subDays, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import MeridianClock from "@/components/crm/MeridianClock";
import { AppointmentWithClient } from "@/types/crm";
import DashboardStats from "@/components/crm/DashboardStats";
import DailyBriefing from "@/components/crm/DailyBriefing";
import AppLayout from "@/components/crm/AppLayout";
import PractitionerGrounding from "@/components/crm/PractitionerGrounding";
import ClientWins from "@/components/crm/ClientWins";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useAppMode } from "@/components/ModeProvider";
import { showSuccess } from "@/utils/toast";
import Scratchpad from "@/components/crm/Scratchpad";
import QuickActionsGrid from "@/components/crm/QuickActionsGrid";
import IdentitySmartTool from "@/components/crm/IdentitySmartTool";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/shared/PageHeader";
import { useSearchParams } from "react-router-dom";

const DailyMission = ({ mode, stats, morningProgress }: { mode: string, stats: any, morningProgress: number }) => {
  const missions = {
    clinical: [
      { label: "Grounding", status: morningProgress >= 25 ? 'done' : 'pending', icon: Sparkles },
      { label: "Review Alerts", status: stats.imperativeAlerts === 0 ? 'done' : 'pending', icon: ShieldAlert },
      { label: "Session Prep", status: 'pending', icon: ClipboardCheck },
    ],
    lab: [
      { label: "Morning Program", status: morningProgress === 100 ? 'done' : 'pending', icon: Sun },
      { label: "Journal Entry", status: 'pending', icon: MessageSquare },
      { label: "Identity Work", status: 'pending', icon: Fingerprint },
    ],
    library: [
      { label: "Daily Quiz", status: 'pending', icon: Zap },
      { label: "Protocol Study", status: 'pending', icon: BookOpen },
      { label: "Mastery Check", status: 'pending', icon: Trophy },
    ]
  };

  const currentMissions = missions[mode as keyof typeof missions] || missions.clinical;

  return (
    <Card className="border-none shadow-2xl shadow-indigo-500/10 rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-[0.3em] px-3 py-1">
              Daily Mission
            </Badge>
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              Your focus for <span className="text-indigo-600">today</span>.
            </h2>
            <p className="text-sm text-slate-500 font-medium">Complete these tasks to maintain clinical excellence.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {currentMissions.map((m, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all duration-500",
                m.status === 'done'
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                  : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800"
              )}>
                <m.icon size={18} className={cn(m.status === 'done' ? "text-emerald-500" : "text-slate-300")} />
                <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
                {m.status === 'done' && <Check size={14} className="ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const { isPrivate } = usePrivacyMode();
  const { mode, setMode } = useAppMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'hub';
  
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
  const [pendingOnboarding, setPendingOnboarding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const handleCopyLink = (e: React.MouseEvent, clientId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/onboarding/${clientId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(clientId);
    showSuccess("Onboarding link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchDashboardData = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const [
        { count: clientCount }, 
        { count: appCount }, 
        { data: allAppsRaw },
        { count: newClientsCount },
        { count: recentAppsCount },
        { data: clinicalClients },
        { data: recentOnboarding }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('*, clients!inner(name, is_practitioner)').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null').gte('created_at', thirtyDaysAgo),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).gte('date', thirtyDaysAgo),
        supabase.from('clients').select('id, name, appointments(bolt_score, date)').or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('clients').select('id, name, created_at').or('is_practitioner.eq.false,is_practitioner.is.null').order('created_at', { ascending: false }).limit(3)
      ]);

      setPendingOnboarding(recentOnboarding || []);

      const allApps = (allAppsRaw || []).map(a => ({
        ...a,
        clientId: (a as any).client_id,
        date: new Date(a.date)
      })) as unknown as AppointmentWithClient[];

      const boltScores = allApps.filter(a => a.bolt_score).map(a => a.bolt_score as number);
      const cohScores = allApps.filter(a => a.coherence_score).map(a => a.coherence_score as number);
      
      const avgBolt = boltScores.length > 0 ? Math.round(boltScores.reduce((a, b) => a + b, 0) / boltScores.length) : 0;
      const avgCoh = cohScores.length > 0 ? cohScores.reduce((a, b) => a + b, 0) / cohScores.length : 0;

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

      const sessionsThisWeek = allApps.filter(app => 
        isWithinInterval(app.date, { start: weekStart, end: weekEnd })
      ).length;

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0,
        newClients30d: newClientsCount || 0,
        sessions30d: recentAppsCount || 0,
        sessionsThisWeek,
        avgBolt,
        avgCoherence: avgCoh,
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* RADICAL BACKGROUND DECORATION */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-400/20 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-400/20 blur-[150px] rounded-full animate-pulse delay-1000" />
          <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-amber-400/20 blur-[150px] rounded-full animate-pulse delay-2000" />
          
          {/* GRID PATTERN */}
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
              Choose your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-emerald-600 to-amber-600">clinical focus</span>.
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
              A unified workspace for clinical precision, personal integration, and knowledge mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
            {/* CLINICAL HUB */}
            <button
              onClick={() => handleEnterMode('clinical')}
              className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500"
            >
              <div className="absolute inset-0 bg-indigo-600 rounded-[3.5rem] translate-y-6 translate-x-6 opacity-0 group-hover:opacity-20 transition-all duration-700 blur-3xl" />
              <Card className="relative h-full border-none shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[3.5rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden transition-all duration-700 group-hover:-translate-y-6 group-hover:ring-2 group-hover:ring-indigo-500/50">
                <CardContent className="p-12 flex flex-col h-full">
                  <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center mb-12 shadow-2xl shadow-indigo-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <Activity size={40} />
                  </div>
                  <div className="space-y-6 mb-12">
                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Clinical Hub</h3>
                    <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      The command center for your practice. Manage clients, track progress, and execute sessions.
                    </p>
                  </div>
                  <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-600 transition-colors">Enter Workspace</span>
                    <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>

            {/* PRACTICE LAB */}
            <button
              onClick={() => handleEnterMode('lab')}
              className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-600"
            >
              <div className="absolute inset-0 bg-emerald-600 rounded-[3.5rem] translate-y-6 translate-x-6 opacity-0 group-hover:opacity-20 transition-all duration-700 blur-3xl" />
              <Card className="relative h-full border-none shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[3.5rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden transition-all duration-700 group-hover:-translate-y-6 group-hover:ring-2 group-hover:ring-emerald-500/50">
                <CardContent className="p-12 flex flex-col h-full">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-600 text-white flex items-center justify-center mb-12 shadow-2xl shadow-emerald-500/40 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
                    <Zap size={40} />
                  </div>
                  <div className="space-y-6 mb-12">
                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Practice Lab</h3>
                    <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Your personal sanctuary. Ground yourself, journal reflections, and shift your identity.
                    </p>
                  </div>
                  <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-emerald-600 transition-colors">Enter Workspace</span>
                    <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-lg">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>

            {/* KNOWLEDGE HUB */}
            <button
              onClick={() => handleEnterMode('library')}
              className="group relative flex flex-col text-left h-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700"
            >
              <div className="absolute inset-0 bg-amber-600 rounded-[3.5rem] translate-y-6 translate-x-6 opacity-0 group-hover:opacity-20 transition-all duration-700 blur-3xl" />
              <Card className="relative h-full border-none shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[3.5rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden transition-all duration-700 group-hover:-translate-y-6 group-hover:ring-2 group-hover:ring-amber-500/50">
                <CardContent className="p-12 flex flex-col h-full">
                  <div className="w-20 h-20 rounded-[2rem] bg-amber-600 text-white flex items-center justify-center mb-12 shadow-2xl shadow-amber-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                    <BookOpen size={40} />
                  </div>
                  <div className="space-y-6 mb-12">
                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Knowledge Hub</h3>
                    <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      The clinical oracle. Master protocols, study the bible, and sharpen your skills.
                    </p>
                  </div>
                  <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-amber-600 transition-colors">Enter Workspace</span>
                    <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-lg">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>

          <div className="pt-12 flex justify-center animate-in fade-in duration-1000 delay-1000">
            <div className="flex items-center gap-16 text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-12 py-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.clients}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Clients</span>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.appointments}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Sessions</span>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl font-bold text-indigo-600">{morningProgress}%</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Daily Readiness</span>
              </div>
            </div>
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

        {/* MODE: CLINICAL */}
        {mode === 'clinical' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <DailyMission mode={mode} stats={stats} morningProgress={morningProgress} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <PractitionerGrounding />
              </div>
              <div className="lg:col-span-4">
                <Link to="/morning-program" className="block h-full">
                  <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 h-full overflow-hidden group hover:border-indigo-300 transition-all">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Sun size={14} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Morning Program</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Readiness</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                          <span>Progress</span>
                          <span>{morningProgress}%</span>
                        </div>
                        <Progress value={morningProgress} className="h-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-indigo-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            <QuickActionsGrid 
              onNewClient={() => setClientDialogOpen(true)} 
              onBookSession={() => setAppDialogOpen(true)} 
            />

            <DashboardStats stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-10">
                <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
                
                {pendingOnboarding.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-indigo-600" /> Recent Onboarding
                      </h2>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-slate-200">
                        {pendingOnboarding.length} New
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {pendingOnboarding.map(client => (
                        <div key={client.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-200 transition-all">
                          <Link to={`/clients/${client.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {client.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className={cn("font-bold text-sm text-slate-900 dark:text-white truncate", isPrivate && "blur-sm")}>{client.name}</p>
                              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                                Added {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-[9px] uppercase tracking-widest"
                              onClick={(e) => handleCopyLink(e, client.id)}
                            >
                              {copiedId === client.id ? <Check size={12} className="mr-1.5 text-emerald-500" /> : <LinkIcon size={12} className="mr-1.5" />}
                              Link
                            </Button>
                            <Link to={`/clients/${client.id}`}>
                              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ArrowRight size={16} />
                              </div>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Scratchpad />
              </div>

              <div className="lg:col-span-4 space-y-10">
                <ClientWins />
                <UpcomingAppointments />
                <RecentActivity />
              </div>
            </div>
          </div>
        )}

        {/* MODE: LAB */}
        {mode === 'lab' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <DailyMission mode={mode} stats={stats} morningProgress={morningProgress} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-8">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="max-w-2xl space-y-4">
                      <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                        Daily Ritual
                      </Badge>
                      <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
                        Establish Your State.
                      </h2>
                      <p className="text-base text-slate-500 font-medium leading-relaxed">
                        Complete your morning program to ensure you are grounded, coherent, and ready for clinical work.
                      </p>
                      <div className="flex items-center gap-6 pt-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                            <span>Progress</span>
                            <span className="text-indigo-600">{morningProgress}%</span>
                          </div>
                          <Progress value={morningProgress} className="h-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-indigo-600" />
                        </div>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-widest">
                          <Link to="/morning-program">Open Program</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <IdentitySmartTool />
                <Scratchpad />
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <MessageSquare size={20} className="text-indigo-600" /> Practitioner Journal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Capture your clinical doubts, breakthroughs, and reflections.
                    </p>
                    <Button asChild className="w-full bg-slate-900 text-white h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                      <Link to="/practice/journal">Open Journal</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <Layers size={20} className="text-indigo-600" /> The Lab (Sandbox)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { label: "Identity Shifting", path: "/sandbox/identity-shifting", icon: Fingerprint },
                        { label: "Identity Alignment", path: "/sandbox/identity-alignment", icon: Target },
                        { label: "Limiting Beliefs", path: "/sandbox/limiting-beliefs", icon: ShieldAlert }
                      ].map(tool => (
                        <Link key={tool.path} to={tool.path} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group">
                          <div className="flex items-center gap-3">
                            <tool.icon size={14} className="text-slate-400 group-hover:text-indigo-600" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tool.label}</span>
                          </div>
                          <ArrowRight size={12} className="text-slate-300 group-hover:text-indigo-600" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* MODE: LIBRARY */}
        {mode === 'library' && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <DailyMission mode={mode} stats={stats} morningProgress={morningProgress} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-10">
                <div className="p-10 bg-indigo-600 text-white rounded-[2.5rem] shadow-md relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                      <Badge className="bg-white/20 text-white border-none font-bold text-[9px] uppercase tracking-[0.3em] px-3 py-1">
                        Knowledge Mastery
                      </Badge>
                      <h2 className="text-4xl font-serif font-bold tracking-tight">
                        The Knowledge Oracle.
                      </h2>
                      <p className="text-lg text-indigo-100 font-medium max-w-xl">
                        Sharpen your clinical intuition with infinite practice questions across Anatomy, TCM, and FNH protocols.
                      </p>
                    </div>
                    <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50 h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">
                      <Link to="/practice/quiz">Start Infinite Quiz <Zap size={16} className="ml-2 fill-current" /></Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white px-1">Clinical Reference</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/resources" className="block group">
                      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 hover:border-indigo-300 transition-all h-full">
                        <CardContent className="p-6 space-y-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                            <BookOpen size={18} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinical Bible</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            The definitive guide to joints, muscles, and the geometry of movement.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    <Link to="/peace-framework" className="block group">
                      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 hover:border-indigo-300 transition-all h-full">
                        <CardContent className="p-6 space-y-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-rose-600 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={18} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">PEACE Framework</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Master the central clinical hierarchy of Functional Neuro Health.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <MeridianClock />
                
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden group">
                  <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <Trophy size={20} className="text-indigo-600" /> Mastery Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Track your proficiency across all loggable clinical components.
                    </p>
                    <Button asChild className="w-full bg-slate-900 text-white h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                      <Link to="/practice/procedures">View My Mastery</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-serif font-bold tracking-tight">Schedule New Session</DialogTitle>
            </DialogHeader>
            <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Index;