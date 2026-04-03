"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Sparkles, Target, Clock, Activity, Coffee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";

interface DailyBriefingProps {
  todaySessions: AppointmentWithClient[];
  activeSession: AppointmentWithClient | null;
}

const DailyBriefing = ({ todaySessions, activeSession }: DailyBriefingProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-3 text-foreground">
            <Zap size={24} className="text-amber-500 fill-amber-400" /> Daily Briefing
          </h2>
          <p className="text-muted-foreground font-medium">
            {todaySessions.length > 0 
              ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} today.`
              : "Your schedule is clear for today."}
          </p>
        </div>
        {activeSession && (
          <Link to={`/appointments/${activeSession.id}`}>
            <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-4 py-1.5 animate-pulse cursor-pointer font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20">
              <Activity size={12} className="mr-2" /> LIVE: {activeSession.clients?.name}
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`}>
              <div className={cn(
                "p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-4 group",
                activeSession?.id === session.id 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xl scale-[1.02]" 
                  : "bg-white dark:bg-slate-900 hover:border-indigo-200 border-slate-100 dark:border-slate-800"
              )}>
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock size={12} className={cn(activeSession?.id === session.id ? "text-indigo-200" : "text-indigo-500")} />
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em]",
                        activeSession?.id === session.id ? "text-indigo-200" : "text-slate-400"
                      )}>
                        {activeSession?.id === session.id ? "ONGOING" : format(session.date, "h:mm a")}
                      </p>
                    </div>
                    <p className="font-black text-xl truncate">{session.clients?.name}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    activeSession?.id === session.id ? "bg-white/20 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600"
                  )}>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {session.goal && (
                  <div className={cn(
                    "p-3 rounded-2xl text-xs font-medium flex items-start gap-2",
                    activeSession?.id === session.id ? "bg-white/10 text-indigo-50" : "bg-slate-50 dark:bg-slate-800 text-slate-500"
                  )}>
                    <Target size={14} className={cn("shrink-0 mt-0.5", activeSession?.id === session.id ? "text-indigo-200" : "text-indigo-400")} />
                    <p className="line-clamp-2 italic">"{session.goal}"</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="sm:col-span-2 flex flex-col items-center justify-center gap-4 p-12 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
              <Coffee size={32} />
            </div>
            <div>
              <p className="font-black text-foreground text-xl">Time for deep work.</p>
              <p className="text-muted-foreground font-medium text-sm mt-1 max-w-xs mx-auto">
                No sessions scheduled for today.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;