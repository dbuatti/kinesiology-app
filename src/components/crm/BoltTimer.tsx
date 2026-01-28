import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoltTimerProps {
  initialScore: number | null | undefined;
  onScoreRecorded: (score: number) => Promise<void>;
  isSaving: boolean;
}

const BoltTimer = ({ initialScore, onScoreRecorded, isSaving }: BoltTimerProps) => {
  const [time, setTime] = useState(initialScore || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    // Reset time if initialScore changes (e.g., parent component fetches new data)
    if (initialScore !== null && initialScore !== undefined && !isRunning && !isFinished) {
      setTime(initialScore);
    }
  }, [initialScore]);

  const startTimer = () => {
    setTime(0);
    setIsFinished(false);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsFinished(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTime(initialScore || 0);
  };

  const handleSave = () => {
    if (isFinished) {
      onScoreRecorded(time);
      // Keep the recorded time displayed until parent component updates
    }
  };

  const displayTime = isRunning || isFinished ? time : (initialScore || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center bg-slate-50 p-6 rounded-xl border border-slate-100">
        <span className={cn(
          "text-6xl font-extrabold tabular-nums transition-colors",
          displayTime >= 25 ? "text-emerald-600" : "text-amber-600"
        )}>
          {displayTime}
        </span>
        <span className="text-2xl font-semibold text-slate-400 ml-2">s</span>
      </div>

      <div className="flex gap-2">
        {!isRunning && !isFinished && (
          <Button 
            onClick={startTimer} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100"
          >
            <Play size={18} className="mr-2" /> Start Test
          </Button>
        )}

        {isRunning && (
          <Button 
            onClick={stopTimer} 
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-100"
          >
            <Square size={18} className="mr-2" /> Stop
          </Button>
        )}

        {isFinished && (
          <>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />}
              Save {time}s
            </Button>
            <Button 
              onClick={resetTimer} 
              variant="outline" 
              className="w-1/4 rounded-xl border-slate-200 hover:bg-slate-100"
              disabled={isSaving}
            >
              <RotateCcw size={18} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BoltTimer;