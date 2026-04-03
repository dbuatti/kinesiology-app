"use client";

import React from "react";
import { Users, Calendar, FlaskConical, AlertCircle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  stats: {
    clients: number;
    newClients30d: number;
    sessionsThisWeek: number;
    sessions30d: number;
    avgBolt: number;
    avgCoherence: number;
    imperativeAlerts: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Clients Stat */}
      <div className="p-5 md:p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20 transition-all duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 flex items-center justify-center shadow-sm">
            <Users size={20} />
          </div>
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Clients</p>
        </div>
        <p className="text-3xl font-black text-foreground tracking-tight">{stats.clients}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5">
            <ArrowUpRight size={12} /> +{stats.newClients30d}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold">this month</span>
        </div>
      </div>

      {/* Sessions Stat */}
      <div className="p-5 md:p-6 rounded-[2rem] bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20 transition-all duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-rose-600 flex items-center justify-center shadow-sm">
            <Calendar size={20} />
          </div>
          <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Weekly</p>
        </div>
        <p className="text-3xl font-black text-foreground tracking-tight">{stats.sessionsThisWeek}</p>
        <p className="text-[10px] text-muted-foreground font-bold mt-1">
          {stats.sessions30d} in 30d
        </p>
      </div>

      {/* BOLT Stat */}
      <div className="p-5 md:p-6 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-900/20 transition-all duration-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 flex items-center justify-center shadow-sm">
            <FlaskConical size={20} />
          </div>
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Avg BOLT</p>
        </div>
        <p className="text-3xl font-black text-foreground tracking-tight">{stats.avgBolt}s</p>
        <div className="mt-1">
          <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black border-emerald-200 text-emerald-600 uppercase rounded-full">
            Functional
          </Badge>
        </div>
      </div>

      {/* Alerts Stat */}
      <div className={cn(
        "p-5 md:p-6 rounded-[2rem] border transition-all duration-500",
        stats.imperativeAlerts > 0 
          ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-200 dark:shadow-none" 
          : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
            stats.imperativeAlerts > 0 ? "bg-white/20 backdrop-blur-md" : "bg-white dark:bg-slate-800 text-rose-600"
          )}>
            <AlertCircle size={20} />
          </div>
          <p className={cn("text-[9px] font-black uppercase tracking-widest", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-muted-foreground")}>Alerts</p>
        </div>
        <p className="text-3xl font-black tracking-tight">{stats.imperativeAlerts}</p>
        <p className={cn("text-[10px] font-bold mt-1", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-muted-foreground")}>
          {stats.imperativeAlerts === 1 ? 'Case focus' : 'Cases focus'}
        </p>
      </div>
    </div>
  );
};

export default DashboardStats;