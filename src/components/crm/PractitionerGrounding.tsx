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
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-indigo-900 text-white overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
      <CardContent className="p-8 relative z-10">
        {!isActive && phase !== 'complete' ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                <Wind size={28} className="text-indigo-300" />
              </div>
              <div>
                <h3 className="text-xl font-black">Practitioner Grounding</h3>
                <p className="text-indigo-200 text-sm font-medium">60s to shift into a receptive clinical state.</p>
              </div>
            </div>
            <Button 
              onClick={startGrounding}
              className="bg-white text-indigo-900 hover:bg-indigo-50 h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl"
            >
              Start Centering
            </Button>
          </div>
        ) : phase === 'complete' ? (
          <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black">State Shifted</h3>
              <p className="text-indigo-200 font-medium">You are centered, present, and ready for your client.</p>
            </div>
            <Button variant="ghost" onClick={resetGrounding} className="text-indigo-300 hover:text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest">
              <RotateCcw size={14} className="mr-2" /> Reset Tool
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Timer size={16} className="text-indigo-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Centering in Progress</span>
              </div>
              <span className="text-xs font-black tabular-nums opacity-60">{60 - totalElapsed}s remaining</span>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="relative">
                <div className={cn(
                  "w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center transition-all duration-1000",
                  phase === 'inhale' ? "scale-125 bg-white/10" : "scale-100 bg-transparent"
                )}>
                  <p className="text-2xl font-black uppercase tracking-widest animate-pulse">
                    {phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale'}
                  </p>
                </div>
              </div>
              
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-indigo-400" />
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-indigo-400">
                  <span>{phase}</span>
                  <span>{timeLeft}s</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={resetGrounding} className="text-white/40 hover:text-white hover:bg-white/10 h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest">
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