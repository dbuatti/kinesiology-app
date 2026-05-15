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
      {[
        { label: "Total Clients", value: stats.clients, sub: `+${stats.newClients30d} new`, icon: Users },
        { label: "Weekly Sessions", value: stats.sessionsThisWeek, sub: `${stats.sessions30d} in 30d`, icon: Calendar },
        { label: "Avg BOLT", value: `${stats.avgBolt}s`, sub: "Functional", icon: FlaskConical },
        { label: "Clinical Alerts", value: stats.imperativeAlerts, sub: "Case focus", icon: AlertCircle, alert: stats.imperativeAlerts > 0 },
      ].map((stat, i) => (
        <div key={i} className={cn(
          "p-6 rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm transition-all duration-500 hover:shadow-md",
          stat.alert ? "border-rose-200 bg-rose-50/30 dark:border-rose-900/30" : "border-slate-100 dark:border-slate-800"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm",
              stat.alert ? "bg-rose-100 text-rose-600" : "bg-indigo-50 text-indigo-600"
            )}>
              <stat.icon size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;