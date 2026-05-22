"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  CheckCircle2, 
  Target, 
  Zap, 
  AlertTriangle, 
  Home, 
  ChevronDown, 
  LogOut, 
  AlertCircle,
  Maximize2,
  Minimize2,
  FileText,
  LayoutGrid
} from 'lucide-react';
import { format, differenceInSeconds, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useLocation, useNavigate } from 'react-router-dom';

interface SessionTimerProps {
  sessionId: string;
  appointmentDate: Date;
  status: string;
  clientName?: string;
  currentPhaseName?: string;
}

const SESSION_STAGES = [
  { id: 'baseline', name: "PRELIMINARY", duration: 15, color: "bg-indigo-600", Icon: Target },
  { id: 'sympathetic', name: "EASE", duration: 15, color: "bg-rose-600", Icon: Zap },
  { id: 'pathway', name: "ALIGN", duration: 15, color: "bg-amber-600", Icon: CheckCircle2 },
  { id: 'calibration', name: "CORRECT", duration: 10, color: "bg-emerald-600", Icon: AlertTriangle },
  { id: 'reassessment', name: "EMBED", duration: 5, color: "bg-blue-600", Icon: Home },
];
const TOTAL_DURATION_MINUTES = SESSION_STAGES.reduce((sum, stage) => sum + stage.duration, 0);

const SessionTimer = ({ sessionId, appointmentDate, status, clientName, currentPhaseName }: SessionTimerProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  const [isFullScreen, setIsFullScreen] = useState(() => {
    return localStorage.getItem('antigravity_fullscreen') === 'true';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts & Event Listeners (macOS & Windows Robust)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt/Option + F: Toggle Full Screen
      if (e.altKey && e.code === 'KeyF') {
        e.preventDefault();
        toggleFullScreen();
      }
      // Alt/Option + D: Toggle Document View
      if (e.altKey && e.code === 'KeyD') {
        e.preventDefault();
        toggleDocumentView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.addEventListener('keydown', handleKeyDown);
  }, [location.pathname, location.search, isFullScreen]);

  const toggleFullScreen = () => {
    const nextState = !isFullScreen;
    setIsFullScreen(nextState);
    localStorage.setItem('antigravity_fullscreen', String(nextState));
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
    showSuccess(nextState ? "Full Screen Mode Enabled" : "Full Screen Mode Disabled");
  };

  const isDocViewActive = location.search.includes('view=document');

  const toggleDocumentView = () => {
    if (!location.pathname.startsWith('/appointments/')) return;
    
    if (isDocViewActive) {
      navigate(location.pathname);
    } else {
      navigate(`${location.pathname}?view=document`);
    }
  };

  const {
    elapsedSeconds,
    elapsedMinutes,
    recommendedStage,
    stageProgressPercent,
    overallProgressPercent,
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
      timeRemainingInSession,
      isOvertime,
      overtimeSeconds
    };
  }, [appointmentDate, currentTime]);

  const isOngoing = elapsedSeconds >= 0 && status !== 'Completed';
  const isUpcoming = elapsedSeconds < 0;
  const isFinished = status === 'Completed';

  const handleComplete = async () => {
    if (!confirm("Complete this session?")) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Completed' })
        .eq('id', sessionId);
      if (error) throw error;
      showSuccess("Session finalized.");
    } catch (err) {
      showError("Failed to complete session.");
    }
  };

  const formatOvertime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}`;
  };

  const activePhase = SESSION_STAGES.find(s => s.id === currentPhaseName) || recommendedStage;
  const isInSessionPage = location.pathname.startsWith('/appointments/');

  return (
    <div className="w-full">
      <div className={cn(
        "transition-colors duration-1000 p-2 flex items-center justify-between px-6",
        isOvertime && !isFinished ? "bg-rose-950 border-b border-rose-500/30" : "bg-slate-950 border-b border-white/10"
      )}>
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            {isFinished ? (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Session Complete</span>
              </div>
            ) : isOvertime ? (
              <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Time Elapsed</span>
              </div>
            ) : isUpcoming ? (
              <div className="flex items-center gap-2 text-indigo-400">
                <Clock size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Starts in {formatDistanceToNow(appointmentDate)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Session Live</span>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/10" />

          {!isFinished && (
            <div className={cn(
              "text-xs font-black tabular-nums font-mono shrink-0",
              isOvertime ? "text-rose-400 animate-pulse" : "text-emerald-400"
            )}>
              {isOvertime ? `+${formatOvertime(overtimeSeconds)}` : timeRemainingInSession}
            </div>
          )}

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-black text-white truncate privacy-mode-active:blur-sm">
              {clientName}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">
              {format(appointmentDate, "h:mm a")}
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {!isFinished && (
            <div className="hidden sm:flex items-center gap-2">
              <Badge className={cn("border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md", activePhase.color, "text-white")}>
                {activePhase.name}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick View Switcher (Doc vs Standard) */}
          {isInSessionPage && (
            <Button
              size="sm"
              onClick={toggleDocumentView}
              className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest gap-1.5"
              title="Toggle Document View (Option + D)"
            >
              {isDocViewActive ? <LayoutGrid size={14} /> : <FileText size={14} />}
              <span className="hidden md:inline">{isDocViewActive ? "Standard View" : "Doc View"}</span>
            </Button>
          )}

          {/* Full Screen Toggle */}
          {isInSessionPage && (
            <Button
              size="sm"
              onClick={toggleFullScreen}
              className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest gap-1.5"
              title="Toggle Full Screen (Option + F)"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="hidden md:inline">{isFullScreen ? "Exit Full" : "Full Screen"}</span>
            </Button>
          )}

          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden hidden lg:block">
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
                  "border-none h-8 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors",
                  isOvertime && !isFinished ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                Actions <ChevronDown size={12} className="ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-3xl border-none bg-slate-900 text-white">
              {!isFinished && (
                <DropdownMenuItem 
                  onClick={handleComplete}
                  className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10"
                >
                  <CheckCircle2 size={16} />
                  <span className="font-bold text-xs uppercase tracking-widest">Complete Session</span>
                </DropdownMenuItem>
              )}
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
      
      {!isFinished && (
        <div className="h-0.5 bg-white/5 relative">
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