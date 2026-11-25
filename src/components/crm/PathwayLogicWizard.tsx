
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Activity,
  CheckCircle2,
  Zap,
  RefreshCw,
  Eye,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Heart,
  ImageIcon,
  ShieldAlert,
  Baby,
  ClipboardCheck,
  ChevronDown,
  Flag,
  Plus,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PATHWAY_DIRECTION } from '@/lib/pathway-direction';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";

import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { getMuscleInfo } from '@/data/muscle-info-data';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { EYE_POSITIONS } from '@/data/emotion-data';
import { safeParse } from '@/utils/safe-json';
import { format } from 'date-fns';
import {
  isFindingCategory,
  isInhibitedStatus,
  normalizeFindingPriority,
  priorityKey,
  type FindingPriority,
} from '@/components/crm/v2/v2-utils';
import PriorityTierControl from '@/components/crm/PriorityTierControl';
import { findingNameFromPathway, isCorrectionProcessName } from '@/lib/pathway-finding';
import { splitCranialNervePattern } from '@/lib/cranial-stim-findings';

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
  /** Called when the dropdown picks a different correction target. */
  onChangeFinding?: (findingName: string) => void;
  /** Persists the priority tier chosen inside the finding dropdown. */
  updatePriorityPattern?: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<void>;
}

const DYSFUNCTIONAL_STATUSES = ['Inhibited', 'Hypertonic', 'Switching', 'Inhibition'];

const STAGE_DEFS = [
  { id: 'select', label: 'Select' },
  { id: 'direction', label: 'Direction' },
  { id: 'apply', label: 'Apply' },
] as const;

const stageIndexFor = (s: Step): number =>
  s === 'SELECT_START' ? 0 : (s === 'AFFERENT_SELECT' || s === 'EFFERENT_SELECT') ? 1 : 2;

const PathwayLogicWizard = ({ onSave, onClearItem, onCancel, priorityPattern, initialFinding, appointmentId, onChangeFinding, updatePriorityPattern }: PathwayLogicWizardProps) => {
  const [step, setStep] = useState<Step>('SELECT_START');
  const [history, setHistory] = useState<Step[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<string>(findingNameFromPathway(initialFinding) || "");
  const [customText, setCustomText] = useState<string>("");
  const [muscleFindings, setMuscleFindings] = useState<string[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(false);
  const [showClinicalTip, setShowClinicalTip] = useState(false);
  
  const [ligamentImages, setLigamentImages] = useState<Record<string, (string | null)[]>>({});
  const [ligamentModalOpen, setLigamentModalOpen] = useState(false);
  const [correctionSummary, setCorrectionSummary] = useState<string>("");

  const onOpenLigamentCharts = () => setLigamentModalOpen(true);

  const isSandbox = !appointmentId || appointmentId.includes('00000000');
  const isDemo = appointmentId === DEMO_APPOINTMENT_ID;

  const initialFindingName = useMemo(() => findingNameFromPathway(initialFinding), [initialFinding]);

  useEffect(() => {
    if (initialFinding === 'CUSTOM') {
      setSelectedFinding('CUSTOM');
    } else if (initialFindingName) {
      setSelectedFinding(initialFindingName);
    } else if (isSandbox) {
      setSelectedFinding('CUSTOM');
    }
  }, [initialFinding, initialFindingName, isSandbox]);

  useEffect(() => {
    const fetchMuscles = async () => {
      if (isDemo || isSandbox) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: effect/callback is keyed on its real inputs; adding this would re-run every render
  }, [appointmentId, isSandbox]);

  const effectiveItem = selectedFinding === 'CUSTOM' ? customText : selectedFinding;

  const { inhibitedItems, hasAnyTested } = useMemo(() => {
    interface WizardFinding {
      status: string | null;
      catKey: string;
      priorityLevel: FindingPriority | null;
    }
    const items = new Map<string, WizardFinding>();
    const baseNames = new Map<string, { sides: Set<'L' | 'R'>; catKey: string }>();
    let hasAnyTested = false;

    // safeParse keeps a malformed priority_pattern out of the wizard.
    const parsed = safeParse<Record<string, Record<string, string>>>(priorityPattern ?? '', {});
    const priorities = (parsed.priorities ?? {}) as Record<string, string>;
    const levelFor = (catKey: string, name: string) =>
      normalizeFindingPriority(priorities[priorityKey(catKey, name)]);

    const registerSide = (name: string, catKey: string) => {
      const match = name.match(/(.+) \(([LR])\)$/);
      if (!match) return;
      const base = match[1];
      const side = match[2] as 'L' | 'R';
      const entry = baseNames.get(base) ?? { sides: new Set<'L' | 'R'>(), catKey };
      entry.sides.add(side);
      baseNames.set(base, entry);
    };

    Object.entries(parsed).forEach(([catKey, category]) => {
      if (catKey === 'priorities') return;
      // Skip correction processes (e.g. mechanoreceptor) — only include
      // standard assessment findings that actually need correcting.
      if (!isFindingCategory(catKey)) return;
      // Marked stims are information on a cranial nerve, never pathways.
      const entries = catKey === 'cranialNerves'
        ? Object.entries(splitCranialNervePattern(category).findings)
        : Object.entries(category);
      if (entries.length > 0) hasAnyTested = true;
      entries.forEach(([name, status]) => {
        if (isInhibitedStatus(String(status))) {
          items.set(name, {
            status: String(status),
            catKey,
            priorityLevel: levelFor(catKey, name),
          });
          registerSide(name, catKey);
        }
      });
    });

    muscleFindings.forEach(name => {
      hasAnyTested = true;
      if (!items.has(name)) {
        items.set(name, { status: null, catKey: 'muscles', priorityLevel: levelFor('muscles', name) });
      }
      registerSide(name, 'muscles');
    });

    baseNames.forEach(({ sides, catKey }, base) => {
      if (sides.has('L') && sides.has('R')) {
        const name = `${base} (Bilateral)`;
        items.set(name, { status: null, catKey, priorityLevel: levelFor(catKey, name) });
      }
    });

    // The pathway chosen in Align is the correction target even when its
    // assessment status has since cleared (or it was never recorded as
    // inhibited), so it must always be selectable here. Correction *process*
    // names (e.g. "Mechanoreceptor (Unconscious)") are not findings and stay out.
    if (
      initialFindingName &&
      !isCorrectionProcessName(initialFindingName) &&
      !items.has(initialFindingName)
    ) {
      const priorityKeyMatch = Object.keys(priorities)
        .find(key => key.slice(key.indexOf('|') + 1) === initialFindingName);
      const priorityCategory = priorityKeyMatch?.split('|')[0];
      const patternCategory = priorityCategory ?? Object.entries(parsed).find(([catKey, category]) =>
        catKey !== 'priorities' && isFindingCategory(catKey) &&
        Object.prototype.hasOwnProperty.call(category, initialFindingName)
      )?.[0] ?? 'muscles';
      items.set(initialFindingName, {
        status: null,
        catKey: patternCategory,
        priorityLevel: levelFor(patternCategory, initialFindingName),
      });
    }

    return {
      inhibitedItems: Array.from(items.entries())
        .map(([name, meta]) => ({ name, ...meta }))
        .sort((a, b) => {
          const tierRank = (level: FindingPriority | null) => level === 'primary' ? 0 : level === 'priority' ? 1 : 2;
          return tierRank(a.priorityLevel) - tierRank(b.priorityLevel) || a.name.localeCompare(b.name);
        }),
      hasAnyTested,
    };
  }, [priorityPattern, initialFindingName, muscleFindings]);

  const selectedFindingMeta = inhibitedItems.find(item => item.name === selectedFinding);
  const selectedPriority = selectedFindingMeta?.priorityLevel ?? null;

  const selectFinding = (name: string) => {
    setSelectedFinding(name);
    if (name !== 'CUSTOM') onChangeFinding?.(name);
  };

  /** Priority lives with the pathway: one primary per session, as in Align. */
  const setSelectedPriority = async (next: FindingPriority | null) => {
    if (!selectedFindingMeta || !updatePriorityPattern) return;
    if (next === 'primary') {
      for (const item of inhibitedItems) {
        if (item.name !== selectedFindingMeta.name && item.priorityLevel === 'primary') {
          await updatePriorityPattern('priorities', priorityKey(item.catKey, item.name), 'priority');
        }
      }
    }
    await updatePriorityPattern(
      'priorities',
      priorityKey(selectedFindingMeta.catKey, selectedFindingMeta.name),
      next,
    );
  };

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
                hasAnyTested ? "bg-success/10 text-success-strong" : "bg-muted text-muted-foreground"
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
                onClick={() => selectFinding('CUSTOM')}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                + Manual Entry
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-muted-foreground">Correction Direction</label>
              {!effectiveItem && (
                <p className="text-[12px] text-muted-foreground">Select a finding before choosing a correction direction.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={!effectiveItem}
                  onClick={() => goToStep('AFFERENT_SELECT')}
                  className={cn("min-h-[128px] rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50", PATHWAY_DIRECTION.afferent.hover)}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", PATHWAY_DIRECTION.afferent.soft, PATHWAY_DIRECTION.afferent.strong)}>
                    <PATHWAY_DIRECTION.afferent.Icon size={17} strokeWidth={1.75} />
                  </div>
                  <p className={cn("mt-2 text-[11px] font-semibold uppercase tracking-[0.08em]", PATHWAY_DIRECTION.afferent.text)}>Bottom-Up</p>
                  <p className="text-[15px] font-semibold text-foreground">Afferent</p>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">Sensory input from the body</p>
                </button>

                <button
                  disabled={!effectiveItem}
                  onClick={() => goToStep('EFFERENT_SELECT')}
                  className={cn("min-h-[128px] rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50", PATHWAY_DIRECTION.efferent.hover)}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", PATHWAY_DIRECTION.efferent.soft, PATHWAY_DIRECTION.efferent.strong)}>
                    <PATHWAY_DIRECTION.efferent.Icon size={17} strokeWidth={1.75} />
                  </div>
                  <p className={cn("mt-2 text-[11px] font-semibold uppercase tracking-[0.08em]", PATHWAY_DIRECTION.efferent.text)}>Top-Down</p>
                  <p className="text-[15px] font-semibold text-foreground">Efferent</p>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">Brain processing & output</p>
                </button>
              </div>
            </div>

            {clinicalTip && (
              <div className="border-t border-border pt-3">
                <button
                  onClick={() => setShowClinicalTip(!showClinicalTip)}
                  className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <clinicalTip.icon size={12} />
                  <span>Clinical Insight: {clinicalTip.title}</span>
                  <ChevronDown size={12} className={cn("ml-auto transition-transform", showClinicalTip && "rotate-180")} />
                </button>
                {showClinicalTip && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border space-y-2 animate-in fade-in duration-200">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="border-border text-muted-foreground font-medium text-xs px-2 py-0 rounded-full">
                        {clinicalTip.type}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary-strong border-none font-medium text-[10px] uppercase tracking-wider px-2 py-0 rounded-full">
                        {clinicalTip.logic}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-card rounded-md border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {clinicalTip.type === 'Primitive Reflex' ? 'Inhibition' : 'Reflex Point'}
                        </p>
                        <p className="text-[10px] font-medium text-foreground leading-tight">{clinicalTip.location}</p>
                      </div>
                      <div className="p-2 bg-card rounded-md border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Stimulus</p>
                        <p className="text-[10px] font-medium text-foreground leading-tight">{clinicalTip.stimulus}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                      "{clinicalTip.content}"
                    </p>
                    {clinicalTip.extra && (
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
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
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Correcting</p>
                <p className="text-sm font-medium text-foreground">{effectiveItem || "General"}</p>
              </div>
              <Badge className={cn("border-none font-medium text-[10px] uppercase tracking-wider px-2 py-0 rounded-full", PATHWAY_DIRECTION.afferent.tint)}>Afferent</Badge>
            </div>
            {[
              { type: 'Mechanoreceptive', icon: Activity, step: 'MECHANO_PROCESS', desc: 'Joint and muscle receptor calibration' },
              { type: 'Nociceptive', icon: AlertTriangle, step: 'NOCICEPTIVE_PROCESS', desc: 'Threat detection via spinothalamic tract' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className={cn("shrink-0", PATHWAY_DIRECTION.afferent.text)} />
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
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Correcting</p>
                <p className="text-sm font-medium text-foreground">{effectiveItem || "General"}</p>
              </div>
              <Badge className={cn("border-none font-medium text-[10px] uppercase tracking-wider px-2 py-0 rounded-full", PATHWAY_DIRECTION.efferent.tint)}>Efferent</Badge>
            </div>
            {[
              { type: 'Brain Integration', icon: Brain, step: 'EFFERENT_PROCESS', desc: 'Cortical and subcortical zone pairing' },
              { type: 'Emotional Integration', icon: Heart, step: 'EMOTIONS_PROCESS', desc: 'Limbic system and emotional balancing' }
            ].map(item => (
              <button key={item.type} onClick={() => goToStep(item.step as Step)} className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left group w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className={cn("shrink-0", PATHWAY_DIRECTION.efferent.text)} />
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

      case 'COMPLETION': {
        const eyeMatch = EYE_POSITIONS.find(e => correctionSummary.includes(e.label));
        const eyeLabel = eyeMatch?.label ?? "";
        const eyeSub = eyeMatch?.sub ?? "";
        const eyePos = eyeMatch?.pos ?? "";
        return (
          <div className="py-4 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success-strong flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Correction Complete</h3>
                <p className="text-xs text-muted-foreground">{effectiveItem || "Finding"} corrected.</p>
              </div>
            </div>

            {correctionSummary && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2 text-left">
                <p className="text-xs font-medium text-muted-foreground">Details</p>
                <div className="space-y-1">
                  {correctionSummary.split(" | ").map((part, i) => {
                    const [key, ...rest] = part.split(": ");
                    const val = rest.join(": ");
                    if (key === "Eye Position" && eyeMatch) {
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <Eye size={12} className="text-destructive mt-1 shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{eyeLabel}</span> ({eyePos})
                            {eyeSub && <span className="text-[10px] block">{eyeSub}</span>}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={12} className="text-success mt-1 shrink-0" />
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
              <Button variant="outline" size="sm" onClick={resetWizard} className="rounded-md h-8 px-3 text-xs font-medium">
                <RefreshCw size={12} className="mr-2" /> Another
              </Button>
              <Button size="sm" onClick={() => { setStep('SELECT_START'); setHistory([]); setSelectedFinding(''); setCustomText(''); }} className="rounded-md h-8 px-3 text-xs font-medium">
                <Zap size={12} className="mr-2" /> Done
              </Button>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const isProcessStep = ['MECHANO_PROCESS', 'NOCICEPTIVE_PROCESS', 'EFFERENT_PROCESS', 'EMOTIONS_PROCESS', 'VESTIBULAR_PROCESS'].includes(step);

  const priorityBadge = (level: FindingPriority | null) => {
    if (!level) return null;
    const primary = level === 'primary';
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
          primary ? 'bg-gold/15 text-gold-strong' : 'bg-primary/10 text-primary-strong',
        )}
        title={primary ? 'Primary priority' : 'Priority'}
      >
        {primary ? <Star size={9} fill="currentColor" /> : <Flag size={9} />}
        {primary ? 'Primary' : 'Priority'}
      </span>
    );
  };

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Compact header with Select → Direction → Apply indicator */}
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {step !== 'SELECT_START' && (
              <Button variant="ghost" size="sm" onClick={goBack} className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md -ml-1">
                <ChevronLeft size={14} />
              </Button>
            )}
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-foreground">Correction Wizard</h3>
              <p className="truncate text-[13px] text-muted-foreground">
                {step === 'COMPLETION' ? 'Correction logged' : (effectiveItem || 'Choose a finding to correct')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isProcessStep || step === 'COMPLETION' ? (
              <span className={cn(
                'rounded-full px-2 py-1 text-[11px] font-semibold',
                step === 'COMPLETION' ? 'bg-success/10 text-success-strong' : 'bg-primary/10 text-primary-strong'
              )}>
                {step === 'COMPLETION' ? 'Logged' : 'Applying…'}
              </span>
            ) : (
              <div className="hidden items-center sm:flex" aria-label="Correction progress">
                {STAGE_DEFS.map((s, i) => {
                  const current = stageIndexFor(step);
                  const doneS = i < current;
                  const activeS = i === current;
                  return (
                    <span key={s.id} className="flex items-center">
                      {i > 0 && <span className={cn('mx-1 h-px w-3', i <= current ? 'bg-primary/50' : 'bg-border')} />}
                      <span className={cn(
                        'rounded-full px-2 py-1 text-[10px] font-semibold',
                        activeS ? 'bg-primary text-primary-foreground'
                        : doneS ? 'bg-success/10 text-success-strong'
                        : 'bg-muted text-muted-foreground'
                      )}>
                        {s.label}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
            {step !== 'SELECT_START' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetWizard}
                aria-label="Reset wizard"
                title="Reset"
                className="h-8 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={11} className="sm:mr-1" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Finding picker — the pathway and its priority live in one dropdown. */}
        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      Finding to correct
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {effectiveItem || (loadingMuscles ? 'Loading…' : 'Choose a finding')}
                      </span>
                      {priorityBadge(selectedPriority)}
                    </span>
                  </span>
                  <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-[320px] min-w-[260px] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
              >
                <DropdownMenuLabel>Finding to correct</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={selectedFinding || ''} onValueChange={selectFinding}>
                  {inhibitedItems.map(item => (
                    <DropdownMenuRadioItem key={item.name} value={item.name} className="gap-2 py-2 text-[12px]">
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      {priorityBadge(item.priorityLevel)}
                    </DropdownMenuRadioItem>
                  ))}
                  {selectedFinding &&
                    selectedFinding !== 'CUSTOM' &&
                    !inhibitedItems.some(item => item.name === selectedFinding) && (
                      <DropdownMenuRadioItem value={selectedFinding} className="gap-2 py-2 text-[12px]">
                        <span className="min-w-0 flex-1 truncate">{selectedFinding}</span>
                        {priorityBadge(selectedPriority)}
                      </DropdownMenuRadioItem>
                    )}
                  <DropdownMenuRadioItem value="CUSTOM" className="gap-2 py-2 text-[12px] text-primary">
                    <Plus size={12} className="shrink-0" />
                    <span>Manual entry</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                {selectedFindingMeta && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                        Priority for this pathway
                      </p>
                      <PriorityTierControl
                        compact
                        value={selectedPriority}
                        onChange={(next) => void setSelectedPriority(next)}
                        label={`Priority level for ${selectedFindingMeta.name}`}
                      />
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedFinding === 'CUSTOM' && (
              <div className="flex w-full flex-wrap items-center gap-2 pt-1">
                <Input
                  placeholder="Enter custom entry point..."
                  className="h-9 min-w-[200px] flex-1 text-[12px]"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  autoFocus
                />
                <Button
                  size="sm"
                  disabled={!customText.trim()}
                  onClick={() => onChangeFinding?.(customText.trim())}
                  className="h-9 shrink-0 px-3 text-[12px]"
                >
                  Save pathway
                </Button>
              </div>
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
            <DialogTitle className="text-[15px] font-semibold">Ligament Reference Images</DialogTitle>
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
                          <img loading="lazy" decoding="async" src={url} alt={`${category} ${index}`} className="w-full h-full object-cover" />
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
    </div>
  );
};

export default PathwayLogicWizard;
