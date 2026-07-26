
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Wind, Timer, CheckCircle2, Trophy, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface BreathingRecoveryTimerProps {
  onSessionComplete?: (totalSeconds: number, cycles: number) => void;
}

type Phase = 'idle' | 'hold' | 'recover' | 'complete';

const HOLD_DURATION = 5;
const RECOVER_DURATION = 15;

const BreathingRecoveryTimer = ({ onSessionComplete }: BreathingRecoveryTimerProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  }, []);

  const startSession = () => {
    setPhase('hold');
    setTimeLeft(HOLD_DURATION);
    setTotalElapsed(0);
    setCycles(0);
    
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed(prev => prev + 1);
    }, 1000);
  };

  const resetSession = () => {
    stopTimers();
    setPhase('idle');
    setTimeLeft(0);
    setTotalElapsed(0);
    setCycles(0);
  };

  useEffect(() => {
    if (phase === 'hold' || phase === 'recover') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (phase === 'hold') {
              setPhase('recover');
              return RECOVER_DURATION;
            } else {
              setCycles(c => c + 1);
              setPhase('hold');
              return HOLD_DURATION;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStop = () => {
    stopTimers();
    if (onSessionComplete && totalElapsed > 0) {
      onSessionComplete(totalElapsed, cycles);
    }
    setPhase('complete');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = phase === 'hold' 
    ? ((HOLD_DURATION - timeLeft) / HOLD_DURATION) * 100 
    : ((RECOVER_DURATION - timeLeft) / RECOVER_DURATION) * 100;

  return (
    <div className="space-y-6">
      <div className={cn(
        "relative p-8 rounded-3xl border-4 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden",
        phase === 'idle' ? "bg-muted border-border" :
        phase === 'hold' ? "bg-primary border-primary text-primary-foreground shadow-2xl shadow-primary/20" :
        phase === 'recover' ? "bg-emerald-500 border-emerald-300 text-primary-foreground shadow-2xl shadow-emerald-200" :
        "bg-foreground border-border text-background"
      )}>
        {/* Background Pulse for Breathing */}
        {(phase === 'hold' || phase === 'recover') && (
          <div className={cn(
            "absolute inset-0 opacity-20 animate-ping",
            phase === 'hold' ? "bg-card" : "bg-card"
          )} style={{ animationDuration: phase === 'hold' ? '5s' : '3s' }} />
        )}

        {phase === 'idle' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <Wind size={40} className="text-chart-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Ready to start?</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">Follow the 5s hold and 15s recovery cycles.</p>
            <Button onClick={startSession} className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl font-medium">
              Start Practice
            </Button>
          </div>
        )}

        {(phase === 'hold' || phase === 'recover') && (
          <div className="relative z-10 text-center space-y-6 w-full">
            <div className="flex items-center justify-center gap-3 mb-2">
              {phase === 'hold' ? <Timer size={24} /> : <Wind size={24} />}
              <span className="text-xs font-semibold uppercase tracking-wider">
                {phase === 'hold' ? 'Hold Breath' : 'Recover (Nasal)'}
              </span>
            </div>
            
            <div className="text-8xl font-semibold tabular-nums leading-none">
              {timeLeft}
            </div>

            <div className="w-full max-w-[200px] mx-auto space-y-2">
              <Progress value={progress} className="h-2 bg-card/20 [&>div]:bg-card" />
              <div className="flex justify-between text-[10px] font-medium opacity-70">
                <span>{cycles} Cycles Done</span>
                <span>{formatTime(totalElapsed)} Total</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleStop} className="flex-1 bg-muted border-border hover:bg-muted/80 text-primary-foreground rounded-xl font-medium">
                <Square size={18} className="mr-2 fill-current" /> Stop
              </Button>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="text-center space-y-6 py-4 relative z-10">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Trophy size={40} className="text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Session Complete!</h3>
              <p className="text-muted-foreground text-sm mt-1">Great work on your CO2 tolerance.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Duration</p>
                <p className="text-xl font-semibold">{formatTime(totalElapsed)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Cycles</p>
                <p className="text-xl font-semibold">{cycles}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={startSession} className="flex-1 bg-primary hover:bg-primary/90 rounded-xl font-medium">
                <RotateCcw size={18} className="mr-2" /> Restart
              </Button>
              <Button variant="outline" onClick={resetSession} className="bg-muted/50 border-border hover:bg-muted/80 rounded-xl font-medium">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {(phase === 'hold' || phase === 'recover') && (
        <div className="bg-muted p-4 rounded-xl border border-border flex items-start gap-3">
          <Info size={18} className="text-chart-primary mt-0.5" />
          <p className="text-xs text-indigo-900 leading-relaxed">
            <strong>Tip:</strong> Keep your body relaxed during the hold. If you feel significant air hunger, stop the timer and rest longer.
          </p>
        </div>
      )}
    </div>
  );
};

export default BreathingRecoveryTimer;