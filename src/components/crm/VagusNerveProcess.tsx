"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Play, Pause, RotateCcw, CheckCircle2, Activity, Zap, Info, Timer, Search, Brain, Heart, Wind, RefreshCw } from 'lucide-react';
import EditableField from './EditableField';
import { cn } from '@/lib/utils';
import { VAGUS_ASSOCIATIONS, VAGAL_FUNCTIONS, HAND_REFLEXOLOGY } from '@/data/vagus-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [mode, setMode] = useState<'stimulation' | 'screen'>('stimulation');
  const [branch, setBranch] = useState<string>('auricular');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  
  // Screen Mode State
  const [reflexPoint, setReflexPoint] = useState<string>("Occiput");
  const [auricularSide, setAuricularSide] = useState<string>("Left");
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [pulseSide, setPulseSide] = useState<"Right" | "Left">("Right");
  const [pulseDepth, setPulseDepth] = useState<"Light" | "Deep">("Light");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("");
  const [selectedAssociation, setSelectedAssociation] = useState<string>("");
  const [breathingPattern, setBreathingPattern] = useState<string>("");
  const [correctionTime, setCorrectionTime] = useState(30);
  const [isCorrectionActive, setIsCorrectionActive] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const correctionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (isCorrectionActive && correctionTime > 0) {
      correctionTimerRef.current = setInterval(() => setCorrectionTime((prev) => prev - 1), 1000);
    } else if (correctionTime === 0) {
      setIsCorrectionActive(false);
    }
    return () => { if (correctionTimerRef.current) clearInterval(correctionTimerRef.current); };
  }, [isCorrectionActive, correctionTime]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(60); };

  const toggleCorrectionTimer = () => setIsCorrectionActive(!isCorrectionActive);
  const resetCorrectionTimer = () => { setIsCorrectionActive(false); setCorrectionTime(30); };

  const toggleShift = (id: string) => {
    setSelectedShifts(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter associations based on selected organ
  const filteredAssociations = useMemo(() => {
    if (!selectedOrgan) return VAGUS_ASSOCIATIONS;
    
    const searchTerms = selectedOrgan.split('/').map(s => s.trim().toLowerCase());
    
    return VAGUS_ASSOCIATIONS.filter(assoc => {
      const organName = assoc.organ.toLowerCase();
      return searchTerms.some(term => organName.includes(term));
    });
  }, [selectedOrgan]);

  // Auto-select if only one association matches
  useEffect(() => {
    if (filteredAssociations.length === 1) {
      setSelectedAssociation(filteredAssociations[0].spinalSegment);
    } else if (filteredAssociations.length === 0) {
      setSelectedAssociation("");
    }
  }, [filteredAssociations]);

  const handleAutoPopulate = async () => {
    let summary = "";
    if (mode === 'stimulation') {
      const branchLabel = branch.charAt(0).toUpperCase() + branch.slice(1);
      const shifts = selectedShifts.map(s => SHIFT_SIGNS.find(ss => ss.id === s)?.label).join(', ');
      summary = `VAGUS STIMULATION:\n- Branch: ${branchLabel}\n- Shifts: ${shifts || 'None observed'}\n- Duration: ${60 - timeLeft}s`;
    } else {
      const assoc = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === selectedAssociation);
      const reflexLabel = reflexPoint === 'Auricular' ? `Auricular (${auricularSide})` : 'Occiput (Both)';
      summary = `VAGUS SCREEN & RESET:\n- Reflex Point: ${reflexLabel}\n- Dysfunctional Function: ${selectedFunction}\n- Organ Pulse: ${pulseSide} Hand (${pulseDepth})\n- Selected Organ: ${selectedOrgan}\n- Associated Spinal: ${selectedAssociation}\n- Muscle: ${assoc?.muscle}\n- Lovett-Brother: ${assoc?.reciprocatingSegment}\n- Correction: ${breathingPattern} for ${30 - correctionTime}s\n- Status: ${isCleared ? 'Cleared/Balanced' : 'In Progress'}`;
    }
    
    const currentNotes = initialNotes ? `${initialNotes}\n\n${summary}` : summary;
    await onSaveField('vagus_nerve_notes', currentNotes);
    onUpdate();
  };

  const currentOrgans = HAND_REFLEXOLOGY[pulseSide][pulseDepth];

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-900">Vagus Nerve Protocol</CardTitle>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => setMode('stimulation')}
                  className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all", mode === 'stimulation' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500")}
                >
                  Stimulation
                </button>
                <button 
                  onClick={() => setMode('screen')}
                  className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all", mode === 'screen' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500")}
                >
                  Screen & Reset
                </button>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold">
            SNS Stage
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {mode === 'stimulation' ? (
          <>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Target Branch
              </label>
              <ToggleGroup type="single" value={branch} onValueChange={(v) => v && setBranch(v)} className="justify-start gap-2">
                <ToggleGroupItem value="auricular" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-indigo-600 data-[state=on]:text-white border border-slate-200">Auricular</ToggleGroupItem>
                <ToggleGroupItem value="cervical" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-indigo-600 data-[state=on]:text-white border border-slate-200">Cervical</ToggleGroupItem>
                <ToggleGroupItem value="abdominal" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-indigo-600 data-[state=on]:text-white border border-slate-200">Abdominal</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-100">
              <div className="text-5xl font-black text-slate-900 mb-4 font-mono tracking-tighter">{formatTime(timeLeft)}</div>
              <div className="flex gap-3">
                <Button onClick={toggleTimer} variant={isActive ? "outline" : "default"} className={cn("rounded-2xl px-6 h-12 font-bold transition-all", !isActive && "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200")}>
                  {isActive ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                  {isActive ? "Pause" : "Start Stimulation"}
                </Button>
                <Button onClick={resetTimer} variant="ghost" size="icon" className="rounded-2xl h-12 w-12 text-slate-400 hover:text-slate-600"><RotateCcw size={18} /></Button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" /> Signs of Shift
              </label>
              <div className="flex flex-wrap gap-2">
                {SHIFT_SIGNS.map((shift) => (
                  <Badge key={shift.id} variant="outline" onClick={() => toggleShift(shift.id)} className={cn("px-4 py-2 rounded-xl cursor-pointer transition-all border-slate-200 text-sm font-medium", selectedShifts.includes(shift.id) ? "bg-emerald-50 text-white border-emerald-500 shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50")}>
                    {shift.label}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" /> 1. Reflex Point + IM
                </label>
                <div className="space-y-2">
                  <ToggleGroup type="single" value={reflexPoint} onValueChange={(v) => v && setReflexPoint(v)} className="justify-start gap-2">
                    <ToggleGroupItem value="Occiput" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-indigo-600 data-[state=on]:text-white font-bold">Occiput (Both)</ToggleGroupItem>
                    <ToggleGroupItem value="Auricular" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-indigo-600 data-[state=on]:text-white font-bold">Auricular</ToggleGroupItem>
                  </ToggleGroup>
                  {reflexPoint === 'Auricular' && (
                    <ToggleGroup type="single" value={auricularSide} onValueChange={(v) => v && setAuricularSide(v)} className="justify-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <ToggleGroupItem value="Left" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-indigo-500 data-[state=on]:text-white font-bold text-xs">Left Vagus</ToggleGroupItem>
                      <ToggleGroupItem value="Right" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-indigo-500 data-[state=on]:text-white font-bold text-xs">Right Vagus</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Brain size={14} className="text-purple-500" /> 2. Vagal Function
                </label>
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11 font-bold">
                    <SelectValue placeholder="Select dysfunctional pathway..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VAGAL_FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Heart size={14} className="text-rose-500" /> 3. Organ Pulse (Hand Reflexology)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <ToggleGroup type="single" value={pulseSide} onValueChange={(v) => v && setPulseSide(v as any)} className="flex-1">
                    <ToggleGroupItem value="Left" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-bold">Left Hand</ToggleGroupItem>
                    <ToggleGroupItem value="Right" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-bold">Right Hand</ToggleGroupItem>
                  </ToggleGroup>
                  <ToggleGroup type="single" value={pulseDepth} onValueChange={(v) => v && setPulseDepth(v as any)} className="flex-1">
                    <ToggleGroupItem value="Light" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-bold">Light</ToggleGroupItem>
                    <ToggleGroupItem value="Deep" className="flex-1 rounded-xl border border-slate-200 data-[state=on]:bg-rose-600 data-[state=on]:text-white font-bold">Deep</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentOrgans.map((org) => (
                    <Button
                      key={org.name}
                      variant={selectedOrgan === org.name ? "default" : "outline"}
                      onClick={() => {
                        setSelectedOrgan(org.name);
                        setSelectedAssociation(""); // Reset association to trigger auto-select
                      }}
                      className={cn(
                        "h-9 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        selectedOrgan === org.name ? "bg-slate-900 text-white" : "bg-white border-slate-200"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full mr-2", org.color)} />
                      {org.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Search size={14} className="text-indigo-500" /> 4. Associated Spinal Segment
              </label>
              <Select value={selectedAssociation} onValueChange={setSelectedAssociation}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11 font-bold">
                  <SelectValue placeholder={selectedOrgan ? `Select segment for ${selectedOrgan}...` : "Find associated spinal segment..."} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredAssociations.map(a => (
                    <SelectItem key={a.spinalSegment} value={a.spinalSegment}>
                      {a.spinalSegment}: {a.muscle} ({a.organ})
                    </SelectItem>
                  ))}
                  {filteredAssociations.length === 0 && (
                    <SelectItem value="none" disabled>No direct spinal match found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedAssociation && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Muscle to Test</p>
                      <p className="text-lg font-black text-indigo-900">
                        {VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === selectedAssociation)?.muscle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Lovett-Brother Partner</p>
                      <p className="text-lg font-black text-rose-900">
                        {VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === selectedAssociation)?.reciprocatingSegment}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <Wind size={14} /> 5. Correction Phase
                </label>
                <div className="text-2xl font-black text-emerald-700 tabular-nums">{formatTime(correctionTime)}</div>
              </div>
              
              <div className="space-y-4">
                <ToggleGroup type="single" value={breathingPattern} onValueChange={setBreathingPattern} className="justify-start gap-2">
                  <ToggleGroupItem value="Blocked Inhalation" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-emerald-600 data-[state=on]:text-white border border-emerald-200 font-bold text-xs">Blocked Inhalation</ToggleGroupItem>
                  <ToggleGroupItem value="Forced Exhalation" className="rounded-xl px-4 py-2 h-auto data-[state=on]:bg-emerald-600 data-[state=on]:text-white border border-emerald-200 font-bold text-xs">Forced Exhalation</ToggleGroupItem>
                </ToggleGroup>

                <div className="flex gap-3">
                  <Button onClick={toggleCorrectionTimer} variant={isCorrectionActive ? "outline" : "default"} className={cn("flex-1 rounded-2xl h-12 font-bold transition-all", !isCorrectionActive && "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200")}>
                    {isCorrectionActive ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                    {isCorrectionActive ? "Pause" : "Start Correction (15-30s)"}
                  </Button>
                  <Button onClick={resetCorrectionTimer} variant="ghost" size="icon" className="rounded-2xl h-12 w-12 text-emerald-400 hover:text-emerald-600"><RotateCcw size={18} /></Button>
                </div>
                
                <p className="text-[10px] text-emerald-700 font-medium leading-relaxed italic">
                  "Hold Vagal Reflex + Stim Function + Hold Organ Reflex + Medulla Breathing Pattern"
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">6. Re-assess all indicators</span>
              </div>
              <Button 
                variant={isCleared ? "default" : "outline"} 
                size="sm" 
                onClick={() => setIsCleared(!isCleared)}
                className={cn("rounded-xl font-bold", isCleared ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-200")}
              >
                {isCleared ? <CheckCircle2 size={16} className="mr-2" /> : null}
                {isCleared ? "Balanced" : "Mark as Balanced"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Procedure Notes</label>
            <Button variant="ghost" size="sm" onClick={handleAutoPopulate} className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              <Zap size={12} className="mr-1" /> Auto-Populate Summary
            </Button>
          </div>
          <EditableField field="vagus_nerve_notes" label="" value={initialNotes} multiline placeholder="Document stimulation details and client response..." onSave={(field, value) => onSaveField(field, value as string)} className="bg-slate-50/50 border-slate-100 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  );
};

export default VagusNerveProcess;