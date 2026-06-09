
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Activity, 
  Heart, 
  Brain, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import { VAGUS_ASSOCIATIONS, VAGAL_FUNCTIONS, HAND_REFLEXOLOGY, VAGAL_GLANDS } from '@/data/vagus-data';
import { showSuccess, showError } from '@/utils/toast';
import DocInput from './DocInput';

interface EaseSectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
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

const STIMULATION_METHODS: Record<string, { label: string; desc: string }> = {
  'auricular': {
    label: 'Auricular Branch Reset',
    desc: 'Stimulate the tragus or concha of the ear using gentle massage, cold water, or microcurrent.'
  },
  'cervical': {
    label: 'Cervical Branch Reset',
    desc: 'Apply gentle carotid sinus massage, neck stretching, or a cold compress to the side of the neck.'
  },
  'abdominal': {
    label: 'Abdominal Branch Reset',
    desc: 'Perform deep diaphragmatic breathing, gentle visceral massage, or gut-directed stimulation.'
  },
  'pharyngeal': {
    label: 'Pharyngeal/Laryngeal Reset',
    desc: 'Engage the vocal cords and throat muscles via gargling, humming, singing, or gag reflex stimulation.'
  }
};

const EaseSection = ({ appointment, saveField }: EaseSectionProps) => {
  // Vagus Interactive State
  const [vagusMode, setVagusMode] = useState<'stimulation' | 'screen'>('stimulation');
  const [vagusBranch, setVagusBranch] = useState<string>('auricular');
  const [vagusTimeLeft, setVagusTimeLeft] = useState(60);
  const [vagusTimerActive, setVagusTimerActive] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  
  const [vagusSide, setVagusSide] = useState<"Left" | "Right">("Left");
  const [reflexPoint, setReflexPoint] = useState<string>("Occiput");
  const [auricularSide, setAuricularSide] = useState<string>("Left");
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  
  const [challengeType, setChallengeType] = useState<'hand' | 'gland'>('hand');
  const [pulseSide, setPulseSide] = useState<"Right" | "Left">("Right");
  const [pulseDepth, setPulseDepth] = useState<"Light" | "Deep">("Light");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("");
  const [selectedGland, setSelectedGland] = useState<string>("");
  const [polarity, setPolarity] = useState<'Energy IN' | 'Energy OUT' | null>(null);
  
  const [selectedAssociation, setSelectedAssociation] = useState<string>("");
  const [breathingPattern, setBreathingPattern] = useState<string>("");
  const [correctionTime, setCorrectionTime] = useState(30);
  const [isCorrectionActive, setIsCorrectionActive] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const correctionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timers
  useEffect(() => {
    if (vagusTimerActive && vagusTimeLeft > 0) {
      timerRef.current = setInterval(() => setVagusTimeLeft((prev) => prev - 1), 1000);
    } else if (vagusTimeLeft === 0) {
      setVagusTimerActive(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [vagusTimerActive, vagusTimeLeft]);

  useEffect(() => {
    if (isCorrectionActive && correctionTime > 0) {
      correctionTimerRef.current = setInterval(() => setCorrectionTime((prev) => prev - 1), 1000);
    } else if (correctionTime === 0) {
      setIsCorrectionActive(false);
    }
    return () => { if (correctionTimerRef.current) clearInterval(correctionTimerRef.current); };
  }, [isCorrectionActive, correctionTime]);

  const toggleVagusTimer = () => setVagusTimerActive(!vagusTimerActive);
  const resetVagusTimer = () => { setVagusTimerActive(false); setVagusTimeLeft(60); };

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

  const filteredAssociations = useMemo(() => {
    const target = challengeType === 'hand' ? selectedOrgan : selectedGland;
    if (!target) return VAGUS_ASSOCIATIONS;
    
    const searchTerms = target.split('/').map(s => s.trim().toLowerCase());
    
    return VAGUS_ASSOCIATIONS.filter(assoc => {
      const organName = assoc.organ.toLowerCase();
      return searchTerms.some(term => organName.includes(term));
    });
  }, [selectedOrgan, selectedGland, challengeType]);

  useEffect(() => {
    if (filteredAssociations.length === 1) {
      setSelectedAssociation(filteredAssociations[0].spinalSegment);
    } else if (filteredAssociations.length === 0) {
      setSelectedAssociation("");
    }
  }, [filteredAssociations]);

  const partnerInfo = useMemo(() => {
    if (!selectedAssociation) return null;
    const current = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === selectedAssociation);
    if (!current) return null;
    
    const partner = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === current.reciprocatingSegment);
    return {
      currentMuscle: current.muscle,
      currentOrgan: current.organ,
      partnerSegment: current.reciprocatingSegment,
      partnerMuscle: partner?.muscle || "Unknown",
      partnerOrgan: partner?.organ || "Unknown"
    };
  }, [selectedAssociation]);

  const handleResetProtocol = () => {
    if (!confirm("Reset Vagus Nerve protocol state?")) return;
    setVagusMode('stimulation');
    setVagusBranch('auricular');
    setVagusTimeLeft(60);
    setVagusTimerActive(false);
    setSelectedShifts([]);
    setReflexPoint("Occiput");
    setAuricularSide("Left");
    setVagusSide("Left");
    setSelectedFunction("");
    setChallengeType('hand');
    setSelectedOrgan("");
    setSelectedGland("");
    setPolarity(null);
    setSelectedAssociation("");
    setBreathingPattern("");
    setCorrectionTime(30);
    setIsCorrectionActive(false);
    setIsCleared(false);
  };

  const handleAutoPopulate = async () => {
    let summary = "";
    const stimHeader = "VAGUS STIMULATION:";
    const screenHeader = "VAGUS SCREEN & RESET:";

    if (vagusMode === 'stimulation') {
      const methodInfo = STIMULATION_METHODS[vagusBranch];
      const shifts = selectedShifts.map(s => SHIFT_SIGNS.find(ss => ss.id === s)?.label).join(', ');
      summary = `${stimHeader}\n- Reset Type: ${methodInfo?.label || vagusBranch}\n- Description: ${methodInfo?.desc || ''}\n- Shifts Observed: ${shifts || 'None observed'}\n- Duration: ${60 - vagusTimeLeft}s`;
    } else {
      const assoc = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === selectedAssociation);
      const reflexLabel = reflexPoint === 'Auricular' ? `Auricular (${auricularSide})` : 'Occiput (Both)';
      const challengeLabel = challengeType === 'hand' 
        ? `Organ Pulse: ${pulseSide} Hand (${pulseDepth}) - ${selectedOrgan}`
        : `Gland Challenge: ${selectedGland} (${VAGAL_GLANDS.find(g => g.name === selectedGland)?.reflex})`;
      
      summary = `${screenHeader}\n- Side: ${vagusSide}\n- Reflex Point: ${reflexLabel}\n- Dysfunctional Function: ${selectedFunction}\n- ${challengeLabel}\n- Polarity: ${polarity || 'Not set'}\n- Associated Spinal: ${selectedAssociation} (${partnerInfo?.currentOrgan})\n- Muscle: ${assoc?.muscle}\n- Lovett-Brother: ${assoc?.reciprocatingSegment} (${partnerInfo?.partnerOrgan}) - ${partnerInfo?.partnerMuscle}\n- Correction: ${breathingPattern} for ${30 - correctionTime}s\n- Status: ${isCleared ? 'Cleared/Balanced' : 'In Progress'}`;
    }
    
    const currentNotes = appointment.vagus_nerve_notes ? `${appointment.vagus_nerve_notes}\n\n${summary}` : summary;
    await saveField('vagus_nerve_notes', currentNotes);
    showSuccess("Vagus Nerve reset logged successfully.");
  };

  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  const currentOrgans = HAND_REFLEXOLOGY[pulseSide][pulseDepth];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Harmonic Rocking & T1 Reset */}
        <div className="space-y-6">
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider">Harmonic Rocking</h4>
              <Checkbox 
                checked={!!appointment.harmonic_rocking_notes}
                className="border-black rounded-none data-[state=checked]:bg-black" 
              />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.harmonic_rocking_notes} 
              field="harmonic_rocking_notes" 
              placeholder="Client response..." 
              onChange={handleFieldChange}
            />
          </div>
          
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider">T1 Sympathetic Reset</h4>
              <Checkbox 
                checked={!!appointment.t1_reset_notes}
                className="border-black rounded-none data-[state=checked]:bg-black" 
              />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.t1_reset_notes} 
              field="t1_reset_notes" 
              placeholder="Side, Psoas response..." 
              onChange={handleFieldChange}
            />
          </div>
        </div>

        {/* Right Column: Diaphragm Reset & Vagus Nerve Process */}
        <div className="space-y-6">
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider">Diaphragm Reset</h4>
              <Checkbox 
                checked={!!appointment.diaphragm_reset_notes}
                className="border-black rounded-none data-[state=checked]:bg-black" 
              />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.diaphragm_reset_notes} 
              field="diaphragm_reset_notes" 
              placeholder="Tender points, breath shift..." 
              onChange={handleFieldChange}
            />
          </div>

          {/* Interactive Vagus Nerve Process Box */}
          <div className="p-6 border border-black space-y-6 bg-muted/50">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider">Vagus Nerve Process</h4>
                <div className="flex gap-1">
                  <button 
                    type="button"
                    onClick={() => setVagusMode('stimulation')}
                    className={cn("text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm transition-all", vagusMode === 'stimulation' ? "bg-foreground text-background" : "bg-slate-200 text-slate-600")}
                  >
                    Stim
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVagusMode('screen')}
                    className={cn("text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm transition-all", vagusMode === 'screen' ? "bg-foreground text-background" : "bg-slate-200 text-slate-600")}
                  >
                    Screen
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleResetProtocol} className="text-[10px] font-semibold text-chart-destructive uppercase tracking-wider hover:underline">
                  Reset
                </button>
                <Checkbox 
                  checked={!!appointment.vagus_nerve_notes}
                  className="border-black rounded-none data-[state=checked]:bg-black" 
                />
              </div>
            </div>

            {vagusMode === 'stimulation' ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Select Reset Type</label>
                  <select 
                    value={vagusBranch} 
                    onChange={(e) => setVagusBranch(e.target.value)}
                    className="w-full bg-transparent border-b border-border py-1 text-xs font-medium focus:border-black outline-none"
                  >
                    {Object.entries(STIMULATION_METHODS).map(([key, method]) => (
                      <option key={key} value={key}>{method.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground italic leading-tight mt-1">
                    {STIMULATION_METHODS[vagusBranch]?.desc}
                  </p>
                </div>

                {/* Compact Timer */}
                <div className="p-3 bg-white border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Timer</span>
                    <span className="text-lg font-semibold tabular-nums">{formatTime(vagusTimeLeft)}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" onClick={toggleVagusTimer} className="h-7 px-3 bg-foreground text-background hover:bg-foreground/90 rounded-none text-[10px] font-semibold uppercase">
                      {vagusTimerActive ? <Pause size={10} /> : <Play size={10} />}
                    </Button>
                    <Button type="button" size="sm" onClick={resetVagusTimer} className="h-7 w-7 p-0 rounded-none border border-border bg-white text-slate-600">
                      <RotateCcw size={10} />
                    </Button>
                  </div>
                </div>

                {/* Signs of Shift */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Signs of Shift</label>
                  <div className="flex flex-wrap gap-1">
                    {SHIFT_SIGNS.map((shift) => (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => toggleShift(shift.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider border transition-all",
                          selectedShifts.includes(shift.id) ? "bg-foreground text-background border-black" : "bg-white text-muted-foreground border-border"
                        )}
                      >
                        {shift.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">1. Side</label>
                    <select value={vagusSide} onChange={(e) => setVagusSide(e.target.value as any)} className="w-full bg-transparent border-b border-border py-1 font-medium">
                      <option value="Left">Left</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">2. Reflex Point</label>
                    <select value={reflexPoint} onChange={(e) => setReflexPoint(e.target.value)} className="w-full bg-transparent border-b border-border py-1 font-medium">
                      <option value="Occiput">Occiput</option>
                      <option value="Auricular">Auricular</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">3. Vagal Function</label>
                  <select value={selectedFunction} onChange={(e) => setSelectedFunction(e.target.value)} className="w-full bg-transparent border-b border-border py-1 font-medium">
                    <option value="">Select function...</option>
                    {VAGAL_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="p-3 bg-white border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">4. Challenge Type</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setChallengeType('hand')} className={cn("text-[7px] font-semibold uppercase px-1.5 py-0.5 rounded-sm hover:bg-muted", challengeType === 'hand' ? "bg-foreground text-background" : "bg-muted")}>Hand</button>
                      <button type="button" onClick={() => setChallengeType('gland')} className={cn("text-[7px] font-semibold uppercase px-1.5 py-0.5 rounded-sm hover:bg-muted", challengeType === 'gland' ? "bg-foreground text-background" : "bg-muted")}>Gland</button>
                    </div>
                  </div>

                  {challengeType === 'hand' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select value={pulseSide} onChange={(e) => setPulseSide(e.target.value as any)} className="bg-transparent border-b border-border py-0.5 font-medium text-[10px]">
                          <option value="Left">Left Hand</option>
                          <option value="Right">Right Hand</option>
                        </select>
                        <select value={pulseDepth} onChange={(e) => setPulseDepth(e.target.value as any)} className="bg-transparent border-b border-border py-0.5 font-medium text-[10px]">
                          <option value="Light">Light</option>
                          <option value="Deep">Deep</option>
                        </select>
                      </div>
                      <select value={selectedOrgan} onChange={(e) => { setSelectedOrgan(e.target.value); setSelectedGland(""); }} className="w-full bg-transparent border-b border-border py-1 font-medium text-[10px]">
                        <option value="">Select Organ...</option>
                        {currentOrgans.map(org => <option key={org.name} value={org.name}>{org.name} ({org.position})</option>)}
                      </select>
                    </div>
                  ) : (
                    <select value={selectedGland} onChange={(e) => { setSelectedGland(e.target.value); setSelectedOrgan(""); }} className="w-full bg-transparent border-b border-border py-1 font-medium text-[10px]">
                      <option value="">Select Gland...</option>
                      {VAGAL_GLANDS.map(g => <option key={g.name} value={g.name}>{g.name} ({g.reflex})</option>)}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">5. Polarity</label>
                    <select value={polarity || ""} onChange={(e) => setPolarity(e.target.value as any || null)} className="w-full bg-transparent border-b border-border py-1 font-medium text-[10px]">
                      <option value="">Select Polarity...</option>
                      <option value="Energy IN">Energy IN (+)</option>
                      <option value="Energy OUT">Energy OUT (-)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">6. Spinal Segment</label>
                    <select value={selectedAssociation} onChange={(e) => setSelectedAssociation(e.target.value)} className="w-full bg-transparent border-b border-border py-1 font-medium text-[10px]">
                      <option value="">Select Segment...</option>
                      {filteredAssociations.map(a => (
                        <option key={a.spinalSegment} value={a.spinalSegment}>{a.spinalSegment}: {a.muscle}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {partnerInfo && (
                  <div className="p-2.5 bg-muted border border-border text-[10px] space-y-1">
                    <p><strong>Muscle:</strong> {partnerInfo.currentMuscle} ({partnerInfo.currentOrgan})</p>
                    <p><strong>Lovett Partner:</strong> {partnerInfo.partnerSegment} - {partnerInfo.partnerMuscle} ({partnerInfo.partnerOrgan})</p>
                  </div>
                )}

                <div className="p-3 bg-muted border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">7. Correction</span>
                    <span className="font-mono font-semibold text-[10px]">{formatTime(correctionTime)}</span>
                  </div>
                  <select value={breathingPattern} onChange={(e) => setBreathingPattern(e.target.value)} className="w-full bg-transparent border-b border-border py-0.5 font-medium text-[10px]">
                    <option value="">Select Breathing...</option>
                    <option value="Blocked Inhalation">Blocked Inhalation</option>
                    <option value="Forced Exhalation">Forced Exhalation</option>
                  </select>
                  <div className="flex gap-1.5">
                    <Button type="button" size="sm" onClick={toggleCorrectionTimer} className="flex-1 h-7 bg-foreground text-background hover:bg-foreground/90 rounded-none text-[10px] font-semibold uppercase">
                      {isCorrectionActive ? "Pause" : "Start"}
                    </Button>
                    <Button type="button" size="sm" onClick={resetCorrectionTimer} className="h-7 w-7 p-0 rounded-none border border-border bg-white text-slate-600">
                      <RotateCcw size={10} />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">8. Re-assess</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium">Balanced?</span>
                    <Checkbox checked={isCleared} onCheckedChange={(checked) => setIsCleared(!!checked)} className="border-black rounded-none data-[state=checked]:bg-black" />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-end">
              <Button 
                type="button"
                onClick={handleAutoPopulate}
                className="h-8 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-none text-[10px] font-semibold uppercase tracking-wider"
              >
                Log Vagus Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vagus Nerve Notes Field */}
      <div className="mt-6">
        <DocInput 
          label="Vagus Nerve Process Notes" 
          value={appointment.vagus_nerve_notes} 
          field="vagus_nerve_notes" 
          placeholder="Detailed findings, stimulation results, and clinical observations..." 
          multiline 
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default EaseSection;