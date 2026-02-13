import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Calendar, Activity, TrendingUp, Loader2, 
  Plus, ArrowRight, UserPlus, Sparkles, Clock, 
  CheckCircle2, Zap, Upload, Target, FlaskConical, Brain, Info, Heart, AlertCircle, Edit3, StickyNote
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
import { format, subMonths, isToday, subDays, differenceInMinutes } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

const SCRATCHPAD_KEY = "antigravity_practitioner_scratchpad";

const Index = () => {
  const [stats, setStats] = useState({ 
    clients: 0, 
    appointments: 0,
    newClients30d: 0,
    sessions30d: 0,
    avgBolt: 0,
    avgCoherence: 0,
    imperativeAlerts: 0
  });
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [scratchpad, setScratchpad] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(SCRATCHPAD_KEY);
    if (saved) setScratchpad(saved);
  }, []);

  const handleScratchpadChange = (val: string) => {
    setScratchpad(val);
    localStorage.setItem(SCRATCHPAD_KEY, val);
  };

  const fetchDashboardData = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [
        { count: clientCount }, 
        { count: appCount }, 
        { data: allApps },
        { count: newClientsCount },
        { count: recentAppsCount },
        { data: clinicalClients }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('*, clients!inner(name, is_practitioner)').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null').gte('created_at', thirtyDaysAgo),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).gte('date', thirtyDaysAgo),
        supabase.from('clients').select('id, appointments(bolt_score, date)').or('is_practitioner.eq.false,is_practitioner.is.null')
      ]);

      const boltScores = allApps?.filter(a => a.bolt_score).map(a => a.bolt_score) || [];
      const cohScores = allApps?.filter(a => a.coherence_score).map(a => a.coherence_score) || [];
      
      const avgBolt = boltScores.length > 0 ? Math.round(boltScores.reduce((a, b) => a + b, 0) / boltScores.length) : 0;
      const avgCoh = cohScores.length > 0 ? cohScores.reduce((a, b) => a + b, 0) / cohScores.length : 0;

      let imperativeAlerts = 0;
      clinicalClients?.forEach(client => {
        const sortedApps = (client.appointments || [])
          .filter((a: any) => a.bolt_score !== null)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (sortedApps.length > 0 && (sortedApps[0] as any).bolt_score < 25) {
          imperativeAlerts++;
        }
      });

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0,
        newClients30d: newClientsCount || 0,
        sessions30d: recentAppsCount || 0,
        avgBolt,
        avgCoherence: avgCoh,
        imperativeAlerts
      });

      const today = allApps?.filter(app => isToday(new Date(app.date))) || [];
      setTodaySessions(today);

      const active = today.find(app => {
        const diff = differenceInMinutes(new Date(), new Date(app.date));
        return diff >= 0 && diff < 90 && app.status !== 'Completed';
      });
      setActiveSession(active);

      const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return { name: format(d, "MMM"), sessions: 0, date: d };
      });

      allApps?.forEach(app => {
        const appDate = new Date(app.date);
        const monthIndex = months.findIndex(m => 
          appDate.getMonth() === m.date.getMonth() && 
          appDate.getFullYear() === m.date.getFullYear()
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
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    </div>
  );

  const hasData = stats.clients > 0 || stats.appointments > 0;

  const QuickAction = ({ icon: Icon, label, onClick, color }: any) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg", color)}>
        <Icon size={28} className="text-white" />
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Welcome back! Here's your clinical overview for today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Date</p>
            <p className="text-sm font-bold text-slate-900">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[3rem] border-2 border-dashed border-indigo-200">
          <div className="mx-auto w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl">
            <Sparkles className="text-indigo-500" size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Welcome to Antigravity CRM!</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-10 text-lg">Start building your kinesiology practice by adding your first client and scheduling sessions.</p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-indigo-200" onClick={() => setClientDialogOpen(true)}>
              <UserPlus size={20} className="mr-2" /> Add First Client
            </Button>
            <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-slate-200" onClick={() => setAppDialogOpen(true)}>
              <Calendar size={20} className="mr-2" /> Schedule Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          {stats.imperativeAlerts > 0 && (
            <Link to="/oversight">
              <div className="bg-rose-600 text-white p-5 rounded-3xl shadow-xl shadow-rose-100 flex items-center justify-between group hover:bg-rose-700 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <p className="font-black text-xl">Clinical Attention Required</p>
                    <p className="text-rose-100 text-sm font-medium">{stats.imperativeAlerts} clients have imperative BOLT scores under 25s.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white/10 px-6 py-3 rounded-2xl group-hover:bg-white/20 transition-all">
                  Review Cases <ArrowRight size={18} />
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <QuickAction icon={UserPlus} label="New Client" onClick={() => setClientDialogOpen(true)} color="bg-indigo-600" />
            <QuickAction icon={Calendar} label="Book Session" onClick={() => setAppDialogOpen(true)} color="bg-rose-500" />
            <QuickAction icon={Heart} label="Self Practice" onClick={() => window.location.href='/self-practice'} color="bg-rose-500" />
            <QuickAction icon={Target} label="Procedures" onClick={() => window.location.href='/procedures'} color="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Sparkles size={160} /></div>
              <CardHeader className="pb-4 p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-black flex items-center gap-3">
                    <Zap size={32} className="text-amber-400 fill-amber-400" /> Daily Briefing
                  </CardTitle>
                  {activeSession && (
                    <Link to={`/appointments/${activeSession.id}`}>
                      <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-4 py-1.5 animate-pulse cursor-pointer font-black text-[10px] uppercase tracking-widest">
                        LIVE SESSION: {activeSession.clients?.name}
                      </Badge>
                    </Link>
                  )}
                </div>
                <CardDescription className="text-slate-400 text-lg font-medium">
                  {todaySessions.length > 0 
                    ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
                    : "No sessions scheduled for today. Time for some research or admin!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todaySessions.length > 0 ? (
                    todaySessions.map(session => (
                      <Link key={session.id} to={`/appointments/${session.id}`}>
                        <div className={cn(
                          "p-5 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group",
                          activeSession?.id === session.id 
                            ? "bg-white text-slate-900 border-white shadow-2xl scale-[1.02]" 
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        )}>
                          <div className="min-w-0">
                            <p className={cn(
                              "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                              activeSession?.id === session.id ? "text-rose-500" : "text-slate-400"
                            )}>
                              {activeSession?.id === session.id ? "ONGOING" : format(new Date(session.date), "h:mm a")}
                            </p>
                            <p className="font-black text-xl truncate">{session.clients?.name}</p>
                          </div>
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                            activeSession?.id === session.id ? "bg-indigo-50 text-indigo-600" : "bg-white/5 text-slate-500 group-hover:text-white"
                          )}>
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="sm:col-span-2 flex items-center gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/10">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="font-bold text-slate-300 text-lg">Your schedule is clear. Enjoy the space!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="pb-4 p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                  <TrendingUp size={28} className="text-indigo-600" /> Practice Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Clients</p>
                    <p className="text-4xl font-black text-slate-900">{stats.clients}</p>
                    <p className="text-[10px] text-emerald-600 font-black mt-2 flex items-center gap-1">
                      <TrendingUp size={10} /> +{stats.newClients30d} last 30d
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Sessions</p>
                    <p className="text-4xl font-black text-slate-900">{stats.appointments}</p>
                    <p className="text-[10px] text-indigo-600 font-black mt-2">
                      {stats.sessions30d} last 30d
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Averages</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 cursor-help hover:bg-indigo-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            <FlaskConical size={20} />
                          </div>
                          <span className="text-sm font-black text-indigo-900">Avg BOLT Score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-indigo-600">{stats.avgBolt}s</span>
                          <Info size={14} className="text-indigo-400" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px] rounded-xl p-3">
                      <p className="font-black text-[10px] uppercase tracking-widest mb-2">BOLT Targets</p>
                      <ul className="text-xs space-y-1 font-medium">
                        <li className="flex items-center justify-between"><span>Functional:</span> <span className="font-black text-emerald-600">25s+</span></li>
                        <li className="flex items-center justify-between"><span>Optimal:</span> <span className="font-black text-indigo-600">40s+</span></li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100 cursor-help hover:bg-rose-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm">
                            <Brain size={20} />
                          </div>
                          <span className="text-sm font-black text-rose-900">Avg Coherence</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-rose-600">{stats.avgCoherence.toFixed(2)}</span>
                          <Info size={14} className="text-rose-400" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px] rounded-xl p-3">
                      <p className="font-black text-[10px] uppercase tracking-widest mb-2">Coherence Score</p>
                      <p className="text-xs font-medium leading-relaxed">Ratio of Heart Rate to Breath Rate. Whole numbers indicate high autonomic synchronization.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-xl font-black">Session Activity</CardTitle>
                  <CardDescription className="font-medium">Volume of appointments over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] p-8 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                      <ChartTooltip 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                        labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '4px'}}
                      />
                      <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSessions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[2.5rem] bg-amber-50 border border-amber-100 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black flex items-center gap-3 text-amber-900">
                    <StickyNote size={28} className="text-amber-600" /> Practitioner Scratchpad
                  </CardTitle>
                  <CardDescription className="text-amber-700 font-medium text-base">Quick notes, reminders, or research ideas. Saves automatically.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <Textarea 
                    value={scratchpad}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Type something here..."
                    className="min-h-[180px] bg-white/60 border-amber-200 focus:ring-amber-500 focus:border-amber-500 resize-none text-amber-900 placeholder:text-amber-300 rounded-3xl p-6 text-lg font-medium leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-end gap-2 mt-4 text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">
                    <CheckCircle2 size={12} /> Auto-saved to browser
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <UpcomingAppointments />
              <RecentActivity />
            </div>
          </div>
        </>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-2xl font-black">Add New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-2xl font-black">Schedule New Session</DialogTitle></DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;