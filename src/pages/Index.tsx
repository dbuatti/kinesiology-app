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
  ArrowRight, AlertCircle, TrendingUp, Clock
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
        return diff >= 0 && diff < 90 && app.status !== 'Completed';
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
    <div className="p-4 md:p-10 max-w-full mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 font-medium mt-2 text-xl">Welcome back! Here's your clinical overview for today.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Calendar size={24} />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Date</p>
            <p className="text-lg font-bold text-slate-900">{format(currentTime, "EEEE, MMMM d")}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-32 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[4rem] border-2 border-dashed border-indigo-200">
          <div className="mx-auto w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
            <Sparkles className="text-indigo-500" size={48} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">Welcome to Antigravity CRM!</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-12 text-xl font-medium">Start building your kinesiology practice by adding your first client and scheduling sessions.</p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200" onClick={() => setClientDialogOpen(true)}>
              <UserPlus size={20} className="mr-2" /> Add First Client
            </Button>
            <Button variant="outline" className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-200 bg-white" onClick={() => setAppDialogOpen(true)}>
              <Calendar size={20} className="mr-2" /> Schedule Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          <DashboardStats stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
              
              {priorityClients.length > 0 && (
                <Card className="border-none shadow-xl rounded-[3rem] bg-rose-50 border-2 border-rose-100 overflow-hidden">
                  <CardHeader className="p-10 pb-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-black flex items-center gap-4 text-rose-900">
                        <AlertCircle size={28} className="text-rose-600" /> Clinical Priority: Today
                      </CardTitle>
                      <Badge className="bg-rose-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                        {priorityClients.length} High Risk
                      </Badge>
                    </div>
                    <CardDescription className="text-rose-700 font-medium text-lg mt-2">
                      Clients scheduled for today with BOLT scores below functional baseline (25s).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 space-y-4">
                    {priorityClients.map(pc => (
                      <Link key={pc.id} to={`/appointments/${pc.appointment.id}`}>
                        <div className="p-6 bg-white rounded-[2rem] border border-rose-200 flex items-center justify-between group hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl">
                              {pc.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-xl text-slate-900 group-hover:text-rose-600 transition-colors">{pc.name}</p>
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1">
                                <Clock size={14} className="text-rose-400" /> {format(new Date(pc.appointment.date), "h:mm a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latest BOLT</p>
                              <p className="text-2xl font-black text-rose-600">{pc.bolt}s</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                              <ArrowRight size={20} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-10">
              {nextSession && (
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden animate-in zoom-in-95 duration-500">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                        <Timer size={28} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Next Session Starts In</p>
                        <h3 className="text-3xl font-black tracking-tight">
                          {formatDistanceToNow(nextSession.date)}
                        </h3>
                        <p className="text-xs font-bold opacity-90 mt-1">Client: {nextSession.clients?.name}</p>
                      </div>
                    </div>
                    <Link to={`/appointments/${nextSession.id}`}>
                      <Button size="icon" className="w-12 h-12 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg">
                        <ArrowRight size={24} />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
              <MeridianClock />
              <UpcomingAppointments />
              <RecentActivity />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <Card className="border-none shadow-xl rounded-[3.5rem] overflow-hidden bg-white">
                <CardHeader className="p-12 pb-0">
                  <CardTitle className="text-3xl font-black tracking-tight">Session Activity</CardTitle>
                  <CardDescription className="font-medium text-xl mt-2">Volume of appointments over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] p-12 pt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 900}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 900}} />
                      <ChartTooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px'}}
                        labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '10px', fontSize: '16px'}}
                      />
                      <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={6} fillOpacity={1} fill="url(#colorSessions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[3.5rem] bg-amber-50 border border-amber-100 overflow-hidden">
                <CardHeader className="p-12 pb-6">
                  <CardTitle className="text-3xl font-black flex items-center gap-5 text-amber-900">
                    <StickyNote size={32} className="text-amber-600" /> Practitioner Scratchpad
                  </CardTitle>
                  <CardDescription className="text-amber-700 font-medium text-xl">Quick notes, reminders, or research ideas. Saves automatically.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {["Research", "Follow-up", "Protocol Idea", "Clinical Note"].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => handleScratchpadChange(scratchpad ? `${scratchpad}\n[${tag}] ` : `[${tag}] `)}
                        className="px-4 py-2 rounded-xl bg-white border border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    value={scratchpad}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Type something here..."
                    className="min-h-[250px] bg-white/70 border-amber-200 focus:ring-amber-500 focus:border-amber-500 resize-none text-amber-900 placeholder:text-amber-300 rounded-[3rem] p-10 text-2xl font-medium leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-end gap-3 mt-8 text-[11px] font-black text-amber-600 uppercase tracking-[0.35em]">
                    <CheckCircle2 size={16} /> {lastSaved ? `Last saved at ${lastSaved}` : 'Auto-saved to browser'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              <Card className="border-none shadow-xl rounded-[3.5rem] bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Wind size={150} /></div>
                <CardHeader className="p-10">
                  <CardTitle className="text-3xl font-black flex items-center gap-4">
                    <Wind size={32} className="text-teal-400" /> Clinical Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 shadow-inner">
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-3">Practice Goal</p>
                    <p className="text-xl font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between text-sm font-black uppercase tracking-widest">
                      <span className="text-indigo-300">Quarterly Progress</span>
                      <span className="text-teal-400">68%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-teal-400 rounded-full shadow-lg" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] h-14 shadow-lg" asChild>
                    <Link to="/oversight">View Clinical Oversight</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[3.5rem] bg-white overflow-hidden">
                <CardHeader className="p-10">
                  <CardTitle className="text-3xl font-black flex items-center gap-4 text-slate-900">
                    <Brain size={32} className="text-purple-600" /> Protocol Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-6">
                  <p className="text-lg text-slate-500 font-medium leading-relaxed">Keep your skills sharp by practicing protocols in the Self-Monitoring Zone.</p>
                  <div className="grid grid-cols-1 gap-4">
                    <Button variant="outline" className="justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 font-black text-[11px] uppercase tracking-widest text-slate-700 shadow-sm" asChild>
                      <Link to="/self-practice"><FlaskConical size={18} className="mr-4 text-indigo-500" /> Practice BOLT Test</Link>
                    </Button>
                    <Button variant="outline" className="justify-start h-14 rounded-2xl border-slate-100 hover:bg-slate-50 font-black text-[11px] uppercase tracking-widest text-slate-700 shadow-sm" asChild>
                      <Link to="/self-practice"><Activity size={18} className="mr-4 text-rose-500" /> Practice Coherence</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3.5rem] p-10">
          <DialogHeader className="mb-6"><DialogTitle className="text-3xl font-black tracking-tight">Add New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3.5rem] p-10">
          <DialogHeader className="mb-6"><DialogTitle className="text-3xl font-black tracking-tight">Schedule New Session</DialogTitle></DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;