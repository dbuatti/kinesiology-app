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
    <div className="p-8 bg-rose-50 dark:bg-rose-950/10 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-900/30 flex flex-col items-center text-center space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400">
          <Heart size={20} className={cn(isActive && "animate-pulse")} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">HeartMath 4/6 Rhythm</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Coherence Breathing</h3>
      </div>

      <div className="relative flex items-center justify-center">
        <div className={cn(
          "w-40 h-40 rounded-full border-4 border-rose-200 dark:border-rose-800 flex items-center justify-center transition-all duration-1000 ease-in-out",
          isActive && phase === 'inhale' ? "scale-125 bg-rose-100/50 dark:bg-rose-900/20" : "scale-100 bg-transparent"
        )}>
          <div className="text-center">
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              {isActive ? phase : "Ready"}
            </p>
            {isActive && <p className="text-xl font-bold text-rose-400 tabular-nums">{timeLeft}s</p>}
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <Progress value={isActive ? progress : 0} className="h-1.5 bg-rose-100 dark:bg-rose-900/30 [&>div]:bg-rose-500" />
        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-rose-400">
          <span>4s Inhale</span>
          <span>6s Exhale</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={toggleTimer} 
          className={cn(
            "rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest shadow-lg transition-all",
            isActive ? "bg-slate-900 text-white" : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
          )}
        >
          {isActive ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
          {isActive ? "Pause" : "Start Practice"}
        </Button>
        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-2xl h-12 w-12 text-rose-400 hover:bg-rose-50">
          <RotateCcw size={20} />
        </Button>
      </div>
    </div>
  );
};

export default HeartMathBreathing;