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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Clients", value: stats.clients, sub: `+${stats.newClients30d} new`, icon: Users },
        { label: "Weekly Sessions", value: stats.sessionsThisWeek, sub: `${stats.sessions30d} in 30d`, icon: Calendar },
        { label: "Avg BOLT", value: `${stats.avgBolt}s`, sub: "Functional", icon: FlaskConical },
        { label: "Clinical Alerts", value: stats.imperativeAlerts, sub: "Case focus", icon: AlertCircle, alert: stats.imperativeAlerts > 0 },
      ].map((stat, i) => (
        <div key={i} className={cn(
          "p-5 rounded-lg border bg-white dark:bg-slate-900 shadow-sm transition-all",
          stat.alert ? "border-rose-200 bg-rose-50/30" : "border-slate-200 dark:border-slate-800"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <stat.icon size={14} className={cn(stat.alert ? "text-rose-600" : "text-indigo-600")} />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <span className="text-[10px] text-slate-400 font-medium uppercase">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;