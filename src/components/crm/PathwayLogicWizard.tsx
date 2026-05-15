"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  GitBranch, Brain, Activity, CheckCircle2, 
  Zap, RefreshCw, Eye, Dumbbell,
  ChevronLeft, AlertTriangle, ArrowRight, Heart, ImageIcon, Loader2,
  ShieldAlert, Hand, PlayCircle, Baby, ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
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
  | 'EMOTIONS_PROCESS';

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
  const [selectedFinding, setSelectedFinding] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [muscleFindings, setMuscleFindings] = useState<string[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(false);
  
  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [actionTableOpen, setActionTableOpen] = useState(false);

  const onOpenActionTable = () => setActionTableOpen(true);
  const onOpenLigamentCharts = () => setLigamentModalOpen(true);

  useEffect(() => {
    if (initialFinding) {
      setSelectedFinding(initialFinding);
      setStep('SELECT_START'); 
    }
  }, [initialFinding]);

  useEffect(() => {
    const fetchMuscles = async () => {
      if (!appointmentId || appointmentId.includes('00000000')) return;
      
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
  }, [appointmentId]);

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
    setSelectedFinding("");
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
    onSave(summary);
    resetWizard();
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
        if (inhibitedItems.length === 0) {
          return (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-16 h-16 border border-border flex items-center justify-center text-muted-foreground">
                {hasAnyTested ? <CheckCircle2 size={32} /> : <ClipboardCheck size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium uppercase tracking-tight">
                  {hasAnyTested ? "All findings clear" : "Align phase pending"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto uppercase tracking-widest">
                  {hasAnyTested 
                    ? `✓ All findings from this session tested clear. (${format(new Date(), "h:mm a")})`
                    : "Complete the Align phase first to populate correction targets."}
                </p>
              </div>
              <div className="pt-8 border-t border-border w-full max-w-xs">
                <button 
                  onClick={() => setSelectedFinding('CUSTOM')}
                  className="w-full h-12 border border-border font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                >
                  + Manual Correction Entry
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-medium uppercase tracking-tight">1. Select Finding to Correct</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Choose an inhibited item or enter a custom entry point.</p>
              </div>
              
              <div className="space-y-4">
                <Select value={selectedFinding} onValueChange={(v) => setSelectedFinding(v)}>
                  <SelectTrigger className="h-12 border-border bg-background rounded-none font-bold text-sm uppercase tracking-widest">
                    <SelectValue placeholder={loadingMuscles ? "Loading findings..." : "Select inhibited finding..."} />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-border bg-background">
                    {inhibitedItems.map(item => (
                      <SelectItem key={item} value={item} className="text-[10px] font-bold uppercase tracking-widest py-3 px-4 focus:bg-muted">
                        {item}
                      </SelectItem>
                    ))}
                    <SelectItem value="CUSTOM" className="text-[10px] font-bold uppercase tracking-widest py-3 px-4 focus:bg-muted text-primary">+ New Correction Entry</SelectItem>
                  </SelectContent>
                </Select>

                {selectedFinding === 'CUSTOM' && (
                  <Input 
                    placeholder="Enter custom entry point..." 
                    className="h-12 border-border bg-background rounded-none font-bold text-sm uppercase tracking-widest"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-medium uppercase tracking-tight">2. Choose Correction Direction</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Determine if the system needs bottom-up or top-down input.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
                <button 
                    onClick={() => goToStep('AFFERENT_SELECT')} 
                    className="p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
                      <GitBranch size={20} />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest border border-border px-2 py-1">Bottom-Up</span>
                  </div>
                  <h3 className="text-xl font-medium uppercase tracking-tight">Afferent</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Sensory input issue.</p>
                </button>

                <button 
                    onClick={() => goToStep('EFFERENT_SELECT')} 
                    className="p-8 border-r border-border last:border-r-0 hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
                      <Zap size={20} />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest border border-border px-2 py-1">Top-Down</span>
                  </div>
                  <h3 className="text-xl font-medium uppercase tracking-tight">Efferent</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Processing issue.</p>
                </button>
              </div>
            </div>

            {clinicalTip && (
              <div className="p-8 border border-destructive bg-destructive/5 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-destructive">
                    <clinicalTip.icon size={20} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Clinical Insight: {clinicalTip.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest border border-destructive/20 px-2 py-1">
                      {clinicalTip.type}
                    </span>
                    <span className="bg-destructive text-destructive-foreground text-[8px] font-bold uppercase tracking-widest px-2 py-1">
                      {clinicalTip.logic}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-destructive/20 bg-background space-y-1">
                    <p className="text-[8px] font-bold text-destructive uppercase tracking-widest flex items-center gap-2">
                      {clinicalTip.type === 'Primitive Reflex' ? <ShieldAlert size={10} /> : <Hand size={10} />}
                      {clinicalTip.type === 'Primitive Reflex' ? 'Inhibition Pattern' : 'Reflex Point'}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-tight">{clinicalTip.location}</p>
                  </div>
                  <div className="p-4 border border-destructive/20 bg-background space-y-1">
                    <p className="text-[8px] font-bold text-destructive uppercase tracking-widest flex items-center gap-2">
                      <PlayCircle size={10} /> Stimulus
                    </p>
                    <p className="text-xs font-bold uppercase tracking-tight">{clinicalTip.stimulus}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-destructive/20">
                  <p className="text-sm text-destructive font-medium leading-relaxed italic">
                    "{clinicalTip.content}"
                  </p>
                  {clinicalTip.extra && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-destructive uppercase tracking-widest">
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
          <div className="space-y-6">
            <div className="p-6 border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Correcting</p>
                <p className="text-lg font-bold uppercase tracking-tight">{effectiveItem || "General Correction"}</p>
              </div>
              <span className="bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Afferent</span>
            </div>
            <div className="space-y-0 border border-border">
              {[
                { type: 'Mechanoreceptive', icon: Activity, step: 'MECHANO_PROCESS', desc: 'Joint and muscle receptor calibration.' },
                { type: 'Vestibular', icon: Eye, step: 'VESTIBULAR_PROCESS', desc: 'Balance and visual system integration.' },
                { type: 'Nociceptive', icon: AlertTriangle, step: 'NOCICEPTIVE_PROCESS', desc: 'Clearing threat from scars or old injuries.' }
              ].map(item => (
                <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-8 border-b border-border last:border-b-0 hover:bg-muted transition-colors text-left group w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
                        <item.icon size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-lg uppercase tracking-tight">{item.type}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={goBack} className="w-full h-12 border border-border font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
          </div>
        );

      case 'EFFERENT_SELECT':
        return (
          <div className="space-y-6">
            <div className="p-6 border border-border bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Correcting</p>
                <p className="text-lg font-bold uppercase tracking-tight">{effectiveItem || "General Correction"}</p>
              </div>
              <span className="bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Efferent</span>
            </div>
            <div className="space-y-0 border border-border">
              {[
                { type: 'Brain Integration', icon: Brain, step: 'EFFERENT_PROCESS', desc: 'Cortical and subcortical zone pairing.' },
                { type: 'Emotional Integration', icon: Heart, step: 'EMOTIONS_PROCESS', desc: 'Limbic system and emotional context balancing.' }
              ].map(item => (
                <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-8 border-b border-border last:border-b-0 hover:bg-muted transition-colors text-left group w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
                        <item.icon size={20} />
                      </div>
                      <div>
                          <p className="font-bold text-lg uppercase tracking-tight">{item.type}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={goBack} className="w-full h-12 border border-border font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
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

      default:
        return null;
    }
  };

  return (
    <>
      <div className="border border-border bg-background">
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-medium uppercase tracking-tight">Calibration Wizard</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Correct inhibited findings via Afferent or Efferent pathways.
            </p>
          </div>
          {step !== 'SELECT_START' && (
            <button onClick={resetWizard} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2">
              <RefreshCw size={14} /> Reset Wizard
            </button>
          )}
        </div>
        <div className="p-8">
          {renderStep()}
        </div>
      </div>

      <Dialog open={ligamentModalOpen} onOpenChange={setLigamentModalOpen}>
        <DialogContent className="sm:max-w-[80vw] p-0 border border-border bg-background">
          <div className="p-8 border-b border-border bg-muted/30">
            <DialogTitle className="text-xl font-medium uppercase tracking-tight">Ligament Reference Images</DialogTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Visual guides for mechanoreceptive ligament corrections.</p>
          </div>
          <ScrollArea className="max-h-[70vh] p-8">
            <div className="space-y-12">
              {Object.entries(ligamentImages).map(([category, urls]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3 text-primary">
                    <ImageIcon size={18} />
                    <h3 className="text-lg font-medium uppercase tracking-tight">{category.replace('_', ' ')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border border-border">
                    {urls.map((url, index) => (
                      url ? (
                        <div key={index} className="aspect-video border-r border-b border-border last:border-r-0 overflow-hidden">
                            <img src={url} alt={`${category} ${index}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
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