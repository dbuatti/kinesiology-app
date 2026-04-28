"use client";

import React from "react";
import { Users, Calendar, FlaskConical, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: number; // Optional percentage trend
  variant?: "default" | "alert" | "success";
}

interface DashboardStatsProps {
  stats: {
    clients: number;
    newClients30d: number;
    sessionsThisWeek: number;
    sessions30d: number;
    avgBolt: number;
    avgCoherence?: number; // Kept for future use
    imperativeAlerts: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const statItems: StatItem[] = [
    {
      label: "Total Clients",
      value: stats.clients.toLocaleString(),
      sub: `+${stats.newClients30d} this month`,
      icon: Users,
      trend: stats.newClients30d > 0 ? 12 : undefined,
    },
    {
      label: "Weekly Sessions",
      value: stats.sessionsThisWeek,
      sub: `${stats.sessions30d} in 30 days`,
      icon: Calendar,
    },
    {
      label: "Average BOLT",
      value: `${stats.avgBolt}s`,
      sub: "Functional strength",
      icon: FlaskConical,
      variant: "success",
    },
    {
      label: "Clinical Alerts",
      value: stats.imperativeAlerts,
      sub: stats.imperativeAlerts === 1 ? "Case needs focus" : "Cases need focus",
      icon: AlertCircle,
      variant: stats.imperativeAlerts > 0 ? "alert" : "default",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {statItems.map((stat, index) => {
        const isAlert = stat.variant === "alert";
        const isSuccess = stat.variant === "success";

        return (
          <div
            key={index}
            className={cn(
              "group relative p-6 rounded-xl border bg-card text-card-foreground",
              "shadow-sm hover:shadow-md transition-all duration-200",
              "flex flex-col",
              isAlert && "border-destructive/30 bg-destructive/5 dark:bg-destructive/10",
              isSuccess && "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30"
            )}
          >
            {/* Icon & Label */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isAlert && "bg-destructive/10 text-destructive",
                    isSuccess && "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
                    !isAlert && !isSuccess && "bg-primary/10 text-primary"
                  )}
                >
                  <stat.icon size={20} strokeWidth={2.25} />
                </div>
                <p className="text-sm font-medium text-muted-foreground tracking-tight">
                  {stat.label}
                </p>
              </div>

              {stat.trend && (
                <div className="flex items-center text-emerald-600 text-xs font-medium">
                  <TrendingUp size={14} className="mr-1" />
                  +{stat.trend}%
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mt-auto">
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tighter",
                  isAlert && "text-destructive",
                  isSuccess && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {stat.value}
              </p>

              {stat.sub && (
                <p className="text-sm text-muted-foreground mt-1 leading-tight">
                  {stat.sub}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;