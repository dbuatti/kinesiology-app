"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, Target, Zap, AlertTriangle, Home, Check, ChevronDown, LogOut, User, Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInSeconds, isToday, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface SessionTimerProps {
  appointmentDate: Date;
  status: string;
  clientName?: string;
  currentPhaseName?: string;
  onFixedHeaderChange: (isFixed: boolean) => void;
  onCompleteSession?: () => void;
}

const SESSION_STAGES = [
  { id: 'baseline', name: "PRELIMINARY", duration: 15, color: "bg-indigo-600", Icon: Target },
  { id: 'sympathetic', name: "EASE", duration: 15, color: "bg-rose-600", Icon: Zap },
  { id: 'pathway', name: "ALIGN", duration: 15, color: "bg-amber-600", Icon: CheckCircle2 },
  { id: 'calibration', name: "CORRECT", duration: 10, color: "bg-emerald-600", Icon: AlertTriangle },
  { id: 'reassessment', name: "EMBED", duration: 5, icon: Home, color: "bg-blue-600", Icon: Home },
];
const TOTAL_DURATION_MINUTES = SESSION_STAGES.reduce((sum, stage) => sum + stage.duration, 0);

const SessionTimer = ({ appointmentDate, status, clientName, currentPhaseName, onFixedHeaderChange, onCompleteSession }: SessionTimerProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    elapsedSeconds,
    elapsedMinutes,
    recommendedStage,
    stageProgressPercent,
    overallProgressPercent,
    isComplete,
    timeRemainingInSession,
    isOvertime,
    overtimeSeconds
  } = useMemo(() => {
    const elapsedSeconds = differenceInSeconds(currentTime, appointmentDate);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const totalDurationSeconds = TOTAL_DURATION_MINUTES * 60;
    
    let recommendedStage = SESSION_STAGES[0];
    let cumulativeDuration = 0;
    let stageStartTime = 0;

    for (const stage of SESSION_STAGES) {
      stageStartTime = cumulativeDuration;
      cumulativeDuration += stage.duration;

      if (elapsedMinutes < cumulativeDuration) {
        recommendedStage = stage;
        break;
      }
    }

    const isComplete = elapsedMinutes >= TOTAL_DURATION_MINUTES;
    const timeInCurrentStage = elapsedMinutes - stageStartTime;
    const stageProgressPercent = Math.min(100, (timeInCurrentStage / recommendedStage.duration) * 100);
    const overallProgressPercent = Math.min(100, (elapsedMinutes / TOTAL_DURATION_MINUTES) * 100);
    
    const isOvertime = elapsedSeconds >= totalDurationSeconds;
    const overtimeSeconds = isOvertime ? elapsedSeconds - totalDurationSeconds : 0;
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
    
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecs = remainingSeconds % 60;
    
    const timeRemainingInSession = `${remainingMinutes}:${remainingSecs.toString().padStart(2, '0')}`;

    return {
      elapsedSeconds,
      elapsedMinutes,
      recommendedStage,
      stageProgressPercent,
      overallProgressPercent,
      isComplete,
      timeRemainingInSession,
      isOvertime,
      overtimeSeconds
    };
  }, [appointmentDate, currentTime]);

  const isRelevant = isToday(appointmentDate) && status !== 'Cancelled';
  const isOngoing = isRelevant && elapsedSeconds >= 0 && status !== 'Completed';
  const isUpcoming = isRelevant && elapsedSeconds < 0;
  const isFinished = status === 'Completed';

  useEffect(() => {
    onFixedHeaderChange(isOngoing || isFinished);
  }, [isOngoing, isFinished, onFixedHeaderChange]);

  if (!isRelevant) return null;

  const handleComplete = () => {
    if (onCompleteSession) {
      if (confirm("Are you sure you want to complete this session? Please ensure billing status is correct.")) {
        onCompleteSession();
      }
    }
  };

  const formatOvertime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activePhase = SESSION_STAGES.find(s => s.id === currentPhaseName) || recommendedStage;

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] shadow-2xl">
      <div className={cn(
        "transition-colors duration-1000 h-14 flex items-center justify-between px-6",
        isOvertime && !isFinished ? "bg-rose-950 border-b border-rose-500/30" : "bg-slate-950 border-b border-white/10"
      )}>
        <div className="flex items-center gap-6 overflow-hidden">
          {/* STATUS INDICATOR */}
          <div className="flex flex-col justify-center shrink-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
              {isFinished ? "SESSION COMPLETE" : isOvertime ? "TIME ELAPSED" : isUpcoming ? "UPCOMING" : "SESSION LIVE"}
            </span>
            <div className={cn(
              "text-2xl font-black tabular-nums font-mono leading-none",
              isFinished ? "text-emerald-400" : isOvertime ? "text-rose-400 animate-pulse" : "text-emerald-400"
            )}>
              {isFinished ? "00:00" : isOvertime ? `+${formatOvertime(overtimeSeconds)}` : timeRemainingInSession}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* CANONICAL IDENTITY */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
              ACTIVE CLIENT
            </span>
            <span className="text-lg font-black text-white truncate privacy-mode-active:blur-sm leading-none">
              {clientName}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block" />

          {/* PHASE INDICATOR */}
          {!isFinished && (
            <div className="hidden sm:flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
                CURRENT PHASE
              </span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", activePhase.color)} />
                <span className="text-sm font-black text-white tracking-widest">{activePhase.name}</span>
              </div>
            </div>
          )}
          
          {isFinished && (
            <div className="hidden sm:flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
                STATUS
              </span>
              <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-none">
                REPORT READY
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="w-32 h-1.5 bg-white/5 rounded-none overflow-hidden hidden lg:block">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isFinished ? "bg-emerald-500" : isOvertime ? "bg-amber-500" : "bg-indigo-500"
              )}
              style={{ width: isFinished ? '100%' : `${overallProgressPercent}%` }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className={cn(
                  "border-none h-10 px-6 rounded-none font-black text-[10px] uppercase tracking-widest transition-colors",
                  isOvertime && !isFinished ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                {isOvertime && !isFinished && <AlertCircle size={12} className="mr-2" />}
                ACTIONS <ChevronDown size={12} className="ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none p-1 shadow-3xl border-2 border-slate-900 bg-slate-900 text-white">
              {!isFinished && (
                <DropdownMenuItem 
                  onClick={handleComplete}
                  className="rounded-none py-3 px-4 cursor-pointer flex items-center gap-3 text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10"
                >
                  <CheckCircle2 size={16} />
                  <span className="font-bold text-xs uppercase tracking-widest">Complete Session</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="rounded-none py-3 px-4 cursor-pointer flex items-center gap-3 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
              >
                <LogOut size={16} />
                <span className="font-bold text-xs uppercase tracking-widest">Pause / Exit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {!isFinished && (
        <div className="h-1 bg-white/5 relative">
          <div 
            className={cn("h-full transition-all duration-500", activePhase.color)}
            style={{ width: `${stageProgressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default SessionTimer;