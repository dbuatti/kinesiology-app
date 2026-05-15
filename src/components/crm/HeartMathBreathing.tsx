"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Heart, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const HeartMathBreathing = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (phase === 'inhale') {
              setPhase('exhale');
              return 6;
            } else {
              setPhase('inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, phase]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(4);
  };

  const progress = phase === 'inhale' 
    ? ((4 - timeLeft) / 4) * 100 
    : ((6 - timeLeft) / 6) * 100;

  return (
    <div className="p-10 bg-rose-50 dark:bg-rose-950/10 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-900/30 flex flex-col items-center text-center space-y-10 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3 text-rose-600 dark:text-rose-400">
          <Heart size={24} className={cn(isActive && "animate-pulse")} />
          <span className="text-[10px] font-black uppercase tracking-widest">HeartMath 4/6 Rhythm</span>
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Coherence Breathing</h3>
      </div>

      <div className="relative flex items-center justify-center">
        <div className={cn(
          "w-48 h-40 rounded-full border-4 border-rose-200 dark:border-rose-800 flex items-center justify-center transition-all duration-1000 ease-in-out shadow-inner",
          isActive && phase === 'inhale' ? "scale-125 bg-rose-100/50 dark:bg-rose-900/20" : "scale-100 bg-transparent"
        )}>
          <div className="text-center">
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em]">
              {isActive ? phase : "Ready"}
            </p>
            {isActive && <p className="text-2xl font-black text-rose-400 tabular-nums mt-1">{timeLeft}s</p>}
          </div>
        </div>
      </div>

      <div className="w-full max-sm space-y-3">
        <Progress value={isActive ? progress : 0} className="h-2 bg-rose-100 dark:bg-rose-900/30 [&>div]:bg-rose-500" />
        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
          <span>4s Inhale</span>
          <span>6s Exhale</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={toggleTimer} 
          className={cn(
            "rounded-2xl px-10 h-14 font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95",
            isActive ? "bg-slate-900 text-white" : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
          )}
        >
          {isActive ? <Pause size={20} className="mr-3" /> : <Play size={20} className="mr-3" />}
          {isActive ? "Pause" : "Start Practice"}
        </Button>
        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-2xl h-14 w-14 text-rose-400 hover:bg-rose-50 transition-all">
          <RotateCcw size={24} />
        </Button>
      </div>
    </div>
  );
};

export default HeartMathBreathing;