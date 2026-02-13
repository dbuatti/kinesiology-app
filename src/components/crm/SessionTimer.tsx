"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, Target, Zap, AlertTriangle, Home, Check } from 'lucide-react';
import { format, differenceInSeconds, isToday, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface SessionTimerProps {
  appointmentDate: Date;
  status: string;
  onFixedHeaderChange: (isFixed: boolean) => void;
  onCompleteSession?: () => void;
}

const SESSION_STAGES = [
  { name: "Goal Setting", duration: 22, color: "bg-indigo-600", Icon: Target },
  { name: "Activation", duration: 23, color: "bg-blue-600", Icon: Zap },
  { name: "Correction", duration: 35, color: "bg-emerald-600", Icon: CheckCircle2 },
  { name: "Challenge", duration: 5, color: "bg-amber-600", Icon: AlertTriangle },
  { name: "Home Reinforcement", duration: 5, color: "bg-rose-600", Icon: Home },
];
const TOTAL_DURATION_MINUTES = SESSION_STAGES.reduce((sum, stage) => sum + stage.duration, 0); // 90 minutes

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
    
    // Calculate progress within current stage
    const timeInCurrentStage = elapsedMinutes - stageStartTime;
    const stageProgressPercent = Math.min(100, (timeInCurrentStage / currentStage.duration) * 100);

    // Calculate overall progress
    const overallProgressPercent = Math.min(100, (elapsedMinutes / TOTAL_DURATION_MINUTES) * 100);
    
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
    
    // Format remaining time (H:mm:ss)
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

  // Only show the timer if the appointment is today and not completed/cancelled
  const isRelevant = isToday(appointmentDate) && status !== 'Completed' && status !== 'Cancelled';
  
  // Determine if the session is ongoing (needs the fixed header)
  const isOngoing = isRelevant && elapsedSeconds >= 0 && !isComplete;
  
  // Determine if the session is upcoming (needs the floating badge)
  const isUpcoming = isRelevant && elapsedSeconds < 0;

  useEffect(() => {
    onFixedHeaderChange(isOngoing);
  }, [isOngoing, onFixedHeaderChange]);

  if (!isRelevant) return null;

  const timeInSessionFormatted = format(new Date(0, 0, 0, 0, 0, elapsedSeconds), 'H:mm:ss');
  const [hours, minutes, seconds] = timeInSessionFormatted.split(':');
  const displayTime = `${parseInt(hours) > 0 ? `${parseInt(hours)}h ` : ''}${parseInt(minutes)}m ${seconds}s`;

  let statusText = '';
  let statusColor = 'bg-slate-900';
  let statusIcon = <Clock size={16} className="text-white" />;
  let StageIcon = currentStage.Icon;

  if (isComplete) {
    statusText = 'Session Complete';
    statusColor = 'bg-emerald-600';
    statusIcon = <CheckCircle2 size={16} className="text-white" />;
  } else if (isUpcoming) {
    statusText = `Starts in ${formatDistanceToNow(appointmentDate, { addSuffix: true })}`;
    statusColor = 'bg-indigo-600';
  } else if (isOngoing) {
    statusText = `Stage: ${currentStage.name}`;
    statusColor = currentStage.color;
    statusIcon = <StageIcon size={16} className="text-white" />;
  }

  // --- Render Floating Badge for Upcoming Session ---
  if (isUpcoming) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
        <div className={cn(
          "px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl transition-all duration-300", 
          statusColor
        )}>
          <Clock size={18} className="text-white" />
          <span className="text-white">{statusText}</span>
        </div>
      </div>
    );
  }
  // --- End Floating Badge ---

  // --- Render Fixed Header Bar for Ongoing/Complete Session ---
  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-xl">
      <div className="bg-white border-b border-slate-100 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2", statusColor)}>
            {statusIcon}
            <span className="text-white">{statusText}</span>
          </div>
          
          {!isComplete && elapsedSeconds >= 0 && (
            <div className="text-sm text-slate-600 font-medium hidden sm:flex items-center gap-1">
              <Clock size={14} className="text-slate-400" />
              Elapsed: <span className="font-bold text-slate-800">{displayTime}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isComplete && elapsedSeconds >= 0 && (
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Remaining</p>
              <p className="text-lg font-black text-slate-900">{timeRemainingInSession}</p>
            </div>
          )}
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", statusColor)}
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
          {isOngoing && onCompleteSession && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-9 px-4 shadow-lg shadow-emerald-100"
              onClick={onCompleteSession}
            >
              <Check size={14} className="mr-2" /> Complete Session
            </Button>
          )}
        </div>
      </div>
      
      {/* Stage Progress Bar (only visible if session is ongoing) */}
      {!isComplete && elapsedSeconds >= 0 && (
        <div className="h-1 bg-slate-200 relative">
          <div 
            className={cn("h-full transition-all duration-500", currentStage.color)}
            style={{ width: `${stageProgressPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white mix-blend-difference">
              {currentStage.name} {Math.round(stageProgressPercent)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionTimer;