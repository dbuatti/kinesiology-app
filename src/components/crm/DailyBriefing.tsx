"use client";

import React from "react";
import { Link } from "react-router-dom";
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Zap size={18} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Clinical Landscape</p>
          </div>
          <h2 className="text-2xl font-medium uppercase tracking-tight">Daily Briefing</h2>
          <p className="text-muted-foreground text-sm">
            {todaySessions.length > 0 
              ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled for today.`
              : "Your schedule is clear for today."}
          </p>
        </div>
        {activeSession && (
          <Link to={`/appointments/${activeSession.id}`}>
            <div className="bg-success text-success-foreground px-4 py-2 flex items-center gap-3">
              <Activity size={14} />
              <span className="font-bold text-[10px] uppercase tracking-widest">LIVE: {activeSession.clients?.name}</span>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <Link key={session.id} to={`/appointments/${session.id}`} className="group">
              <div className={cn(
                "p-8 border-r border-b border-border last:border-b-0 md:last:border-b-0 transition-colors flex flex-col gap-6 h-full",
                activeSession?.id === session.id 
                  ? "bg-success/10" 
                  : "bg-background hover:bg-muted"
              )}>
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {activeSession?.id === session.id ? "ACTIVE NOW" : format(session.date, "h:mm a")}
                      </p>
                    </div>
                    <p className="font-medium text-xl uppercase tracking-tight truncate">{session.clients?.name}</p>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                {session.goal && (
                  <div className="p-4 bg-muted text-xs font-medium flex items-start gap-3">
                    <Target size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                    <p className="text-muted-foreground uppercase tracking-tight">Goal: {session.goal}</p>
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 flex flex-col items-center justify-center gap-6 p-16 text-center">
            <div className="w-12 h-12 border border-border flex items-center justify-center text-muted-foreground">
              <Coffee size={24} />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-xl uppercase tracking-tight">No sessions today.</p>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Use this time for clinical research or personal practice.
              </p>
            </div>
            <Link to="/practice/self">
              <Button variant="outline" className="h-12 px-8 font-bold text-[10px] uppercase tracking-widest border-border hover:bg-muted">
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