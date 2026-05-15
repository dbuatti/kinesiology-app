"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Target, Clock, Activity, Coffee } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Zap size={24} className="text-amber-500 fill-amber-400" /> Daily Briefing
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {todaySessions.length > 0 
              ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
              : "Your schedule is clear for today."}
          </p>
        </div>
        {activeSession && (
          <Link to={`/appointments/${activeSession.id}`}>
            <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-none px-4 py-1.5 animate-pulse cursor-pointer font-bold text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-rose-500/20">
              <Activity size={14} className="mr-2" /> LIVE: {activeSession.clients?.name}
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`}>
              <div className={cn(
                "p-6 rounded-2xl border transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden",
                activeSession?.id === session.id 
                  ? "bg-slate-900 text-white border-slate-800 shadow-xl" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 shadow-sm"
              )}>
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className={cn(activeSession?.id === session.id ? "text-indigo-400" : "text-slate-400")} />
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        activeSession?.id === session.id ? "text-indigo-400" : "text-slate-500"
                      )}>
                        {activeSession?.id === session.id ? "ONGOING" : format(session.date, "h:mm a")}
                      </p>
                    </div>
                    <p className="font-serif font-bold text-xl truncate">{session.clients?.name}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    activeSession?.id === session.id ? "bg-white/10 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white"
                  )}>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {session.goal && (
                  <div className={cn(
                    "p-4 rounded-xl text-xs font-medium flex items-start gap-3 relative z-10",
                    activeSession?.id === session.id ? "bg-white/5 text-slate-300" : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                  )}>
                    <Target size={14} className="shrink-0 mt-0.5 opacity-50" />
                    <p className="italic line-clamp-2">"{session.goal}"</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 p-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 shadow-sm">
              <Coffee size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-serif font-bold text-slate-900 dark:text-white text-xl">No sessions today.</p>
              <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
                Use this time for clinical research or personal practice.
              </p>
            </div>
            <Link to="/practice/self">
              <Button variant="outline" className="rounded-xl px-6 h-10 font-bold text-[10px] uppercase tracking-widest border-slate-200 hover:bg-white transition-all">
                Start Self Practice
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBriefing;