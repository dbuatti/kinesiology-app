"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, Target, Zap, AlertTriangle, Home, Check, ChevronDown, LogOut } from 'lucide-react';
import { format, differenceInSeconds, isToday, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SessionTimerProps {
  appointmentDate: Date;
  status: string;
  onFixedHeaderChange: (isFixed: boolean) => void;
  onCompleteSession?: () => void;
}

const SESSION_STAGES = [
  { name: "Goal Setting", duration: 15, color: "bg-indigo-600", Icon: Target },
  { name: "Activation", duration: 15, color: "bg-blue-600", Icon: Zap },
  { name: "Correction", duration: 20, color: "bg-emerald-600", Icon: CheckCircle2 },
  { name: "Challenge", duration: 5, color: "bg-amber-600", Icon: AlertTriangle },
  { name: "Home Reinforcement", duration: 5, icon: Home, color: "bg-rose-600", Icon: Home },
];
const TOTAL_DURATION_MINUTES = SESSION_STAGES.reduce((sum, stage) => sum + stage.duration, 0);

const SessionTimer = ({ appointmentDate, status, onFixedHeaderChange, onCompleteSession }: SessionTimerProps) => {
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
    currentStage,
    stageProgressPercent,
    overallProgressPercent,
    isComplete,
    timeRemainingInSession,
  } = useMemo(() => {
    const elapsedSeconds = differenceInSeconds(currentTime, appointmentDate);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const totalDurationSeconds = TOTAL_DURATION_MINUTES * 60;
    
    let currentStage = SESSION_STAGES[0];
    let cumulativeDuration = 0;
    let stageStartTime = 0;

    for (const stage of SESSION_STAGES) {
      stageStartTime = cumulativeDuration;
      cumulativeDuration += stage.duration;

      if (elapsedMinutes < cumulativeDuration) {
        currentStage = stage;
        break;
      }
    }

    const isComplete = elapsedMinutes >= TOTAL_DURATION_MINUTES;
    const timeInCurrentStage = elapsedMinutes - stageStartTime;
    const stageProgressPercent = Math.min(100, (timeInCurrentStage / currentStage.duration) * 100);
    const overallProgressPercent = Math.min(100, (elapsedMinutes / TOTAL_DURATION_MINUTES) * 100);
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
    
    const remainingHours = Math.floor(remainingSeconds / 3600);
    const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const remainingSecs = remainingSeconds % 60;
    
    const timeRemainingInSession = `${remainingHours > 0 ? `${remainingHours}h ` : ''}${remainingMinutes.toString().padStart(2, '0')}m ${remainingSecs.toString().padStart(2, '0')}s`;

    return {
      elapsedSeconds,
      elapsedMinutes,
      currentStage,
      stageProgressPercent,
      overallProgressPercent,
      isComplete,
      timeRemainingInSession,
    };
  }, [appointmentDate, currentTime]);

  const isRelevant = isToday(appointmentDate) && status !== 'Completed' && status !== 'Cancelled';
  const isOngoing = isRelevant && elapsedSeconds >= 0 && !isComplete;
  const isUpcoming = isRelevant && elapsedSeconds < 0;

  useEffect(() => {
    onFixedHeaderChange(isOngoing);
  }, [isOngoing, onFixedHeaderChange]);

  if (!isRelevant) return null;

  const timeInSessionFormatted = format(new Date(0, 0, 0, 0, 0, elapsedSeconds), 'H:mm:ss');
  const [hours, minutes, seconds] = timeInSessionFormatted.split(':');
  const displayTime = `${parseInt(hours) > 0 ? `${parseInt(hours)}h ` : ''}${parseInt(minutes)}m ${seconds}s`;

  const handleComplete = () => {
    if (onCompleteSession) {
      // Simple confirmation for now, could be a more complex dialog
      if (confirm("Are you sure you want to complete this session? Please ensure billing status is correct.")) {
        onCompleteSession();
      }
    }
  };

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
      <div className="bg-slate-950 border-b border-white/10 p-2 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Session Live</span>
            <span className="text-xs font-black text-emerald-400 tabular-nums font-mono">{displayTime}</span>
          </div>
          
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          
          <div className="hidden sm:flex items-center gap-3">
            <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2", currentStage.color)}>
              <currentStage.Icon size={12} className="text-white" />
              <span className="text-white">{currentStage.name}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {timeRemainingInSession} remaining
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden hidden md:block">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white border-none h-8 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest"
              >
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
          className={cn("h-full transition-all duration-500", currentStage.color)}
          style={{ width: `${stageProgressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default SessionTimer;