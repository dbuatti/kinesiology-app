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
  { id: 'baseline', name: "Preliminary", duration: 15, color: "bg-indigo-600", Icon: Target },
  { id: 'sympathetic', name: "Ease", duration: 15, color: "bg-rose-600", Icon: Zap },
  { id: 'pathway', name: "Align", duration: 15, color: "bg-amber-600", Icon: CheckCircle2 },
  { id: 'calibration', name: "Correct", duration: 10, color: "bg-emerald-600", Icon: AlertTriangle },
  { id: 'reassessment', name: "Embed", duration: 5, icon: Home, color: "bg-blue-600", Icon: Home },
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
    
    const timeRemainingInSession = `${remainingMinutes}m ${remainingSecs.toString().padStart(2, '0')}s`;

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

  const isRelevant = isToday(appointmentDate) && status !== 'Completed' && status !== 'Cancelled';
  const isOngoing = isRelevant && elapsedSeconds >= 0;
  const isUpcoming = isRelevant && elapsedSeconds < 0;

  useEffect(() => {
    onFixedHeaderChange(isOngoing);
  }, [isOngoing, onFixedHeaderChange]);

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
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const activePhase = SESSION_STAGES.find(s => s.id === currentPhaseName) || recommendedStage;

  if (isUpcoming) {
    return (
      <div className="w-full bg-indigo-600 text-white h-8 flex items-center justify-center px-4 z-[110] relative">
        <div className="flex items-center gap-2 animate-in slide-in-from-top-full duration-500">
          <Clock size={12} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            Session starts in {formatDistanceToNow(appointmentDate)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] shadow-2xl">
      <div className={cn(
        "transition-colors duration-1000 p-2 flex items-center justify-between px-6",
        isOvertime ? "bg-rose-950 border-b border-rose-500/30" : "bg-slate-950 border-b border-white/10"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isOvertime ? "bg-rose-500" : "bg-emerald-500"
            )} />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
              {isOvertime ? "Time Elapsed" : "Session Live"}
            </span>
            <span className={cn(
              "text-xs font-black tabular-nums font-mono",
              isOvertime ? "text-rose-400 animate-pulse" : "text-emerald-400"
            )}>
              {isOvertime ? `+${formatOvertime(overtimeSeconds)}` : timeRemainingInSession}
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-white truncate max-w-[150px]">{clientName}</span>
            </div>
            <div className="flex items-center gap-2 opacity-60">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                {format(appointmentDate, "EEE d MMM")} · {format(appointmentDate, "h:mm a")}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          <div className="hidden sm:flex items-center gap-3">
            <Badge className={cn("border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1.5", activePhase.color, "text-white")}>
              <activePhase.Icon size={10} />
              {activePhase.name}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden hidden lg:block">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isOvertime ? "bg-amber-500" : "bg-indigo-500"
              )}
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className={cn(
                  "border-none h-8 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors",
                  isOvertime ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                {isOvertime && <AlertCircle size={12} className="mr-2" />}
                Session Actions <ChevronDown size={12} className="ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-3xl border-none bg-slate-900 text-white">
              <DropdownMenuItem 
                onClick={handleComplete}
                className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10"
              >
                <CheckCircle2 size={16} />
                <span className="font-bold text-xs uppercase tracking-widest">Complete Session</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
              >
                <LogOut size={16} />
                <span className="font-bold text-xs uppercase tracking-widest">Pause / Exit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="h-0.5 bg-white/5 relative">
        <div 
          className={cn("h-full transition-all duration-500", activePhase.color)}
          style={{ width: `${stageProgressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default SessionTimer;