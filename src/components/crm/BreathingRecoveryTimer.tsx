"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Wind, Timer, CheckCircle2, Trophy } from 'lucide-react';
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
        phase === 'idle' ? "bg-slate-50 border-slate-100" :
        phase === 'hold' ? "bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-200" :
        phase === 'recover' ? "bg-emerald-500 border-emerald-300 text-white shadow-2xl shadow-emerald-200" :
        "bg-slate-900 border-slate-700 text-white"
      )}>
        {/* Background Pulse for Breathing */}
        {(phase === 'hold' || phase === 'recover') && (
          <div className={cn(
            "absolute inset-0 opacity-20 animate-ping",
            phase === 'hold' ? "bg-white" : "bg-white"
          )} style={{ animationDuration: phase === 'hold' ? '5s' : '3s' }} />
        )}

        {phase === 'idle' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Wind size={40} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Ready to start?</h3>
            <p className="text-sm text-slate-500 max-w-[200px]">Follow the 5s hold and 15s recovery cycles.</p>
            <Button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-bold">
              Start Practice
            </Button>
          </div>
        )}

        {(phase === 'hold' || phase === 'recover') && (
          <div className="relative z-10 text-center space-y-6 w-full">
            <div className="flex items-center justify-center gap-3 mb-2">
              {phase === 'hold' ? <Timer size={24} /> : <Wind size={24} />}
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {phase === 'hold' ? 'Hold Breath' : 'Recover (Nasal)'}
              </span>
            </div>
            
            <div className="text-8xl font-black tabular-nums leading-none">
              {timeLeft}
            </div>

            <div className="w-full max-w-[200px] mx-auto space-y-2">
              <Progress value={progress} className="h-2 bg-white/20 [&>div]:bg-white" />
              <div className="flex justify-between text-[10px] font-bold opacity-70">
                <span>{cycles} Cycles Done</span>
                <span>{formatTime(totalElapsed)} Total</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleStop} className="flex-1 bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl font-bold">
                <Square size={18} className="mr-2 fill-current" /> Stop
              </Button>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="text-center space-y-6 py-4 relative z-10">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Trophy size={40} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Session Complete!</h3>
              <p className="text-slate-400 text-sm mt-1">Great work on your CO2 tolerance.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Duration</p>
                <p className="text-xl font-black">{formatTime(totalElapsed)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Cycles</p>
                <p className="text-xl font-black">{cycles}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={startSession} className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">
                <RotateCcw size={18} className="mr-2" /> Restart
              </Button>
              <Button variant="outline" onClick={resetSession} className="bg-white/5 border-white/10 hover:bg-white/20 rounded-xl font-bold">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {(phase === 'hold' || phase === 'recover') && (
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <Info size={18} className="text-indigo-600 mt-0.5" />
          <p className="text-xs text-indigo-900 leading-relaxed">
            <strong>Tip:</strong> Keep your body relaxed during the hold. If you feel significant air hunger, stop the timer and rest longer.
          </p>
        </div>
      )}
    </div>
  );
};

export default BreathingRecoveryTimer;