
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  TrendingUp,
  Users,
  Wind,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState, ErrorState } from "@/components/shared/PageState";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import DataIntegrityCheck from "@/components/crm/DataIntegrityCheck";
import FollowUpTracker from "@/components/crm/FollowUpTracker";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";

export function ClinicalOversightTool() {
 const [clients, setClients] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [search, setSearch] = useState("");

 useEffect(() => {
 const fetchClinicalData = async () => {
 try {
 // Fetch clients and their appointments (including future ones for follow-up tracking)
 const { data, error } = await supabase
 .from('clients')
 .select(`
 id, 
 name, 
 email,
 phone,
 born,
 suburbs,
 is_practitioner,
 appointments (
 id,
 bolt_score,
 coherence_score,
 date
 )
 `)
 .contains("practices", ["kinesiology"])
 .or('is_practitioner.eq.false,is_practitioner.is.null')
 .order('name');

 if (error) throw error;

 const processed = (data || []).map(client => {
 const appsWithData = client.appointments
 .filter((a: any) => a.bolt_score !== null || a.coherence_score !== null)
 .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
 
 return {
 ...client,
 latestData: appsWithData[0] || null,
 totalAssessments: appsWithData.length
 };
 });

 setClients(processed);
 } catch (err) {
  console.error("Error fetching clinical oversight data:", err);
  setError("Failed to load clinical data. Please try again.");
 } finally {
 setLoading(false);
 }
 };

 fetchClinicalData();
 }, []);

 const filteredClients = clients.filter(c => 
 c.name.toLowerCase().includes(search.toLowerCase())
 );

 const imperativeCount = clients.filter(c => c.latestData?.bolt_score !== null && c.latestData?.bolt_score !== undefined && c.latestData?.bolt_score < 25).length;
 const functionalCount = clients.filter(c => c.latestData?.bolt_score !== null && c.latestData?.bolt_score !== undefined && c.latestData?.bolt_score >= 25).length;

 if (loading) return <LoadingState label="Reading practice data…" />;

 if (error) return (
  <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); }} />
  );

 return (
  <div className="space-y-8">
  <PageHeader 
  title="Clinical Oversight"
  subtitle="Practice-wide health monitoring, data integrity, and case management."
   icon={TrendingUp}
   actions={
  <div className="flex items-center gap-3">
  <div className="relative w-full md:w-72">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
  <Input 
  placeholder="Search clients..." 
  className="pl-10 bg-card border-border rounded-xl shadow-sm h-12"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  />
  </div>
   <Button asChild variant="outline" size="sm" className="rounded-xl h-10 px-4 gap-2 shrink-0">
     <Link to="/follow-up" className="no-underline">
       <MessageSquare size={14} /> Follow Up
     </Link>
   </Button>
  </div>
   }
  />

 {/* Practice Management Tools */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <DataIntegrityCheck clients={clients} />
 <FollowUpTracker clients={clients} />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="border-none shadow-sm rounded-xl bg-destructive text-primary-foreground overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-20">
 <AlertCircle size={80} />
 </div>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold uppercase tracking-wider opacity-80">Imperative Attention</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-4xl font-semibold">{imperativeCount}</p>
 <p className="text-xs font-medium text-primary-foreground/80 mt-1">Clients with BOLT score {"<"} 25s</p>
 </CardContent>
 </Card>

 <Card className="border-none shadow-sm rounded-xl bg-chart-emerald text-primary-foreground overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-20">
 <CheckCircle2 size={80} />
 </div>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold uppercase tracking-wider opacity-80">Functional Status</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-4xl font-semibold">{functionalCount}</p>
 <p className="text-xs font-medium text-primary-foreground/80 mt-1">Clients with BOLT score ≥ 25s</p>
 </CardContent>
 </Card>

 <Card className="border-none shadow-sm rounded-xl bg-primary text-primary-foreground overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-20">
 <Users size={80} />
 </div>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-semibold uppercase tracking-wider opacity-80">Total Monitored</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-4xl font-semibold">{clients.length}</p>
 <p className="text-xs font-medium text-primary-foreground/80 mt-1">Active clinical cases</p>
 </CardContent>
 </Card>
 </div>

 <div className="space-y-6">
 <h2 className="text-2xl font-semibold text-foreground px-2 flex items-center gap-3">
 <TrendingUp size={28} className="text-chart-primary" /> Client Clinical Status
 </h2>
 
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredClients.map(client => {
 const bolt = client.latestData?.bolt_score ?? null;
 const coh = client.latestData?.coherence_score ?? null;
 const isImperative = bolt !== null && bolt < 25;

 return (
 <Link key={client.id} to={`/clients/${client.id}?tab=progress`}>
 <Card className={cn(
 "hover:shadow-sm transition-all border-2 rounded-xl overflow-hidden group h-full",
 isImperative ? "border-border bg-chart-destructive/10 " : "border-border bg-card"
 )}>
 <CardContent className="p-8 space-y-6">
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <h3 className="font-semibold text-2xl text-foreground group-hover:text-chart-primary transition-colors">{client.name}</h3>
 <p className="text-[11px] font-semibold text-muted-foreground">
 {client.totalAssessments} Assessments Recorded
 </p>
 </div>
 <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/80 group-hover:text-primary-foreground transition-all shadow-sm">
 <ArrowRight size={24} />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className={cn(
 "p-4 rounded-xl border flex flex-col items-center text-center",
 bolt === null ? "bg-muted/30 border-border" : (bolt >= 25 ? "bg-chart-emerald/10 border-border " : "bg-chart-destructive/10 border-border ")
 )}>
 <FlaskConical size={16} className={cn("mb-1.5", bolt === null ? "text-muted-foreground" : (bolt >= 25 ? "text-chart-emerald" : "text-chart-destructive"))} />
 <p className="text-[11px] font-semibold opacity-60">BOLT</p>
 <p className="text-2xl font-semibold">{bolt !== null ? `${bolt}s` : "—"}</p>
 </div>
 <div className={cn(
 "p-4 rounded-xl border flex flex-col items-center text-center",
 coh === null ? "bg-muted/30 border-border" : "bg-chart-primary/10 border-border "
 )}>
 <Activity size={16} className={cn("mb-1.5", coh === null ? "text-muted-foreground" : "text-chart-primary ")} />
 <p className="text-[11px] font-semibold opacity-60">COH</p>
 <p className="text-2xl font-semibold">{coh !== null ? coh.toFixed(1) : "—"}</p>
 </div>
 </div>

 {isImperative && (
 <div className="flex items-center gap-3 p-3 bg-destructive text-primary-foreground rounded-xl shadow-sm ">
 <Wind size={18} className="shrink-0" />
 <span className="text-[11px] font-semibold">Imperative: Breathing Recovery</span>
 </div>
 )}
 </CardContent>
 </Card>
 </Link>
 );
 })}
 </div>

 {filteredClients.length === 0 && (
  <EmptyState
    icon={Users}
    title="No clients found"
    hint="Try adjusting your search or add new clients to monitor."
    className="rounded-xl border border-dashed border-border bg-muted/20 py-20"
  />
  )}
  </div>
  </div>
  );
};

const ClinicalOversightPage = () => (
  <AppLayout>
    <ClinicalOversightTool />
  </AppLayout>
);

export default ClinicalOversightPage;