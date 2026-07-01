
import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Activity, 
  Zap, 
  Search, 
  Brain, 
  Heart, 
  Wind, 
  RefreshCw, 
  Trash2,
  ChevronDown,
  Sparkles,
  MousePointer2,
  Hand
} from 'lucide-react';
import EditableField from '@/components/shared/EditableField';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';
import { VAGUS_ASSOCIATIONS, VAGAL_FUNCTIONS, HAND_REFLEXOLOGY, VAGAL_GLANDS } from '@/data/vagus-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess } from '@/utils/toast';
import MuscleInfoModal from "./MuscleInfoModal";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VagusNerveProcessProps {
  appointmentId: string;
  initialNotes: string | null;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const VagusNerveProcess = ({ appointmentId, initialNotes, onSaveField, onUpdate }: VagusNerveProcessProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [reflexPoint, setReflexPoint] = useState<string>("Occiput");
  const [auricularSide, setAuricularSide] = useState<string>("Left");
  const [vagusSide, setVagusSide] = useState<"Left" | "Right">("Left");
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

  const [selectedMuscleForInfo, setSelectedMuscleForInfo] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const hasNotes = !!initialNotes;

  const correctionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isCorrectionActive && correctionTime > 0) {
      correctionTimerRef.current = setInterval(() => setCorrectionTime((prev) => prev - 1), 1000);
    } else if (correctionTime === 0) {
      setIsCorrectionActive(false);
    }
    return () => { if (correctionTimerRef.current) clearInterval(correctionTimerRef.current); };
  }, [isCorrectionActive, correctionTime]);

  const toggleCorrectionTimer = () => setIsCorrectionActive(!isCorrectionActive);
  const resetCorrectionTimer = () => { setIsCorrectionActive(false); setCorrectionTime(30); };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShowMuscleInfo = (muscleName: string) => {
    setSelectedMuscleForInfo(muscleName);
    setInfoModalOpen(true);
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

  const executeReset = () => {
    setShowResetConfirm(false);
    if (correctionTimerRef.current) clearInterval(correctionTimerRef.current);
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
    showSuccess("Vagus Nerve protocol reset.");
  };

  const handleAutoPopulate = async () => {
    const assoc = VAGUS_ASSOCIATIONS.find(a => a.spinalSegment === selectedAssociation);
    const reflexLabel = reflexPoint === 'Auricular' ? `Auricular (${auricularSide})` : 'Occiput (Both)';
    const challengeLabel = challengeType === 'hand' 
      ? `Organ Pulse: ${pulseSide} Hand (${pulseDepth}) - ${selectedOrgan}`
      : `Gland Challenge: ${selectedGland} (${VAGAL_GLANDS.find(g => g.name === selectedGland)?.reflex})`;
    
    const instruction = selectedOrgan || selectedGland
      ? `Instruction: Hold ${challengeType === 'hand' ? selectedOrgan : selectedGland}${challengeType === 'hand' ? ` (${pulseSide} hand, ${pulseDepth.toLowerCase()})` : ''} with your ${polarity || 'energy'} finger, whilst client does ${breathingPattern || 'selected breathing pattern'}.`
      : '';
    
    const summary = [
      "VAGUS SCREEN & RESET:",
      `- Side: ${vagusSide}`,
      `- Reflex Point: ${reflexLabel}`,
      `- Dysfunctional Function: ${selectedFunction}`,
      `- ${challengeLabel}`,
      `- Polarity: ${polarity || 'Not set'} (finger)`,
      `- Associated Spinal: ${selectedAssociation} (${partnerInfo?.currentOrgan})`,
      `- Muscle: ${assoc?.muscle}`,
      `- Lovett-Brother: ${assoc?.reciprocatingSegment} (${partnerInfo?.partnerOrgan}) - ${partnerInfo?.partnerMuscle}`,
      `- Breathing Pattern: ${breathingPattern || 'Not selected'}`,
      `- ${instruction}`,
      `- Correction: ${breathingPattern} for ${30 - correctionTime}s`,
      `- Status: ${isCleared ? 'Cleared/Balanced' : 'In Progress'}`
    ].join('\n');
    
    const currentNotes = initialNotes ? `${initialNotes}\n\n${summary}` : summary;
    await onSaveField('vagus_nerve_notes', currentNotes);
    onUpdate();
    showSuccess("Vagus Nerve reset logged successfully.");
  };

  const currentOrgans = HAND_REFLEXOLOGY[pulseSide][pulseDepth];

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="bg-muted/50 border-b border-border pb-4 cursor-pointer hover:bg-muted transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Activity size={20} className="text-chart-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Vagus Nerve Process</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary text-primary-foreground">Screen & Reset</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(true)} className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                      <Trash2 size={14} className="mr-1" /> Reset
                    </Button>
                    {hasNotes ? (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">Recorded</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">Pending</span>
                    )}
                    <Badge variant="outline" className="text-muted-foreground">
                      SNS Stage
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={isOpen ? "Collapse Vagus Nerve process" : "Expand Vagus Nerve process"}>
                    <ChevronDown className={cn("h-5 w-5 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Zap size={14} className="text-muted-foreground" /> 1. Side
                </label>
                <ToggleGroup type="single" value={vagusSide} onValueChange={(v) => v && setVagusSide(v as any)} className="justify-start gap-2">
                  <ToggleGroupItem value="Left" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Left</ToggleGroupItem>
                  <ToggleGroupItem value="Right" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Right</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Hand size={14} className="text-muted-foreground" /> 2. Reflex Point
                </label>
                <div className="space-y-2">
                  <ToggleGroup type="single" value={reflexPoint} onValueChange={(v) => v && setReflexPoint(v)} className="justify-start gap-2">
                    <ToggleGroupItem value="Occiput" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Occiput</ToggleGroupItem>
                    <ToggleGroupItem value="Auricular" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Auricular</ToggleGroupItem>
                  </ToggleGroup>
                  {reflexPoint === 'Auricular' && (
                    <ToggleGroup type="single" value={auricularSide} onValueChange={(v) => v && setAuricularSide(v)} className="justify-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <ToggleGroupItem value="Left" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium text-xs">L</ToggleGroupItem>
                      <ToggleGroupItem value="Right" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium text-xs">R</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Brain size={14} className="text-muted-foreground" /> 3. Vagal Function
                </label>
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger className="rounded-xl border-border h-11 font-medium">
                    <SelectValue placeholder="Select function..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VAGAL_FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 p-6 bg-muted rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Heart size={14} className="text-muted-foreground" /> 4. Organ / Gland Challenge
                  </label>
                  <ToggleGroup type="single" value={challengeType} onValueChange={(v) => v && setChallengeType(v as any)} className="bg-background p-1 rounded-xl border border-border">
                    <ToggleGroupItem value="hand" className="rounded-lg px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Hand Reflex</ToggleGroupItem>
                    <ToggleGroupItem value="gland" className="rounded-lg px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Gland Reflex</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {challengeType === 'hand' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex gap-2">
                      <ToggleGroup type="single" value={pulseSide} onValueChange={(v) => v && setPulseSide(v as any)} className="flex-1">
                        <ToggleGroupItem value="Left" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Left Hand</ToggleGroupItem>
                        <ToggleGroupItem value="Right" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Right Hand</ToggleGroupItem>
                      </ToggleGroup>
                      <ToggleGroup type="single" value={pulseDepth} onValueChange={(v) => v && setPulseDepth(v as any)} className="flex-1">
                        <ToggleGroupItem value="Light" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Light</ToggleGroupItem>
                        <ToggleGroupItem value="Deep" className="flex-1 rounded-xl border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground font-medium">Deep</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentOrgans.map((org) => (
                        <Button
                          key={org.name}
                          variant={selectedOrgan === org.name ? "default" : "outline"}
                          onClick={() => {
                            setSelectedOrgan(selectedOrgan === org.name ? "" : org.name);
                            setSelectedGland("");
                          }}
                          className={cn(
                            "h-auto py-2 flex flex-col items-center gap-0.5 rounded-xl transition-all",
                            selectedOrgan === org.name
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", org.color, selectedOrgan === org.name && "ring-1 ring-white/50")} />
                            <span className="text-[10px] font-medium uppercase tracking-widest">{org.name}</span>
                          </div>
                          <span className="text-[7px] font-medium opacity-60 uppercase">{org.position}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-2">
                      {VAGAL_GLANDS.map((gland) => (
                        <Button
                          key={gland.name}
                          variant={selectedGland === gland.name ? "default" : "outline"}
                          onClick={() => {
                            setSelectedGland(selectedGland === gland.name ? "" : gland.name);
                            setSelectedOrgan("");
                          }}
                          className={cn(
                            "h-auto py-3 flex flex-col items-center gap-1 rounded-xl transition-all",
                            selectedGland === gland.name ? "bg-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                          )}
                        >
                          <span className="text-[10px] font-medium uppercase tracking-widest">{gland.name}</span>
                          <span className="text-[8px] font-medium opacity-70 text-center leading-tight">{gland.reflex}</span>
                        </Button>
                      ))}
                    </div>
                    
                    {selectedGland ? (
                      <div className="bg-muted border border-border rounded-2xl p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Sparkles size={20} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Reflex Challenge</p>
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {VAGAL_GLANDS.find(g => g.name === selectedGland)?.reflex}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-2 italic">Challenge this reflex while testing the indicator muscle.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                        <MousePointer2 size={24} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">Select a gland to see <br/>its reflex challenge</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Zap size={14} className="text-muted-foreground" /> 5. Energy Polarity
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={polarity === 'Energy OUT' ? "default" : "outline"}
                    className={cn(
                      "h-20 flex-col gap-1.5 rounded-2xl transition-all",
                      polarity === 'Energy OUT' ? "bg-chart-destructive hover:bg-chart-destructive/90 text-destructive-foreground shadow-sm ring-2 ring-chart-destructive/20" : "hover:border-border hover:bg-destructive/5"
                    )}
                    onClick={() => setPolarity(polarity === 'Energy OUT' ? null : 'Energy OUT')}
                    aria-label="Set energy polarity to Energy OUT"
                  >
                    <span className="font-semibold text-sm">Energy OUT (−)</span>
                    <span className="text-[9px] font-medium opacity-80 uppercase tracking-wider">Energy OUT Finger</span>
                    <span className="text-[7px] font-light opacity-60">(practitioner's output hand)</span>
                  </Button>
                  <Button 
                    variant={polarity === 'Energy IN' ? "default" : "outline"}
                    className={cn(
                      "h-20 flex-col gap-1.5 rounded-2xl transition-all",
                      polarity === 'Energy IN' ? "bg-chart-primary hover:bg-chart-primary/90 shadow-sm ring-2 ring-chart-primary/20" : "hover:border-border hover:bg-primary/5"
                    )}
                    onClick={() => setPolarity(polarity === 'Energy IN' ? null : 'Energy IN')}
                    aria-label="Set energy polarity to Energy IN"
                  >
                    <span className="font-semibold text-sm">Energy IN (+)</span>
                    <span className="text-[9px] font-medium opacity-80 uppercase tracking-wider">Energy IN Finger</span>
                    <span className="text-[7px] font-light opacity-60">(practitioner's input hand)</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Search size={14} className="text-muted-foreground" /> 6. Associated Spinal Segment
                </label>
                <Select value={selectedAssociation} onValueChange={setSelectedAssociation}>
                  <SelectTrigger className="rounded-xl border-border h-11 font-medium">
                    <SelectValue placeholder={(selectedOrgan || selectedGland) ? `Select segment for ${selectedOrgan || selectedGland}...` : "Find associated spinal segment..."} />
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
                {partnerInfo && (
                  <div className="p-4 bg-muted rounded-2xl border border-border animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-1">Muscle to Test</p>
                        <button 
                          onClick={() => handleShowMuscleInfo(partnerInfo.currentMuscle)}
                          className="text-lg font-semibold text-foreground hover:underline decoration-border underline-offset-4 text-left block"
                        >
                          {partnerInfo.currentMuscle}
                        </button>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Organ: {partnerInfo.currentOrgan}</p>
                        <p className="text-[10px] font-medium text-muted-foreground/70">Segment: {selectedAssociation}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-1">Lovett-Brother Partner</p>
                        <button 
                          onClick={() => handleShowMuscleInfo(partnerInfo.partnerMuscle)}
                          className="text-lg font-semibold text-foreground hover:underline decoration-border underline-offset-4 text-right block w-full"
                        >
                          {partnerInfo.partnerMuscle}
                        </button>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Organ: {partnerInfo.partnerOrgan}</p>
                        <p className="text-[10px] font-medium text-muted-foreground/70">Segment: {partnerInfo.partnerSegment}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6 bg-muted rounded-2xl border border-border">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Search size={14} /> 7. Breathing Pattern — Test & Select
                </label>
                <div className="p-4 bg-background rounded-2xl border border-border space-y-3">
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Test/challenge the client to determine which breathing pattern creates a change in the indicator muscle. Once identified, select it below:
                  </p>
                  <ToggleGroup type="single" value={breathingPattern} onValueChange={setBreathingPattern} className="justify-start gap-2">
                    <ToggleGroupItem value="Blocked Inhalation" className="flex-1 rounded-xl px-4 py-3 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border border-border font-medium text-xs data-[state=on]:shadow-sm">Blocked Inhalation</ToggleGroupItem>
                    <ToggleGroupItem value="Forced Exhalation" className="flex-1 rounded-xl px-4 py-3 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border border-border font-medium text-xs data-[state=on]:shadow-sm">Forced Exhalation</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <div className="space-y-4 p-6 bg-muted rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Wind size={14} /> 8. Correction Phase
                  </label>
                  <div className="text-2xl font-semibold text-foreground tabular-nums">{formatTime(correctionTime)}</div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-2xl border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Hand size={16} className="text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground uppercase tracking-tight">Instruction:</p>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                      Hold <span className="font-semibold text-foreground underline decoration-border underline-offset-4">{challengeType === 'hand' ? selectedOrgan : selectedGland}</span>{challengeType === 'hand' ? ` (${pulseSide} hand, ${pulseDepth.toLowerCase()})` : ''} with your{' '}
                      <span className="font-semibold text-foreground underline decoration-border underline-offset-4">{polarity === 'Energy OUT' ? 'Energy OUT' : polarity === 'Energy IN' ? 'Energy IN' : 'energy'}</span> finger,{' '}
                      whilst client does{' '}
                      <span className="font-semibold text-foreground underline decoration-border underline-offset-4">{breathingPattern || 'selected breathing pattern'}</span>.
                    </p>
                    {(!selectedOrgan && !selectedGland) || !polarity || !breathingPattern ? (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="text-[10px] font-medium text-amber-700">
                          Complete steps 4–7 to see full instruction
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={toggleCorrectionTimer} variant={isCorrectionActive ? "outline" : "default"} className={cn("flex-1 rounded-2xl h-12 font-semibold transition-all", !isCorrectionActive && "bg-primary hover:bg-primary/90")}>
                      {isCorrectionActive ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                      {isCorrectionActive ? "Pause" : "Start Correction (30s)"}
                    </Button>
                    <Button onClick={resetCorrectionTimer} variant="ghost" size="icon" className="rounded-2xl h-12 w-12 text-muted-foreground hover:text-foreground" aria-label="Reset correction timer"><RotateCcw size={18} /></Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground/70 font-medium leading-relaxed italic">
                    "Hold Vagal Reflex + Stim Function + Hold Organ/Gland Reflex + Medulla Breathing Pattern"
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">9. Re-assess all indicators</span>
                </div>
                <Button 
                  variant={isCleared ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setIsCleared(!isCleared)}
                  className={cn("rounded-xl font-medium", isCleared ? "bg-primary hover:bg-primary/90" : "border-border")}
                  aria-label={isCleared ? "Mark as not balanced" : "Mark as balanced"}
                >
                  {isCleared ? <CheckCircle2 size={16} className="mr-2" /> : null}
                  {isCleared ? "Balanced (tap to undo)" : "Mark as Balanced"}
                </Button>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Procedure Notes</label>
                  <Button variant="ghost" size="sm" onClick={handleAutoPopulate} className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Zap size={12} className="mr-1" /> Auto-Populate Summary
                  </Button>
                </div>
                <EditableField field="vagus_nerve_notes" label="" value={initialNotes} multiline placeholder="Document stimulation details and client response..." onSave={(field, value) => onSaveField(field, value as string)} className="bg-muted/50 border-border rounded-2xl" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      <MuscleInfoModal 
        muscleName={selectedMuscleForInfo}
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
      />

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Vagus Nerve protocol?"
        description="This will clear all selections and timer state for the Vagus Nerve process."
        confirmLabel="Reset"
        onConfirm={executeReset}
      />
    </>
  );
};

export default VagusNerveProcess;
