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
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-secondary/30 shadow-sm hover:shadow-md transition-all duration-500 group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Users size={22} />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Clients</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">{stats.clients}</p>
          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={10} /> +{stats.newClients30d}
          </span>
        </div>
      </div>

      {/* Sessions Stat */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-secondary/30 shadow-sm hover:shadow-md transition-all duration-500 group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Calendar size={22} />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Weekly Sessions</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">{stats.sessionsThisWeek}</p>
          <p className="text-[10px] text-muted-foreground font-bold">
            {stats.sessions30d} in 30d
          </p>
        </div>
      </div>

      {/* BOLT Stat */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-secondary/30 shadow-sm hover:shadow-md transition-all duration-500 group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <FlaskConical size={22} />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Avg BOLT</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">{stats.avgBolt}s</p>
          <Badge variant="outline" className="h-5 px-3 text-[9px] font-black border-emerald-200 text-emerald-600 uppercase rounded-full">
            Functional
          </Badge>
        </div>
      </div>

      {/* Alerts Stat */}
      <div className={cn(
        "p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 group",
        stats.imperativeAlerts > 0 
          ? "bg-rose-600 text-white border-rose-500 shadow-xl shadow-rose-500/20" 
          : "bg-white dark:bg-slate-900 border-secondary/30 shadow-sm hover:shadow-md"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform",
            stats.imperativeAlerts > 0 ? "bg-white/20 backdrop-blur-md" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600"
          )}>
            <AlertCircle size={22} />
          </div>
          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-muted-foreground")}>Clinical Alerts</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{stats.imperativeAlerts}</p>
          <p className={cn("text-[10px] font-bold", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-muted-foreground")}>
            {stats.imperativeAlerts === 1 ? 'Case focus' : 'Cases focus'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;