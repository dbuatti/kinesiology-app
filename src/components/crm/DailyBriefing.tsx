"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, CheckCircle2, Sparkles, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";

interface DailyBriefingProps {
  todaySessions: AppointmentWithClient[];
  activeSession: AppointmentWithClient | null;
}

const DailyBriefing = ({ todaySessions, activeSession }: DailyBriefingProps) => {
  return (
    <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3.5rem] overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Sparkles size={250} /></div>
      <CardHeader className="pb-4 p-12">
        <div className="flex items-center justify-between">
          <CardTitle className="text-4xl font-black flex items-center gap-5">
            <Zap size={40} className="text-amber-400 fill-amber-400" /> Daily Briefing
          </CardTitle>
          {activeSession && (
            <Link to={`/appointments/${activeSession.id}`}>
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-8 py-3 animate-pulse cursor-pointer font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/20">
                LIVE SESSION: {activeSession.clients?.name}
              </Badge>
            </Link>
          )}
        </div>
        <CardDescription className="text-slate-400 text-xl font-medium mt-4">
          {todaySessions.length > 0 
            ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
            : "No sessions scheduled for today. Time for some research or admin!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-12 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {todaySessions.length > 0 ? (
            todaySessions.map(session => (
              <Link key={session.id} to={`/appointments/${session.id}`}>
                <div className={cn(
                  "p-8 rounded-[3rem] border transition-all duration-500 flex flex-col gap-4 group",
                  activeSession?.id === session.id 
                    ? "bg-white text-slate-950 border-white shadow-2xl scale-[1.02]" 
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                )}>
                  <div className="flex items-center justify-between w-full">
                    <div className="min-w-0">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-[0.35em] mb-2",
                        activeSession?.id === session.id ? "text-rose-500" : "text-slate-500"
                      )}>
                        {activeSession?.id === session.id ? "ONGOING" : format(session.date, "h:mm a")}
                      </p>
                      <p className="font-black text-2xl truncate">{session.clients?.name}</p>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                      activeSession?.id === session.id ? "bg-indigo-50 text-indigo-600" : "bg-white/5 text-slate-500 group-hover:text-white"
                    )}>
                      <ArrowRight size={24} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                  
                  {session.goal && (
                    <div className={cn(
                      "p-4 rounded-2xl text-sm font-medium flex items-start gap-3",
                      activeSession?.id === session.id ? "bg-slate-50 text-slate-600" : "bg-white/5 text-slate-400"
                    )}>
                      <Target size={16} className={cn("shrink-0 mt-0.5", activeSession?.id === session.id ? "text-indigo-500" : "text-slate-500")} />
                      <p className="line-clamp-2 italic">"{session.goal}"</p>
                    </div>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="sm:col-span-2 flex items-center gap-8 p-10 bg-white/5 rounded-[3rem] border border-white/10">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <p className="font-black text-slate-200 text-2xl">Your schedule is clear.</p>
                <p className="text-slate-400 font-medium text-lg mt-1">Enjoy the space for deep work or rest.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyBriefing;