"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Wind, 
  Timer, 
  RotateCcw, 
  CheckCircle2
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
      "p-8 border-none transition-colors duration-500 h-full flex flex-col justify-center",
      isActive ? "bg-success text-success-foreground" : "bg-background text-foreground"
    )}>
      {!isActive && phase !== 'complete' ? (
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 border border-border flex items-center justify-center">
              <Wind size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-medium uppercase tracking-tight">Practitioner Grounding</h3>
              <p className="text-muted-foreground text-sm">60s to shift into a receptive clinical state.</p>
            </div>
          </div>
          <Button 
            onClick={startGrounding}
            className="bg-primary text-primary-foreground h-12 px-8 font-medium text-[10px] uppercase tracking-widest"
          >
            Start Centering
          </Button>
        </div>
      ) : phase === 'complete' ? (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-success text-success-foreground flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-medium uppercase tracking-tight">State Shifted</h3>
            <p className="text-muted-foreground text-sm">You are centered, present, and ready for your client.</p>
          </div>
          <Button variant="ghost" onClick={resetGrounding} className="text-primary hover:bg-muted font-medium text-[10px] uppercase tracking-widest">
            <RotateCcw size={14} className="mr-2" /> Reset Tool
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Centering in Progress</span>
            </div>
            <span className="text-xs font-bold tabular-nums">{60 - totalElapsed}S REMAINING</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-8">
            <div className="relative">
              <div className={cn(
                "w-32 h-32 border-2 border-success-foreground/20 flex items-center justify-center transition-all duration-1000",
                phase === 'inhale' ? "scale-110 bg-success-foreground/10" : "scale-100 bg-transparent"
              )}>
                <p className="text-xl font-bold uppercase tracking-widest">
                  {phase}
                </p>
              </div>
            </div>
            
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-1 bg-success-foreground/20 [&>div]:bg-success-foreground" />
              <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest">
                <span>{phase}</span>
                <span>{timeLeft}S</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={resetGrounding} className="text-success-foreground/60 hover:text-success-foreground hover:bg-success-foreground/10 h-8 px-4 text-[10px] font-bold uppercase tracking-widest">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PractitionerGrounding;