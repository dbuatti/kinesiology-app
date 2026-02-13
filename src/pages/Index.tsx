import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Calendar, Activity, TrendingUp, Loader2, 
  Plus, ArrowRight, UserPlus, Sparkles, Clock, 
  CheckCircle2, Zap, Target, FlaskConical, Brain, Info, Heart, AlertCircle, StickyNote, Wind
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
      className="flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-xl", color)}>
        <Icon size={32} className="text-white" />
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Welcome back! Here's your clinical overview for today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Date</p>
            <p className="text-base font-bold text-slate-900">{format(new Date(), "EEEE, MMMM d")}</p>
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
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Clients</p>
                  <p className="text-3xl font-black text-slate-900">{stats.clients}</p>
                  <p className="text-[10px] text-emerald-600 font-black mt-1 flex items-center gap-1">
                    <TrendingUp size={10} /> +{stats.newClients30d} this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</p>
                  <p className="text-3xl font-black text-slate-900">{stats.appointments}</p>
                  <p className="text-[10px] text-indigo-600 font-black mt-1">
                    {stats.sessions30d} this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FlaskConical size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg BOLT Score</p>
                  <p className="text-3xl font-black text-slate-900">{stats.avgBolt}s</p>
                  <p className="text-[10px] text-slate-400 font-black mt-1">Practice average</p>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-none shadow-lg rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all",
              stats.imperativeAlerts > 0 ? "bg-rose-600 text-white" : "bg-white"
            )}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                  stats.imperativeAlerts > 0 ? "bg-white/20 backdrop-blur-md" : "bg-amber-50 text-amber-600"
                )}>
                  <AlertCircle size={28} />
                </div>
                <div>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-slate-400")}>Imperative Cases</p>
                  <p className="text-3xl font-black">{stats.imperativeAlerts}</p>
                  <p className={cn("text-[10px] font-black mt-1", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-slate-400")}>Requires attention</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <QuickAction icon={UserPlus} label="New Client" onClick={() => setClientDialogOpen(true)} color="bg-indigo-600" />
            <QuickAction icon={Calendar} label="Book Session" onClick={() => setAppDialogOpen(true)} color="bg-rose-500" />
            <QuickAction icon={Heart} label="Self Practice" onClick={() => window.location.href='/self-practice'} color="bg-rose-500" />
            <QuickAction icon={Target} label="Procedures" onClick={() => window.location.href='/procedures'} color="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-2xl bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-[3rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Sparkles size={200} /></div>
              <CardHeader className="pb-4 p-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-4xl font-black flex items-center gap-4">
                    <Zap size={40} className="text-amber-400 fill-amber-400" /> Daily Briefing
                  </CardTitle>
                  {activeSession && (
                    <Link to={`/appointments/${activeSession.id}`}>
                      <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-6 py-2 animate-pulse cursor-pointer font-black text-xs uppercase tracking-widest rounded-xl">
                        LIVE SESSION: {activeSession.clients?.name}
                      </Badge>
                    </Link>
                  )}
                </div>
                <CardDescription className="text-slate-400 text-xl font-medium mt-2">
                  {todaySessions.length > 0 
                    ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
                    : "No sessions scheduled for today. Time for some research or admin!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {todaySessions.length > 0 ? (
                    todaySessions.map(session => (
                      <Link key={session.id} to={`/appointments/${session.id}`}>
                        <div className={cn(
                          "p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between group",
                          activeSession?.id === session.id 
                            ? "bg-white text-slate-950 border-white shadow-2xl scale-[1.02]" 
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        )}>
                          <div className="min-w-0">
                            <p className={cn(
                              "text-[10px] font-black uppercase tracking-[0.3em] mb-2",
                              activeSession?.id === session.id ? "text-rose-500" : "text-slate-400"
                            )}>
                              {activeSession?.id === session.id ? "ONGOING" : format(new Date(session.date), "h:mm a")}
                            </p>
                            <p className="font-black text-2xl truncate">{session.clients?.name}</p>
                          </div>
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                            activeSession?.id === session.id ? "bg-indigo-50 text-indigo-600" : "bg-white/5 text-slate-500 group-hover:text-white"
                          )}>
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="sm:col-span-2 flex items-center gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <p className="font-black text-slate-200 text-2xl">Your schedule is clear.</p>
                        <p className="text-slate-400 font-medium">Enjoy the space for deep work or rest.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <UpcomingAppointments />
              <RecentActivity />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-10 pb-0">
                  <CardTitle className="text-2xl font-black">Session Activity</CardTitle>
                  <CardDescription className="font-medium text-lg">Volume of appointments over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] p-10 pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} />
                      <ChartTooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px'}}
                        labelStyle={{fontWeight: 900, color: '#1e293b', marginBottom: '8px', fontSize: '14px'}}
                      />
                      <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorSessions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[3rem] bg-amber-50 border border-amber-100 overflow-hidden">
                <CardHeader className="p-10 pb-4">
                  <CardTitle className="text-3xl font-black flex items-center gap-4 text-amber-900">
                    <StickyNote size={32} className="text-amber-600" /> Practitioner Scratchpad
                  </CardTitle>
                  <CardDescription className="text-amber-700 font-medium text-lg">Quick notes, reminders, or research ideas. Saves automatically.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <Textarea 
                    value={scratchpad}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                    placeholder="Type something here..."
                    className="min-h-[220px] bg-white/60 border-amber-200 focus:ring-amber-500 focus:border-amber-500 resize-none text-amber-900 placeholder:text-amber-300 rounded-[2.5rem] p-8 text-xl font-medium leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-end gap-2 mt-6 text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
                    <CheckCircle2 size={14} /> Auto-saved to browser
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="border-none shadow-xl rounded-[3rem] bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Wind size={120} /></div>
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Wind size={24} className="text-teal-400" /> Clinical Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Practice Goal</p>
                    <p className="text-lg font-bold leading-snug">Improve practice-wide BOLT scores by 15% this quarter.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-indigo-200">Quarterly Progress</span>
                      <span>68%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest h-12" asChild>
                    <Link to="/oversight">View Clinical Oversight</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                    <Brain size={24} className="text-purple-600" /> Protocol Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Keep your skills sharp by practicing protocols in the Self-Monitoring Zone.</p>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="justify-start h-12 rounded-xl border-slate-100 hover:bg-slate-50 font-bold text-slate-700" asChild>
                      <Link to="/self-practice"><FlaskConical size={16} className="mr-3 text-indigo-500" /> Practice BOLT Test</Link>
                    </Button>
                    <Button variant="outline" className="justify-start h-12 rounded-xl border-slate-100 hover:bg-slate-50 font-bold text-slate-700" asChild>
                      <Link to="/self-practice"><Activity size={16} className="mr-3 text-rose-500" /> Practice Coherence</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3rem]">
          <DialogHeader><DialogTitle className="text-3xl font-black">Add New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem]">
          <DialogHeader><DialogTitle className="text-3xl font-black">Schedule New Session</DialogTitle></DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;