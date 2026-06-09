import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, RefreshCw, CalendarDays, PiggyBank, BarChart3, Target, FileText, ArrowRight, Clock, Music, Mail, User, Activity, Database } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { format, parseISO, subMonths, isAfter, differenceInDays } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

interface KineClient { id: string; name: string; email?: string; totalSpent: number; sessionCount: number; lastSession: string | null; avgRate: number; }
interface VoiceStudent { name: string; email?: string; totalSpent: number; lessonCount: number; lastLesson: string | null; }

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-AU");
const fmtShort = (n: number) => n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + Math.round(n);

const ACTIONS = [
 { label: "Financial Overview", desc: "Deep-dive revenue metrics, charts, and projections.", icon: BarChart3, path: "/business/overview", color: "text-chart-primary", bg: "bg-chart-primary/10 " },
 { label: "Client Audit", desc: "Review rates, recency, and AI pricing suggestions.", icon: FileText, path: "/business/client-audit", color: "text-muted-foreground", bg: "bg-muted " },
 { label: "Marketing Engine", desc: "Transform clinical wins into newsletter assets.", icon: Target, path: "/business/marketing-engine", color: "text-chart-emerald", bg: "bg-chart-emerald/10 " },
];

const BusinessDashboardPage = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const viewParam = searchParams.get("view") as "fnh" | "voice" | "combined" | null;
 const [viewMode, setViewModeState] = useState<"combined" | "fnh" | "voice">(viewParam || "combined");

 const setViewMode = (v: "combined" | "fnh" | "voice") => {
 setViewModeState(v);
 setSearchParams(v === "combined" ? {} : { view: v }, { replace: true });
 };

 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [kineClients, setKineClients] = useState<KineClient[]>([]);
 const [voiceStudents, setVoiceStudents] = useState<VoiceStudent[]>([]);
 const [upcomingAppts, setUpcomingAppts] = useState<any[]>([]);
 const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
 const [recentPaid, setRecentPaid] = useState<any[]>([]);
 const [backfilling, setBackfilling] = useState(false);

 const fetchData = async () => {
 setLoading(true); setError(null);
 try {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error("Not authenticated");

 const [apptsRes, voicesRes, onboardRes, upcomingA, upcomingV] = await Promise.all([
 supabase.from("appointments").select("id, client_id, date, price_amount, payment_received, clients(id, name, email)").order("date", { ascending: false }),
 supabase.from("voice_bookings").select("id, student_name, student_email, lesson_date, cost, status").order("lesson_date", { ascending: false }),
 supabase.from("voice_onboarding").select("name, email"),
 supabase.from("appointments").select("id, date, price_amount, clients(id, name)").gte("date", new Date().toISOString().split("T")[0]).order("date", { ascending: true }).limit(5),
 supabase.from("voice_bookings").select("id, student_name, lesson_date, cost, status").gte("lesson_date", new Date().toISOString().split("T")[0]).order("lesson_date", { ascending: true }).limit(5),
 ]);

 if (apptsRes.error) throw apptsRes.error;
 if (voicesRes.error) throw voicesRes.error;

 const paid = (apptsRes.data || []).filter(a => a.payment_received && a.price_amount);
 const cmap = new Map<string, KineClient>();
 for (const a of paid) {
 if (!a.client_id) continue;
 const c = (a.clients as any);
 const e = cmap.get(a.client_id) || { id: a.client_id, name: c?.name || "Unknown", email: c?.email, totalSpent: 0, sessionCount: 0, lastSession: null as string | null, avgRate: 0 };
 e.totalSpent += Number(a.price_amount); e.sessionCount += 1;
 if (!e.lastSession || a.date > e.lastSession) e.lastSession = a.date;
 e.avgRate = e.totalSpent / e.sessionCount;
 cmap.set(a.client_id, e);
 }
 setKineClients(Array.from(cmap.values()).sort((a, b) => b.totalSpent - a.totalSpent));

 const paidVoice = (voicesRes.data || []).filter(v => v.cost && v.status === "paid");
 const vmap = new Map<string, VoiceStudent>();
 for (const v of (voicesRes.data || []).filter(v => v.status !== "cancelled" && v.status !== "rescheduled")) {
 const k = v.student_email || v.student_name || "?";
 const e = vmap.get(k) || { name: v.student_name || "Unknown", email: v.student_email, totalSpent: 0, lessonCount: 0, lastLesson: null as string | null };
 e.totalSpent += Number(v.cost || 0); e.lessonCount += 1;
 if (!e.lastLesson || v.lesson_date > e.lastLesson) e.lastLesson = v.lesson_date;
 vmap.set(k, e);
 }
 setVoiceStudents(Array.from(vmap.values()).sort((a, b) => b.totalSpent - a.totalSpent));

 // Add onboarded students (may not have bookings yet)
 if (!onboardRes.error && onboardRes.data) {
 setVoiceStudents(prev => {
 const merged = new Map<string, VoiceStudent>();
 for (const s of prev) merged.set(s.email || s.name, s);
 for (const o of onboardRes.data) {
 const k = o.email || o.name || "?";
 if (!merged.has(k)) merged.set(k, { name: o.name || "Unknown", email: o.email, totalSpent: 0, lessonCount: 0, lastLesson: null });
 }
 return Array.from(merged.values()).sort((a, b) => b.totalSpent - a.totalSpent);
 });
 }

 setUpcomingAppts(upcomingA.data || []);
 setUpcomingLessons(upcomingV.data || []);
 setRecentPaid([...paid.slice(0, 5), ...paidVoice.slice(0, 5)].sort((a, b) => {
 const da = a.date || a.lesson_date || "";
 const db = b.date || b.lesson_date || "";
 return db.localeCompare(da);
 }).slice(0, 10));
 } catch (err: any) {
 setError(err.message);
 } finally { setLoading(false); }
 };

 useEffect(() => { fetchData(); }, []);

 const now = new Date();
 const totals = useMemo(() => ({
 kine: kineClients.reduce((s, c) => s + c.totalSpent, 0),
 voice: voiceStudents.reduce((s, v) => s + v.totalSpent, 0),
 kineCount: kineClients.length,
 voiceCount: voiceStudents.length,
 kineSessions: kineClients.reduce((s, c) => s + c.sessionCount, 0),
 voiceLessons: voiceStudents.reduce((s, v) => s + v.lessonCount, 0),
 }), [kineClients, voiceStudents]);

 const runRate = useMemo(() => {
 const threeMonthsAgo = subMonths(now, 3);
 const recentKine = kineClients.filter(c => c.lastSession && isAfter(parseISO(c.lastSession), threeMonthsAgo));
 const recentVoice = voiceStudents.filter(s => s.lastLesson && isAfter(parseISO(s.lastLesson), threeMonthsAgo));
 const kine3mo = recentKine.reduce((s, c) => s + c.totalSpent, 0);
 const voice3mo = recentVoice.reduce((s, v) => s + v.totalSpent, 0);
 return { monthly: Math.round((kine3mo + voice3mo) / 3), annual: Math.round((kine3mo + voice3mo) / 3 * 12), kine3mo, voice3mo };
 }, [kineClients, voiceStudents, now]);

 const v = useMemo(() => {
 if (viewMode === "fnh") return {
 total: totals.kine, sub: fmt(totals.kine),
 runRate: { monthly: Math.round(runRate.kine3mo / 3), annual: Math.round(runRate.kine3mo / 3 * 12) },
 count: totals.kineCount, sessions: totals.kineSessions, label: "kine" as const,
 };
 if (viewMode === "voice") return {
 total: totals.voice, sub: fmt(totals.voice),
 runRate: { monthly: Math.round(runRate.voice3mo / 3), annual: Math.round(runRate.voice3mo / 3 * 12) },
 count: totals.voiceCount, sessions: totals.voiceLessons, label: "voice" as const,
 };
 return {
 total: totals.kine + totals.voice, sub: `Kin ${fmt(totals.kine)} · Voice ${fmt(totals.voice)}`,
 runRate, count: totals.kineCount + totals.voiceCount, sessions: totals.kineSessions + totals.voiceLessons, label: "both" as const,
 };
 }, [viewMode, totals, runRate]);

 if (error) return (
 <AppLayout><div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
 <div className="w-20 h-20 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingUp className="h-8 w-8 text-destructive/70" /></div>
 <div className="text-center"><h2 className="text-2xl font-semibold text-foreground">Failed to load</h2><p className="text-sm text-muted-foreground mt-1">{error}</p></div>
 <Button onClick={fetchData} variant="outline" className="rounded-xl font-medium text-xs"><RefreshCw size={14} className="mr-2" /> Retry</Button>
 </div></AppLayout>
 );

 const miniCard = (label: string, value: string, sub: string, icon: any, accent: string) => (
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardContent className="p-5 flex items-center gap-4">
 <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm", accent)}>{icon}</div>
 <div className="min-w-0 flex-1">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
 {loading ? <Skeleton className="h-7 w-20 rounded-lg mt-1" /> : <p className="text-xl font-semibold text-foreground tracking-tight">{value}</p>}
 {!loading && sub && <p className="text-[10px] font-medium text-muted-foreground truncate">{sub}</p>}
 </div>
 </CardContent>
 </Card>
 );

 const filteredKine = useMemo(() =>
 viewMode === "voice" ? [] : kineClients,
 [kineClients, viewMode]);

 const filteredVoice = useMemo(() =>
 viewMode === "fnh" ? [] : voiceStudents,
 [voiceStudents, viewMode]);

 const filteredRecentPaid = useMemo(() =>
 recentPaid.filter(r => {
 if (viewMode === "combined") return true;
 const isKine = "client_id" in r;
 return viewMode === "fnh" ? isKine : !isKine;
 }),
 [recentPaid, viewMode]);

 const filteredKineCount = viewMode === "voice" ? 0 : totals.kineCount;
 const filteredVoiceCount = viewMode === "fnh" ? 0 : totals.voiceCount;
 const filteredKineSessions = viewMode === "voice" ? 0 : totals.kineSessions;
 const filteredVoiceLessons = viewMode === "fnh" ? 0 : totals.voiceLessons;

 return (
 <AppLayout>
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
 <PageHeader
 title="Business Hub"
 subtitle="Combined financial intelligence for kinesiology and voice."
 icon={BarChart3}
 actions={
 <div className="flex items-center gap-2">
 <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="rounded-xl h-11 px-5 border-border font-medium text-[10px] uppercase tracking-wider">
 <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} /> Refresh
 </Button>
 <Button onClick={async () => {
 setBackfilling(true);
 try {
 await supabase.functions.invoke("voice-backfill");
 fetchData();
 } catch {}
 setBackfilling(false);
 }} disabled={backfilling} variant="outline" size="sm" className="rounded-xl h-11 px-5 border-border font-medium text-[10px] uppercase tracking-wider">
 <Database size={14} className={cn("mr-2", backfilling && "animate-spin")} /> Backfill
 </Button>
 </div>
 }
 />

 <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full">
 <div className="flex items-center justify-between mb-8">
 <TabsList className="rounded-xl p-1.5 bg-muted border border-border shadow-sm">
 <TabsTrigger value="fnh" className="rounded-xl text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2.5">
 FNH
 </TabsTrigger>
 <TabsTrigger value="voice" className="rounded-xl text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-destructive data-[state=active]:text-white px-6 py-2.5">
 Voice
 </TabsTrigger>
 <TabsTrigger value="combined" className="rounded-xl text-[11px] font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2.5">
 FNH + Voice
 </TabsTrigger>
 </TabsList>
 </div>
 </Tabs>

 {/* Mini metrics */}
 {loading ? (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
 </div>
 ) : (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {miniCard("Total Revenue", fmt(v.total), v.sub, <DollarSign size={18} />, "bg-chart-primary/10 text-chart-primary ")}
 {miniCard("Sessions", String(v.sessions), `${v.count} paying client${v.count !== 1 ? "s" : ""}`, <Activity size={18} />, "bg-chart-emerald/10 text-chart-emerald ")}
 {miniCard("Monthly Run Rate", fmtShort(v.runRate.monthly) + "/mo", `${fmtShort(v.runRate.annual)}/yr projected`, <PiggyBank size={18} />, "bg-chart-primary/10 text-chart-primary ")}
 {miniCard("Paying Clients", String(v.count), viewMode === "combined" ? `Kin ${totals.kineCount} · Voice ${totals.voiceCount}` : "", <Users size={18} />, "bg-muted text-muted-foreground ")}
 </div>
 )}

 {/* Upcoming */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <CalendarDays size={14} className="text-primary" /> Upcoming Kinesiology
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
 ) : viewMode === "voice" ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">Switch to FNH or Combined view.</p>
 ) : upcomingAppts.length === 0 ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">No upcoming appointments.</p>
 ) : (
 <div className="space-y-2">
 {upcomingAppts.map(a => (
 <Link key={a.id} to={`/appointments/${a.id}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border hover:bg-card hover:shadow-md transition-all group">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-sm text-foreground truncate group-hover:text-chart-primary transition-colors">{(a.clients as any)?.name || "Unknown"}</p>
 <p className="text-[10px] font-medium text-muted-foreground">{format(parseISO(a.date), "EEE, MMM d · h:mm a")}</p>
 </div>
 {a.price_amount && <span className="text-xs font-semibold text-foreground shrink-0 ml-3">{fmt(Number(a.price_amount))}</span>}
 </Link>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <Music size={14} className="text-destructive" /> Upcoming Voice Lessons
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
 ) : viewMode === "fnh" ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">Switch to Voice or Combined view.</p>
 ) : upcomingLessons.length === 0 ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">No upcoming lessons.</p>
 ) : (
 <div className="space-y-2">
 {upcomingLessons.map(l => (
 <div key={l.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-sm text-foreground truncate">{l.student_name || "Unknown"}</p>
 <p className="text-[10px] font-medium text-muted-foreground">{format(parseISO(l.lesson_date), "EEE, MMM d · h:mm a")}</p>
 </div>
 {l.cost && <span className="text-xs font-semibold text-foreground shrink-0 ml-3">{fmt(Number(l.cost))}</span>}
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Quick Actions */}
 <div>
 <div className="flex items-center gap-3 px-1 mb-6">
 <div className="w-9 h-9 rounded-xl bg-chart-primary/10 text-chart-primary flex items-center justify-center shadow-sm"><Target size={16} /></div>
 <h2 className="text-lg font-semibold text-foreground tracking-tight">Quick Actions</h2>
 <div className="flex-1 h-[2px] bg-border rounded-full ml-3" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {ACTIONS.map(a => (
 <Link key={a.path} to={a.path} className="block group">
 <Card className="border-none shadow-md rounded-xl bg-card hover:shadow-sm hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
 <CardContent className="p-6 space-y-4">
 <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm", a.bg, a.color)}>
 <a.icon size={22} />
 </div>
 <div className="space-y-1">
 <h3 className="font-semibold text-foreground group-hover:text-chart-primary transition-colors">{a.label}</h3>
 <p className="text-xs font-medium text-muted-foreground leading-relaxed">{a.desc}</p>
 </div>
 <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-chart-primary transition-colors pt-2">
 Launch <ArrowRight size={12} />
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 </div>

 {/* Top Clients */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {viewMode !== "voice" && (
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <User size={14} className="text-primary" /> Top Kinesiology Clients
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
 ) : filteredKine.length === 0 ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">No paid sessions yet.</p>
 ) : (
 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
 {filteredKine.slice(0, 10).map(c => (
 <Link key={c.id} to={`/clients/${c.id}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border hover:bg-card hover:shadow-md transition-all group">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-sm text-foreground truncate group-hover:text-chart-primary transition-colors">{c.name}</p>
 <p className="text-[10px] font-medium text-muted-foreground">
 {c.sessionCount} sessions · {fmt(Math.round(c.avgRate))}/avg
 {c.lastSession && <span className="ml-2">· Last {differenceInDays(now, parseISO(c.lastSession))}d ago</span>}
 </p>
 </div>
 <div className="text-right shrink-0 ml-3">
 <p className="font-semibold text-sm text-foreground">{fmt(Math.round(c.totalSpent))}</p>
 <p className="text-[10px] font-medium text-muted-foreground">{c.email || "no email"}</p>
 </div>
 </Link>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 )}

 {viewMode !== "fnh" && (
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <User size={14} className="text-destructive" /> Top Voice Students
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
 ) : filteredVoice.length === 0 ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">No paid lessons yet.</p>
 ) : (
 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
 {filteredVoice.map((s, i) => (
 <div key={s.email || i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border hover:bg-card hover:shadow-md transition-all group">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
 <p className="text-[10px] font-medium text-muted-foreground">
 {s.lessonCount} lessons
 {s.lastLesson && <span className="ml-2">· Last {differenceInDays(now, parseISO(s.lastLesson))}d ago</span>}
 </p>
 </div>
 <div className="text-right shrink-0 ml-3">
 <p className="font-semibold text-sm text-foreground">{fmt(Math.round(s.totalSpent))}</p>
 <p className="text-[10px] font-medium text-muted-foreground">{s.email || "no email"}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 )}
 </div>

 {/* Recent Activity */}
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <Clock size={14} className="text-primary" /> Recent Payments
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
 ) : filteredRecentPaid.length === 0 ? (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">No payments yet.</p>
 ) : (
 <div className="space-y-1">
 {filteredRecentPaid.map((r, i) => {
 const isKine = "client_id" in r;
 const name = isKine ? (r.clients as any)?.name || "Unknown" : r.student_name || "Unknown";
 const date = r.date || r.lesson_date;
 const amount = Number(r.price_amount || r.cost || 0);
 const clientId = isKine ? (r.clients as any)?.id : null;
 return (
 <div key={r.id || i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isKine ? "bg-chart-primary/10 text-chart-primary" : "bg-chart-destructive/10 text-chart-destructive")}>
 <DollarSign size={14} />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {isKine && clientId ? (
 <Link to={`/clients/${clientId}`} className="font-medium text-sm text-foreground truncate hover:text-chart-primary transition-colors">{name}</Link>
 ) : (
 <p className="font-medium text-sm text-foreground truncate">{name}</p>
 )}
 </div>
 <p className="text-[10px] font-medium text-muted-foreground">
 {date ? format(parseISO(date), "MMM d, yyyy") : "Unknown date"}
 <span className={cn("ml-2 font-semibold", isKine ? "text-primary" : "text-destructive")}>{isKine ? "Kine" : "Voice"}</span>
 </p>
 </div>
 </div>
 <span className="font-semibold text-sm text-foreground shrink-0 ml-3">{fmt(amount)}</span>
 </div>
 );
 })}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Communication & Client Health */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <Mail size={14} className="text-primary" /> Communication Summary
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
 ) : (
 <div className="space-y-3">
 {viewMode !== "voice" && (
 <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-chart-primary/10 text-chart-primary flex items-center justify-center"><Mail size={14} /></div>
 <div><p className="font-medium text-sm text-foreground">Kinesiology Clients</p><p className="text-[10px] font-medium text-muted-foreground">{totals.kineCount} clients · {totals.kineSessions} sessions</p></div>
 </div>
 <p className="text-xs font-medium text-muted-foreground">{filteredKine.filter(c => c.lastSession && isAfter(parseISO(c.lastSession), subMonths(now, 1))).length} active (30d)</p>
 </div>
 )}
 {viewMode !== "fnh" && (
 <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-chart-destructive/10 text-chart-destructive flex items-center justify-center"><Mail size={14} /></div>
 <div><p className="font-medium text-sm text-foreground">Voice Students</p><p className="text-[10px] font-medium text-muted-foreground">{totals.voiceCount} students · {totals.voiceLessons} lessons</p></div>
 </div>
 <p className="text-xs font-medium text-muted-foreground">{filteredVoice.filter(s => s.lastLesson && isAfter(parseISO(s.lastLesson), subMonths(now, 1))).length} active (30d)</p>
 </div>
 )}
 <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center"><Users size={14} /></div>
 <div><p className="font-medium text-sm text-foreground">Needs Follow-Up</p><p className="text-[10px] font-medium text-muted-foreground">No contact in 60+ days</p></div>
 </div>
 <p className="text-xs font-semibold text-muted-foreground">
 {(filteredKine.filter(c => c.lastSession && !isAfter(parseISO(c.lastSession), subMonths(now, 2))).length +
 filteredVoice.filter(s => s.lastLesson && !isAfter(parseISO(s.lastLesson), subMonths(now, 2))).length)}
 </p>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
 <CardHeader className="p-6 pb-3 border-b border-border bg-muted/30">
 <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
 <Activity size={14} className="text-chart-emerald" /> Client Health — At Risk
 </CardTitle>
 </CardHeader>
 <CardContent className="p-5">
 {loading ? (
 <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
 ) : (
 <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
 {[...filteredKine.filter(c => c.lastSession && !isAfter(parseISO(c.lastSession), subMonths(now, 2))).map(c => ({
 name: c.name, id: c.id, days: differenceInDays(now, parseISO(c.lastSession!)), type: "kine" as const, spent: c.totalSpent,
 })), ...filteredVoice.filter(s => s.lastLesson && !isAfter(parseISO(s.lastLesson), subMonths(now, 2))).map(s => ({
 name: s.name, id: null, days: differenceInDays(now, parseISO(s.lastLesson!)), type: "voice" as const, spent: s.totalSpent,
 }))].sort((a, b) => b.days - a.days).slice(0, 8).map((item, i) => (
 <div key={`${item.type}-${item.name}-${i}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.type === "kine" ? "bg-chart-primary/10 text-chart-primary" : "bg-chart-destructive/10 text-chart-destructive")}>
 <User size={14} />
 </div>
 <div className="min-w-0">
 <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
 <p className="text-[10px] font-medium text-muted-foreground">{item.days} days since last {item.type === "kine" ? "session" : "lesson"} · {fmtShort(Math.round(item.spent))}</p>
 </div>
 </div>
 <span className={cn("text-[10px] font-semibold shrink-0 ml-3", item.days > 90 ? "text-destructive" : item.days > 60 ? "text-muted-foreground" : "text-muted-foreground")}>
 {item.days}d
 </span>
 </div>
 ))}
 {filteredKine.filter(c => c.lastSession && !isAfter(parseISO(c.lastSession), subMonths(now, 2))).length === 0 &&
 filteredVoice.filter(s => s.lastLesson && !isAfter(parseISO(s.lastLesson), subMonths(now, 2))).length === 0 && (
 <p className="text-center py-6 text-sm font-medium text-muted-foreground">All clients seen within 60 days. Great work!</p>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 </AppLayout>
 );
};

export default BusinessDashboardPage;
