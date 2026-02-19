"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, Activity, FlaskConical, Brain, 
  AlertCircle, CheckCircle2, History, Zap, Info,
  ArrowUpRight, ArrowDownRight, LineChart, Plus
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import BreathingRecoveryProtocol from "./BreathingRecoveryProtocol";
import { Appointment } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import QuickAssessmentModal from "./QuickAssessmentModal";

interface ClientProgressTabProps {
  client: any;
  appointments: Appointment[];
  onRefresh?: () => void;
}

const ClientProgressTab = ({ client, appointments, onRefresh }: ClientProgressTabProps) => {
  const [assessmentType, setAssessmentType] = useState<'bolt' | 'coherence' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const boltData = useMemo(() => {
    return [...appointments]
      .filter(app => app.bolt_score !== null && app.bolt_score !== undefined)
      .reverse()
      .map(app => ({
        date: format(new Date(app.date), "MMM d"),
        score: app.bolt_score,
        fullDate: format(new Date(app.date), "MMMM d, yyyy")
      }));
  }, [appointments]);

  const coherenceData = useMemo(() => {
    return [...appointments]
      .filter(app => app.coherence_score !== null && app.coherence_score !== undefined)
      .reverse()
      .map(app => ({
        date: format(new Date(app.date), "MMM d"),
        score: app.coherence_score,
        fullDate: format(new Date(app.date), "MMMM d, yyyy")
      }));
  }, [appointments]);

  const latestBolt = boltData[boltData.length - 1]?.score || null;
  const previousBolt = boltData[boltData.length - 2]?.score || null;
  const latestCoh = coherenceData[coherenceData.length - 1]?.score || null;

  const getTrend = (current: number | null, previous: number | null) => {
    if (current === null || previous === null || current === previous) return null;
    return current > previous ? "up" : "down";
  };

  const boltTrend = getTrend(latestBolt, previousBolt);

  const openAssessment = (type: 'bolt' | 'coherence') => {
    setAssessmentType(type);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Quick Assessment Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 px-4 border-r border-slate-100 mr-2">
          <Zap size={18} className="text-amber-500 fill-amber-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Assessment</span>
        </div>
        <Button 
          onClick={() => openAssessment('bolt')}
          variant="outline" 
          className="rounded-xl border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 font-bold h-10"
        >
          <FlaskConical size={16} className="mr-2" /> Log BOLT
        </Button>
        <Button 
          onClick={() => openAssessment('coherence')}
          variant="outline" 
          className="rounded-xl border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 font-bold h-10"
        >
          <Activity size={16} className="mr-2" /> Log Coherence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clinical Status Card */}
        <Card className="lg:col-span-1 border-none shadow-lg rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" /> Clinical Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Latest BOLT Score</p>
                  {boltTrend === "up" && <Badge className="bg-emerald-500 text-white border-none text-[10px]"><ArrowUpRight size={10} className="mr-1" /> Improving</Badge>}
                  {boltTrend === "down" && <Badge className="bg-rose-500 text-white border-none text-[10px]"><ArrowDownRight size={10} className="mr-1" /> Declining</Badge>}
                </div>
                <div className="flex items-baseline gap-2">
                  <p className={cn(
                    "text-4xl font-black",
                    latestBolt === null ? "text-slate-300" : (latestBolt >= 25 ? "text-emerald-600" : "text-rose-600")
                  )}>
                    {latestBolt !== null ? `${latestBolt}s` : "—"}
                  </p>
                  <span className="text-slate-400 text-sm font-bold">/ 40s target</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Latest Coherence</p>
                <div className="flex items-baseline gap-2">
                  <p className={cn(
                    "text-4xl font-black",
                    latestCoh === null ? "text-slate-300" : "text-rose-600"
                  )}>
                    {latestCoh !== null ? latestCoh.toFixed(2) : "—"}
                  </p>
                  <span className="text-slate-400 text-sm font-bold">Ratio</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Alerts</h4>
              {latestBolt !== null && latestBolt < 25 ? (
                <div className="flex gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <AlertCircle className="text-rose-600 shrink-0" size={18} />
                  <p className="text-xs text-rose-900 font-bold leading-tight">
                    BOLT score below functional threshold. Breathing Recovery exercise is imperative.
                  </p>
                </div>
              ) : latestBolt !== null ? (
                <div className="flex gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                  <p className="text-xs text-emerald-900 font-bold leading-tight">
                    BOLT score is functional. Continue monitoring for optimal (40s) goal.
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Info className="text-slate-400 shrink-0" size={18} />
                  <p className="text-xs text-slate-500 font-medium leading-tight">
                    No BOLT score recorded yet. Perform assessment in next session.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trends Chart */}
        <Card className="lg:col-span-2 border-none shadow-lg rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" /> Clinical Trends
                </CardTitle>
                <CardDescription>Long-term BOLT score progress</CardDescription>
              </div>
              <LineChart size={24} className="text-slate-300" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {boltData.length > 1 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={boltData}>
                    <defs>
                      <linearGradient id="colorBoltProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <ChartTooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                      labelStyle={{fontWeight: 'bold', color: '#1e293b'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      name="BOLT Score"
                      stroke="#4f46e5" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorBoltProgress)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <History size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">Insufficient Data for Trends</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Record BOLT scores in at least 2 sessions to see progress visualization.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BreathingRecoveryProtocol currentScore={latestBolt} />
        </div>
        
        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-3xl bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={120} />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Zap size={20} className="text-amber-400 fill-amber-400" /> Case Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Primary Focus</p>
                <p className="text-sm font-bold leading-relaxed">
                  {latestBolt !== null && latestBolt < 25 
                    ? "Prioritize CO2 tolerance and respiratory mechanics. Shift from SNS to Receptive state."
                    : "Refine autonomic synchronization and multi-planar mobility patterns."}
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Shared Responsibility</p>
                <p className="text-xs text-indigo-100 leading-relaxed italic">
                  "There needs to be a balance of shared responsibility, but ultimately the client must drive their own healing process."
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Brain size={18} className="text-emerald-500" /> Neuro Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                If breathing exercises are stressful, use the <strong>Nociceptive Threat Assessment</strong> to clear the response.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Fakuda Test</span>
                  <Badge variant="outline" className="text-[10px] border-slate-200">
                    {appointments.some(a => a.fakuda_notes) ? "Assessed" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Rhombergs</span>
                  <Badge variant="outline" className="text-[10px] border-slate-200">
                    {appointments.some(a => a.sharpened_rhombergs_notes) ? "Assessed" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {assessmentType && (
        <QuickAssessmentModal 
          open={modalOpen}
          onOpenChange={setModalOpen}
          clientId={client.id}
          clientName={client.name}
          type={assessmentType}
          onComplete={() => onRefresh?.()}
        />
      )}
    </div>
  );
};

export default ClientProgressTab;