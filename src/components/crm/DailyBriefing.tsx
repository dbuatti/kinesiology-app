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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-serif font-bold flex items-center gap-3 text-primary">
            <Zap size={28} className="text-amber-500 fill-amber-400" /> Daily Briefing
          </h2>
          <p className="text-muted-foreground font-medium text-sm md:text-base">
            {todaySessions.length > 0 
              ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} today.`
              : "Your schedule is clear for today."}
          </p>
        </div>
        {activeSession && (
          <Link to={`/appointments/${activeSession.id}`}>
            <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-5 py-2 animate-pulse cursor-pointer font-black text-[10px] uppercase tracking-widest rounded-full shadow-xl shadow-rose-500/20">
              <Activity size={14} className="mr-2" /> LIVE: {activeSession.clients?.name}
            </Badge>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`}>
              <div className={cn(
                "p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col gap-6 group relative overflow-hidden",
                activeSession?.id === session.id 
                  ? "bg-primary text-white border-primary shadow-2xl scale-[1.02]" 
                  : "bg-white dark:bg-slate-900 hover:border-primary/30 border-secondary/30 shadow-sm hover:shadow-xl"
              )}>
                {activeSession?.id === session.id && (
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={80} />
                  </div>
                )}
                
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className={cn(activeSession?.id === session.id ? "text-white/70" : "text-primary")} />
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        activeSession?.id === session.id ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {activeSession?.id === session.id ? "ONGOING" : format(session.date, "h:mm a")}
                      </p>
                    </div>
                    <p className="font-serif font-bold text-2xl md:text-3xl truncate">{session.clients?.name}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                    activeSession?.id === session.id ? "bg-white/20 text-white" : "bg-muted text-primary group-hover:bg-primary group-hover:text-white"
                  )}>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {session.goal && (
                  <div className={cn(
                    "p-4 md:p-5 rounded-2xl text-sm font-medium flex items-start gap-3 relative z-10",
                    activeSession?.id === session.id ? "bg-white/10 text-white/90" : "bg-muted/50 text-muted-foreground"
                  )}>
                    <Target size={18} className={cn("shrink-0 mt-0.5", activeSession?.id === session.id ? "text-white/70" : "text-primary/60")} />
                    <p className="italic leading-relaxed">"{session.goal}"</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="sm:col-span-2 flex flex-col items-center justify-center gap-6 p-16 bg-muted/30 rounded-[3rem] border-2 border-dashed border-secondary/50 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 shadow-inner">
              <Coffee size={40} />
            </div>
            <div className="space-y-2">
              <p className="font-serif font-bold text-primary text-2xl">Time for deep work.</p>
              <p className="text-muted-foreground font-medium text-base max-w-xs mx-auto">
                No sessions scheduled for today. Use this time for research or practice.
              </p>
            </div>
            <Link to="/practice/self">
              <Button variant="outline" className="rounded-full px-8 h-12 font-black text-[10px] uppercase tracking-widest border-secondary/50 hover:bg-primary hover:text-white transition-all">
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