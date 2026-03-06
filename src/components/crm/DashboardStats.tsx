"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, FlaskConical, AlertCircle, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
      <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Clients</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.clients}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5">
                <ArrowUpRight size={12} /> +{stats.newClients30d}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">this month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Stat */}
      <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Load</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.sessionsThisWeek}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              {stats.sessions30d} sessions in 30d
            </p>
          </div>
        </CardContent>
      </Card>

      {/* BOLT Stat */}
      <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
            <FlaskConical size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg BOLT</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.avgBolt}s</p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black border-emerald-200 text-emerald-600 uppercase">
                Functional
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Stat */}
      <Card className={cn(
        "border-none shadow-lg rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-500",
        stats.imperativeAlerts > 0 ? "bg-rose-600 text-white" : "bg-white"
      )}>
        <CardContent className="p-6 flex items-center gap-5">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xl",
            stats.imperativeAlerts > 0 ? "bg-white/20 backdrop-blur-md" : "bg-amber-50 text-amber-600"
          )}>
            <AlertCircle size={28} />
          </div>
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-slate-400")}>Imperative</p>
            <p className="text-3xl font-black tracking-tight">{stats.imperativeAlerts}</p>
            <p className={cn("text-[10px] font-bold mt-1", stats.imperativeAlerts > 0 ? "text-rose-100" : "text-slate-400")}>
              {stats.imperativeAlerts === 1 ? 'Case requires focus' : 'Cases require focus'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;