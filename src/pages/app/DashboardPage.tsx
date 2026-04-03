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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 w-48 rounded-xl" /><Skeleton className="h-4 w-96 rounded-xl" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />)}
        </div>
      </div>
    </AppLayout>
  );

  const hasData = stats.clients > 0 || stats.appointments > 0;

  return (
    <AppLayout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary">Practice Hub</h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">Welcome back! Here's your clinical overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/settings/demo">
              <Button variant="outline" className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-secondary text-primary hover:bg-muted shadow-sm">
                <Sparkles size={18} className="mr-2" /> Launch Demo Session
              </Button>
            </Link>
            <div className="flex items-center gap-3 bg-white p-3 rounded-[1.5rem] border border-secondary/30 shadow-sm">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-primary">
                <Calendar size={20} />
              </div>
              <div className="pr-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today's Date</p>
                <p className="text-base font-bold text-primary">{format(currentTime, "EEEE, MMMM d")}</p>
              </div>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="text-center py-20 bg-gradient-to-br from-muted to-white rounded-[3rem] border-2 border-dashed border-secondary">
            <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Sparkles className="text-accent" size={32} />
            </div>
            <h2 className="text-2xl font-black text-primary mb-2">Welcome to Resonance!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-base font-medium">Start building your kinesiology practice by adding your first client and scheduling sessions.</p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" onClick={() => setClientDialogOpen(true)}>
                <UserPlus size={20} className="mr-2" /> Add First Client
              </Button>
              <Button variant="outline" className="h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-border bg-white" onClick={() => setAppDialogOpen(true)}>
                <Calendar size={20} className="mr-2" /> Schedule Session
              </Button>
            </div>
          </div>
        ) : (
          <>
            <PractitionerGrounding />

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setClientDialogOpen(true)}
                className="h-24 rounded-[2rem] bg-white border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600 flex flex-col gap-2 shadow-sm transition-all group"
              >
                <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-[10px] uppercase tracking-widest">New Client</span>
              </Button>
              <Button 
                onClick={() => setAppDialogOpen(true)}
                className="h-24 rounded-[2rem] bg-white border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 text-rose-600 flex flex-col gap-2 shadow-sm transition-all group"
              >
                <CalendarPlus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-[10px] uppercase tracking-widest">Book Session</span>
              </Button>
              <Link to="/practice/calibrate" className="block">
                <Button 
                  className="w-full h-24 rounded-[2rem] bg-white border-2 border-amber-100 hover:border-amber-500 hover:bg-amber-50 text-amber-600 flex flex-col gap-2 shadow-sm transition-all group"
                >
                  <Zap size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Quick Calibrate</span>
                </Button>
              </Link>
              <Link to="/practice/procedures" className="block">
                <Button 
                  className="w-full h-24 rounded-[2rem] bg-white border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 flex flex-col gap-2 shadow-sm transition-all group"
                >
                  <Target size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Procedures</span>
                </Button>
              </Link>
            </div>

            <DashboardStats stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Content Column */}
              <div className="lg:col-span-8 space-y-12">
                <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
                
                {pendingOnboarding.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-2xl font-black flex items-center gap-3 text-primary">
                        <ClipboardCheck size={24} className="text-accent" /> Recent Onboarding
                      </h2>
                      <Badge className="bg-accent text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                        New Submissions
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {pendingOnboarding.map(client => (
                        <div key={client.id} className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-secondary/30 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                          <Link to={`/clients/${client.id}`} className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-muted text-primary flex items-center justify-center font-black text-lg">
                              {client.name.charAt(0)}
                            </div>
                            <div>
                              <p className={cn("font-black text-lg text-foreground group-hover:text-accent transition-colors", isPrivate && "blur-sm")}>{client.name}</p>
                              <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Clock size={14} className="text-accent" /> Updated {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 px-3 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-widest"
                              onClick={(e) => handleCopyLink(e, client.id)}
                            >
                              {copiedId === client.id ? <Check size={14} className="mr-1.5 text-emerald-500" /> : <LinkIcon size={14} className="mr-1.5" />}
                              {copiedId === client.id ? "Copied" : "Copy Link"}
                            </Button>
                            <Link to={`/clients/${client.id}`}>
                              <div className="w-10 h-10 rounded-xl bg-muted text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ArrowRight size={20} />
                              </div>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {priorityClients.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-2xl font-black flex items-center gap-3 text-rose-600">
                        <AlertCircle size={24} /> Clinical Priority: Today
                      </h2>
                      <Badge className="bg-rose-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                        {priorityClients.length} High Risk
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {priorityClients.map(pc => (
                        <Link key={pc.id} to={`/appointments/${pc.appointment.id}`}>
                          <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-rose-200 dark:border-rose-900/30 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-lg">
                                {pc.name.charAt(0)}
                              </div>
                              <div>
                                <p className={cn("font-black text-lg text-foreground group-hover:text-rose-600 transition-colors", isPrivate && "blur-sm")}>{pc.name}</p>
                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-1">
                                  <Clock size={14} className="text-rose-400" /> {format(new Date(pc.appointment.date), "h:mm a")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Latest BOLT</p>
                                <p className="text-2xl font-black text-rose-600">{pc.bolt}s</p>
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                                <ArrowRight size={20} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="px-2">
                    <h2 className="text-2xl font-black tracking-tight">Session Activity</h2>
                    <p className="text-muted-foreground font-medium">Volume of appointments over the last 6 months</p>
                  </div>
                  <div className="h-[300px] w-full">
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
                          contentStyle={{borderRadius: '20px', border: 'none', backgroundColor: 'hsl(var(--card))', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}}
                          labelStyle={{fontWeight: 900, color: 'hsl(var(--foreground))', marginBottom: '5px', fontSize: '14px'}}
                        />
                        <Area type="monotone" dataKey="sessions" stroke="#1E3261" strokeWidth={5} fillOpacity={1} fill="url(#colorSessions)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="px-2">
                    <h2 className="text-2xl font-black flex items-center gap-3 text-amber-600">
                      <StickyNote size={24} /> Practitioner Scratchpad
                    </h2>
                    <p className="text-muted-foreground font-medium">Quick notes or research ideas. Saves automatically.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => handleScratchpadChange(scratchpad ? `${scratchpad}\n[${tag}] ` : `[${tag}] `)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      value={scratchpad}
                      onChange={(e) => handleScratchpadChange(e.target.value)}
                      placeholder="Type something here..."
                      className="min-h-[200px] bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-amber-500 focus:border-amber-500 resize-none text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-800 rounded-[2rem] p-8 text-xl font-medium leading-relaxed shadow-inner"
                    />
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
                      <CheckCircle2 size={14} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved to browser'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-4 space-y-12">
                <MeridianClock />
                
                <UpcomingAppointments />
                
                <RecentActivity />

                <div className="p-8 bg-primary text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Wind size={120} /></div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                        <Wind size={20} className="text-secondary" />
                      </div>
                      <h3 className="text-xl font-black">Clinical Focus</h3>
                    </div>
                    <div className="p-5 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Practice Goal</p>
                      <p className="text-lg font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-secondary">Quarterly Progress</span>
                        <span className="text-white">68%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-white rounded-full shadow-lg" style={{ width: '68%' }} />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] h-12 shadow-lg" asChild>
                      <Link to="/oversight">View Clinical Oversight</Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="px-2">
                    <h3 className="text-xl font-black flex items-center gap-3 text-primary">
                      <Brain size={24} className="text-accent" /> Protocol Mastery
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="justify-start h-14 rounded-2xl border-secondary/30 hover:bg-muted font-black text-[10px] uppercase tracking-widest text-primary shadow-sm" asChild>
                      <Link to="/practice/self"><FlaskConical size={18} className="mr-3 text-primary" /> Practice BOLT Test</Link>
                    </Button>
                    <Button variant="outline" className="justify-start h-14 rounded-2xl border-secondary/30 hover:bg-muted font-black text-[10px] uppercase tracking-widest text-primary shadow-sm" asChild>
                      <Link to="/practice/self"><Activity size={18} className="mr-3 text-accent" /> Practice Coherence</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight">Add New Client</DialogTitle>
                <DialogDescription className="font-medium">Create a new client profile in your clinical database.</DialogDescription>
              </DialogHeader>
              <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight">Schedule New Session</DialogTitle>
                <DialogDescription className="font-medium">Book a new appointment for an existing client.</DialogDescription>
              </DialogHeader>
              <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Index;