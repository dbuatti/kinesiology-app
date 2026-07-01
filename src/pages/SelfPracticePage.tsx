
import { useState, useEffect, type MouseEvent } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
 Heart, Activity, FlaskConical, Brain, Plus, 
 Calendar, Clock, Loader2, TrendingUp, ArrowRight, 
 Zap, Info, History, Sparkles, CheckCircle2, Target, Move, Footprints,
 LayoutDashboard, Trash2
} from "lucide-react";
import { format, isToday, startOfToday, differenceInDays } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientProgressTab from "@/components/crm/ClientProgressTab";
import AppLayout from "@/components/crm/AppLayout";

const SelfPracticePage = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const activeTab = searchParams.get("tab") || "overview";
 
 const [selfClient, setSelfClient] = useState<any>(null);
 const [sessions, setSessions] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

 const fetchSelfData = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 // 1. Find or create the "Self" client record
 let { data: client, error: clientError } = await supabase
 .from('clients')
 .select('*')
 .eq('user_id', user.id)
 .eq('is_practitioner', true)
 .single();

 if (clientError && clientError.code === 'PGRST116') {
 const { data: newClient, error: createError } = await supabase
 .from('clients')
 .insert({
 user_id: user.id,
 name: "Practitioner (Self)",
 is_practitioner: true,
 email: user.email,
 pronouns: "Practitioner"
 })
 .select()
 .single();
 
 if (createError) throw createError;
 client = newClient;
 } else if (clientError) {
 throw clientError;
 }

 setSelfClient(client);

 // 2. Fetch self-sessions
 const { data: appData, error: appError } = await supabase
 .from('appointments')
 .select('*')
 .eq('client_id', client.id)
 .order('date', { ascending: false });

 if (appError) throw appError;
 setSessions(appData || []);

 } catch (err) {
 console.error("Error fetching self-practice data:", err);
 showError("Failed to load your personal practice zone.");
 } finally {
 setLoading(false);
 }
 };

 const handleNewSelfSession = async (goal?: string) => {
 if (!selfClient) return;
 setCreating(true);
 try {
 const { data: { user } } = await supabase.auth.getUser();
 const now = new Date();
 
 const { data, error } = await supabase
 .from('appointments')
 .insert({
 user_id: user!.id,
 client_id: selfClient.id,
 name: `Self Practice - ${format(now, "MMM d, yyyy")}`,
 date: now.toISOString(),
 tag: "Self Practice",
 status: "Scheduled",
 goal: goal || "Personal health monitoring & protocol practice"
 })
 .select()
 .single();

 if (error) throw error;
 showSuccess("New self-practice session created!");
 window.location.href = `/appointments/${data.id}`;
 } catch (err: any) {
 showError(err.message || "Failed to create session");
 } finally {
 setCreating(false);
 }
 };

  const handleDeleteClick = (e: MouseEvent, id: string) => {
  e.preventDefault();
  e.stopPropagation();
  setDeleteTarget(id);
  };

  const executeDelete = async () => {
  if (!deleteTarget) return;
  try {
  const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', deleteTarget);

  if (error) throw error;
  showSuccess("Self-practice session deleted.");
  setDeleteTarget(null);
  fetchSelfData();
  } catch (err: any) {
  showError(err.message || "Failed to delete session.");
  setDeleteTarget(null);
  }
  };

 useEffect(() => {
 fetchSelfData();
 }, []);

 // Calculate Streak
 const calculateStreak = () => {
 if (sessions.length === 0) return 0;
 
 const uniqueDates = Array.from(new Set(sessions.map(s => format(new Date(s.date), 'yyyy-MM-dd'))))
 .map(d => new Date(d))
 .sort((a, b) => b.getTime() - a.getTime());

 if (uniqueDates.length === 0) return 0;
 
 let streak = 0;
 let checkDate = startOfToday();
 
 if (differenceInDays(checkDate, uniqueDates[0]) > 1) return 0;

 for (let i = 0; i < uniqueDates.length; i++) {
 if (i === 0 && differenceInDays(checkDate, uniqueDates[i]) <= 1) {
 streak++;
 checkDate = uniqueDates[i];
 } else if (differenceInDays(checkDate, uniqueDates[i]) === 1) {
 streak++;
 checkDate = uniqueDates[i];
 } else {
 break;
 }
 }
 return streak;
 };

 if (loading) return (
 <div className="flex min-h-screen items-center justify-center">
 <Loader2 className="animate-spin text-primary" size={48} />
 </div>
 );

 const boltTrendData = [...sessions]
 .filter(s => s.bolt_score)
 .reverse()
 .map(s => ({
 date: format(new Date(s.date), "MMM d"),
 score: s.bolt_score
 }));

 const lastBolt = sessions.find(s => s.bolt_score)?.bolt_score || null;
 const lastCoh = sessions.find(s => s.coherence_score)?.coherence_score || null;
 const streak = calculateStreak();

 const protocols = [
 { name: "BOLT Test", icon: FlaskConical, color: "bg-primary", goal: "Practice BOLT timing and recovery breathing" },
 { name: "Coherence", icon: Activity, color: "bg-destructive", goal: "Practice heart-brain synchronization" },
 { name: "Neuro Drills", icon: Brain, color: "bg-chart-emerald", goal: "Practice Fakuda and Rhombergs assessments" },
 { name: "Cogs/ROM", icon: Move, color: "bg-chart-primary", goal: "Practice 3-plane mobility assessment" },
 ];

 return (
 <AppLayout>
 <div className="space-y-6">


 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center text-white shadow-sm">
 <Heart size={32} className="fill-current" />
 </div>
 <div>
 <h1 className="text-3xl font-semibold tracking-tight text-foreground">Self Practice</h1>
 <p className="text-muted-foreground font-medium">Your private space for personal health tracking and protocol practice.</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="hidden sm:flex flex-col items-end mr-4">
 <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Practice Streak</p>
 <p className="text-xl font-semibold text-orange-500 flex items-center gap-1">
 <Zap size={18} className="fill-current" /> {streak} Days
 </p>
 </div>
 <Button 
 onClick={() => handleNewSelfSession()} 
 disabled={creating}
 className="bg-destructive hover:bg-destructive/90 shadow-sm h-12 px-8 rounded-xl font-medium"
 >
 {creating ? <Loader2 className="mr-2 animate-spin" /> : <Plus size={20} className="mr-2" />}
 Start Self-Session
 </Button>
 </div>
 </div>

 <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
 <TabsList className="grid w-full grid-cols-2 h-14 bg-muted p-1.5 rounded-xl mb-8">
 <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-destructive data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
 <LayoutDashboard size={14} /> Practice Dashboard
 </TabsTrigger>
 <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-chart-destructive data-[state=active]:shadow-sm rounded-xl h-11 font-semibold uppercase tracking-wider text-[10px]">
 <TrendingUp size={14} /> Progress & Protocols
 </TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="space-y-8">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <Card className="lg:col-span-2 border-none shadow-sm bg-card rounded-3xl overflow-hidden">
 <CardHeader className="bg-muted/30 border-b border-border">
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="text-xl font-medium flex items-center gap-2">
 <TrendingUp size={20} className="text-destructive" /> Personal Health Trends
 </CardTitle>
 <CardDescription>Your BOLT score progress over time</CardDescription>
 </div>
 <div className="flex gap-3">
 <div className="text-right">
 <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Latest BOLT</p>
 <p className={cn("text-2xl font-semibold", lastBolt && lastBolt >= 25 ? "text-chart-emerald" : "text-muted-foreground")}>
 {lastBolt ? `${lastBolt}s` : 'N/A'}
 </p>
 </div>
 <div className="text-right border-l border-border pl-3">
 <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Latest Coh</p>
 <p className="text-2xl font-semibold text-chart-primary ">
 {lastCoh ? lastCoh.toFixed(2) : 'N/A'}
 </p>
 </div>
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-6">
 {boltTrendData.length > 1 ? (
 <div className="h-[300px] w-full mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={boltTrendData}>
 <defs>
 <linearGradient id="colorBolt" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="hsl(var(--chart-destructive))" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="hsl(var(--chart-destructive))" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
 <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
 <Area type="monotone" dataKey="score" stroke="hsl(var(--chart-destructive))" strokeWidth={3} fillOpacity={1} fill="url(#colorBolt)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <div className="h-[300px] flex flex-col items-center justify-center text-center bg-muted/30 rounded-xl border-2 border-dashed border-border">
 <Activity size={48} className="text-muted-foreground mb-4" />
 <p className="text-muted-foreground font-medium">Not enough data to show trends yet.</p>
 <p className="text-xs text-muted-foreground/60 mt-1">Complete at least 2 self-sessions with BOLT scores.</p>
 </div>
 )}
 </CardContent>
 </Card>

 <div className="space-y-6">
 <Card className="border-none shadow-sm bg-card text-white rounded-3xl overflow-hidden relative">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <Sparkles size={120} />
 </div>
 <CardHeader>
 <CardTitle className="text-xl font-medium flex items-center gap-2">
 <Target size={20} className="text-amber-400" /> Protocol Mastery
 </CardTitle>
 <CardDescription className="text-muted-foreground/60">Quick start specific practice goals</CardDescription>
 </CardHeader>
 <CardContent className="space-y-3 relative z-10">
 {protocols.map((p) => (
 <button
 key={p.name}
 onClick={() => handleNewSelfSession(p.goal)}
 className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
 >
 <div className="flex items-center gap-3">
 <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", p.color)}>
 <p.icon size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-medium">{p.name}</p>
 <p className="text-[10px] text-muted-foreground/60">Practice Drill</p>
 </div>
 </div>
 <ArrowRight size={16} className="text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
 </button>
 ))}
 </CardContent>
 </Card>

 <Card className="border-none shadow-sm bg-card rounded-3xl">
 <CardHeader>
 <CardTitle className="text-lg font-medium flex items-center gap-2">
 <Info size={18} className="text-primary" /> Practice Tips
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex gap-3">
 <div className="w-6 h-6 rounded-full bg-chart-emerald/10 flex items-center justify-center shrink-0">
 <CheckCircle2 size={14} className="text-chart-emerald " />
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed font-medium">
 Use the <strong>Session Timer</strong> to pace your practice. Aim for 20 mins of focused drill work.
 </p>
 </div>
 <div className="flex gap-3">
 <div className="w-6 h-6 rounded-full bg-chart-emerald/10 flex items-center justify-center shrink-0">
 <CheckCircle2 size={14} className="text-chart-emerald " />
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed font-medium">
 Self-sessions count towards your <strong>Procedure Tracker</strong> progress!
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex items-center justify-between px-2">
 <h2 className="text-2xl font-medium text-foreground flex items-center gap-2">
 <History size={24} className="text-primary" /> Self-Session History
 </h2>
 <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium">
 {sessions.length} Sessions
 </Badge>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {sessions.map(session => (
 <Link key={session.id} to={`/appointments/${session.id}`}>
 <Card className="hover:shadow-sm transition-all border-border bg-card group rounded-xl overflow-hidden cursor-pointer h-full">
 <CardContent className="p-6 space-y-4">
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
 {isToday(new Date(session.date)) ? "TODAY" : format(new Date(session.date), "EEEE, MMM d")}
 </p>
 <h3 className="font-medium text-lg text-foreground group-hover:text-chart-destructive transition-colors">
 {session.name || "Self Practice Session"}
 </h3>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <Button 
 variant="ghost" 
 size="icon" 
 className="h-9 w-9 rounded-xl text-muted-foreground hover:text-chart-destructive hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
  onClick={(e: MouseEvent) => handleDeleteClick(e, session.id)}
 >
 <Trash2 size={16} />
 </Button>
 <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-muted group-hover:text-destructive transition-colors">
 <ArrowRight size={20} />
 </div>
 </div>
 </div>

 <div className="flex flex-wrap gap-2">
 {session.bolt_score && (
 <Badge className="bg-chart-primary/10 text-chart-primary border-none text-[10px] font-medium">
 BOLT: {session.bolt_score}s
 </Badge>
 )}
 {session.coherence_score && (
 <Badge className="bg-chart-destructive/10 text-chart-destructive border-none text-[10px] font-medium">
 COH: {session.coherence_score.toFixed(2)}
 </Badge>
 )}
 <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground">
 {session.status}
 </Badge>
 </div>

 {session.goal && (
 <p className="text-xs text-muted-foreground line-clamp-2 italic font-medium">
 "{session.goal}"
 </p>
 )}
 </CardContent>
 </Card>
 </Link>
 ))}

 {sessions.length === 0 && (
 <div className="col-span-full text-center py-20 bg-card rounded-3xl border-2 border-dashed border-border">
 <div className="w-16 h-16 bg-chart-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <Heart className="text-rose-300 " size={32} />
 </div>
 <h3 className="text-foreground font-medium text-lg">No self-sessions yet</h3>
 <p className="text-muted-foreground mt-1 max-w-xs mx-auto font-medium">Start your first self-monitoring session to track your personal health and practice protocols.</p>
 <Button 
 className="mt-6 bg-destructive hover:bg-destructive/90 rounded-xl"
 onClick={() => handleNewSelfSession()}
 >
 Start First Self-Session
 </Button>
 </div>
 )}
 </div>
 </div>
 </TabsContent>

 <TabsContent value="progress">
 <ClientProgressTab 
 client={selfClient} 
 appointments={sessions} 
 onRefresh={fetchSelfData}
 />
 </TabsContent>
 </Tabs>
  </div>

  <ConfirmDialog
    open={deleteTarget !== null}
    onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
    title="Delete Session"
    description="Are you sure you want to delete this self-practice session?"
    onConfirm={executeDelete}
  />
  </AppLayout>
  );
};

export default SelfPracticePage;