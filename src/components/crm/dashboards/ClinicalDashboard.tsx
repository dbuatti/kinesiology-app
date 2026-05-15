"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Activity, Zap, ShieldAlert, ClipboardCheck, Sparkles, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import PractitionerGrounding from "../PractitionerGrounding";
import QuickActionsGrid from "../QuickActionsGrid";
import DashboardStats from "../DashboardStats";
import DailyBriefing from "../DailyBriefing";
import ClientWins from "../ClientWins";
import UpcomingAppointments from "../UpcomingAppointments";
import RecentActivity from "../RecentActivity";
import Scratchpad from "../Scratchpad";

interface ClinicalDashboardProps {
  stats: {
    clients: number;
    newClients30d: number;
    sessionsThisWeek: number;
    sessions30d: number;
    avgBolt: number;
    avgCoherence: number;
    imperativeAlerts: number;
  };
  todaySessions: any[];
  activeSession: any;
  morningProgress: number;
}

const ClinicalDashboard = ({ stats, todaySessions, activeSession, morningProgress }: ClinicalDashboardProps) => {
  const missions = [
    { label: "Grounding", status: morningProgress >= 25 ? 'done' : 'pending', icon: Sparkles, path: "/morning-program" },
    { label: "Review Alerts", status: stats.imperativeAlerts === 0 ? 'done' : 'pending', icon: ShieldAlert, path: "/oversight" },
    { label: "Session Prep", status: 'pending', icon: ClipboardCheck, path: "/schedule" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-3 text-center md:text-left">
              <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase tracking-[0.4em] px-4 py-1.5 rounded-full">
                Daily Mission
              </Badge>
              <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Your focus for <span className="text-indigo-600">today</span>.
              </h2>
              <p className="text-base text-slate-500 font-medium">Complete these tasks to maintain clinical excellence.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {missions.map((m, i) => (
                <Link 
                  key={i} 
                  to={m.path}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-500 hover:scale-105 active:scale-95",
                    m.status === 'done'
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 shadow-sm"
                      : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800 hover:border-indigo-200 hover:bg-indigo-50/30"
                  )}
                >
                  <m.icon size={20} className={cn(m.status === 'done' ? "text-emerald-500" : "text-slate-300")} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{m.label}</span>
                  {m.status === 'done' && <Check size={16} className="ml-1 text-emerald-500" />}
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <PractitionerGrounding />
        </div>
        <div className="lg:col-span-4">
          <Link to="/morning-program" className="block h-full">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 h-full overflow-hidden group hover:border-indigo-300 hover:shadow-xl transition-all duration-500">
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Sun size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Morning Program</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Daily Readiness</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Progress</span>
                    <span className="text-indigo-600">{morningProgress}%</span>
                  </div>
                  <Progress value={morningProgress} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <QuickActionsGrid onNewClient={() => {}} onBookSession={() => {}} />
      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
          <Scratchpad />
        </div>
        <div className="lg:col-span-4 space-y-12">
          <ClientWins />
          <UpcomingAppointments />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default ClinicalDashboard;