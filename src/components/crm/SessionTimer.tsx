
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
  { id: 'baseline', name: "PRELIMINARY", duration: 15, color: "bg-chart-primary", Icon: Target },
  { id: 'sympathetic', name: "EASE", duration: 15, color: "bg-chart-destructive", Icon: Zap },
  { id: 'pathway', name: "ALIGN", duration: 15, color: "bg-chart-primary", Icon: CheckCircle2 },
  { id: 'calibration', name: "CORRECT", duration: 10, color: "bg-chart-emerald", Icon: AlertTriangle },
  { id: 'reassessment', name: "EMBED", duration: 5, color: "bg-chart-primary", Icon: Home },
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
    const handleFullScreenChange = () => {
      setIsFullScreen(localStorage.getItem('antigravity_fullscreen') === 'true');
    };
    window.addEventListener('antigravity_fullscreen_change', handleFullScreenChange);
    return () => window.removeEventListener('antigravity_fullscreen_change', handleFullScreenChange);
  }, []);

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
      navigate(location.pathname, { replace: true });
    } else {
      navigate(`${location.pathname}?view=document`, { replace: true });
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
      showSuccess("Session finalised.");
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
        "transition-colors duration-1000 p-2 flex items-center justify-between px-4 md:px-6",
        isOvertime && !isFinished ? "bg-chart-destructive/10 border-b border-chart-destructive/20" : "bg-foreground text-background border-b border-border"
      )}>
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0">
            {isFinished ? (
              <div className="flex items-center gap-1 text-chart-emerald">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Session Complete</span>
              </div>
            ) : isOvertime ? (
              <div className="flex items-center gap-1 text-chart-destructive">
                <AlertCircle size={12} />
                <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Time Elapsed</span>
              </div>
            ) : isUpcoming ? (
              <div className="flex items-center gap-1 text-chart-primary">
                <Clock size={12} />
                <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Upcoming</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-chart-emerald">
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Live</span>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-muted shrink-0" />

          {!isFinished && (
            <div className={cn(
              "text-[10px] md:text-xs font-semibold tabular-nums font-mono shrink-0",
              isOvertime ? "text-chart-destructive" : "text-chart-emerald"
            )}>
              {isOvertime ? `+${formatOvertime(overtimeSeconds)}` : timeRemainingInSession}
            </div>
          )}

          <div className="h-4 w-px bg-muted shrink-0" />

          <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
            <span className="text-xs md:text-sm font-semibold text-white truncate privacy-mode-active:blur-sm">
              {clientName}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden md:inline">
              {format(appointmentDate, "h:mm a")}
            </span>
          </div>

          <div className="h-4 w-px bg-muted shrink-0 hidden sm:block" />

          {!isFinished && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Badge className={cn("border-none font-semibold text-[7px] md:text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md", activePhase.color, "text-white")}>
                {activePhase.name}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Quick View Switcher (Doc vs Standard) */}
          {isInSessionPage && (
            <Button
              size="sm"
              onClick={toggleDocumentView}
              className="h-7 md:h-8 px-2 md:px-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider gap-1 md:gap-1.5"
              title="Toggle Document View (Option + D)"
            >
              {isDocViewActive ? <LayoutGrid size={12} /> : <FileText size={12} />}
              <span className="hidden sm:inline">{isDocViewActive ? "Standard" : "Doc View"}</span>
            </Button>
          )}

          <div className="w-16 md:w-32 h-1 bg-muted/50 rounded-full overflow-hidden hidden lg:block">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isFinished ? "bg-chart-emerald" : isOvertime ? "bg-muted" : "bg-chart-primary"
              )}
              style={{ width: isFinished ? '100%' : `${overallProgressPercent}%` }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className={cn(
                  "border-none h-7 md:h-8 px-2.5 md:px-4 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-colors",
                  isOvertime && !isFinished ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                <span className="hidden sm:inline">Actions</span> <ChevronDown size={10} className="sm:ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 md:w-56 rounded-xl p-2 shadow-3xl border-none bg-foreground text-background">
              {!isFinished && (
                <DropdownMenuItem 
                  onClick={handleComplete}
                  className="rounded-xl py-2.5 md:py-3 px-4 cursor-pointer flex items-center gap-3 text-chart-emerald focus:text-chart-emerald focus:bg-chart-emerald/10"
                >
                  <CheckCircle2 size={14} />
                  <span className="font-medium text-xs">Complete Session</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="rounded-xl py-2.5 md:py-3 px-4 cursor-pointer flex items-center gap-3 text-chart-destructive focus:text-chart-destructive focus:bg-chart-destructive/10"
              >
                <LogOut size={14} />
                <span className="font-medium text-xs">Pause / Exit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {!isFinished && (
        <div className="h-0.5 bg-muted/50 relative">
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