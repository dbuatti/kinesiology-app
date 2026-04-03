"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Activity, Loader2,
  Plus, UserPlus, Sparkles,
  CheckCircle2, Zap, FlaskConical, Brain, Wind, StickyNote, Timer,
  ArrowRight, AlertCircle, TrendingUp, Clock, ShieldCheck, Heart,
  ClipboardCheck, EyeOff, CalendarPlus, Target, Link as LinkIcon, Check
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, isToday, subDays, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import MeridianClock from "@/components/crm/MeridianClock";
import { AppointmentWithClient } from "@/types/crm";
import DashboardStats from "@/components/crm/DashboardStats";
import DailyBriefing from "@/components/crm/DailyBriefing";
import AppLayout from "@/components/crm/AppLayout";
import PractitionerGrounding from "@/components/crm/PractitionerGrounding";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { showSuccess } from "@/utils/toast";

const SCRATCHPAD_KEY = "antigravity_practitioner_scratchpad";
const SCRATCHPAD_TIME_KEY = "antigravity_practitioner_scratchpad_time";

const Index = () => {
  const { isPrivate } = usePrivacyMode();
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
  const [priorityClients, setPriorityClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [chartData, setChartData] = useState<{ name: string; sessions: number; date: Date }[]>([]);
  const [scratchpad, setScratchpad] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SCRATCHPAD_KEY);
    const savedTime = localStorage.getItem(SCRATCHPAD_TIME_KEY);
    if (saved) setScratchpad(saved);
    if (savedTime) setLastSaved(savedTime);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleScratchpadChange = (val: string) => {
    const now = format(new Date(), "h:mm a");
    setScratchpad(val);
    setLastSaved(now);
    localStorage.setItem(SCRATCHPAD_KEY, val);
    localStorage.setItem(SCRATCHPAD_TIME_KEY, now);
  };

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
      const priorities: any[] = [];

      clinicalClients?.forEach(client => {
        const sortedApps = (client.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (sortedApps.length > 0) {
          const latestBolt = (sortedApps[0] as any).bolt_score;
          if (latestBolt < 25) {
            imperativeAlerts++;
            const isScheduledToday = allApps.some(app => app.clientId === client.id && isToday(app.date));
            if (isScheduledToday) {
              priorities.push({
                id: client.id,
                name: client.name,
                bolt: latestBolt,
                appointment: allApps.find(app => app.clientId === client.id && isToday(app.date))
              });
            }
          }
        }
      });

      setPriorityClients(priorities);

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

      const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return { name: format(d, "MMM"), sessions: 0, date: d };
      });

      allApps.forEach(app => {
        const monthIndex = months.findIndex(m => 
          app.date.getMonth() === m.date.getMonth() && 
          app.date.getFullYear() === m.date.getFullYear()
        );
        if (monthIndex !== -1) months[monthIndex].sessions += 1;
      });

      setChartData(months);
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
          <div className="space-y-2"><Skeleton className="h-10 w-64 rounded-2xl" /><Skeleton className="h-4 w-96 rounded-xl" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />)}
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none font-black text-[10px] uppercase tracking-[0.4em] px-6 py-2 rounded-full mb-2">
              Practitioner Command Center
            </Badge>
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter text-primary">Practice Hub</h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl">Welcome back, Daniele. Here is your clinical landscape for today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Time</p>
              <p className="text-2xl font-serif font-bold text-primary">{format(currentTime, "h:mm a")}</p>
            </div>
            <div className="w-px h-12 bg-border hidden lg:block" />
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-secondary/30 shadow-sm">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Calendar size={24} />
              </div>
              <div className="pr-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today</p>
                <p className="text-lg font-bold text-primary">{format(currentTime, "EEEE, MMM d")}</p>
              </div>
            </div>
          </div>
        </div>

        <PractitionerGrounding />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Button 
            onClick={() => setClientDialogOpen(true)}
            className="h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-indigo-900/20 hover:border-indigo-500 hover:bg-indigo-50/30 text-indigo-600 flex flex-col gap-3 shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus size={28} />
            </div>
            <span className="font-black text-[11px] uppercase tracking-widest">New Client</span>
          </Button>
          <Button 
            onClick={() => setAppDialogOpen(true)}
            className="h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-rose-50 dark:border-rose-900/20 hover:border-rose-500 hover:bg-rose-50/30 text-rose-600 flex flex-col gap-3 shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarPlus size={28} />
            </div>
            <span className="font-black text-[11px] uppercase tracking-widest">Book Session</span>
          </Button>
          <Link to="/practice/calibrate" className="block">
            <Button 
              className="w-full h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-amber-50 dark:border-amber-900/20 hover:border-amber-500 hover:bg-amber-50/30 text-amber-600 flex flex-col gap-3 shadow-sm transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap size={28} />
              </div>
              <span className="font-black text-[11px] uppercase tracking-widest">Quick Calibrate</span>
            </Button>
          </Link>
          <Link to="/practice/procedures" className="block">
            <Button 
              className="w-full h-32 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-emerald-50 dark:border-emerald-900/20 hover:border-emerald-500 hover:bg-emerald-50/30 text-emerald-600 flex flex-col gap-3 shadow-sm transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <span className="font-black text-[11px] uppercase tracking-widest">Procedures</span>
            </Button>
          </Link>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-16">
            <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
            
            {pendingOnboarding.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-serif font-bold text-primary flex items-center gap-4">
                      <ClipboardCheck size={32} className="text-accent" /> Recent Onboarding
                    </h2>
                    <p className="text-muted-foreground font-medium">New client submissions ready for review.</p>
                  </div>
                  <Badge className="bg-accent text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-accent/20">
                    {pendingOnboarding.length} New
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingOnboarding.map(client => (
                    <div key={client.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-secondary/30 flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-5 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-muted text-primary flex items-center justify-center font-black text-xl shadow-inner">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className={cn("font-black text-lg text-foreground group-hover:text-accent transition-colors", isPrivate && "blur-sm")}>{client.name}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Clock size={14} className="text-accent" /> {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-10 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest"
                          onClick={(e) => handleCopyLink(e, client.id)}
                        >
                          {copiedId === client.id ? <Check size={16} className="mr-2 text-emerald-500" /> : <LinkIcon size={16} className="mr-2" />}
                          {copiedId === client.id ? "Copied" : "Link"}
                        </Button>
                        <Link to={`/clients/${client.id}`}>
                          <div className="w-10 h-10 rounded-xl bg-muted text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            <ArrowRight size={20} />
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8">
              <div className="px-2 space-y-1">
                <h2 className="text-3xl font-serif font-bold tracking-tight">Session Activity</h2>
                <p className="text-muted-foreground font-medium">Volume of appointments over the last 6 months</p>
              </div>
              <div className="h-[350px] w-full bg-white dark:bg-slate-900/50 p-8 rounded-[3rem] border border-border shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3261" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1E3261" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 900}} />
                    <ChartTooltip 
                      contentStyle={{borderRadius: '24px', border: 'none', backgroundColor: 'hsl(var(--card))', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px'}}
                      labelStyle={{fontWeight: 900, color: 'hsl(var(--foreground))', marginBottom: '8px', fontSize: '16px', fontFamily: 'Playfair Display'}}
                    />
                    <Area type="monotone" dataKey="sessions" stroke="#1E3261" strokeWidth={6} fillOpacity={1} fill="url(#colorSessions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-8">
              <div className="px-2 space-y-1">
                <h2 className="text-3xl font-serif font-bold flex items-center gap-4 text-amber-600">
                  <StickyNote size={32} /> Practitioner Scratchpad
                </h2>
                <p className="text-muted-foreground font-medium">Quick notes or research ideas. Saves automatically to your browser.</p>
              </div>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => handleScratchpadChange(scratchpad ? `${scratchpad}\n[${tag}] ` : `[${tag}] `)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <Textarea 
                    value={scratchpad}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Type something here..."
                    className="min-h-[250px] bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-amber-500 focus:border-amber-500 resize-none text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-800 rounded-[2.5rem] p-10 text-2xl font-medium leading-relaxed shadow-xl transition-all"
                  />
                  <div className="absolute bottom-6 right-10 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 size={14} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-16">
            <MeridianClock />
            
            <UpcomingAppointments />
            
            <RecentActivity />

            <div className="p-10 bg-primary text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Wind size={150} /></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl">
                    <Wind size={24} className="text-secondary" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold">Clinical Focus</h3>
                </div>
                <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 shadow-inner">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">Practice Goal</p>
                  <p className="text-xl font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-secondary">Quarterly Progress</span>
                    <span className="text-white">68%</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-white rounded-full shadow-lg" style={{ width: '68%' }} />
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] h-14 shadow-lg" asChild>
                  <Link to="/oversight">View Clinical Oversight</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="px-2">
                <h3 className="text-2xl font-serif font-bold flex items-center gap-4 text-primary">
                  <Brain size={28} className="text-accent" /> Protocol Mastery
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button variant="outline" className="justify-start h-16 rounded-[1.5rem] border-secondary/30 hover:bg-muted font-black text-[11px] uppercase tracking-widest text-primary shadow-sm group" asChild>
                  <Link to="/practice/self">
                    <FlaskConical size={20} className="mr-4 text-primary group-hover:scale-110 transition-transform" /> 
                    Practice BOLT Test
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-16 rounded-[1.5rem] border-secondary/30 hover:bg-muted font-black text-[11px] uppercase tracking-widest text-primary shadow-sm group" asChild>
                  <Link to="/practice/self">
                    <Activity size={20} className="mr-4 text-accent group-hover:scale-110 transition-transform" /> 
                    Practice Coherence
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
              <DialogDescription className="text-lg font-medium">Create a new client profile in your clinical database.</DialogDescription>
            </DialogHeader>
            <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Schedule New Session</DialogTitle>
              <DialogDescription className="text-lg font-medium">Book a new appointment for an existing client.</DialogDescription>
            </DialogHeader>
            <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Index;