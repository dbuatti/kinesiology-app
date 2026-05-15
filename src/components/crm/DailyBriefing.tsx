"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Target, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentWithClient } from "@/types/crm";

interface DailyBriefingProps {
  todaySessions: AppointmentWithClient[];
  activeSession: AppointmentWithClient | null;
}

const DailyBriefing = ({ todaySessions, activeSession }: DailyBriefingProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 text-primary flex items-center justify-center">
            <Zap size={16} />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900">Daily Briefing</h2>
        </div>
        {activeSession && (
          <Link to={`/appointments/${activeSession.id}`}>
            <div className="bg-emerald-500 text-white px-3 py-1 flex items-center gap-2 shadow-lg shadow-emerald-100">
              <Activity size={12} />
              <span className="font-black text-[9px] uppercase tracking-widest">LIVE: {activeSession.clients?.name}</span>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`} className="group">
              <div className={cn(
                "p-6 border-r border-b border-border last:border-b-0 md:last:border-b-0 transition-colors flex flex-col gap-4 h-full",
                activeSession?.id === session.id 
                  ? "bg-emerald-50/30" 
                  : "bg-white hover:bg-slate-50"
              )}>
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className="text-slate-400" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {activeSession?.id === session.id ? "ACTIVE NOW" : format(session.date, "h:mm a")}
                      </p>
                    </div>
                    <p className="font-black text-lg uppercase tracking-tight truncate text-slate-900 privacy-mode-active:blur-sm">{session.clients?.name}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-primary transition-all" />
                </div>
                
                {session.goal && (
                  <div className="p-3 bg-slate-50 text-[11px] font-medium flex items-start gap-2 border-l-2 border-indigo-500">
                    <Target size={12} className="shrink-0 mt-0.5 text-indigo-500" />
                    <p className="text-slate-600 line-clamp-1 italic">"{session.goal}"</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 p-12 text-center bg-slate-50/50">
            <p className="font-serif font-bold text-xl text-slate-400">No sessions today.</p>
            <Link to="/practice/self">
              <Button variant="outline" className="h-10 px-6 font-black text-[9px] uppercase tracking-widest border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
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