import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Calendar, Activity, TrendingUp, Loader2, 
  Plus, ArrowRight, UserPlus, Sparkles, Clock, 
  CheckCircle2, Zap, Upload, Target, FlaskConical, Brain, Info, Heart
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

const Index = () => {
  const [stats, setStats] = useState({ 
    clients: 0, 
    appointments: 0,
    newClients30d: 0,
    sessions30d: 0,
    avgBolt: 0,
    avgCoherence: 0
  });
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Fetch data while filtering out practitioner self-monitoring records (handling NULL values)
      const [
        { count: clientCount }, 
        { count: appCount }, 
        { data: allApps },
        { count: newClientsCount },
        { count: recentAppsCount }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null'),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }),
        supabase.from('appointments').select('*, clients!inner(name, is_practitioner)').or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).order('date', { ascending: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null').gte('created_at', thirtyDaysAgo),
        supabase.from('appointments').select('*, clients!inner(is_practitioner)', { count: 'exact', head: true }).or('is_practitioner.eq.false,is_practitioner.is.null', { foreignTable: 'clients' }).gte('date', thirtyDaysAgo)
      ]);

      // Calculate averages for clinical clients only
      const boltScores = allApps?.filter(a => a.bolt_score).map(a => a.bolt_score) || [];
      const cohScores = allApps?.filter(a => a.coherence_score).map(a => a.coherence_score) || [];
      
      const avgBolt = boltScores.length > 0 ? Math.round(boltScores.reduce((a, b) => a + b, 0) / boltScores.length) : 0;
      const avgCoh = cohScores.length > 0 ? cohScores.reduce((a, b) => a + b, 0) / cohScores.length : 0;

      setStats({ 
        clients: clientCount || 0, 
        appointments: appCount || 0,
        newClients30d: newClientsCount || 0,
        sessions30d: recentAppsCount || 0,
        avgBolt,
        avgCoherence: avgCoh
      });

      // Filter today's sessions
      const today = allApps?.filter(app => isToday(new Date(app.date))) || [];
      setTodaySessions(today);

      // Find active session (started within last 90 mins)
      const active = today.find(app => {
        const diff = differenceInMinutes(new Date(), new Date(app.date));
        return diff >= 0 && diff < 90 && app.status !== 'Completed';
      });
      setActiveSession(active);

      // Process chart data for last 6 months
      const months = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return {
          name: format(d, "MMM"),
          sessions: 0,
          date: d
        };
      });

      allApps?.forEach(app => {
        const appDate = new Date(app.date);
        const monthIndex = months.findIndex(m => 
          appDate.getMonth() === m.date.getMonth() && 
          appDate.getFullYear() === m.date.getFullYear()
        );
        if (monthIndex !== -1) {
          months[monthIndex].sessions += 1;
        }
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
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
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
      className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 font-medium">Welcome back! Here's what's happening in your practice.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Date</p>
            <p className="text-sm font-bold text-slate-900">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-20 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border-2 border-dashed border-indigo-200">
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Sparkles className="text-indigo-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Antigravity CRM!</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Start building your kinesiology practice by adding your first client and scheduling sessions.
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setClientDialogOpen(true)}>
              <UserPlus size={18} className="mr-2" /> Add First Client
            </Button>
            <Button variant="outline" onClick={() => setAppDialogOpen(true)}>
              <Calendar size={18} className="mr-2" /> Schedule Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction icon={UserPlus} label="New Client" onClick={() => setClientDialogOpen(true)} color="bg-indigo-600" />
            <QuickAction icon={Calendar} label="Book Session" onClick={() => setAppDialogOpen(true)} color="bg-rose-50" />
            <QuickAction icon={Heart} label="Self Practice" onClick={() => window.location.href='/self-practice'} color="bg-rose-500" />
            <QuickAction icon={Target} label="Procedures" onClick={() => window.location.href='/procedures'} color="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles size={120} />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Zap size={24} className="text-amber-400 fill-amber-400" /> Daily Briefing
                  </CardTitle>
                  {activeSession && (
                    <Link to={`/appointments/${activeSession.id}`}>
                      <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-3 py-1 animate-pulse cursor-pointer">
                        LIVE SESSION: {activeSession.clients?.name}
                      </Badge>
                    </Link>
                  )}
                </div>
                <CardDescription className="text-slate-400 text-base">
                  {todaySessions.length > 0 
                    ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
                    : "No sessions scheduled for today. Time for some research or admin!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todaySessions.length > 0 ? (
                    todaySessions.map(session => (
                      <Link key={session.id} to={`/appointments/${session.id}`}>
                        <div className={cn(
                          "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                          activeSession?.id === session.id 
                            ? "bg-white text-slate-900 border-white shadow-xl scale-[1.02]" 
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                        )}>
                          <div className="min-w-0">
                            <p className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              activeSession?.id === session.id ? "text-rose-500" : "text-slate-400"
                            )}>
                              {activeSession?.id === session.id ? "ONGOING" : format(new Date(session.date), "h:mm a")}
                            </p>
                            <p className="font-bold text-lg truncate">{session.clients?.name}</p>
                          </div>
                          <ArrowRight size={20} className={cn(
                            "group-hover:translate-x-1 transition-transform",
                            activeSession?.id === session.id ? "text-indigo-600" : "text-slate-500"
                          )} />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <CheckCircle2 size={24} className="text-emerald-400" />
                      <p className="font-medium text-slate-300">Your schedule is clear. Enjoy the space!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                  <TrendingUp size={20} className="text-indigo-600" /> Practice Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Clients</p>
                    <p className="text-3xl font-black text-slate-900">{stats.clients}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">+{stats.newClients30d} last 30d</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sessions</p>
                    <p className="text-3xl font-black text-slate-900">{stats.appointments}</p>
                    <p className="text-[10px] text-indigo-600 font-bold mt-1">{stats.sessions30d} last 30d</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Averages</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 cursor-help">
                        <div className="flex items-center gap-2">
                          <FlaskConical size={16} className="text-indigo-600" />
                          <span className="text-sm font-bold text-indigo-900">Avg BOLT Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-black text-indigo-600">{stats.avgBolt}s</span>
                          <Info size={12} className="text-indigo-400" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px]">
                      <p className="font-bold mb-1">BOLT Score Targets:</p>
                      <ul className="text-xs space-y-1">
                        <li>• <span className="font-bold">25s+</span>: Functional</li>
                        <li>• <span className="font-bold">40s+</span>: Optimal</li>
                        <li>• <span className="font-bold">{"<"} 10s</span>: High Stress</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100 cursor-help">
                        <div className="flex items-center gap-2">
                          <Brain size={16} className="text-rose-600" />
                          <span className="text-sm font-bold text-rose-900">Avg Coherence</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-black text-rose-600">{stats.avgCoherence.toFixed(2)}</span>
                          <Info size={12} className="text-rose-400" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px]">
                      <p className="font-bold mb-1">Coherence Score:</p>
                      <p className="text-xs">Ratio of Heart Rate to Breath Rate. Whole numbers (e.g., 6.0) indicate high autonomic synchronization.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Session Activity</CardTitle>
                <CardDescription>Volume of appointments over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <UpcomingAppointments />
              <RecentActivity />
            </div>
          </div>
        </>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setClientDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Schedule New Session</DialogTitle></DialogHeader>
          <AppointmentForm onSuccess={() => { setAppDialogOpen(false); fetchDashboardData(); }} />
        </DialogContent>
      </Dialog>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;