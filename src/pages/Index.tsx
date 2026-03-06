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
  ArrowRight, AlertCircle, TrendingUp, Clock, ShieldCheck, Heart,
  LayoutDashboard, ChevronRight, Search, CalendarPlus, Target
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
import { motion } from "framer-motion";

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
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-96" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
      </div>
    </div>
  );

  const hasData = stats.clients > 0 || stats.appointments > 0;

  return (
    <div className="p-4 md:p-10 max-w-full mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 font-medium text-lg">Welcome back! Here's your clinical overview for {format(currentTime, "EEEE")}.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setClientDialogOpen(true)}
            variant="outline" 
            className="rounded-xl h-12 px-6 border-slate-200 bg-white font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50"
          >
            <UserPlus size={18} className="mr-2 text-indigo-600" /> New Client
          </Button>
          <Button 
            onClick={() => setAppDialogOpen(true)}
            className="rounded-xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200"
          >
            <CalendarPlus size={18} className="mr-2" /> Book Session
          </Button>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-32 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[3rem] border-2 border-dashed border-indigo-200">
          <div className="mx-auto w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
            <Sparkles className="text-indigo-500" size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Welcome to Antigravity CRM!</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-10 text-lg font-medium">Start building your kinesiology practice by adding your first client and scheduling sessions.</p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-200" onClick={() => setClientDialogOpen(true)}>
              <UserPlus size={18} className="mr-2" /> Add First Client
            </Button>
            <Button variant="outline" className="h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200 bg-white" onClick={() => setAppDialogOpen(true)}>
              <Calendar size={18} className="mr-2" /> Schedule Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Stats Row */}
          <DashboardStats stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-10">
              {/* Active Session Hero */}
              {activeSession ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="border-none shadow-2xl bg-indigo-600 text-white rounded-[3rem] overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700" />
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Activity size={200} />
                    </div>
                    <CardContent className="p-10 relative z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <Badge className="bg-white/20 text-white border-none px-4 py-1.5 animate-pulse font-black text-[10px] uppercase tracking-[0.2em] rounded-full">
                            <Activity size={14} className="mr-2" /> Live Session in Progress
                          </Badge>
                          <div>
                            <h2 className="text-5xl font-black tracking-tighter">{activeSession.clients?.name}</h2>
                            <p className="text-indigo-100 text-xl font-medium mt-2">Current Stage: <span className="font-black text-white">{activeSession.tag}</span></p>
                          </div>
                          <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                              <Clock size={20} className="text-indigo-300" />
                              <span className="font-bold text-lg">{format(activeSession.date, "h:mm a")}</span>
                            </div>
                            <div className="h-8 w-[2px] bg-white/10 rounded-full" />
                            <div className="flex items-center gap-2">
                              <Target size={20} className="text-indigo-300" />
                              <span className="font-bold text-lg truncate max-w-[200px]">{activeSession.goal || "No goal set"}</span>
                            </div>
                          </div>
                        </div>
                        <Link to={`/appointments/${activeSession.id}`}>
                          <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 h-16 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-900/20 group/btn">
                            Enter Session <ChevronRight size={20} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <DailyBriefing todaySessions={todaySessions} activeSession={null} />
              )}
              
              {/* Clinical Priorities & Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {priorityClients.length > 0 && (
                  <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-50 border-2 border-rose-100 overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black flex items-center gap-3 text-rose-900">
                          <AlertCircle size={24} className="text-rose-600" /> Clinical Priority
                        </CardTitle>
                        <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                          {priorityClients.length} High Risk
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-3">
                      {priorityClients.map(pc => (
                        <Link key={pc.id} to={`/appointments/${pc.appointment.id}`}>
                          <div className="p-5 bg-white rounded-2xl border border-rose-200 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-lg">
                                {pc.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-lg text-slate-900 group-hover:text-rose-600 transition-colors">{pc.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Clock size={12} className="text-rose-400" /> {format(new Date(pc.appointment.date), "h:mm a")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BOLT</p>
                              <p className="text-xl font-black text-rose-600">{pc.bolt}s</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                  <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                      <TrendingUp size={24} className="text-indigo-600" /> Session Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] p-8 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 900}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 900}} />
                        <ChartTooltip 
                          contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.2)', padding: '15px'}}
                          labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '5px', fontSize: '14px'}}
                        />
                        <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSessions)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Scratchpad */}
              <Card className="border-none shadow-xl rounded-[3rem] bg-amber-50 border border-amber-100 overflow-hidden">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-2xl font-black flex items-center gap-4 text-amber-900">
                    <StickyNote size={28} className="text-amber-600" /> Practitioner Scratchpad
                  </CardTitle>
                  <CardDescription className="text-amber-700 font-medium text-lg">Quick notes, reminders, or research ideas. Saves automatically.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => handleScratchpadChange(scratchpad ? `${scratchpad}\n[${tag}] ` : `[${tag}] `)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-[9px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    value={scratchpad}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Type something here..."
                    className="min-h-[200px] bg-white/70 border-amber-200 focus:ring-amber-500 focus:border-amber-500 resize-none text-amber-900 placeholder:text-amber-300 rounded-[2.5rem] p-8 text-xl font-medium leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-end gap-2 mt-6 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
                    <CheckCircle2 size={14} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved to browser'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-10">
              {/* Next Session Countdown */}
              {nextSession && !activeSession && (
                <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-600 text-white overflow-hidden animate-in zoom-in-95 duration-500">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                        <Timer size={24} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Next Session In</p>
                        <h3 className="text-2xl font-black tracking-tight">
                          {formatDistanceToNow(nextSession.date)}
                        </h3>
                        <p className="text-[10px] font-bold opacity-90 mt-0.5">Client: {nextSession.clients?.name}</p>
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

              {/* Quick Links / Resources */}
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Wind size={120} /></div>
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
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-indigo-300">Quarterly Progress</span>
                      <span className="text-teal-400">68%</span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-teal-400 rounded-full shadow-lg" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] h-12 shadow-lg" asChild>
                    <Link to="/oversight">View Clinical Oversight</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-10">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black tracking-tight">Add New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-10">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black tracking-tight">Schedule New Session</DialogTitle></DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;