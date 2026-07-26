
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, RefreshCw, Eye, Dumbbell,
  ChevronRight, ChevronLeft, Droplets, 
  AlertTriangle, ArrowRight, Heart, ImageIcon,
  ShieldAlert, Hand, PlayCircle, Baby, ClipboardCheck,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NociceptiveThreatAssessment from './NociceptiveThreatAssessment';
import EfferentBrainIntegration from './EfferentBrainIntegration';
import MechanoreceptiveProcess from './MechanoreceptiveProcess';
import EmotionalIntegrationProcess from './EmotionalIntegrationProcess';
import VestibularProcess from './VestibularProcess';
import { supabase } from "@/integrations/supabase/client";

import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { getMuscleInfo } from '@/data/muscle-info-data';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { EYE_POSITIONS } from '@/data/emotion-data';
import { safeParse } from '@/utils/safe-json';
import { format } from 'date-fns';

type Step = 
  | 'SELECT_START'
  | 'AFFERENT_SELECT'
  | 'EFFERENT_SELECT'
  | 'MECHANO_PROCESS'
  | 'VESTIBULAR_PROCESS'
  | 'NOCICEPTIVE_PROCESS'
  | 'EFFERENT_PROCESS'
  | 'EMOTIONS_PROCESS'
  | 'COMPLETION';

interface PathwayLogicWizardProps {
  onSave: (summary: string) => void;
  onClearItem?: (itemName: string) => void;
  onCancel?: () => void;
  priorityPattern?: string | null;
  initialFinding?: string | null;
  appointmentId?: string;
}

const DYSFUNCTIONAL_STATUSES = ['Inhibited', 'Hypertonic', 'Switching', 'Inhibition'];

const STEP_LABELS: Record<Step, string> = {
  SELECT_START: 'Select',
  AFFERENT_SELECT: 'Afferent',
  EFERENT_SELECT: 'Efferent',
  MECHANO_PROCESS: 'Mechano',
  VESTIBULAR_PROCESS: 'Vestibular',
  NOCICEPTIVE_PROCESS: 'Nociceptive',
  EFFERENT_PROCESS: 'Brain',
  EMOTIONS_PROCESS: 'Emotion',
  COMPLETION: 'Done',
};

const PathwayLogicWizard = ({ onSave, onClearItem, onCancel, priorityPattern, initialFinding, appointmentId }: PathwayLogicWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_START');
  const [history, setHistory] = useState<Step[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string>(initialFinding || "");
  const [customText, setCustomText] = useState<string>("");
  const [muscleFindings, setMuscleFindings] = useState<string[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(false);
  const [showClinicalTip, setShowClinicalTip] = useState(false);
  
  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [correctionSummary, setCorrectionSummary] = useState<string>("");

  const onOpenLigamentCharts = () => setLigamentModalOpen(true);

  const isSandbox = !appointmentId || appointmentId.includes('00000000');

  useEffect(() => {
    if (initialFinding) {
      setSelectedFinding(initialFinding);
    } else if (isSandbox) {
      setSelectedFinding('CUSTOM');
    }
  }, [initialFinding, isSandbox]);

  useEffect(() => {
    const fetchMuscles = async () => {
      if (isSandbox) return;
      setLoadingMuscles(true);
      try {
        const { data, error } = await supabase
          .from('muscle_tests')
          .select('muscle_name, status')
          .eq('appointment_id', appointmentId);
        if (!error && data) {
          const dysfunctional = data
            .filter(m => DYSFUNCTIONAL_STATUSES.includes(m.status))
            .map(m => m.muscle_name);
          setMuscleFindings(dysfunctional);
        }
      } catch (err) {
        console.error("Error fetching muscles for wizard:", err);
      } finally {
        setLoadingMuscles(false);
      }
    };
    fetchMuscles();
  }, [appointmentId, isSandbox]);

  const effectiveItem = selectedFinding === 'CUSTOM' ? customText : selectedFinding;

  const { inhibitedItems, hasAnyTested } = useMemo(() => {
    const items = new Set<string>();
    const baseNames = new Map<string, Set<'L' | 'R'>>();
    let hasAnyTested = false;
    
    if (priorityPattern) {
      try {
        const parsed = safeParse(priorityPattern, {});
        Object.values(parsed).forEach((category: any) => {
          if (Object.keys(category).length > 0) hasAnyTested = true;
          Object.entries(category).forEach(([name, status]) => {
            if (DYSFUNCTIONAL_STATUSES.includes(status as string)) {
              items.add(name);
              const match = name.match(/(.+) \(([LR])\)$/);
              if (match) {
                const base = match[1];
                const side = match[2] as 'L' | 'R';
                if (!baseNames.has(base)) baseNames.set(base, new Set());
                baseNames.get(base)!.add(side);
              }
            }
          });
        });
      } catch (e) {}
    }

    muscleFindings.forEach(name => {
      hasAnyTested = true;
      items.add(name);
      const match = name.match(/(.+) \(([LR])\)$/);
      if (match) {
        const base = match[1];
        const side = match[2] as 'L' | 'R';
        if (!baseNames.has(base)) baseNames.set(base, new Set());
        baseNames.get(base)!.add(side);
      }
    });

    baseNames.forEach((sides, base) => {
      if (sides.has('L') && sides.has('R')) {
        items.add(`${base} (Bilateral)`);
      }
    });

    if (initialFinding && initialFinding !== 'CUSTOM') {
      items.add(initialFinding);
    }

    return { inhibitedItems: Array.from(items).sort(), hasAnyTested };
  }, [priorityPattern, initialFinding, muscleFindings]);

  useEffect(() => {
    const fetchLigamentImages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('ligament_images').select('category, image_index, image_url').eq('user_id', user.id);
      if (data) {
        const imageMap: Record<string, (string | null)[]> = {};
        data.forEach(item => {
          if (!imageMap[item.category]) imageMap[item.category] = [];
          imageMap[item.category][item.image_index] = item.image_url ? `${item.image_url}?t=${Date.now()}` : null;
        });
        setLigamentImages(imageMap);
      }
    };
    fetchLigamentImages();
  }, []);

  const goToStep = (nextStep: Step) => {
    setHistory([...history, step]);
    setStep(nextStep);
    setShowClinicalTip(false);
  };

  const goBack = () => {
    const lastStep = history.pop();
    if (lastStep) {
      setStep(lastStep);
      setHistory([...history]);
    } else {
      onCancel?.();
    }
  };

  const resetWizard = () => {
    setStep('SELECT_START');
    setHistory([]);
    setSelectedFinding(isSandbox ? 'CUSTOM' : "");
    setCustomText("");
    setShowClinicalTip(false);
  };

  const handleSave = (summary: string) => {
    if (effectiveItem && selectedFinding !== 'CUSTOM' && onClearItem) {
      if (effectiveItem.includes('(Bilateral)')) {
        const base = effectiveItem.replace(' (Bilateral)', '');
        onClearItem(`${base} (L)`);
        onClearItem(`${base} (R)`);
      } else {
        onClearItem(effectiveItem);
      }
    }
    setCorrectionSummary(summary);
    onSave(summary);
    setStep('COMPLETION');
    setHistory([]);
  };

  const handleInhibited = (summary: string) => {
    onSave(summary);
    setStep('SELECT_START');
    setHistory([]);
  };

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
        logic: `${primitive.category} Category`,
        location: primitive.inhibitionPattern,
        stimulus: primitive.stimulus,
        extra: "Usually 1-3 corrections needed for integration."
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
        logic: `${brainPoint.lateralization} Logic`,
        location: brainPoint.location,
        stimulus: brainPoint.stimulus || brainPoint.technique,
        extra: brainPoint.nuclei ? `Nuclei: ${brainPoint.nuclei}` : null
      };
    }

    const muscle = getMuscleInfo(cleanItem);
    if (muscle && muscle.meridian !== 'General') {
      return {
        type: 'Muscle',
        icon: Dumbbell,
        title: muscle.name,
        content: muscle.clinicalIndications || muscle.description || "Muscle inhibition detected.",
        logic: `Meridian: ${muscle.meridian}`,
        location: muscle.neurolymphatic || "Check NL points",
        stimulus: muscle.testingPosition || "Standard test",
        extra: muscle.brainstemControl ? `Control: ${muscle.brainstemControl}` : null
      };
    }

    return null;
  }, [effectiveItem]);

  const renderStep = () => {
    switch (step) {
      case 'SELECT_START':
        if (inhibitedItems.length === 0 && !isSandbox && selectedFinding !== 'CUSTOM') {
          return (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                hasAnyTested ? "bg-chart-emerald/10 text-chart-emerald" : "bg-muted text-muted-foreground"
              )}>
                {hasAnyTested ? <CheckCircle2 size={24} /> : <ClipboardCheck size={24} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  {hasAnyTested ? "All findings clear" : "Align phase pending"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  {hasAnyTested 
                    ? `All findings tested clear — no corrections required. (${format(new Date(), "h:mm a")})`
                    : "Complete the Align phase first to populate correction targets."}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedFinding('CUSTOM')}
                className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                + Manual Entry
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Finding to Correct</label>
              <Select value={selectedFinding} onValueChange={(v) => setSelectedFinding(v)}>
                <SelectTrigger className="h-10 rounded-lg border-border bg-card text-sm font-medium">
                  <SelectValue placeholder={loadingMuscles ? "Loading..." : "Select finding..."} />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-border bg-card">
                  {inhibitedItems.map(item => (
                    <SelectItem key={item} value={item} className={cn(
                      "py-2 text-sm font-medium",
                      item.includes('(Bilateral)') && "text-chart-primary"
                    )}>
                      {item}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM" className="py-2 text-sm font-medium text-chart-primary">+ Custom Entry</SelectItem>
                </SelectContent>
              </Select>
              {selectedFinding === 'CUSTOM' && (
                <Input 
                  placeholder="Enter custom entry point..." 
                  className="h-9 rounded-lg text-sm font-medium border-border animate-in slide-in-from-top-1 duration-200"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Correction Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => goToStep('AFFERENT_SELECT')} 
                  className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={14} className="text-chart-primary" />
                    <span className="text-[9px] font-medium uppercase tracking-wider text-chart-primary">Bottom-Up</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Afferent</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sensory input</p>
                </button>

                <button 
                  onClick={() => goToStep('EFFERENT_SELECT')} 
                  className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-muted-foreground" />
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Top-Down</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Efferent</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Processing</p>
                </button>
              </div>
            </div>

            {clinicalTip && (
              <div className="border-t border-border pt-3">
                <button
                  onClick={() => setShowClinicalTip(!showClinicalTip)}
                  className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <clinicalTip.icon size={12} />
                  <span>Clinical Insight: {clinicalTip.title}</span>
                  <ChevronDown size={12} className={cn("ml-auto transition-transform", showClinicalTip && "rotate-180")} />
                </button>
                {showClinicalTip && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border space-y-2 animate-in fade-in duration-200">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="border-border text-muted-foreground font-medium text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-full">
                        {clinicalTip.type}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-none font-medium text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-full">
                        {clinicalTip.logic}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-card rounded-md border border-border">
                        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                          {clinicalTip.type === 'Primitive Reflex' ? 'Inhibition' : 'Reflex Point'}
                        </p>
                        <p className="text-[10px] font-medium text-foreground leading-tight">{clinicalTip.location}</p>
                      </div>
                      <div className="p-2 bg-card rounded-md border border-border">
                        <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Stimulus</p>
                        <p className="text-[10px] font-medium text-foreground leading-tight">{clinicalTip.stimulus}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                      "{clinicalTip.content}"
                    </p>
                    {clinicalTip.extra && (
                      <p className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                        <ShieldAlert size={10} /> {clinicalTip.extra}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'AFFERENT_SELECT':
        return (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Correcting</p>
                <p className="text-sm font-medium text-foreground">{effectiveItem || "General"}</p>
              </div>
              <Badge className="bg-chart-primary/10 text-chart-primary border-none font-medium text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-full">Afferent</Badge>
            </div>
            {[
              { type: 'Mechanoreceptive', icon: Activity, step: 'MECHANO_PROCESS', desc: 'Joint and muscle receptor calibration' },
              { type: 'Nociceptive', icon: AlertTriangle, step: 'NOCICEPTIVE_PROCESS', desc: 'Threat detection via spinothalamic tract' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="text-chart-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.type}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            ))}
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Correcting</p>
                <p className="text-sm font-medium text-foreground">{effectiveItem || "General"}</p>
              </div>
              <Badge className="bg-foreground/10 text-foreground border-none font-medium text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-full">Efferent</Badge>
            </div>
            {[
              { type: 'Brain Integration', icon: Brain, step: 'EFFERENT_PROCESS', desc: 'Cortical and subcortical zone pairing' },
              { type: 'Emotional Integration', icon: Heart, step: 'EMOTIONS_PROCESS', desc: 'Limbic system and emotional balancing' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.type}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            ))}
          </div>
        );

      case 'MECHANO_PROCESS':
        return (
          <MechanoreceptiveProcess 
            onSave={handleSave} 
            onInhibited={handleInhibited}
            onCancel={goBack} 
            ligamentImages={ligamentImages}
            onOpenLigamentCharts={onOpenLigamentCharts}
          />
        );

      case 'NOCICEPTIVE_PROCESS':
        return <NociceptiveThreatAssessment onSave={handleSave} onInhibited={handleInhibited} onCancel={goBack} initialValue={effectiveItem} />;
      
      case 'EFFERENT_PROCESS':
        return <EfferentBrainIntegration initialEntryPoint={effectiveItem} onSave={handleSave} onInhibited={handleInhibited} onCancel={goBack} />;

      case 'EMOTIONS_PROCESS':
        return <EmotionalIntegrationProcess onSave={handleSave} onInhibited={handleInhibited} onCancel={goBack} />;

      case 'VESTIBULAR_PROCESS':
        return <VestibularProcess onSave={handleSave} onInhibited={handleInhibited} onCancel={goBack} />;

      case 'COMPLETION':
        const eyeMatch = EYE_POSITIONS.find(e => correctionSummary.includes(e.label));
        const eyeLabel = eyeMatch?.label ?? "";
        const eyeSub = eyeMatch?.sub ?? "";
        const eyePos = eyeMatch?.pos ?? "";
        return (
          <div className="py-4 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-chart-emerald/10 text-chart-emerald flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Correction Complete</h3>
                <p className="text-xs text-muted-foreground">{effectiveItem || "Finding"} corrected.</p>
              </div>
            </div>

            {correctionSummary && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-1.5 text-left">
                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Details</p>
                <div className="space-y-1">
                  {correctionSummary.split(" | ").map((part, i) => {
                    const [key, ...rest] = part.split(": ");
                    const val = rest.join(": ");
                    if (key === "Eye Position" && eyeMatch) {
                      return (
                        <div key={i} className="flex items-start gap-1.5">
                          <Eye size={12} className="text-chart-destructive mt-0.5 shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{eyeLabel}</span> ({eyePos})
                            {eyeSub && <span className="text-[10px] block">{eyeSub}</span>}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-chart-emerald mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {key && val ? <><span className="font-medium text-foreground">{key}</span>: {val}</> : part}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetWizard} className="rounded-lg h-8 px-3 text-xs font-medium">
                <RefreshCw size={12} className="mr-1.5" /> Another
              </Button>
              <Button size="sm" onClick={() => { setStep('SELECT_START'); setHistory([]); setSelectedFinding(''); setCustomText(''); }} className="rounded-lg h-8 px-3 text-xs font-medium">
                <Zap size={12} className="mr-1.5" /> Done
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isProcessStep = ['MECHANO_PROCESS', 'NOCICEPTIVE_PROCESS', 'EFFERENT_PROCESS', 'EMOTIONS_PROCESS', 'VESTIBULAR_PROCESS'].includes(step);

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Compact header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== 'SELECT_START' && (
              <Button variant="ghost" size="sm" onClick={goBack} className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg -ml-1">
                <ChevronLeft size={14} />
              </Button>
            )}
            <div>
              <h3 className="text-sm font-medium text-foreground">Correction Wizard</h3>
              <p className="text-[10px] text-muted-foreground">
                {step === 'COMPLETION' ? 'Correction logged' : `Step: ${STEP_LABELS[step]}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Step dots */}
            {!isProcessStep && step !== 'COMPLETION' && (
              <div className="flex items-center gap-1">
                {(['SELECT_START', 'AFFERENT_SELECT', 'EFFERENT_SELECT'] as Step[]).map((s, i) => (
                  <div 
                    key={s} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      step === s ? "bg-primary" : 
                      history.includes(s) ? "bg-primary/30" : "bg-border"
                    )} 
                  />
                ))}
              </div>
            )}
            {step !== 'SELECT_START' && (
              <Button variant="ghost" size="sm" onClick={resetWizard} className="h-7 px-2 text-[10px] font-medium text-muted-foreground hover:text-foreground rounded-lg">
                <RefreshCw size={11} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={cn("p-4", isProcessStep && "px-4 py-0")}>
          {renderStep()}
        </div>
      </div>

      <Dialog open={ligamentModalOpen} onOpenChange={setLigamentModalOpen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] rounded-xl p-0 overflow-hidden border-none shadow-sm bg-card">
          <DialogHeader className="p-6 bg-muted text-foreground">
            <DialogTitle className="text-base font-medium">Ligament Reference Images</DialogTitle>
            <DialogDescription>Visual guides for mechanoreceptive ligament corrections.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-6">
            <div className="space-y-8">
              {Object.entries(ligamentImages).map(([category, urls]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground capitalize">{category.replace('_', ' ')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {urls.map((url, index) => (
                      url ? (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden border border-border">
                          <img src={url} alt={`${category} ${index}`} className="w-full h-full object-cover" />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PathwayLogicWizard;
