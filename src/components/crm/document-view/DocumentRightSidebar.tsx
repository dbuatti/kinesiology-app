"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Clock, Play, Pause, RotateCcw, Check, Zap, 
  Activity, Heart, FlaskConical, Save, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from "@/integrations/supabase/client";

interface DocumentRightSidebarProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
  activeTimerDuration: number | null;
  timeLeft: number;
  startQuickTimer: (duration: number) => void;
  stopQuickTimer: () => void;
  formatCountdown: (seconds: number) => string;
}

const TIMER_PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '3m', value: 180 },
  { label: '6m', value: 360 },
  { label: '9m', value: 540 },
];

const DocumentRightSidebar = ({
  appointment,
  saveField,
  onUpdate,
  activeTimerDuration,
  timeLeft,
  startQuickTimer,
  stopQuickTimer,
  formatCountdown
}: DocumentRightSidebarProps) => {
  // BOLT Local State
  const [boltTime, setBoltTime] = useState(0);
  const [boltRunning, setBoltRunning] = useState(false);
  const [boltFinished, setBoltFinished] = useState(false);
  const [savingBolt, setSavingBolt] = useState(false);
  const boltIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Coherence Local State
  const [heartRateRaw, setHeartRateRaw] = useState<string>(
    appointment.heart_rate ? (appointment.heart_rate / 2).toString() : ''
  );
  const [breathRateRaw, setBreathRateRaw] = useState<string>(
    appointment.breath_rate ? (appointment.breath_rate / 2).toString() : ''
  );
  const [coherenceScore, setCoherenceScore] = useState<number | null>(
    appointment.coherence_score || null
  );
  const [savingCoherence, setSavingCoherence] = useState(false);

  // BOLT Timer Logic
  useEffect(() => {
    if (boltRunning) {
      boltIntervalRef.current = setInterval(() => {
        setBoltTime(prev => prev + 1);
      }, 1000);
    } else if (boltIntervalRef.current) {
      clearInterval(boltIntervalRef.current);
    }
    return () => {
      if (boltIntervalRef.current) clearInterval(boltIntervalRef.current);
    };
  }, [boltRunning]);

  const startBolt = () => {
    setBoltTime(0);
    setBoltFinished(false);
    setBoltRunning(true);
  };

  const stopBolt = () => {
    setBoltRunning(false);
    setBoltFinished(true);
  };

  const saveBolt = async () => {
    setSavingBolt(true);
    try {
      await saveField('bolt_score', boltTime);
      showSuccess(`BOLT score of ${boltTime}s saved.`);
      setBoltFinished(false);
      onUpdate();
    } catch (err) {
      showError("Failed to save BOLT score.");
    } finally {
      setSavingBolt(false);
    }
  };

  // Coherence Logic
  const calculateCoherence = () => {
    const hr = parseInt(heartRateRaw) * 2;
    const br = parseInt(breathRateRaw) * 2;
    if (!hr || !br || br === 0) {
      showError("Please enter valid counts.");
      return;
    }
    const score = hr / br;
    setCoherenceScore(score);
  };

  const saveCoherence = async () => {
    if (coherenceScore === null) return;
    setSavingCoherence(true);
    try {
      const hr = parseInt(heartRateRaw) * 2;
      const br = parseInt(breathRateRaw) * 2;
      await Promise.all([
        saveField('heart_rate', hr),
        saveField('breath_rate', br),
        saveField('coherence_score', coherenceScore)
      ]);
      showSuccess("Coherence metrics saved.");
      onUpdate();
    } catch (err) {
      showError("Failed to save coherence.");
    } finally {
      setSavingCoherence(false);
    }
  };

  return (
    <aside className="w-64 shrink-0 sticky top-[64px] max-h-[calc(100vh-120px)] overflow-y-auto p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-8 print:hidden custom-scrollbar">
      {/* 1. Quick Presets Column */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Quick Timers</p>
        <div className="grid grid-cols-3 gap-2">
          {TIMER_PRESETS.map((preset) => {
            const isActive = activeTimerDuration === preset.value;
            return (
              <button
                key={preset.label}
                onClick={() => isActive ? stopQuickTimer() : startQuickTimer(preset.value)}
                className={cn(
                  "h-12 rounded-xl border text-xs font-black flex flex-col items-center justify-center transition-all shadow-sm",
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white animate-pulse"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600"
                )}
              >
                <span>{isActive ? formatCountdown(timeLeft) : preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* 2. Minimal BOLT Tracker */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">BOLT Tracker</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-500">Score</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black tabular-nums">
                {boltRunning || boltFinished ? boltTime : (appointment.bolt_score || 0)}
              </span>
              <span className="text-xs font-bold text-slate-400">s</span>
            </div>
          </div>

          <div className="flex gap-2">
            {boltRunning ? (
              <Button 
                onClick={stopBolt} 
                className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Stop
              </Button>
            ) : boltFinished ? (
              <Button 
                onClick={saveBolt} 
                disabled={savingBolt}
                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                {savingBolt ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} className="mr-1.5" />}
                Save
              </Button>
            ) : (
              <Button 
                onClick={startBolt} 
                className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Start BOLT
              </Button>
            )}
            {(boltFinished || appointment.bolt_score) && (
              <Button 
                variant="outline" 
                onClick={() => { setBoltTime(0); setBoltFinished(false); setBoltRunning(false); }}
                className="h-9 w-9 rounded-xl border-slate-200"
              >
                <RotateCcw size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* 3. Minimal Coherence Calculator */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Heart Coherence</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase text-slate-400">Heart (30s)</Label>
              <Input 
                type="number" 
                placeholder="Count" 
                value={heartRateRaw} 
                onChange={e => setHeartRateRaw(e.target.value)}
                className="h-8 rounded-lg text-center text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[8px] font-black uppercase text-slate-400">Breath (30s)</Label>
              <Input 
                type="number" 
                placeholder="Count" 
                value={breathRateRaw} 
                onChange={e => setBreathRateRaw(e.target.value)}
                className="h-8 rounded-lg text-center text-xs font-bold"
              />
            </div>
          </div>

          {coherenceScore !== null && (
            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coherence Ratio</p>
              <p className="text-2xl font-black text-slate-900">{coherenceScore.toFixed(2)}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={calculateCoherence}
              className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Calculate
            </Button>
            {coherenceScore !== null && (
              <Button 
                onClick={saveCoherence}
                disabled={savingCoherence}
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-3"
              >
                {savingCoherence ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DocumentRightSidebar;