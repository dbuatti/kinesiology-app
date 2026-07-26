
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalibrationTimerProps {
  duration: number;
}

const CalibrationTimer = ({ duration }: CalibrationTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  const toggleTimer = () => {
    if (!isActive && timeLeft === 0) {
      setTimeLeft(duration);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="p-4 bg-card rounded-2xl border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase">Timer ({duration}s)</p>
        <p className="text-2xl font-black text-foreground tabular-nums">{timeLeft}s</p>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000 ease-linear", isActive ? "bg-indigo-500" : "bg-muted")}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={toggleTimer} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10">
          {isActive ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
          {isActive ? 'Pause' : timeLeft === 0 ? 'Restart' : 'Start'}
        </Button>
        <Button onClick={resetTimer} variant="outline" size="icon" className="rounded-xl h-10 w-10">
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  );
};

export default CalibrationTimer;