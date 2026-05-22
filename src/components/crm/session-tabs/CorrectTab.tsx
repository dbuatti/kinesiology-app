"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Zap, Brain, Activity, Target, Move, RefreshCw, 
  Sparkles, ShieldCheck, Clock, Info, ChevronRight, ChevronLeft,
  AlertTriangle, Heart, Hand, PlayCircle, Loader2, CheckCircle2,
  Baby, Dumbbell
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CalibrationTimer from '../CalibrationTimer';
import { showSuccess, showError } from "@/utils/toast";

interface CorrectTabProps {
  appointment: any;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

type WizardStep = 'SELECT' | 'DIRECTION' | 'PROTOCOL' | 'CALIBRATE' | 'REASSESS';

const DYSFUNCTIONAL_STATUSES = ['Inhibited', 'Hypertonic', 'Switching', 'Inhibition'];

const CorrectTab = ({ appointment, onUpdate, saveField, updatePriorityPattern }: CorrectTabProps) => {
  const [step, setStep] = useState<WizardStep>('SELECT');
  const [selectedFinding, setSelectedFinding] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [direction, setDirection] = useState<'Afferent' | 'Efferent' | null>(null);
  const [protocol, setProtocol] = useState<string>("");
  const [isCleared, setIsCleared] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  const inhibitedItems = useMemo(() => {
    const items = new Set<string>();
    
    Object.entries(pattern).forEach(([category, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (DYSFUNCTIONAL_STATUSES.includes(status as string)) {
          items.add(name);
        }
      });
    });

    return Array.from(items).sort();
  }, [pattern]);

  const effectiveItem = selectedFinding === 'CUSTOM' ? customText : selectedFinding;

  const clinicalTip = useMemo(() => {
    if (!effectiveItem) return null;
    const cleanItem = effectiveItem.replace(' (Bilateral)', '').replace(/ \([LR]\)$/, '');

    const primitive = PRIMITIVE_REFLEXES.find(r => 
      cleanItem.toLowerCase().includes(r.name.toLowerCase()) || 
      r.name.toLowerCase().includes(cleanItem.toLowerCase())
    );

    if (primitive) {
      return {
        type: 'Primitive Reflex',
        icon: Baby,
        title: primitive.name,
        content: primitive.pearl || "Foundational neurological pattern.",
        location: primitive.inhibitionPattern,
        stimulus: primitive.stimulus,
      };
    }

    const brainPoint = BRAIN_REFLEX_POINTS.find(p => 
      cleanItem.toLowerCase().includes(p.name.toLowerCase()) || 
      p.name.toLowerCase().includes(cleanItem.toLowerCase())
    );

    if (brainPoint) {
      return {
        type: brainPoint.category,
        icon: Brain,
        title: brainPoint.name,
        content: brainPoint.pearl || "Neurological priority detected.",
        location: brainPoint.location,
        stimulus: brainPoint.stimulus || brainPoint.technique,
      };
    }

    const muscle = getMuscleInfo(cleanItem);
    if (muscle && muscle.meridian !== 'General') {
      return {
        type: 'Muscle',
        icon: Dumbbell,
        title: muscle.name,
        content: muscle.clinicalIndications || muscle.description || "Muscle inhibition detected.",
        location: muscle.neurolymphatic || "Check NL points",
        stimulus: muscle.testingPosition || "Standard test",
      };
    }

    return null;
  }, [effectiveItem]);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const summary = `Calibrated: ${effectiveItem} via ${direction} (${protocol}) - ${isCleared ? 'Cleared' : 'Still Inhibited'}`;
      const currentBalances = appointment.modes_balances ? `${appointment.modes_balances}\n${summary}` : summary;
      
      await saveField('modes_balances', currentBalances);
      
      // If cleared, update the priority pattern
      if (isCleared && selectedFinding !== 'CUSTOM') {
        const sideMatch = selectedFinding.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = selectedFinding.replace(/ \([LR]\)$/, '');
        
        // Find category
        let category = 'muscles';
        Object.entries(pattern).forEach(([cat, items]: [string, any]) => {
          if (items[selectedFinding]) category = cat;
        });

        await updatePriorityPattern(category, baseName, 'Clear', side);
      }

      showSuccess("Calibration logged successfully.");
      setStep('SELECT');
      setSelectedFinding("");
      setCustomText("");
      setDirection(null);
      setProtocol("");
      setIsCleared(null);
      onUpdate();
    } catch (err) {
      showError("Failed to save calibration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 pb-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-slate-900">Calibration Wizard</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Streamlined clinical correction flow.</CardDescription>
          </div>
          {step !== 'SELECT' && (
            <Button variant="ghost" size="sm" onClick={() => setStep('SELECT')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600">
              <RefreshCw size={14} className="mr-2" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {step === 'SELECT' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Select Finding to Correct</Label>
              <Select value={selectedFinding} onValueChange={setSelectedFinding}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 bg-white font-bold">
                  <SelectValue placeholder="Select inhibited finding..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl p-2 bg-white dark:bg-slate-900">
                  {inhibitedItems.map(item => (
                    <SelectItem key={item} value={item} className="rounded-lg font-bold">
                      {item}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" className="rounded-lg font-bold text-indigo-600">+ Custom Entry</SelectItem>
                </SelectContent>
              </Select>

              {selectedFinding === 'CUSTOM' && (
                <Input 
                  placeholder="Enter custom finding..." 
                  className="h-12 rounded-xl font-bold border-2 border-indigo-100 mt-2 animate-in slide-in-from-top-2"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            {clinicalTip && (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <clinicalTip.icon size={18} className="text-amber-600" />
                    <h4 className="font-black text-amber-900 text-xs uppercase tracking-widest">{clinicalTip.title}</h4>
                  </div>
                  <Badge className="bg-amber-600 text-white border-none font-black text-[8px] uppercase tracking-widest rounded-full">
                    {clinicalTip.type}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-amber-900">
                  <div className="p-3 bg-white/60 rounded-xl border border-amber-200">
                    <p className="font-black text-[8px] text-amber-600 uppercase tracking-widest mb-1">Location / Pattern</p>
                    <p className="font-bold">{clinicalTip.location}</p>
                  </div>
                  <div className="p-3 bg-white/60 rounded-xl border border-amber-200">
                    <p className="font-black text-[8px] text-amber-600 uppercase tracking-widest mb-1">Stimulus</p>
                    <p className="font-bold">{clinicalTip.stimulus}</p>
                  </div>
                </div>
                <p className="text-sm text-amber-800 font-medium leading-relaxed italic">
                  "{clinicalTip.content}"
                </p>
              </div>
            )}

            <Button 
              disabled={!effectiveItem}
              onClick={() => setStep('DIRECTION')}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg"
            >
              Next: Choose Direction <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {step === 'DIRECTION' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Correcting</p>
                <p className="text-lg font-black text-indigo-900">"{effectiveItem}"</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline"
                onClick={() => { setDirection('Afferent'); setStep('PROTOCOL'); }}
                className="h-24 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 flex flex-col items-start p-6 text-left"
              >
                <span className="font-black text-lg text-slate-900">Afferent</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bottom-Up (Sensory)</span>
              </Button>

              <Button 
                variant="outline"
                onClick={() => { setDirection('Efferent'); setStep('PROTOCOL'); }}
                className="h-24 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 flex flex-col items-start p-6 text-left"
              >
                <span className="font-black text-lg text-slate-900">Efferent</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top-Down (Processing)</span>
              </Button>
            </div>

            <Button variant="ghost" onClick={() => setStep('SELECT')} className="w-full h-12 rounded-xl font-bold text-slate-400"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        )}

        {step === 'PROTOCOL' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Correcting</p>
                <p className="text-lg font-black text-indigo-900">"{effectiveItem}" ({direction})</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Protocol</Label>
              <div className="grid grid-cols-1 gap-2">
                {direction === 'Afferent' ? (
                  <>
                    {['Mechanoreceptor (Joint/Muscle)', 'Vestibular / Ocular', 'Nociceptive (Scar/Injury)'].map(p => (
                      <Button 
                        key={p}
                        variant={protocol === p ? 'default' : 'outline'}
                        onClick={() => { setProtocol(p); setStep('CALIBRATE'); }}
                        className="h-12 rounded-xl justify-start px-6 font-bold"
                      >
                        {p}
                      </Button>
                    ))}
                  </>
                ) : (
                  <>
                    {['Cortical (Top-Down)', 'Subcortical (Autonomic)', 'Emotional Integration'].map(p => (
                      <Button 
                        key={p}
                        variant={protocol === p ? 'default' : 'outline'}
                        onClick={() => { setProtocol(p); setStep('CALIBRATE'); }}
                        className="h-12 rounded-xl justify-start px-6 font-bold"
                      >
                        {p}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </div>

            <Button variant="ghost" onClick={() => setStep('DIRECTION')} className="w-full h-12 rounded-xl font-bold text-slate-400"><ChevronLeft size={16} className="mr-2" /> Back</Button>
          </div>
        )}

        {step === 'CALIBRATE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Zap size={150} /></div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-amber-400"><Zap size={28} /> Calibration Phase</h3>
              
              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-400">Active Protocol</p>
                  <p className="text-lg font-bold leading-tight">
                    {direction} — {protocol}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions:</p>
                  <ul className="space-y-2 text-xs font-bold text-slate-300 list-disc list-inside">
                    {direction === 'Afferent' ? (
                      <>
                        <li>Apply the physical stimulus or stretch to the target area.</li>
                        <li>Hold the corresponding reflex point (e.g., GV16 for Unconscious).</li>
                        <li>Breathe calmly through the nose.</li>
                      </>
                    ) : (
                      <>
                        <li>Hold the identified brain zones or ESR points.</li>
                        <li>Focus on the emotional context or intention.</li>
                        <li>Breathe calmly through the nose.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="pt-4">
                  <CalibrationTimer duration={direction === 'Afferent' ? 15 : 60} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep('PROTOCOL')} className="flex-1 h-12 rounded-xl font-bold text-slate-400"><ChevronLeft size={16} className="mr-2" /> Back</Button>
              <Button onClick={() => setStep('REASSESS')} className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg">Correction Applied <ChevronRight size={16} className="ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 'REASSESS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6"><RefreshCw size={48} className="text-emerald-500" /></div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">Final Re-assessment</h3>
              <p className="text-emerald-700 font-medium">Re-test the original stimulus and check the IM.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={isCleared === true ? 'default' : 'outline'}
                onClick={() => setIsCleared(true)}
                className={cn("h-16 rounded-2xl border-2 font-black text-xs uppercase tracking-widest", isCleared === true ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-100")}
              >
                <CheckCircle2 size={18} className="mr-2" /> Cleared
              </Button>
              <Button 
                variant={isCleared === false ? 'default' : 'outline'}
                onClick={() => setIsCleared(false)}
                className={cn("h-16 rounded-2xl border-2 font-black text-xs uppercase tracking-widest", isCleared === false ? "bg-rose-600 border-rose-600 text-white" : "border-slate-100")}
              >
                <AlertTriangle size={18} className="mr-2" /> Still Inhibited
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setStep('CALIBRATE')} className="flex-1 h-12 rounded-xl font-bold text-slate-400"><ChevronLeft size={16} className="mr-2" /> Back</Button>
              <Button 
                disabled={isCleared === null || loading}
                onClick={handleFinish}
                className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Log Calibration
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CorrectTab;