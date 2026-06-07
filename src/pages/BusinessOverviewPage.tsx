import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, RefreshCw, CalendarDays, Wallet, BarChart3, ArrowUpRight, ArrowDownRight, PiggyBank, Target, Eye, EyeOff } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { format, startOfWeek, parseISO, subMonths, isAfter } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

interface KineClientSpend {
  id: string; name: string; email?: string; totalSpent: number; sessionCount: number; lastSession: string | null; avgRate: number; standardRate?: number;
}

interface VoiceStudentSpend {
  name: string; email?: string; totalSpent: number; lessonCount: number; lastLesson: string | null;
}

interface WeeklyRevenue {
  week: string; weekLabel: string; kine: number; voice: number;
}

interface MonthlyRevenue {
  month: string; kine: number; voice: number;
}

const COLORS = { kine: "hsl(var(--chart-primary))", voice: "hsl(var(--chart-destructive))", emerald: "hsl(var(--chart-emerald))" };

const CHART_AXIS_STYLE = { fontSize: 10, fontWeight: 700, tickLine: false, axisLine: false };
const TOOLTIP_STYLE = { borderRadius: 16, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", fontSize: 12, fontWeight: 700 };

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-AU");
const fmtShort = (n: number) => {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + Math.round(n);
};

const BusinessOverviewPage = () => {
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kineClients, setKineClients] = useState<KineClientSpend[]>([]);
  const [voiceStudents, setVoiceStudents] = useState<VoiceStudentSpend[]>([]);
  const [weekly, setWeekly] = useState<WeeklyRevenue[]>([]);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState(0);
  const [upcomingLessons, setUpcomingLessons] = useState(0);
  const [viewMode, setViewMode] = useState<"combined" | "fnh" | "voice">("combined");

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [apptsRes, voicesRes, upcomingApptsRes, upcomingVoicesRes] = await Promise.all([
        supabase.from("appointments").select("id, client_id, date, price_amount, payment_received, clients(name, email)").order("date", { ascending: false }),
        supabase.from("voice_bookings").select("id, student_name, student_email, lesson_date, cost, status").order("lesson_date", { ascending: false }),
        supabase.from("appointments").select("id, date").gte("date", new Date().toISOString().split("T")[0]).limit(1),
        supabase.from("voice_bookings").select("id, lesson_date, status").gte("lesson_date", new Date().toISOString().split("T")[0]).eq("status", "scheduled"),
      ]);

      if (apptsRes.error) throw apptsRes.error;
      if (voicesRes.error) throw voicesRes.error;

      setUpcomingAppts(upcomingApptsRes.data?.length || 0);
      setUpcomingLessons(upcomingVoicesRes.data?.length || 0);

      const paid = (apptsRes.data || []).filter(a => a.payment_received && a.price_amount);
      const cmap = new Map<string, KineClientSpend>();
      for (const a of paid) {
        if (!a.client_id) continue;
        const e = cmap.get(a.client_id) || { id: a.client_id, name: (a.clients as any)?.name || "Unknown", email: (a.clients as any)?.email, totalSpent: 0, sessionCount: 0, lastSession: null as string | null, avgRate: 0 };
        e.totalSpent += Number(a.price_amount); e.sessionCount += 1;
        if (!e.lastSession || a.date > e.lastSession) e.lastSession = a.date;
        e.avgRate = e.totalSpent / e.sessionCount;
        cmap.set(a.client_id, e);
      }
      setKineClients(Array.from(cmap.values()).sort((a, b) => b.totalSpent - a.totalSpent));

      const paidVoice = (voicesRes.data || []).filter(v => v.cost && v.status === "paid");
      const vmap = new Map<string, VoiceStudentSpend>();
      for (const v of (voicesRes.data || []).filter(v => v.cost && v.status !== "cancelled" && v.status !== "rescheduled")) {
        const k = v.student_email || v.student_name || "?";
        const e = vmap.get(k) || { name: v.student_name || "Unknown", email: v.student_email, totalSpent: 0, lessonCount: 0, lastLesson: null as string | null };
        e.totalSpent += Number(v.cost); e.lessonCount += 1;
        if (!e.lastLesson || v.lesson_date > e.lastLesson) e.lastLesson = v.lesson_date;
        vmap.set(k, e);
      }
      setVoiceStudents(Array.from(vmap.values()).sort((a, b) => b.totalSpent - a.totalSpent));

      const wm = new Map<string, WeeklyRevenue>();
      for (const a of paid) {
        if (!a.date) continue;
        const d = parseISO(a.date);
        const k = format(d, "yyyy-ww") + "-" + format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d");
        const e = wm.get(k) || { week: k, weekLabel: format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d"), kine: 0, voice: 0 };
        e.kine += Number(a.price_amount); wm.set(k, e);
      }
      for (const v of paidVoice) {
        if (!v.lesson_date) continue;
        const d = parseISO(v.lesson_date);
        const k = format(d, "yyyy-ww") + "-" + format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d");
        const e = wm.get(k) || { week: k, weekLabel: format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d"), kine: 0, voice: 0 };
        e.voice += Number(v.cost); wm.set(k, e);
      }
      setWeekly(Array.from(wm.values()).sort((a, b) => a.week.localeCompare(b.week)).slice(-16));

      const mm = new Map<string, MonthlyRevenue>();
      for (const a of paid) {
        if (!a.date) continue;
        const k = format(parseISO(a.date), "yyyy-MM");
        const e = mm.get(k) || { month: format(parseISO(a.date), "MMM yy"), kine: 0, voice: 0 };
        e.kine += Number(a.price_amount); mm.set(k, e);
      }
      for (const v of paidVoice) {
        if (!v.lesson_date) continue;
        const k = format(parseISO(v.lesson_date), "yyyy-MM");
        const e = mm.get(k) || { month: format(parseISO(v.lesson_date), "MMM yy"), kine: 0, voice: 0 };
        e.voice += Number(v.cost); mm.set(k, e);
      }
      setMonthly(Array.from(mm.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6));

    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const now = new Date();
  const thisWeekLabel = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-ww");
  const thisWk = useMemo(() => {
    const e = weekly.find(w => w.week.startsWith(thisWeekLabel));
    return { kine: e?.kine || 0, voice: e?.voice || 0, total: (e?.kine || 0) + (e?.voice || 0) };
  }, [weekly, thisWeekLabel]);

  const thisMo = useMemo(() => {
    const thisM = format(now, "MMM yy");
    const e = monthly.find(m => m.month === thisM);
    return { kine: e?.kine || 0, voice: e?.voice || 0, total: (e?.kine || 0) + (e?.voice || 0) };
  }, [monthly]);

  const totals = useMemo(() => ({
    kine: kineClients.reduce((s, c) => s + c.totalSpent, 0),
    voice: voiceStudents.reduce((s, v) => s + v.totalSpent, 0),
    kineCount: kineClients.length,
    voiceCount: voiceStudents.length,
    avgKineRate: kineClients.length ? Math.round(kineClients.reduce((s, c) => s + c.avgRate, 0) / kineClients.length) : 0,
    avgVoiceRate: voiceStudents.length ? Math.round(voiceStudents.reduce((s, v) => s + (v.totalSpent / v.lessonCount), 0) / voiceStudents.length) : 0,
  }), [kineClients, voiceStudents]);

  const runRate = useMemo(() => {
    const threeMonthsAgo = subMonths(now, 3);
    const recentKine = kineClients.filter(c => c.lastSession && isAfter(parseISO(c.lastSession), threeMonthsAgo));
    const recentVoice = voiceStudents.filter(s => s.lastLesson && isAfter(parseISO(s.lastLesson), threeMonthsAgo));
    const kine3mo = recentKine.reduce((s, c) => s + c.totalSpent, 0);
    const voice3mo = recentVoice.reduce((s, v) => s + v.totalSpent, 0);
    const monthlyRunRate = (kine3mo + voice3mo) / 3;
    return { monthly: Math.round(monthlyRunRate), annual: Math.round(monthlyRunRate * 12), kine3mo, voice3mo };
  }, [kineClients, voiceStudents, now]);

  const v = useMemo(() => {
    if (viewMode === "fnh") return {
      total: totals.kine, sub: `Kin ${fmt(totals.kine)}`,
      thisWk: thisWk.kine, thisWkSub: thisWk.kine > 0 ? fmt(thisWk.kine) : "No revenue yet this week",
      thisMo: thisMo.kine, thisMoSub: fmt(thisMo.kine),
      runRate: runRate.kine3mo / 3, runRateSub: `${fmt(Math.round(runRate.kine3mo / 3 * 12))}/yr projected`,
      kine: true, voice: false,
    };
    if (viewMode === "voice") return {
      total: totals.voice, sub: `Voice ${fmt(totals.voice)}`,
      thisWk: thisWk.voice, thisWkSub: thisWk.voice > 0 ? fmt(thisWk.voice) : "No revenue yet this week",
      thisMo: thisMo.voice, thisMoSub: fmt(thisMo.voice),
      runRate: runRate.voice3mo / 3, runRateSub: `${fmt(Math.round(runRate.voice3mo / 3 * 12))}/yr projected`,
      kine: false, voice: true,
    };
    return {
      total: totals.kine + totals.voice, sub: `Kin ${fmt(totals.kine)} · Voice ${fmt(totals.voice)}`,
      thisWk: thisWk.total, thisWkSub: thisWk.kine > 0 ? `Kin ${fmt(thisWk.kine)} · Voice ${fmt(thisWk.voice)}` : "No revenue yet this week",
      thisMo: thisMo.total, thisMoSub: `Kin ${fmt(thisMo.kine)} · Voice ${fmt(thisMo.voice)}`,
      runRate: runRate.monthly, runRateSub: `${fmt(runRate.annual)}/yr projected`,
      kine: true, voice: true,
    };
  }, [viewMode, totals, thisWk, thisMo, runRate]);

  const combinedSpenders = useMemo(() => {
    const all: { name: string; totalSpent: number; source: "kine" | "voice"; email?: string }[] = [
      ...kineClients.map(c => ({ name: c.name, totalSpent: c.totalSpent, source: "kine" as const, email: c.email })),
      ...voiceStudents.map(s => ({ name: s.name, totalSpent: s.totalSpent, source: "voice" as const, email: s.email })),
    ];
    const merged = new Map<string, typeof all[0]>();
    for (const item of all) {
      const key = item.email || item.name;
      const existing = merged.get(key);
      if (existing) {
        existing.totalSpent += item.totalSpent;
      } else {
        merged.set(key, { ...item });
      }
    }
    return Array.from(merged.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [kineClients, voiceStudents]);

  const chartData = useMemo(() => weekly.map(w => ({
    week: w.weekLabel,
    ...(viewMode === "voice" ? {} : { Kinesiology: Math.round(w.kine) }),
    ...(viewMode === "fnh" ? {} : { Voice: Math.round(w.voice) }),
  })), [weekly, viewMode]);

  const showPie = viewMode === "combined";

  const pieData = [
    { name: "Kinesiology", value: Math.round(totals.kine), color: COLORS.kine },
    { name: "Voice Studio", value: Math.round(totals.voice), color: COLORS.voice },
  ].filter(d => d.value > 0);

  if (error) return (
    <AppLayout><div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-950/20 flex items-center justify-center"><TrendingUp className="h-8 w-8 text-red-400" /></div>
      <div className="text-center"><h2 className="text-2xl font-black text-foreground">Failed to load</h2><p className="text-sm text-muted-foreground mt-1">{error}</p></div>
      <Button onClick={fetchData} variant="outline" className="rounded-xl font-bold text-xs"><RefreshCw size={14} className="mr-2" /> Retry</Button>
    </div></AppLayout>
  );

  const MetricCard = ({ label, value, sub, icon: Icon, color, trend }: { label: string; value: string; sub?: string; icon: any; color: string; trend?: { up: boolean; label: string } }) => (
    <Card className="border-none shadow-lg rounded-[2rem] bg-card overflow-hidden hover:shadow-xl transition-all group">
      <CardContent className="p-6 relative">
        <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 -translate-y-1/2 translate-x-1/2 pointer-events-none", color.replace("text-", "bg-").replace("dark:", "").split(" ")[0])} />
        <div className="flex items-start justify-between relative">
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="h-10 w-28 rounded-xl" /> : <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>}
            {sub && <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">{sub}</p>}
            {trend && (
              <p className={cn("text-[10px] font-black uppercase tracking-wider flex items-center gap-1", trend.up ? "text-emerald-600" : "text-rose-500")}>
                {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {trend.label}
              </p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", color)}>{!loading && Icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
        <PageHeader
          title="Business Overview"
          subtitle="Combined financial intelligence for kinesiology and voice."
          icon={BarChart3}
          actions={
            <div className="flex items-center gap-3">
              <Button onClick={togglePrivacy} variant="outline" size="sm" className="rounded-xl h-11 px-4 border-border font-bold text-[10px] uppercase tracking-widest">
                {isPrivate ? <EyeOff size={16} className="mr-2 text-rose-500" /> : <Eye size={16} className="mr-2" />}
                {isPrivate ? "Hidden" : "Visible"}
              </Button>
              <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="rounded-xl h-11 px-5 border-border font-bold text-[10px] uppercase tracking-widest">
                <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} /> Refresh
              </Button>
            </div>
          }
        />

        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="rounded-2xl p-1.5 bg-muted border border-border shadow-sm">
              <TabsTrigger value="fnh" className="rounded-xl text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-indigo-500 data-[state=active]:text-white px-6 py-2.5">
                FNH
              </TabsTrigger>
              <TabsTrigger value="voice" className="rounded-xl text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white px-6 py-2.5">
                Voice
              </TabsTrigger>
              <TabsTrigger value="combined" className="rounded-xl text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-2.5">
                FNH + Voice
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Total Revenue" value={fmt(v.total)} sub={v.sub} icon={<DollarSign size={22} />} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30" trend={{ up: true, label: `${viewMode === 'fnh' ? totals.kineCount : viewMode === 'voice' ? totals.voiceCount : totals.kineCount + totals.voiceCount} paying client${viewMode === 'combined' ? 's' : ''}` }} />
            <MetricCard label="This Week" value={fmt(v.thisWk)} sub={v.thisWkSub} icon={<CalendarDays size={22} />} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" />
            <MetricCard label="This Month" value={fmt(v.thisMo)} sub={v.thisMoSub} icon={<TrendingUp size={22} />} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30" trend={{ up: monthly.length >= 2 && monthly[monthly.length - 1].kine + monthly[monthly.length - 1].voice >= monthly[monthly.length - 2].kine + monthly[monthly.length - 2].voice, label: monthly.length >= 2 ? `vs ${monthly[monthly.length - 2].month}` : "" }} />
            <MetricCard label="Run Rate" value={fmt(Math.round(v.runRate)) + "/mo"} sub={v.runRateSub} icon={<PiggyBank size={22} />} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className={cn("border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden", showPie ? "lg:col-span-3" : "lg:col-span-5")}>
            <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                <TrendingUp size={16} className="text-indigo-500" /> Weekly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? <Skeleton className="h-72 rounded-2xl" /> : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barCategoryGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="week" {...CHART_AXIS_STYLE} />
                    <YAxis {...CHART_AXIS_STYLE} tickFormatter={(v) => fmtShort(v)} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [fmt(value), undefined]} labelFormatter={(l) => `Week of ${l}`} />
                    {viewMode !== "voice" && <Bar dataKey="Kinesiology" fill={COLORS.kine} radius={viewMode === "fnh" ? [6, 6, 0, 0] : [6, 0, 0, 0]} stackId="a" />}
                    {viewMode !== "fnh" && <Bar dataKey="Voice" fill={COLORS.voice} radius={viewMode === "voice" ? [6, 6, 0, 0] : [0, 6, 0, 0]} stackId="a" />}
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-72 flex items-center justify-center text-sm font-bold text-muted-foreground">No revenue data yet.</div>}
            </CardContent>
          </Card>

          {showPie && (
            <Card className="lg:col-span-2 border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                  <Wallet size={16} className="text-indigo-500" /> Revenue Split
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex items-center justify-center">
                {loading ? <Skeleton className="h-72 w-72 rounded-full" /> : pieData.length > 0 ? (
                  <div className="flex flex-col items-center gap-4">
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [fmt(value), undefined]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-6">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[10px] font-bold text-muted-foreground">{d.name} ({Math.round(d.value / (totals.kine + totals.voice) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="h-72 flex items-center text-sm font-bold text-muted-foreground">No revenue data.</div>}
              </CardContent>
            </Card>
          )}
        </div>

        {showPie && (
        <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
              <Users size={16} className="text-indigo-500" /> Top Spenders — Combined
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            ) : combinedSpenders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-right py-3 px-4">Total Spend</th>
                      <th className="text-right py-3 px-4">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedSpenders.slice(0, 25).map((item, i) => {
                      const prev = combinedSpenders[i - 1];
                      const isSameRank = prev && prev.totalSpent === item.totalSpent;
                      return (
                        <tr key={`${item.name}-${item.email}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-black text-muted-foreground w-6 inline-block">{isSameRank ? "—" : i + 1}</span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-sm text-foreground">{isPrivate ? "••••••" : item.name}</p>
                            {item.email && <p className="text-[10px] text-muted-foreground font-medium">{isPrivate ? "••••@••••" : item.email}</p>}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-black text-base">{fmt(Math.round(item.totalSpent))}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full", item.source === "both" ? "bg-indigo-50 text-indigo-600" : item.source === "kine" ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600")}>
                              {item.source === "both" ? "Both" : item.source === "kine" ? "Kine" : "Voice"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-sm font-bold text-muted-foreground">No revenue data yet.</div>
            )}
          </CardContent>
        </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {viewMode !== "voice" && (
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                <Target size={16} className="text-indigo-500" /> Kinesiology — Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {kineClients.slice(0, 15).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border hover:bg-card hover:shadow-md transition-all group">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{isPrivate ? "••••••" : c.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">{c.sessionCount} sessions · avg {fmt(Math.round(c.avgRate))}</p>
                      </div>
                      <p className="font-black text-base text-foreground shrink-0 ml-4 group-hover:text-indigo-600 transition-colors">{fmt(Math.round(c.totalSpent))}</p>
                    </div>
                  ))}
                  {kineClients.length === 0 && <p className="text-center py-8 text-sm font-bold text-muted-foreground">No paid kinesiology sessions yet.</p>}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {viewMode !== "fnh" && (
          <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-border bg-muted/30">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                <Target size={16} className="text-rose-500" /> Voice Studio — Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {voiceStudents.slice(0, 15).map((s, i) => (
                    <div key={s.email || i} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border hover:bg-card hover:shadow-md transition-all group">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{isPrivate ? "••••••" : s.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">{s.lessonCount} lessons · {isPrivate ? "••••@••••" : (s.email || "no email")}</p>
                      </div>
                      <p className="font-black text-base text-foreground shrink-0 ml-4 group-hover:text-rose-600 transition-colors">{fmt(Math.round(s.totalSpent))}</p>
                    </div>
                  ))}
                  {voiceStudents.length === 0 && <p className="text-center py-8 text-sm font-bold text-muted-foreground">No paid voice lessons yet.</p>}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BusinessOverviewPage;
