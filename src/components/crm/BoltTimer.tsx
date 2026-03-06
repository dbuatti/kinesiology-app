import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Save, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BoltTimerProps {
  initialScore: number | null | undefined;
  onScoreRecorded: (score: number) => Promise<void>;
  isSaving: boolean;
}

const BoltTimer = ({ initialScore, onScoreRecorded, isSaving }: BoltTimerProps) => {
  const [time, setTime] = useState(initialScore || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (initialScore !== null && initialScore !== undefined && !isRunning && !isFinished) {
      setTime(initialScore);
    }
  }, [initialScore]);

  const startTimer = () => {
    setTime(0);
    setIsFinished(false);
    setIsRunning(true);
    setShowInstructions(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsFinished(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTime(initialScore || 0);
    setShowInstructions(true);
  };

  const handleSave = () => {
    if (isFinished) {
      onScoreRecorded(time);
    }
  };

  const displayTime = isRunning || isFinished ? time : (initialScore || 0);
  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-emerald-600';
    if (score >= 25) return 'text-blue-600';
    return 'text-amber-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 40) return 'Optimal';
    if (score >= 25) return 'Functional';
    return 'Below Target';
  };

  return (
    <div className="space-y-4">
      {showInstructions && !isRunning && (
        <Alert className="bg-blue-50 border-blue-200 py-2">
          <Info className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-[10px] text-blue-900 leading-tight">
            Breathe normally, then hold after a normal exhalation. Stop at the first definite desire to breathe.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div className={cn(
          "flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
          isRunning ? "bg-indigo-50 border-indigo-300 animate-pulse" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-5xl font-black tabular-nums transition-colors",
              isRunning ? "text-indigo-600" : getScoreColor(displayTime)
            )}>
              {displayTime}
            </span>
            <span className="text-xl font-semibold text-slate-400">s</span>
          </div>
          
          {!isRunning && displayTime > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                displayTime >= 40 ? "bg-emerald-100 text-emerald-700" :
                displayTime >= 25 ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              )}>
                {getScoreLabel(displayTime)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {!isRunning && !isFinished && (
          <Button 
            onClick={startTimer} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl h-10 text-xs font-bold"
          >
            <Play size={16} className="mr-2" /> Start BOLT
          </Button>
        )}

        {isRunning && (
          <Button 
            onClick={stopTimer} 
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl h-10 text-xs font-bold"
          >
            <Square size={16} className="mr-2" /> Stop
          </Button>
        )}

        {isFinished && (
          <>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 text-xs font-bold"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
              Save ({time}s)
            </Button>
            <Button 
              onClick={resetTimer} 
              variant="outline" 
              className="px-4 rounded-xl border-slate-200 hover:bg-slate-100 h-10"
              disabled={isSaving}
            >
              <RotateCcw size={16} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BoltTimer;