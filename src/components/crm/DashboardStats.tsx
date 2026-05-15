"use client";

import React from "react";
import { Users, Calendar, FlaskConical, AlertCircle } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
      {[
        { label: "Total Clients", value: stats.clients, sub: `+${stats.newClients30d} NEW`, icon: Users },
        { label: "Weekly Sessions", value: stats.sessionsThisWeek, sub: `${stats.sessions30d} IN 30D`, icon: Calendar },
        { label: "Avg BOLT", value: `${stats.avgBolt}S`, sub: "FUNCTIONAL", icon: FlaskConical },
        { label: "Clinical Alerts", value: stats.imperativeAlerts, sub: "CASE FOCUS", icon: AlertCircle, alert: stats.imperativeAlerts > 0 },
      ].map((stat, i) => (
        <div key={i} className={cn(
          "p-6 border-r border-border last:border-r-0 transition-colors",
          stat.alert ? "bg-destructive/10" : "bg-background"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <stat.icon size={14} className={cn(stat.alert ? "text-destructive" : "text-primary")} />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-medium tracking-tight">{stat.value}</p>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;