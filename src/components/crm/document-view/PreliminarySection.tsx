"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, Square, RotateCcw, Save, Loader2, 
  Heart, Brain, Activity, FlaskConical, Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import DocInput from './DocInput';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
      {/* Left Column: Goals, Concerns, and BOLT */}
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
        
        {/* Interactive BOLT Section */}
        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">BOLT Score Assessment</label>
          <div className="border border-black p-6 space-y-4 bg-white">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">Score</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-4xl font-black tabular-nums">
                  {boltTime}
                </span>
                <span className="text-sm font-bold text-slate-400">s</span>
              </div>
            </div>

            <div className="flex gap-2">
              {boltRunning ? (
                <Button 
                  type="button"
                  onClick={stopBolt} 
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-black uppercase tracking-widest"
                >
                  Stop
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={startBolt} 
                  className="flex-1 h-10 bg-black text-white hover:bg-slate-800 rounded-none text-xs font-black uppercase tracking-widest"
                >
                  Start BOLT
                </Button>
              )}
              {boltFinished && (
                <Button 
                  type="button"
                  onClick={saveBolt} 
                  disabled={savingBolt}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-black uppercase tracking-widest"
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
        </div>
      </div>

      {/* Right Column: Hydration, Coherence, and ROM */}
      <div className="space-y-10">
        <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100">
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

        {/* Interactive Heart Coherence Section */}
        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Heart Coherence Calculator</label>
          <div className="border border-black p-6 space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
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

            {coherenceScore !== null && (
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coherence Ratio</p>
                <p className="text-3xl font-black text-slate-900">{coherenceScore.toFixed(2)}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="button"
                onClick={calculateCoherence}
                className="flex-1 h-10 bg-black text-white hover:bg-slate-800 rounded-none text-xs font-black uppercase tracking-widest"
              >
                Calculate
              </Button>
              {coherenceScore !== null && (
                <Button 
                  type="button"
                  onClick={saveCoherence}
                  disabled={savingCoherence}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-black uppercase tracking-widest px-3"
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
  );
};

export default PreliminarySection;