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
  Volume2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface PractitionerGroundingProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const PractitionerGrounding = ({ onComplete, onCancel }: PractitionerGroundingProps) => {
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
      onComplete?.();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, totalElapsed, onComplete]);

  const progress = phase === 'inhale' ? ((4 - timeLeft) / 4) * 100 :
                   phase === 'hold' ? ((4 - timeLeft) / 4) * 100 :
                   ((6 - timeLeft) / 6) * 100;

  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-950 text-white overflow-hidden relative group min-h-[400px] flex flex-col justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.15),transparent_70%)]" />
      
      <CardContent className="p-10 relative z-10">
        <AnimatePresence mode="wait">
          {!isActive && phase !== 'complete' ? (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-2xl">
                <Wind size={40} className="text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tight">Practitioner Grounding</h3>
                <p className="text-slate-400 text-lg font-medium max-w-md">
                  60 seconds of rhythmic breathing to shift into a neutral, receptive clinical state.
                </p>
              </div>
              <div className="flex gap-4">
                {onCancel && (
                  <Button variant="ghost" onClick={onCancel} className="h-14 px-8 rounded-2xl font-bold text-slate-500 hover:text-white">
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={startGrounding}
                  className="bg-white text-slate-950 hover:bg-indigo-50 h-14 px-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  Start Centering
                </Button>
              </div>
            </motion.div>
          ) : phase === 'complete' ? (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black tracking-tight">State Shifted</h3>
                <p className="text-indigo-200 text-xl font-medium">You are centered, present, and ready.</p>
              </div>
              <Button variant="ghost" onClick={resetGrounding} className="text-indigo-300 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-2xl border border-white/10">
                <RotateCcw size={18} className="mr-2" /> Reset Tool
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-inner border border-white/10">
                    <Timer size={20} className="text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Centering in Progress</span>
                </div>
                <span className="text-sm font-black tabular-nums text-slate-500 tracking-widest">{60 - totalElapsed}s</span>
              </div>

              <div className="flex flex-col items-center justify-center py-6 space-y-12">
                <div className="relative">
                  {/* Organic Pulse Rings */}
                  <motion.div 
                    animate={{ 
                      scale: phase === 'inhale' ? [1, 1.4] : phase === 'exhale' ? [1.4, 1] : 1,
                      opacity: phase === 'hold' ? 0.5 : [0.2, 0.5, 0.2]
                    }}
                    transition={{ duration: phase === 'exhale' ? 6 : 4, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl"
                  />
                  
                  <div className={cn(
                    "w-56 h-56 rounded-full border-2 border-white/10 flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl relative z-10 bg-slate-900/50 backdrop-blur-sm",
                    phase === 'inhale' ? "scale-110 border-indigo-500/50" : "scale-100"
                  )}>
                    <p className="text-4xl font-black uppercase tracking-[0.2em] text-white">
                      {phase}
                    </p>
                    <p className="text-2xl font-black text-indigo-400 tabular-nums mt-2">{timeLeft}s</p>
                  </div>
                </div>
                
                <div className="w-full max-w-md space-y-4">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                    <span>{phase === 'inhale' ? '4s In' : phase === 'hold' ? '4s Hold' : '6s Out'}</span>
                    <span>Total: {totalElapsed}s / 60s</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" onClick={resetGrounding} className="text-white/20 hover:text-rose-400 hover:bg-rose-500/10 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  <X size={14} className="mr-2" /> Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default PractitionerGrounding;