"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Activity, Loader2,
  Plus, UserPlus, Sparkles,
  CheckCircle2, Zap, FlaskConical, Brain, Wind, StickyNote, Timer,
  ArrowRight, AlertCircle, TrendingUp, Clock, ShieldCheck, Heart
} from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  Dialog,
  DialogContent,
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
import { cn } from "@/lib/utils";

const SCRATCHPAD_KEY = "antigravity_practitioner_scratchpad";
const SCRATCHPAD_TIME_KEY = "antigravity_practitioner_scratchpad_time";

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
  const [nextSession, setNextSession] = useState<AppointmentWithClient | null>(null);
  const [priorityClients, setPriorityClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [chartData, setChartData] = useState<{ name: string; sessions: number; date: Date }[]>([]);
  const [scratchpad, setScratchpad] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
        { data: clinicalClients }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('*, clients!inner(name, is_practitioner)').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null').gte('created_at', thirtyDaysAgo),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).gte('date', thirtyDaysAgo),
        supabase.from('clients').select('id, name, appointments(bolt_score, date)').or('is_practitioner.eq.false,is_practitioner.is.null')
      ]);

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

      const upcoming = today
        .filter(app => app.date > now && app.status === 'Scheduled')
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      setNextSession(upcoming || null);

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
    <div className="p-4 md:p-6 max-w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-96" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
    </div>
  );

  const hasData = stats.clients > 0 || stats.appointments > 0;

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground">Practice Hub</h1>
          <p className="text-muted-foreground font-medium mt-1 text-lg">Welcome back! Here's your clinical overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/demo-session">
            <Button variant="outline" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm">
              <Sparkles size={18} className="mr-2" /> Launch Demo Session
            </Button>
          </Link>
          <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar size={20} />
            </div>
            <div className="pr-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Today's Date</p>
              <p className="text-base font-bold text-foreground">{format(currentTime, "EEEE, MMMM d")}</p>
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-20 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-[2.5rem] border-2 border-dashed border-indigo-200 dark:border-indigo-800">
          <div className="mx-auto w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Sparkles className="text-indigo-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Welcome to Antigravity CRM!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-base font-medium">Start building your kinesiology practice by adding your first client and scheduling sessions.</p>
          <div className="flex gap-3 justify-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200" onClick={() => setClientDialogOpen(true)}>
              <UserPlus size={20} className="mr-2" /> Add First Client
            </Button>
            <Button variant="outline" className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest border-border bg-card" onClick={() => setAppDialogOpen(true)}>
              <Calendar size={20} className="mr-2" /> Schedule Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Clinical Pulse Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-md rounded-[2rem] bg-indigo-900 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Activity size={80} /></div>
              <CardContent className="p-6 flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Activity size={24} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Clinical Pulse</p>
                  <p className="text-2xl font-black">Autonomic Sync</p>
                  <p className="text-xs text-indigo-200 font-medium mt-1">Avg Coherence: {stats.avgCoherence.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-[2rem] bg-emerald-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Wind size={80} /></div>
              <CardContent className="p-6 flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Wind size={24} className="text-emerald-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Respiratory Health</p>
                  <p className="text-2xl font-black">CO2 Tolerance</p>
                  <p className="text-xs text-emerald-100 font-medium mt-1">Avg BOLT: {stats.avgBolt}s</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-[2rem] bg-rose-600 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><Heart size={80} /></div>
              <CardContent className="p-6 flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Heart size={24} className="text-rose-200" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Practice Load</p>
                  <p className="text-2xl font-black">Active Cases</p>
                  <p className="text-xs text-rose-100 font-medium mt-1">{stats.sessionsThisWeek} sessions this week</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DashboardStats stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-8">
              <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
              
              {priorityClients.length > 0 && (
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-rose-50 dark:bg-rose-950/10 border-2 border-rose-100 dark:border-rose-900/30 overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-900 dark:text-rose-100">
                        <AlertCircle size={24} className="text-rose-600" /> Clinical Priority: Today
                      </CardTitle>
                      <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                        {priorityClients.length} High Risk
                      </Badge>
                    </div>
                    <CardDescription className="text-rose-700 dark:text-rose-300 font-medium text-base mt-1">
                      Clients scheduled for today with BOLT scores below functional baseline (25s).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-3">
                    {priorityClients.map(pc => (
                      <Link key={pc.id} to={`/appointments/${pc.appointment.id}`}>
                        <div className="p-5 bg-card rounded-2xl border border-rose-200 dark:border-rose-900/30 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-lg">
                              {pc.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-lg text-foreground group-hover:text-rose-600 transition-colors">{pc.name}</p>
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
                  </CardContent>
                </Card>
              )}

              <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-card">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-2xl font-black tracking-tight">Session Activity</CardTitle>
                  <CardDescription className="font-medium text-lg mt-1">Volume of appointments over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] p-8 pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 900}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 900}} />
                      <ChartTooltip 
                        contentStyle={{borderRadius: '20px', border: 'none', backgroundColor: 'hsl(var(--card))', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}}
                        labelStyle={{fontWeight: 900, color: 'hsl(var(--foreground))', marginBottom: '5px', fontSize: '14px'}}
                      />
                      <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorSessions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg rounded-[2.5rem] bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black flex items-center gap-3 text-amber-900 dark:text-amber-100">
                    <StickyNote size={28} className="text-amber-600" /> Practitioner Scratchpad
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300 font-medium text-lg">Quick notes or research ideas. Saves automatically.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => handleScratchpadChange(scratchpad ? `${scratchpad}\n[${tag}] ` : `[${tag}] `)}
                        className="px-3 py-1.5 rounded-xl bg-card border border-amber-200 dark:border-amber-900/30 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    value={scratchpad}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Type something here..."
                    className="min-h-[200px] bg-card/70 border-amber-200 dark:border-amber-900/30 focus:ring-amber-500 focus:border-amber-500 resize-none text-amber-900 dark:text-amber-100 placeholder:text-amber-300 dark:placeholder:text-amber-800 rounded-[2rem] p-8 text-xl font-medium leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-end gap-2 mt-4 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
                    <CheckCircle2 size={14} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved to browser'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              {nextSession && (
                <Card className="border-none shadow-lg rounded-[2rem] bg-indigo-600 text-white overflow-hidden animate-in zoom-in-95 duration-500">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                        <Timer size={24} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Next Session In</p>
                        <h3 className="text-2xl font-black tracking-tight">
                          {formatDistanceToNow(nextSession.date)}
                        </h3>
                        <p className="text-xs font-bold opacity-90 mt-1">Client: {nextSession.clients?.name}</p>
                      </div>
                    </div>
                    <Link to={`/appointments/${nextSession.id}`}>
                      <Button size="icon" className="w-10 h-10 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg">
                        <ArrowRight size={20} />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <MeridianClock />
              
              <UpcomingAppointments />
              
              <RecentActivity />

              <Card className="border-none shadow-lg rounded-[2rem] bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Wind size={120} /></div>
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Wind size={28} className="text-teal-400" /> Clinical Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-5 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Practice Goal</p>
                    <p className="text-lg font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-indigo-300">Quarterly Progress</span>
                      <span className="text-teal-400">68%</span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-teal-400 rounded-full shadow-lg" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] h-12 shadow-lg" asChild>
                    <Link to="/oversight">View Clinical Oversight</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg rounded-[2rem] bg-card overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black flex items-center gap-3 text-foreground">
                    <Brain size={28} className="text-purple-600" /> Protocol Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <p className="text-base text-muted-foreground font-medium leading-relaxed">Keep your skills sharp by practicing protocols.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="justify-start h-12 rounded-2xl border-border hover:bg-accent font-black text-[10px] uppercase tracking-widest text-foreground shadow-sm" asChild>
                      <Link to="/self-practice"><FlaskConical size={18} className="mr-3 text-indigo-500" /> Practice BOLT Test</Link>
                    </Button>
                    <Button variant="outline" className="justify-start h-12 rounded-2xl border-border hover:bg-accent font-black text-[10px] uppercase tracking-widest text-foreground shadow-sm" asChild>
                      <Link to="/self-practice"><Activity size={18} className="mr-3 text-rose-500" /> Practice Coherence</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black flex items-center gap-3 text-indigo-900 dark:text-indigo-100">
                    <Sparkles size={28} className="text-indigo-600" /> Program Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <p className="text-base text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">Access your weekly worksheets and materials.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button className="justify-start h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-indigo-200" asChild>
                      <Link to="/week-3-worksheet">
                        <ShieldCheck size={20} className="mr-3" /> Week 3: Releasing Curses
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start h-12 rounded-2xl border-indigo-200 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-black text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-300 shadow-sm" asChild>
                      <Link to="/north-star"><Sparkles size={18} className="mr-3 text-indigo-500" /> North Star Worksheet</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-4"><DialogTitle className="text-2xl font-black tracking-tight">Add New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader className="mb-4"><DialogTitle className="text-2xl font-black tracking-tight">Schedule New Session</DialogTitle></DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;