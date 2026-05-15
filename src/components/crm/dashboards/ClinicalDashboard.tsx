"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Activity, Zap, ShieldAlert, ClipboardCheck, Sparkles, Check, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import PractitionerGrounding from "../PractitionerGrounding";
import QuickActionsGrid from "../QuickActionsGrid";
import DailyBriefing from "../DailyBriefing";
import UpcomingAppointments from "../UpcomingAppointments";
import RecentActivity from "../RecentActivity";

interface ClinicalDashboardProps {
  stats: any;
  todaySessions: any[];
  activeSession: any;
  morningProgress: number;
}

const ClinicalDashboard = ({ stats, todaySessions, activeSession, morningProgress }: ClinicalDashboardProps) => {
  const missions = [
    { label: "Grounding", status: morningProgress >= 25 ? 'done' : 'pending', icon: Sparkles },
    { label: "Review Alerts", status: stats.imperativeAlerts === 0 ? 'done' : 'pending', icon: ShieldAlert },
    { label: "Session Prep", status: 'pending', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      {/* BRANDED HEADER */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div className="space-y-1">
          <p className="label-caps">Clinical Operations</p>
          <h1 className="text-5xl font-serif font-black tracking-tighter text-slate-900">Clinical Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-6 border-2 border-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
            Switch Workspace
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DAILY MISSION - RESTORED DEPTH */}
        <div className="lg:col-span-4">
          <Card className="h-full border-none shadow-lg rounded-none bg-navy text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Target size={120} />
            </div>
            <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Daily Mission</p>
                  <h3 className="text-2xl font-serif font-bold">Clinical Readiness</h3>
                </div>
                
                <div className="space-y-3">
                  {missions.map((m, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-3 transition-colors",
                      m.status === 'done' ? "bg-white/10 text-emerald-400" : "bg-white/5 text-white/40"
                    )}>
                      <div className="flex items-center gap-3">
                        <m.icon size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                      </div>
                      {m.status === 'done' ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border border-white/20" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-2">
                  <span>Overall Readiness</span>
                  <span>{morningProgress}%</span>
                </div>
                <Progress value={morningProgress} className="h-1 bg-white/10 [&>div]:bg-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GROUNDING RITUAL - RESTORED VISUAL WEIGHT */}
        <div className="lg:col-span-8">
          <Card className="h-full border-none shadow-ritual rounded-none bg-white overflow-hidden border-l-8 border-primary">
            <PractitionerGrounding />
          </Card>
        </div>
      </div>

      <QuickActionsGrid onNewClient={() => {}} onBookSession={() => {}} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
        </div>
        <div className="lg:col-span-4 space-y-8">
          <UpcomingAppointments />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default ClinicalDashboard;