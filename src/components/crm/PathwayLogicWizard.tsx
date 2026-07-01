
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  GitBranch, Sparkles, Brain, Activity, CheckCircle2, 
  Zap, Info, List, RefreshCw, Eye, Dumbbell, Link as LinkIcon,
  Workflow, Lightbulb, ChevronRight, ChevronLeft, Droplets, 
  AlertTriangle, ArrowRight, Heart, ImageIcon, Loader2, Search,
  ShieldAlert, Hand, PlayCircle, Baby, ClipboardCheck
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
import JointActionTableModal from './JointActionTableModal';
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

const PathwayLogicWizard = ({ onSave, onClearItem, onCancel, priorityPattern, initialFinding, appointmentId }: PathwayLogicWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_START');
  const [history, setHistory] = useState<Step[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string>(initialFinding || "");
  const [customText, setCustomText] = useState<string>("");
  const [muscleFindings, setMuscleFindings] = useState<string[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(false);
  
  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [actionTableOpen, setActionTableOpen] = useState(false);
  const [correctionSummary, setCorrectionSummary] = useState<string>("");

  const onOpenActionTable = () => setActionTableOpen(true);
  const onOpenLigamentCharts = () => setLigamentModalOpen(true);

  const isSandbox = !appointmentId || appointmentId.includes('00000000');

  useEffect(() => {
    if (initialFinding) {
      setSelectedFinding(initialFinding);
    } else if (isSandbox) {
      setSelectedFinding('CUSTOM');
    }
  }, [initialFinding, isSandbox]);

  // Fetch muscles from the separate muscle_tests table
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
    
    // 1. Process Pattern (Reflexes, Nerves, Zones)
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

    // 2. Process Muscle Findings from separate table
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

    // 3. Handle Bilateral Logic
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
        if (inhibitedItems.length === 0 && !isSandbox) {
          return (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className={cn(
                "w-20 h-20 rounded-xl flex items-center justify-center shadow-xl",
                hasAnyTested ? "bg-chart-emerald/10 text-chart-emerald" : "bg-muted text-muted-foreground"
              )}>
                {hasAnyTested ? <CheckCircle2 size={40} /> : <ClipboardCheck size={40} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {hasAnyTested ? "All findings clear" : "Align phase pending"}
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {hasAnyTested 
                    ? `✓ All findings from this session tested clear — no corrections required. (${format(new Date(), "h:mm a")})`
                    : "Complete the Align phase first to populate correction targets."}
                </p>
              </div>
              <div className="pt-4 border-t border-border w-full max-w-xs">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedFinding('CUSTOM')}
                  className="w-full h-10 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  + Manual Correction Entry
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">1. Select Finding to Correct</h3>
                <p className="text-sm text-muted-foreground">Choose an inhibited item or enter a custom entry point.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <Select value={selectedFinding} onValueChange={(v) => setSelectedFinding(v)}>
                  <SelectTrigger className="h-14 rounded-xl border border-border bg-card font-medium text-base">
                    <SelectValue placeholder={loadingMuscles ? "Loading findings..." : "Select inhibited finding..."} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-card p-1">
                    {inhibitedItems.map(item => (
                      <SelectItem key={item} value={item} className={cn(
                        "rounded-xl py-3 font-medium",
                        item.includes('(Bilateral)') && "text-chart-primary bg-chart-primary/5"
                      )}>
                        {item}
                      </SelectItem>
                    ))}
                    <SelectItem value="CUSTOM" className="rounded-xl py-3 font-medium text-chart-primary">+ New Correction Entry</SelectItem>
                  </SelectContent>
                </Select>

                {selectedFinding === 'CUSTOM' && (
                  <Input 
                    placeholder="Enter custom entry point..." 
                    className="h-12 rounded-xl font-medium border border-border animate-in slide-in-from-top-2"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">2. Choose Correction Direction</h3>
                <p className="text-sm text-muted-foreground">Determine if the system needs bottom-up or top-down input.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => goToStep('AFFERENT_SELECT')} 
                    className="p-8 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-500 text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center transition-all">
                      <GitBranch size={24} className="text-chart-primary" />
                    </div>
                    <Badge className="bg-chart-primary/10 text-chart-primary border-none font-medium text-[10px] uppercase tracking-wider rounded-full">Bottom-Up</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Afferent</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-2">Sensory input issue.</p>
                </button>

                <button 
                    onClick={() => goToStep('EFFERENT_SELECT')} 
                    className="p-8 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-500 text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center transition-all">
                      <Sparkles size={24} className="text-muted-foreground" />
                    </div>
                    <Badge className="bg-muted text-muted-foreground border-none font-medium text-[10px] uppercase tracking-wider rounded-full">Top-Down</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Efferent</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-2">Processing issue.</p>
                </button>
              </div>
            </div>

            {clinicalTip && (
              <div className="p-6 rounded-xl border border-border bg-card animate-in zoom-in-95 duration-500 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <clinicalTip.icon size={24} className="text-muted-foreground" />
                    <h4 className="font-medium text-foreground text-sm">Clinical Insight: {clinicalTip.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-muted border-border text-muted-foreground font-medium text-[10px] uppercase tracking-wider rounded-full">
                      {clinicalTip.type}
                    </Badge>
                    <Badge className="bg-primary text-primary-foreground border-none font-medium text-[10px] uppercase tracking-wider rounded-full">
                      {clinicalTip.logic}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-xl border border-border space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      {clinicalTip.type === 'Primitive Reflex' ? <ShieldAlert size={10} /> : <Hand size={10} />}
                      {clinicalTip.type === 'Primitive Reflex' ? 'Inhibition Pattern' : 'Reflex Point'}
                    </p>
                    <p className="text-xs font-medium text-foreground leading-tight">{clinicalTip.location}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl border border-border space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <PlayCircle size={10} /> Stimulus
                    </p>
                    <p className="text-xs font-medium text-foreground leading-tight">{clinicalTip.stimulus}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{clinicalTip.content}"
                  </p>
                  {clinicalTip.extra && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                      <ShieldAlert size={12} /> {clinicalTip.extra}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'AFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-muted rounded-xl border border-border flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Correcting</p>
                <p className="text-base font-semibold text-foreground">{effectiveItem || "General Correction"}</p>
              </div>
              <Badge className="bg-chart-primary text-primary-foreground border-none font-medium text-[10px] uppercase tracking-wider rounded-full">Afferent</Badge>
            </div>
            {[
              { type: 'Mechanoreceptive', icon: Activity, color: 'blue', step: 'MECHANO_PROCESS', desc: 'Joint and muscle receptor calibration.' },
              { type: 'Vestibular', icon: Eye, color: 'cyan', step: 'VESTIBULAR_PROCESS', desc: 'Balance and visual system integration.' },
              { type: 'Nociceptive', icon: AlertTriangle, color: 'orange', step: 'NOCICEPTIVE_PROCESS', desc: 'Clearing threat from scars or old injuries.' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-6 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-300 text-left group w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={24} className={cn(
                        item.color === 'blue' ? "text-chart-primary" :
                        item.color === 'cyan' ? "text-muted-foreground" :
                        "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                        <p className="font-semibold text-base text-foreground">{item.type}</p>
                        <p className="text-xs font-medium text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl font-medium text-muted-foreground"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-muted rounded-xl border border-border flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Correcting</p>
                <p className="text-base font-semibold text-foreground">{effectiveItem || "General Correction"}</p>
              </div>
              <Badge className="bg-foreground text-background border-none font-medium text-[10px] uppercase tracking-wider rounded-full">Efferent</Badge>
            </div>
            {[
              { type: 'Brain Integration', icon: Brain, color: 'purple', step: 'EFFERENT_PROCESS', desc: 'Cortical and subcortical zone pairing.' },
              { type: 'Emotional Integration', icon: Heart, color: 'rose', step: 'EMOTIONS_PROCESS', desc: 'Limbic system and emotional context balancing.' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-6 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-300 text-left group w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={24} className={cn(
                        item.color === 'purple' ? "text-muted-foreground" :
                        item.color === 'rose' ? "text-chart-destructive" :
                        "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                        <p className="font-semibold text-base text-foreground">{item.type}</p>
                        <p className="text-xs font-medium text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
            <Button variant="ghost" onClick={goBack} className="w-full h-12 rounded-xl font-medium text-muted-foreground"><ChevronLeft size={18} className="mr-2" /> Back</Button>
          </div>
        );

      case 'MECHANO_PROCESS':
        return (
          <MechanoreceptiveProcess 
            onSave={handleSave} 
            onInhibited={handleInhibited}
            onCancel={goBack} 
            ligamentImages={ligamentImages}
            onOpenActionTable={onOpenActionTable}
            onOpenLigamentCharts={onOpenLigamentCharts}
          />
        );

      case 'NOCICEPTIVE_PROCESS':
        return <NociceptiveThreatAssessment onSave={handleSave} onInhibited={handleInhibited} onCancel={goBack} />;
      
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
          <div className="py-6 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-chart-emerald/10 text-chart-emerald flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Correction Complete</h3>
                <p className="text-sm text-muted-foreground">
                  {effectiveItem || "Finding"} has been cleared.
                </p>
                <p className="text-xs text-muted-foreground/60">Additional layers can be added in future sessions.</p>
              </div>
            </div>

            {correctionSummary && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Correction Details</p>
                <div className="space-y-2 text-sm">
                  {correctionSummary.split(" | ").map((part, i) => {
                    const [key, ...rest] = part.split(": ");
                    const val = rest.join(": ");
                    if (key === "Eye Position" && eyeMatch) {
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <Eye size={14} className="text-rose-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold text-foreground">{eyeLabel}</span>
                            <span className="text-muted-foreground"> ({eyePos})</span>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{eyeSub}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-chart-emerald mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">
                          {key && val ? <><span className="font-semibold text-foreground">{key}</span>: {val}</> : part}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={resetWizard} className="rounded-xl h-10 px-5 text-sm font-medium">
                <RefreshCw size={14} className="mr-2" /> Correct Another Finding
              </Button>
              <Button onClick={() => { setStep('SELECT_START'); setHistory([]); setSelectedFinding(''); setCustomText(''); }} className="rounded-xl h-10 px-5 text-sm font-medium">
                <Zap size={14} className="mr-2" /> Done for Today
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
        <CardHeader className="p-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-foreground">Calibration Wizard</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                    Correct inhibited findings via Afferent or Efferent pathways.
                </CardDescription>
            </div>
            {step !== 'SELECT_START' && (
                <Button variant="ghost" size="sm" onClick={resetWizard} className="text-[10px] font-medium text-muted-foreground hover:text-foreground rounded-xl">
                    <RefreshCw size={14} className="mr-2" /> Reset Wizard
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          {renderStep()}
        </CardContent>
      </Card>
      <Dialog open={ligamentModalOpen} onOpenChange={setLigamentModalOpen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] rounded-xl p-0 overflow-hidden border-none shadow-sm bg-card">
          <DialogHeader className="p-8 bg-muted text-foreground">
            <DialogTitle className="text-lg font-semibold">Ligament Reference Images</DialogTitle>
            <DialogDescription>Visual guides for mechanoreceptive ligament corrections.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-8">
            <div className="space-y-12">
              {Object.entries(ligamentImages).map(([category, urls]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                        <ImageIcon size={18} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground capitalize">{category.replace('_', ' ')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {urls.map((url, index) => (
                      url ? (
                        <div key={index} className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm hover:border-muted-foreground transition-all">
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
      <JointActionTableModal open={actionTableOpen} onOpenChange={setActionTableOpen} />
    </>
  );
};

export default PathwayLogicWizard;