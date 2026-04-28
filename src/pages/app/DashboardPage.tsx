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
  ChevronRight, Fingerprint, ShieldAlert, BookOpen, ShieldCheck, Trophy
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

const Index = () => {
  const { isPrivate } = usePrivacyMode();
  const { mode } = useAppMode();
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
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 md:h-10 w-48 md:w-64 rounded-lg" /><Skeleton className="h-3 md:h-4 w-64 md:w-96 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 md:h-32 w-full rounded-lg" />)}
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-12 md:space-y-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="space-y-1 md:space-y-2">
            <Badge className={cn(
              "border-none font-bold text-[8px] md:text-[9px] uppercase tracking-[0.3em] px-4 md:px-5 py-1.5 rounded-full mb-1 md:mb-2",
              mode === 'clinical' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" :
              mode === 'lab' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
              "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            )}>
              {mode === 'clinical' ? "Clinical Command Center" : mode === 'lab' ? "Practice Lab Dashboard" : "Knowledge Library Hub"}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tighter text-primary capitalize">{mode} Hub</h1>
            <p className="text-sm md:text-lg text-muted-foreground font-medium max-w-2xl">
              {mode === 'clinical' ? "Welcome back, Daniele. Here is your clinical landscape for today." :
               mode === 'lab' ? "Focus on your personal integration and practitioner state." :
               "Deepen your clinical knowledge and master the FNH protocols."}
            </p>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Current Time</p>
              <p className="text-xl font-serif font-bold text-primary">{format(currentTime, "h:mm a")}</p>
            </div>
            <div className="w-px h-10 md:h-12 bg-border hidden lg:block" />
            <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 md:w-11 md:h-11 bg-muted rounded-lg flex items-center justify-center text-primary shadow-inner">
                <Calendar size={18} className="md:w-5 md:h-5" />
              </div>
              <div className="pr-2 md:pr-4">
                <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Today</p>
                <p className="text-sm md:text-base font-bold text-primary">{format(currentTime, "EEEE, MMM d")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MODE: CLINICAL */}
        {mode === 'clinical' && (
          <div className="space-y-12 md:space-y-16 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <PractitionerGrounding />
              </div>
              <div className="lg:col-span-4">
                <Link to="/morning-program" className="block h-full">
                  <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900 h-full overflow-hidden relative group hover:shadow-md transition-all duration-500">
                    <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-600">
                          <Sun size={18} className="fill-current" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Morning Program</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Daily Readiness</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                          <span>Progress</span>
                          <span className="text-amber-600">{morningProgress}%</span>
                        </div>
                        <Progress value={morningProgress} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-amber-500" />
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
              <div className="lg:col-span-8 space-y-12 md:space-y-16">
                <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
                
                {pendingOnboarding.length > 0 && (
                  <div className="space-y-6 md:space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <div className="space-y-0.5 md:space-y-1">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-3 md:gap-4">
                          <ClipboardCheck size={24} className="md:w-8 md:h-8 text-indigo-600" /> Recent Onboarding
                        </h2>
                        <p className="text-xs md:base text-muted-foreground font-medium">New client submissions ready for review.</p>
                      </div>
                      <Badge className="bg-indigo-600 text-white border-none font-bold text-[8px] md:text-[9px] uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded shadow-lg shadow-indigo-500/10">
                        {pendingOnboarding.length} New
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {pendingOnboarding.map(client => (
                        <div key={client.id} className="p-4 md:p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all duration-500">
                          <Link to={`/clients/${client.id}`} className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-muted text-primary flex items-center justify-center font-bold text-base md:text-lg shadow-inner shrink-0">
                              {client.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className={cn("font-bold text-base md:text-lg text-foreground group-hover:text-indigo-600 transition-colors truncate", isPrivate && "blur-sm")}>{client.name}</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5 md:mt-1">
                                <Clock size={12} className="md:w-3 md:h-3 text-indigo-400" /> {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 md:h-9 px-2 md:px-4 rounded text-indigo-600 hover:bg-indigo-50 font-bold text-[8px] md:text-[9px] uppercase tracking-widest"
                              onClick={(e) => handleCopyLink(e, client.id)}
                            >
                              {copiedId === client.id ? <Check size={14} className="md:mr-2 text-emerald-500" /> : <LinkIcon size={14} className="md:mr-2" />}
                              <span className="hidden sm:inline">{copiedId === client.id ? "Copied" : "Link"}</span>
                            </Button>
                            <Link to={`/clients/${client.id}`}>
                              <div className="w-8 h-8 md:w-9 md:h-9 rounded bg-muted text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
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

              <div className="lg:col-span-4 space-y-12 md:space-y-16">
                <ClientWins />
                <UpcomingAppointments />
                <RecentActivity />
              </div>
            </div>
          </div>
        )}

        {/* MODE: LAB */}
        {mode === 'lab' && (
          <div className="space-y-12 md:space-y-16 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <Card className="border border-amber-200 dark:border-amber-900/30 shadow-sm rounded-lg bg-white dark:bg-slate-900 overflow-hidden relative group">
                  <CardContent className="p-10 md:p-14 relative z-10">
                    <div className="max-w-2xl space-y-6">
                      <Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 font-bold text-[10px] uppercase tracking-[0.3em] px-4 py-1">
                        Daily Ritual
                      </Badge>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter leading-tight text-slate-900 dark:text-white">
                        Establish Your State.
                      </h2>
                      <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        Complete your morning program to ensure you are grounded, coherent, and ready for clinical work.
                      </p>
                      <div className="flex items-center gap-6 pt-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                            <span>Readiness Progress</span>
                            <span className="text-amber-600">{morningProgress}%</span>
                          </div>
                          <Progress value={morningProgress} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-amber-500" />
                        </div>
                        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white h-14 px-8 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg">
                          <Link to="/morning-program">Open Program <ArrowRight size={18} className="ml-2" /></Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <IdentitySmartTool />
                <Scratchpad />
              </div>

              <div className="lg:col-span-4 space-y-12">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900 overflow-hidden group">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                      <MessageSquare size={24} className="text-indigo-600" /> Practitioner Journal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Capture your clinical doubts, breakthroughs, and reflections. AI will extract patterns for your Identity Map.
                    </p>
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg">
                      <Link to="/practice/journal">Open Journal <ChevronRight size={16} className="ml-1" /></Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                      <Layers size={24} className="text-indigo-600" /> The Lab (Sandbox)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Access the full suite of identity shifting and neural reconsolidation tools.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Identity Shifting", path: "/sandbox/identity-shifting", icon: Fingerprint },
                        { label: "Identity Alignment", path: "/sandbox/identity-alignment", icon: Target },
                        { label: "Limiting Beliefs", path: "/sandbox/limiting-beliefs", icon: ShieldAlert }
                      ].map(tool => (
                        <Link key={tool.path} to={tool.path} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 transition-all group">
                          <div className="flex items-center gap-3">
                            <tool.icon size={14} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{tool.label}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-all" />
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
          <div className="space-y-12 md:space-y-16 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-12">
                <div className="p-10 md:p-14 bg-indigo-600 text-white rounded-lg shadow-xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <Badge className="bg-white/20 text-white border-white/30 font-bold text-[10px] uppercase tracking-[0.3em] px-4 py-1">
                        Knowledge Mastery
                      </Badge>
                      <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter leading-tight">
                        The Knowledge Oracle.
                      </h2>
                      <p className="text-xl text-indigo-100 font-medium max-w-xl leading-relaxed">
                        Sharpen your clinical intuition with infinite practice questions across Anatomy, TCM, and FNH protocols.
                      </p>
                    </div>
                    <Button asChild className="bg-white text-indigo-600 hover:bg-indigo-50 h-16 px-12 rounded-lg font-bold text-sm uppercase tracking-widest shadow-2xl">
                      <Link to="/practice/quiz">Start Infinite Quiz <Zap size={18} className="ml-2 fill-current" /></Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                      <BookOpen size={16} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Clinical Reference</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/resources" className="block group">
                      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900 hover:shadow-md transition-all duration-300 h-full overflow-hidden">
                        <CardContent className="p-8 space-y-4">
                          <div className="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-110 transition-transform">
                            <BookOpen size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Clinical Bible</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            The definitive guide to joints, muscles, and the geometry of movement.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    <Link to="/peace-framework" className="block group">
                      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900 hover:shadow-md transition-all duration-300 h-full overflow-hidden">
                        <CardContent className="p-8 space-y-4">
                          <div className="w-10 h-10 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/30 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">PEACE Framework</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            Master the central clinical hierarchy of Functional Neuro Health.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-12">
                <MeridianClock />
                
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg bg-white dark:bg-slate-900 overflow-hidden group">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                      <Trophy size={24} className="text-amber-500" /> Mastery Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Track your proficiency across all loggable clinical components.
                    </p>
                    <Button asChild className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white h-12 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg">
                      <Link to="/practice/procedures">View My Mastery <ChevronRight size={16} className="ml-1" /></Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="p-8 bg-indigo-900 text-white rounded-lg shadow-xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                        <Wind size={20} className="text-indigo-300" />
                      </div>
                      <h3 className="text-xl font-serif font-bold">Clinical Focus</h3>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                      <p className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Practice Goal</p>
                      <p className="text-base font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                    </div>
                    <Link to="/oversight" className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 hover:text-white transition-colors flex items-center gap-2">
                      View Oversight <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-lg p-0">
          <div className="p-6 md:p-10">
            <DialogHeader className="mb-6 md:mb-8">
              <DialogTitle className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
              <DialogDescription className="text-base md:text-lg font-medium">Create a new client profile in your clinical database.</DialogDescription>
            </DialogHeader>
            <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-lg p-0">
          <div className="p-6 md:p-10">
            <DialogHeader className="mb-6 md:mb-8">
              <DialogTitle className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Schedule New Session</DialogTitle>
              <DialogDescription className="text-base md:text-lg font-medium">Book a new appointment for an existing client.</DialogDescription>
            </DialogHeader>
            <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Index;