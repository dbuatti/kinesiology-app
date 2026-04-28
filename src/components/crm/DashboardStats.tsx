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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Clients Stat */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Users size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Clients</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{stats.clients}</p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
            <ArrowUpRight size={10} /> +{stats.newClients30d}
          </span>
        </div>
      </div>

      {/* Sessions Stat */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Calendar size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weekly Sessions</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{stats.sessionsThisWeek}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">
            {stats.sessions30d} in 30d
          </p>
        </div>
      </div>

      {/* BOLT Stat */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <FlaskConical size={20} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg BOLT</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{stats.avgBolt}s</p>
          <Badge variant="outline" className="h-5 px-2 text-[9px] font-bold border-emerald-200 text-emerald-600 uppercase rounded-md">
            Functional
          </Badge>
        </div>
      </div>

      {/* Alerts Stat */}
      <div className={cn(
        "p-6 rounded-2xl border transition-all group",
        stats.imperativeAlerts > 0 
          ? "bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
            stats.imperativeAlerts > 0 ? "bg-rose-100 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-400"
          )}>
            <AlertCircle size={20} />
          </div>
          <p className={cn("text-[10px] font-bold uppercase tracking-widest", stats.imperativeAlerts > 0 ? "text-rose-700" : "text-slate-500")}>Clinical Alerts</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-3xl font-serif font-bold", stats.imperativeAlerts > 0 ? "text-rose-700" : "text-slate-900 dark:text-white")}>{stats.imperativeAlerts}</p>
          <p className={cn("text-[10px] font-bold uppercase", stats.imperativeAlerts > 0 ? "text-rose-600" : "text-slate-400")}>
            {stats.imperativeAlerts === 1 ? 'Case focus' : 'Cases focus'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;