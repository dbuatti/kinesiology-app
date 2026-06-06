
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Heart, Wind, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface HeartMathBreathingProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const HeartMathBreathing = ({ onComplete, onCancel }: HeartMathBreathingProps) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycles, setCycles] = useState(0);
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
              setCycles(c => c + 1);
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
    setCycles(0);
  };

  const progress = phase === 'inhale' 
    ? ((4 - timeLeft) / 4) * 100 
    : ((6 - timeLeft) / 6) * 100;

  return (
    <div className="p-12 bg-slate-950 rounded-[3rem] border-2 border-slate-900 flex flex-col items-center text-center space-y-12 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.1),transparent_70%)]" />
      
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-center gap-3 text-rose-500">
          <Heart size={24} className={cn(isActive && "animate-pulse")} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">HeartMath 4/6 Rhythm</span>
        </div>
        <h3 className="text-4xl font-black text-white tracking-tight">Coherence Breathing</h3>
        <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">Focus on the area of your heart. Imagine your breath flowing in and out of that space.</p>
      </div>

      <div className="relative flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: isActive && phase === 'inhale' ? [1, 1.3] : isActive && phase === 'exhale' ? [1.3, 1] : 1,
            opacity: isActive ? [0.3, 0.6, 0.3] : 0.2
          }}
          transition={{ duration: phase === 'exhale' ? 6 : 4, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-rose-500/20 blur-3xl"
        />

        <div className={cn(
          "w-56 h-56 rounded-full border-4 border-rose-500/20 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out shadow-2xl relative z-10 bg-slate-900/50 backdrop-blur-md",
          isActive && phase === 'inhale' ? "scale-110 border-rose-500/50" : "scale-100"
        )}>
          <div className="text-center">
            <p className="text-4xl font-black text-rose-500 uppercase tracking-[0.2em]">
              {isActive ? phase : "Ready"}
            </p>
            {isActive && <p className="text-3xl font-black text-white tabular-nums mt-2">{timeLeft}s</p>}
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 relative z-10">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${isActive ? progress : 0}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          <span>4s Inhale</span>
          <span className="text-rose-400">{cycles} Cycles</span>
          <span>6s Exhale</span>
        </div>
      </div>

      <div className="flex gap-4 relative z-10">
        {onCancel && !isActive && (
          <Button variant="ghost" onClick={onCancel} className="h-14 px-8 rounded-2xl font-bold text-slate-500 hover:text-white">
            Cancel
          </Button>
        )}
        <Button 
          onClick={toggleTimer} 
          className={cn(
            "rounded-2xl px-12 h-16 font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95",
            isActive ? "bg-white text-slate-950" : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
          )}
        >
          {isActive ? <Pause size={20} className="mr-3" /> : <Play size={20} className="mr-3" />}
          {isActive ? "Pause" : "Start Practice"}
        </Button>
        <Button variant="ghost" size="icon" onClick={resetTimer} className="rounded-2xl h-16 w-16 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
          <RotateCcw size={24} />
        </Button>
      </div>
    </div>
  );
};

export default HeartMathBreathing;