"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Activity, FlaskConical, Brain, AlertCircle, 
  CheckCircle2, ArrowRight, Search, Loader2, 
  TrendingUp, Users, Zap, Wind
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { cn } from "@/lib/utils";

const ClinicalOversightPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClinicalData = async () => {
      try {
        // Fetch clients and their latest appointments with clinical data
        const { data, error } = await supabase
          .from('clients')
          .select(`
            id, 
            name, 
            is_practitioner,
            appointments (
              bolt_score,
              coherence_score,
              date
            )
          `)
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

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <Breadcrumbs items={[{ label: "Clinical Oversight" }]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Clinical Oversight</h1>
          <p className="text-muted-foreground font-medium">Practice-wide health monitoring and case management.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search clients..." 
            className="pl-10 bg-card border-border rounded-2xl shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg rounded-3xl bg-rose-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <AlertCircle size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Imperative Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{imperativeCount}</p>
            <p className="text-xs font-bold text-rose-100 mt-1">Clients with BOLT score {"<"} 25s</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-3xl bg-emerald-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <CheckCircle2 size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Functional Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{functionalCount}</p>
            <p className="text-xs font-bold text-emerald-100 mt-1">Clients with BOLT score ≥ 25s</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-3xl bg-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Users size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Total Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{clients.length}</p>
            <p className="text-xs font-bold text-indigo-100 mt-1">Active clinical cases</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-xl font-black text-foreground px-2 flex items-center gap-2">
          <TrendingUp size={24} className="text-indigo-600" /> Client Clinical Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => {
            const bolt = client.latestData?.bolt_score ?? null;
            const coh = client.latestData?.coherence_score ?? null;
            const isImperative = bolt !== null && bolt < 25;

            return (
              <Link key={client.id} to={`/clients/${client.id}?tab=progress`}>
                <Card className={cn(
                  "hover:shadow-xl transition-all border-2 rounded-3xl overflow-hidden group h-full",
                  isImperative ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10" : "border-border bg-card"
                )}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-black text-xl text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{client.name}</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {client.totalAssessments} Assessments Recorded
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn(
                        "p-3 rounded-2xl border flex flex-col items-center text-center",
                        bolt === null ? "bg-muted/30 border-border" : (bolt >= 25 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-900/50")
                      )}>
                        <FlaskConical size={14} className={cn("mb-1", bolt === null ? "text-muted-foreground" : (bolt >= 25 ? "text-emerald-600" : "text-rose-600"))} />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">BOLT</p>
                        <p className="text-xl font-black">{bolt !== null ? `${bolt}s` : "—"}</p>
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl border flex flex-col items-center text-center",
                        coh === null ? "bg-muted/30 border-border" : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30"
                      )}>
                        <Activity size={14} className={cn("mb-1", coh === null ? "text-muted-foreground" : "text-indigo-600 dark:text-indigo-400")} />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">COH</p>
                        <p className="text-xl font-black">{coh !== null ? coh.toFixed(1) : "—"}</p>
                      </div>
                    </div>

                    {isImperative && (
                      <div className="flex items-center gap-2 p-2 bg-rose-600 text-white rounded-xl">
                        <Wind size={14} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Imperative: Breathing Recovery</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-foreground">No clients found</h3>
            <p className="text-muted-foreground font-medium">Try adjusting your search or add new clients to monitor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalOversightPage;