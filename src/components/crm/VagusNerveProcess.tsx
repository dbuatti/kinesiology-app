"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Play, Pause, RotateCcw, CheckCircle2, Activity, Zap, Info, Timer } from 'lucide-react';
import EditableField from './EditableField';
import { cn } from '@/lib/utils';

interface VagusNerveProcessProps {
  appointmentId: string;
  initialNotes: string | null;
  onSaveField: (field: string, value: string) => Promise<void>;
  onUpdate: () => void;
}

const SHIFT_SIGNS = [
  { id: 'yawning', label: 'Yawning' },
  { id: 'sighing', label: 'Sighing' },
  { id: 'swallowing', label: 'Swallowing' },
  { id: 'gurgling', label: 'Gurgling' },
  { id: 'salivation', label: 'Salivation' },
  { id: 'tearing', label: 'Tearing' },
  { id: 'deep_breath', label: 'Deep Breath' },
];

const VagusNerveProcess = ({ appointmentId, initialNotes, onSaveField, onUpdate }: VagusNerveProcessProps) => {
  const [branch, setBranch] = useState<string>('auricular');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(60);
  };

  const toggleShift = (id: string) => {
    setSelectedShifts(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateSummary = () => {
    const branchLabel = branch.charAt(0).toUpperCase() + branch.slice(1);
    const shifts = selectedShifts.map(s => SHIFT_SIGNS.find(ss => ss.id === s)?.label).join(', ');
    const summary = `Branch: ${branchLabel}\nShifts: ${shifts || 'None observed'}\nDuration: ${60 - timeLeft}s stimulation`;
    return summary;
  };

  const handleAutoPopulate = async () => {
    const summary = generateSummary();
    const currentNotes = initialNotes ? `${initialNotes}\n\n${summary}` : summary;
    await onSaveField('vagus_nerve_notes', currentNotes);
    onUpdate();
  };

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Vagus Nerve Stimulation</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">Parasympathetic activation & regulation</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">
            SNS Stage
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Branch Selection */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Target Branch
          </label>
          <ToggleGroup 
            type="single" 
            value={branch} 
            onValueChange={(v) => v && setBranch(v)}
            className="justify-start gap-2"
          >
            <ToggleGroupItem value="auricular" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-indigo-600 data-[state=on]:text-white border border-slate-200">
              Auricular
            </ToggleGroupItem>
            <ToggleGroupItem value="cervical" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-indigo-600 data-[state=on]:text-white border border-slate-200">
              Cervical
            </ToggleGroupItem>
            <ToggleGroupItem value="abdominal" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-indigo-600 data-[state=on]:text-white border border-slate-200">
              Abdominal
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Timer Section */}
        <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-100">
          <div className="text-5xl font-black text-slate-900 mb-4 font-mono tracking-tighter">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={toggleTimer} 
              variant={isActive ? "outline" : "default"}
              className={cn(
                "rounded-2xl px-6 h-12 font-bold transition-all",
                !isActive && "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
              )}
            >
              {isActive ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
              {isActive ? "Pause" : "Start Stimulation"}
            </Button>
            <Button onClick={resetTimer} variant="ghost" size="icon" className="rounded-2xl h-12 w-12 text-slate-400 hover:text-slate-600">
              <RotateCcw size={18} />
            </Button>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-1">
            <Timer size={12} /> Recommended: 60 Seconds
          </p>
        </div>

        {/* Signs of Shift */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Signs of Shift
          </label>
          <div className="flex flex-wrap gap-2">
            {SHIFT_SIGNS.map((shift) => (
              <Badge
                key={shift.id}
                variant="outline"
                onClick={() => toggleShift(shift.id)}
                className={cn(
                  "px-4 py-2 rounded-xl cursor-pointer transition-all border-slate-200 text-sm font-medium",
                  selectedShifts.includes(shift.id) 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                    : "bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {shift.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes & Summary */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Procedure Notes</label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAutoPopulate}
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              <Zap size={12} className="mr-1" /> Auto-Populate Summary
            </Button>
          </div>
          <EditableField
            field="vagus_nerve_notes"
            label=""
            value={initialNotes}
            multiline
            placeholder="Document stimulation details and client response..."
            onSave={(field, value) => onSaveField(field, value as string)}
            className="bg-slate-50/50 border-slate-100 rounded-2xl"
          />
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
          <Info className="text-amber-600 shrink-0" size={18} />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Clinical Pearl:</strong> The Vagus Nerve acts as the "brake pedal" for the nervous system. Stimulation should be gentle and stopped if the client feels lightheaded or nauseous.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VagusNerveProcess;