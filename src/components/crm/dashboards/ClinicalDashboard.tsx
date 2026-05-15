"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Activity, Zap, ShieldAlert, ClipboardCheck, Sparkles, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import PractitionerGrounding from "../PractitionerGrounding";
import QuickActionsGrid from "../QuickActionsGrid";
import DashboardStats from "../DashboardStats";
import DailyBriefing from "../DailyBriefing";
import UpcomingAppointments from "../UpcomingAppointments";
import RecentActivity from "../RecentActivity";
import Scratchpad from "../Scratchpad";

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
    <div className="space-y-8">
      {/* MISSION CRITICAL TASKS */}
      <div className="border border-border p-8 bg-background">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-primary">Clinical Readiness</p>
            <h2 className="text-2xl font-medium uppercase tracking-tight">Daily Mission</h2>
          </div>

          <div className="flex flex-wrap gap-0 border border-border">
            {missions.map((m, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-6 py-4 border-r border-border last:border-r-0 transition-colors",
                m.status === 'done'
                  ? "bg-success/10 text-success"
                  : "bg-background text-muted-foreground"
              )}>
                <m.icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                {m.status === 'done' && <Check size={14} className="ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border">
        <div className="lg:col-span-8 border-r border-border">
          <PractitionerGrounding />
        </div>
        <div className="lg:col-span-4">
          <Link to="/morning-program" className="block h-full hover:bg-muted transition-colors">
            <div className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Sun size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Morning Program</span>
                </div>
                <h3 className="text-xl font-medium uppercase tracking-tight">Daily Readiness</h3>
              </div>
              
              <div className="space-y-4 mt-8">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Progress</span>
                  <span>{morningProgress}%</span>
                </div>
                <Progress value={morningProgress} className="h-1 bg-muted [&>div]:bg-primary" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <QuickActionsGrid onNewClient={() => {}} onBookSession={() => {}} />
      
      {/* Only show stats if there are alerts or significant changes */}
      {stats.imperativeAlerts > 0 && (
        <div className="bg-destructive/10 border border-destructive p-4 flex items-center gap-4">
          <ShieldAlert className="text-destructive" size={20} />
          <p className="text-sm font-bold uppercase text-destructive">
            {stats.imperativeAlerts} Clinical Alerts Require Immediate Attention
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <DailyBriefing todaySessions={todaySessions} activeSession={activeSession} />
          <Scratchpad />
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