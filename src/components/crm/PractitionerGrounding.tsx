"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wind, 
  ShieldCheck, 
  Sparkles, 
  Timer, 
  RotateCcw, 
  CheckCircle2,
  Volume2
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
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
      <CardContent className="p-10 relative z-10">
        {!isActive && phase !== 'complete' ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                <Wind size={32} className="text-indigo-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Practitioner Grounding</h3>
                <p className="text-indigo-200 text-base font-medium">60s to shift into a receptive clinical state.</p>
              </div>
            </div>
            <Button 
              onClick={startGrounding}
              className="bg-white text-indigo-900 hover:bg-indigo-50 h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              Start Centering
            </Button>
          </div>
        ) : phase === 'complete' ? (
          <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-700 py-4">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tight">State Shifted</h3>
              <p className="text-indigo-200 text-lg font-medium">You are centered, present, and ready for your client.</p>
            </div>
            <Button variant="ghost" onClick={resetGrounding} className="text-indigo-300 hover:text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl">
              <RotateCcw size={16} className="mr-2" /> Reset Tool
            </Button>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                  <Timer size={20} className="text-indigo-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Centering in Progress</span>
              </div>
              <span className="text-sm font-black tabular-nums opacity-60 tracking-widest">{60 - totalElapsed}s remaining</span>
            </div>

            <div className="flex flex-col items-center justify-center py-6 space-y-10">
              <div className="relative">
                <div className={cn(
                  "w-40 h-40 rounded-full border-4 border-white/10 flex items-center justify-center transition-all duration-1000 shadow-2xl",
                  phase === 'inhale' ? "scale-125 bg-white/10" : "scale-100 bg-transparent"
                )}>
                  <p className="text-3xl font-black uppercase tracking-[0.2em] animate-pulse">
                    {phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale'}
                  </p>
                </div>
              </div>
              
              <div className="w-full max-w-md space-y-3">
                <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-indigo-400" />
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                  <span>{phase}</span>
                  <span>{timeLeft}s</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={resetGrounding} className="text-white/40 hover:text-white hover:bg-white/10 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PractitionerGrounding;