"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Wind, 
  Timer, 
  RotateCcw, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const PractitionerGrounding = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'complete'>('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGrounding = () => {
    setIsActive(true);
    setPhase('inhale');
    setTimeLeft(4);
    setTotalElapsed(0);
  };

  const resetGrounding = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(4);
    setTotalElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isActive && totalElapsed < 60) {
      timerRef.current = setInterval(() => {
        setTotalElapsed(prev => prev + 1);
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              return 4;
            } else if (phase === 'hold') {
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
    } else if (totalElapsed >= 60) {
      setPhase('complete');
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, totalElapsed]);

  const progress = phase === 'inhale' ? ((4 - timeLeft) / 4) * 100 :
                   phase === 'hold' ? ((4 - timeLeft) / 4) * 100 :
                   ((6 - timeLeft) / 6) * 100;

  return (
    <div className={cn(
      "p-10 transition-all duration-1000 h-full flex flex-col justify-center relative overflow-hidden",
      isActive ? "bg-primary text-white" : "bg-white text-slate-900"
    )}>
      {isActive && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)] animate-pulse" />
      )}

      {!isActive && phase !== 'complete' ? (
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 border-2 border-primary flex items-center justify-center shrink-0">
              <Wind size={32} className="text-primary" />
            </div>
            <div className="space-y-2">
              <p className="label-caps">Clinical Ritual</p>
              <h3 className="text-3xl font-serif font-bold tracking-tight">Practitioner Grounding</h3>
              <p className="text-slate-500 text-base font-medium">60 seconds to establish a receptive clinical state.</p>
            </div>
          </div>
          <Button 
            onClick={startGrounding}
            className="bg-primary text-white h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Start Centering
          </Button>
        </div>
      ) : phase === 'complete' ? (
        <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-200">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-serif font-bold">State Established</h3>
            <p className="text-slate-500 text-lg font-medium">You are centered, present, and ready for clinical work.</p>
          </div>
          <Button variant="ghost" onClick={resetGrounding} className="text-primary hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest">
            <RotateCcw size={14} className="mr-2" /> Reset Tool
          </Button>
        </div>
      ) : (
        <div className="space-y-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-indigo-200" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-100">Centering in Progress</span>
            </div>
            <span className="text-sm font-black tabular-nums font-mono">{60 - totalElapsed}S REMAINING</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-10">
            <div className="relative">
              <div className={cn(
                "w-48 h-48 border-4 border-white/20 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out",
                phase === 'inhale' ? "scale-110 bg-white/10" : "scale-100 bg-transparent"
              )}>
                <p className="text-3xl font-black uppercase tracking-[0.2em]">
                  {phase}
                </p>
                <p className="text-5xl font-black mt-2 tabular-nums">{timeLeft}</p>
              </div>
            </div>
            
            <div className="w-full max-w-md space-y-3">
              <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-white" />
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200">
                <span>4s Inhale</span>
                <span>4s Hold</span>
                <span>6s Exhale</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={resetGrounding} className="text-white/40 hover:text-white hover:bg-white/10 h-10 px-6 text-[10px] font-black uppercase tracking-widest">
              Cancel Ritual
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PractitionerGrounding;