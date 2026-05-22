"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, Square, RotateCcw, Save, Loader2, 
  Heart, Brain, Activity, FlaskConical, Check, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import DocInput from './DocInput';
import { Badge } from '@/components/ui/badge';

interface PreliminarySectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
}

const PreliminarySection = ({ appointment, saveField }: PreliminarySectionProps) => {
  // BOLT Local State
  const [boltTime, setBoltTime] = useState(appointment.bolt_score || 0);
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

  // Sync props
  useEffect(() => {
    if (appointment.bolt_score !== undefined) {
      setBoltTime(appointment.bolt_score || 0);
    }
  }, [appointment.bolt_score]);

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
    } catch (err) {
      showError("Failed to save coherence.");
    } finally {
      setSavingCoherence(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  const isCoherent = coherenceScore !== null && Math.abs(coherenceScore - Math.round(coherenceScore)) < 0.01;

  return (
    <div className="space-y-12">
      {/* Top Grid: Goal, Concern, Hydration, ROM Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-10">
          <DocInput 
            label="Session Goal" 
            value={appointment.goal} 
            field="goal" 
            placeholder="Primary objective..." 
            onChange={handleFieldChange}
          />
          <DocInput 
            label="Main Concern" 
            value={appointment.issue} 
            field="issue" 
            placeholder="Presenting symptoms..." 
            onChange={handleFieldChange}
          />
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200">
            <div className="space-y-0.5">
              <p className="text-[11px] font-black uppercase tracking-widest">Hydration Check</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Systemic Conductivity</p>
            </div>
            <Checkbox 
              checked={appointment.hydrated || false} 
              onCheckedChange={(checked) => saveField('hydrated', !!checked)}
              className="h-8 w-8 border-black rounded-none data-[state=checked]:bg-black"
            />
          </div>

          <DocInput 
            label="ROM / Cogs Notes" 
            value={appointment.sagittal_plane_notes} 
            field="sagittal_plane_notes" 
            placeholder="Sagittal, Frontal, Transverse findings..." 
            multiline 
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Horizontal BOLT Score Assessment */}
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">BOLT Score Assessment</label>
        <div className="border border-black p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Body Oxygen Level Test</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Measure comfortable breath-hold time after a normal exhalation to assess CO2 tolerance.
            </p>
            <div className="flex gap-2 pt-2">
              {boltRunning ? (
                <Button 
                  type="button"
                  onClick={stopBolt} 
                  className="h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-black uppercase tracking-widest"
                >
                  Stop
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={startBolt} 
                  className="h-10 px-6 bg-black text-white hover:bg-slate-800 rounded-none text-xs font-black uppercase tracking-widest"
                >
                  Start BOLT
                </Button>
              )}
              {boltFinished && (
                <Button 
                  type="button"
                  onClick={saveBolt} 
                  disabled={savingBolt}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-black uppercase tracking-widest"
                >
                  {savingBolt ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Save Score
                </Button>
              )}
              {(boltFinished || appointment.bolt_score) && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => { setBoltTime(0); setBoltFinished(false); setBoltRunning(false); saveField('bolt_score', null); }}
                  className="h-10 w-10 rounded-none border-slate-200"
                >
                  <RotateCcw size={14} />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 border-l border-slate-100 pl-6">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-5xl font-black tabular-nums">{boltTime}</span>
                <span className="text-sm font-bold text-slate-400">s</span>
              </div>
            </div>
            {appointment.bolt_score && (
              <Badge className={cn(
                "border-none font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-sm",
                appointment.bolt_score >= 25 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              )}>
                {appointment.bolt_score >= 25 ? "Functional" : "Below Target"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Heart Coherence Calculator */}
      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heart Coherence Calculator</label>
        <div className="border border-black p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase text-slate-400">Heart (30s)</Label>
                <Input 
                  type="number" 
                  placeholder="Count" 
                  value={heartRateRaw} 
                  onChange={e => setHeartRateRaw(e.target.value)}
                  className="h-10 rounded-none border-slate-200 text-center text-sm font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-black uppercase text-slate-400">Breath (30s)</Label>
                <Input 
                  type="number" 
                  placeholder="Count" 
                  value={breathRateRaw} 
                  onChange={e => setBreathRateRaw(e.target.value)}
                  className="h-10 rounded-none border-slate-200 text-center text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="button"
                onClick={calculateCoherence}
                className="h-10 px-6 bg-black text-white hover:bg-slate-800 rounded-none text-xs font-black uppercase tracking-widest"
              >
                Calculate
              </Button>
              {coherenceScore !== null && (
                <Button 
                  type="button"
                  onClick={saveCoherence}
                  disabled={savingCoherence}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-black uppercase tracking-widest"
                >
                  {savingCoherence ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Save Coherence
                </Button>
              )}
              {(coherenceScore !== null || appointment.coherence_score) && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => { setHeartRateRaw(''); setBreathRateRaw(''); setCoherenceScore(null); saveField('coherence_score', null); }}
                  className="h-10 w-10 rounded-none border-slate-200"
                >
                  <RotateCcw size={14} />
                </Button>
              )}
            </div>
          </div>

          {coherenceScore !== null && (
            <div className="flex items-center gap-6 shrink-0 border-l border-slate-100 pl-6">
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coherence Ratio</p>
                <p className="text-5xl font-black tabular-nums">{coherenceScore.toFixed(2)}</p>
              </div>
              <Badge className={cn(
                "border-none font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-sm",
                isCoherent ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              )}>
                {isCoherent ? "Coherent" : "Discordant"}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreliminarySection;