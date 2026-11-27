import { Fragment, useState, useMemo, useEffect } from "react";
import { ArrowDown, ArrowRight, ArrowUp, AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, Dumbbell, Baby, Zap, Brain, Activity, Compass, RotateCcw, ClipboardList, Eye, FileText, Search, ExternalLink } from "lucide-react";
import { differenceInDays } from "date-fns";
import EditableField from "@/components/shared/EditableField";
import BoltTestSection from "@/components/crm/BoltTestSection";
import CoherenceAssessment from "@/components/crm/CoherenceAssessment";
import NeurologicalAssessments from "@/components/crm/NeurologicalAssessments";
import CogsAssessment from "@/components/crm/CogsAssessment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { nerveStimLines, isLateralStim } from "@/components/crm/pathway-reflex-stim-data";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "@/components/crm/BrainZoneAssessment";
import RecheckTabV2 from "@/components/crm/v2/RecheckTabV2";
import { PathwayRow } from "@/components/crm/reflex-corrections/PathwayRow";
import { ReflexQuickRow } from "@/components/crm/reflex-corrections/ReflexQuickRow";
import { useItemCorrections } from "@/components/crm/reflex-corrections/useItemCorrections";
import {
  reflexCorrectionKey,
  reflexPriorityKey,
  type ReflexCorrection,
} from "@/components/crm/reflex-corrections/types";
import { safeParse } from "@/utils/safe-json";
import { cn } from "@/lib/utils";
import type { FindingPriority } from "@/components/crm/v2/v2-utils";
import { categoryTone } from "@/components/crm/v2/categoryConstants";
import { REFLEX_TRACKS } from "@/lib/reflex-order";
import { getMuscleInfo } from "@/data/muscle-info-data";
import MuscleInfoModal from "@/components/crm/MuscleInfoModal";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import {
  cranialStimPatternFindings,
  markedCranialStims,
  splitCranialNervePattern,
} from "@/lib/cranial-stim-findings";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

import {
  Card,
  Section,
  PrimaryButton,
  SegmentedTabs,
  SectionHeader,
  AlertBanner,
  ConfirmationFooter,
  SecondaryButton,
} from "./DesignSystem";

type SubTab = 'recheck' | 'intake' | 'quick' | 'muscles' | 'reflexes' | 'nerves' | 'zones' | 'eyes' | 'report';

const SUB_TABS: { id: SubTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'intake', label: 'Intake & Vitals', icon: Activity },
  { id: 'quick', label: 'Quick Assess', icon: CheckCircle2 },
  { id: 'muscles', label: 'Muscles', icon: Dumbbell },
  { id: 'reflexes', label: 'Primitive Reflexes', icon: Baby },
  { id: 'nerves', label: 'Cranial Nerves', icon: Zap },
  { id: 'zones', label: 'Brain Zones', icon: Brain },
  { id: 'eyes', label: 'Eye Systems', icon: Eye },
];

/** External reference pages on fnhrefapp.com (the Foundations guide). */
const FNH_LINKS = {
  primitiveReflexes: "https://fnhrefapp.com/primitive-reflexes",
  cranialNerves: "https://fnhrefapp.com/cranial-nerves",
  brainZones: "https://fnhrefapp.com/brain-zones",
  ligaments: "https://fnhrefapp.com/ligament-reference",
  lymph: "https://fnhrefapp.com/lymph-reference",
};

/** Small square tile that opens an external reference page in a new tab. */
const ResourceLink = ({ href, title }: { href: string; title: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={`${title} — open external reference`}
    aria-label={`${title} — open external reference`}
    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
  >
    <ExternalLink size={13} />
  </a>
);

type QuickPattern = Record<string, Record<string, string | undefined>> & {
  reflexCorrections?: Record<string, ReflexCorrection[]>;
};

/**
 * One cranial nerve in Quick Assess. Stim lines are collapsed by default —
 * they expand on click, and open automatically when the nerve is marked
 * inhibited — so twelve nerves read as twelve rows, not five screens.
 */
const CranialNerveRow = ({
  nerve,
  pattern,
  onToggle,
  getCorrections,
  isPriority,
  getPriorityTier,
  setPriorityTier,
  addCorrection,
  updateCorrection,
  toggleHolding,
  removeCorrection,
  togglePriority,
}: {
  nerve: (typeof CRANIAL_NERVES)[number];
  pattern: QuickPattern;
  onToggle: (name: string, nextStatus: string, side?: 'L' | 'R', parentName?: string) => void;
  getCorrections: (category: string, name: string, side?: "L" | "R") => ReflexCorrection[];
  isPriority: (category: string, name: string, side?: "L" | "R") => boolean;
  getPriorityTier: (category: string, name: string, side?: "L" | "R") => FindingPriority | null;
  setPriorityTier: (category: string, name: string, side: "L" | "R" | undefined, tier: FindingPriority | null) => void;
  addCorrection: (category: string, name: string, correction: ReflexCorrection, side?: "L" | "R") => void | Promise<void>;
  updateCorrection: (category: string, name: string, correction: ReflexCorrection, side?: "L" | "R") => void | Promise<void>;
  toggleHolding: (category: string, name: string, id: string, side?: "L" | "R") => void;
  removeCorrection: (category: string, name: string, id: string, side?: "L" | "R") => void;
  togglePriority: (category: string, name: string, side?: "L" | "R") => void;
}) => {
  const nerveName = `${nerve.name}: ${nerve.latinName}`;
  const stimLines = nerveStimLines(nerve);
  const isLatStim = (i: number) => isLateralStim(nerve.id, i);
  const hasStims = stimLines.length > 0;

  const parentStatus = pattern.cranialNerves?.[nerveName];
  const leftStatus = pattern.cranialNerves?.[`${nerveName} (L)`];
  const rightStatus = pattern.cranialNerves?.[`${nerveName} (R)`];
  const [expanded, setExpanded] = useState(false);

  // Marking the nerve inhibited on either side (or unsided) opens its stim
  // lines, even if the row was manually collapsed just before.
  useEffect(() => {
    const inhibited = [parentStatus, leftStatus, rightStatus].some(
      (status) => status === 'Inhibited' || status === 'Inhibition'
    );
    if (inhibited) setExpanded(true);
  }, [parentStatus, leftStatus, rightStatus]);

  const getStatus = (compositeName: string, side?: 'L' | 'R') => {
    const key = side ? `${compositeName} (${side})` : compositeName;
    return pattern.cranialNerves?.[key] || null;
  };
  const toggleStatus = (compositeName: string, side?: 'L' | 'R') => {
    const current = getStatus(compositeName, side);
    const next = current === 'Inhibited' ? 'Clear' : current === 'Clear' ? null : 'Inhibited';
    onToggle(compositeName, next || 'Clear', side, nerveName);
  };

  return (
    <div className="py-2.5 border-b border-border/40 last:border-b-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <button
          type="button"
          onClick={() => { if (hasStims) setExpanded((v) => !v); }}
          className={cn("flex min-w-0 items-start gap-2 text-left", hasStims ? "cursor-pointer" : "cursor-default")}
          title={hasStims ? (expanded ? "Hide stim lines" : "Show stim lines") : undefined}
        >
          {hasStims ? (
            <ChevronRight
              size={14}
              className={cn("mt-1 shrink-0 text-muted-foreground/50 transition-transform", expanded && "rotate-90")}
            />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-foreground">{nerveName}</span>
            <span className="block text-[11px] text-muted-foreground/70">{nerve.nuclei} • {nerve.reflexPoint}</span>
          </span>
        </button>
        {!nerve.isLateralized && (
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <ReflexQuickRow category="cranialNerves" name={nerveName} pattern={pattern} onToggle={(cat, name, status, side) => onToggle(name, status, side)} corrections={getCorrections("cranialNerves", nerveName)} isPriority={isPriority("cranialNerves", nerveName)} onTogglePriority={() => togglePriority("cranialNerves", nerveName)} priorityTier={getPriorityTier("cranialNerves", nerveName)} onSetPriorityTier={(tier) => setPriorityTier("cranialNerves", nerveName, undefined, tier)} onAddCorrection={(c) => addCorrection("cranialNerves", nerveName, c)} onUpdateCorrection={(c)=>updateCorrection("cranialNerves", nerveName, c)} onToggleHolding={(id) => toggleHolding("cranialNerves", nerveName, id)} onRemoveCorrection={(id) => removeCorrection("cranialNerves", nerveName, id)} />
          </div>
        )}
        {nerve.isLateralized && (
          <div className="grid shrink-0 grid-cols-2 gap-1.5">
            <ReflexQuickRow category="cranialNerves" name={nerveName} side="L" compact pattern={pattern} onToggle={(cat, name, status, side) => onToggle(name, status, side)} corrections={getCorrections("cranialNerves", nerveName, "L")} isPriority={isPriority("cranialNerves", nerveName, "L")} onTogglePriority={() => togglePriority("cranialNerves", nerveName, "L")} priorityTier={getPriorityTier("cranialNerves", nerveName, "L")} onSetPriorityTier={(tier) => setPriorityTier("cranialNerves", nerveName, "L", tier)} onAddCorrection={(c) => addCorrection("cranialNerves", nerveName, c, "L")} onUpdateCorrection={(c)=>updateCorrection("cranialNerves", nerveName, c, "L")} onToggleHolding={(id) => toggleHolding("cranialNerves", nerveName, id, "L")} onRemoveCorrection={(id) => removeCorrection("cranialNerves", nerveName, id, "L")} />
            <ReflexQuickRow category="cranialNerves" name={nerveName} side="R" compact pattern={pattern} onToggle={(cat, name, status, side) => onToggle(name, status, side)} corrections={getCorrections("cranialNerves", nerveName, "R")} isPriority={isPriority("cranialNerves", nerveName, "R")} onTogglePriority={() => togglePriority("cranialNerves", nerveName, "R")} priorityTier={getPriorityTier("cranialNerves", nerveName, "R")} onSetPriorityTier={(tier) => setPriorityTier("cranialNerves", nerveName, "R", tier)} onAddCorrection={(c) => addCorrection("cranialNerves", nerveName, c, "R")} onUpdateCorrection={(c)=>updateCorrection("cranialNerves", nerveName, c, "R")} onToggleHolding={(id) => toggleHolding("cranialNerves", nerveName, id, "R")} onRemoveCorrection={(id) => removeCorrection("cranialNerves", nerveName, id, "R")} />
          </div>
        )}
      </div>
      {hasStims && expanded && (
        <div className="ml-6 mt-1.5 space-y-0.5 border-l border-border/40 pl-3">
          {stimLines.map((line, i) => {
            const lateral = isLatStim(i);
            const compositeName = `${nerveName} — ${line}`;
            // A stim is information on the nerve, not a pathway to correct.
            return (
              <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-3 py-0.5 px-1 -mx-1 rounded-md">
                  <p className="text-[12px] text-foreground/80 break-words">{line}</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    {lateral ? (
                      <>
                        {(['L', 'R'] as const).map((side) => {
                          const s = getStatus(compositeName, side);
                          return (
                            <button
                              key={side}
                              onClick={() => toggleStatus(compositeName, side)}
                              title={`${side}: ${s === 'Inhibited' ? 'Inhibited' : s === 'Clear' ? 'Clear' : 'Untested'}`}
                              aria-label={`${side}: ${s === 'Inhibited' ? 'Inhibited' : s === 'Clear' ? 'Clear' : 'Untested'}`}
                              className={cn(
                                "inline-flex h-7 w-8 items-center justify-center rounded-md border transition-colors",
                                s === 'Inhibited' ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" :
                                s === 'Clear' ? "bg-primary/10 text-primary-strong dark:text-primary border-primary/30" :
                                "border-border text-muted-foreground/60 hover:border-rose-300 hover:text-rose-600"
                              )}
                            >
                              {s === 'Inhibited' ? <ArrowDown size={11} strokeWidth={2.5} /> : s === 'Clear' ? <Check size={11} strokeWidth={2.5} /> : <span className="text-[10px] font-bold">{side}</span>}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <button
                        onClick={() => toggleStatus(compositeName)}
                        title={getStatus(compositeName) === 'Inhibited' ? 'Inhibited' : getStatus(compositeName) === 'Clear' ? 'Clear' : 'Untested'}
                        aria-label={getStatus(compositeName) === 'Inhibited' ? 'Inhibited' : getStatus(compositeName) === 'Clear' ? 'Clear' : 'Untested'}
                        className={cn(
                          "inline-flex h-7 w-14 items-center justify-center rounded-md border transition-colors",
                          getStatus(compositeName) === 'Inhibited' ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" :
                          getStatus(compositeName) === 'Clear' ? "bg-primary/10 text-primary-strong dark:text-primary border-primary/30" :
                          "border-border text-muted-foreground/60 hover:border-rose-300 hover:text-rose-600"
                        )}
                      >
                        {getStatus(compositeName) === 'Inhibited' ? <ArrowDown size={11} strokeWidth={2.5} /> : getStatus(compositeName) === 'Clear' ? <Check size={11} strokeWidth={2.5} /> : <span className="text-[10px] font-medium text-muted-foreground/60">—</span>}
                      </button>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MuscleGroupGrid = ({ muscles, pattern, onToggle, onSelectMuscle, getCorrections, isPriority, getPriorityTier, setPriorityTier, setPriorityTierForSides, addCorrection, updateCorrection, toggleHolding, removeCorrection, togglePriority }: {
  muscles: string[];
  pattern: QuickPattern;
  onToggle: (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
  onSelectMuscle?: (name: string) => void;
  getCorrections: (category: string, name: string, side?: "L" | "R") => ReflexCorrection[];
  isPriority: (category: string, name: string, side?: "L" | "R") => boolean;
  getPriorityTier: (category: string, name: string, side?: "L" | "R") => FindingPriority | null;
  setPriorityTier: (category: string, name: string, side: "L" | "R" | undefined, tier: FindingPriority | null) => void;
  setPriorityTierForSides: (category: string, name: string, sides: Array<"L" | "R">, tier: FindingPriority | null) => void;
  addCorrection: (category: string, name: string, correction: ReflexCorrection, side?: "L" | "R") => void | Promise<void>;
  updateCorrection: (category: string, name: string, correction: ReflexCorrection, side?: "L" | "R") => void | Promise<void>;
  toggleHolding: (category: string, name: string, id: string, side?: "L" | "R") => void;
  removeCorrection: (category: string, name: string, id: string, side?: "L" | "R") => void;
  togglePriority: (category: string, name: string, side?: "L" | "R") => void;
}) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return muscles;
    const q = search.toLowerCase();
    return muscles.filter(m => m.toLowerCase().includes(q));
  }, [muscles, search]);
  
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search muscles..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="divide-y divide-border/30">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">No muscles found</div>
        ) : filtered.map(m => {
      const info = getMuscleInfo(m);
      const description = info.meridian || undefined;
      const testingInstructions = info.testingPosition || undefined;
      
      if (MIDLINE_MUSCLES.includes(m)) {
        const status = pattern.muscles?.[m];
        const cycleStatus = () => {
          let next: string | null;
          if (status === 'Inhibited' || status === 'Inhibition') next = 'Hypertonic';
          else if (status === 'Hypertonic') next = 'Clear';
          else if (status === 'Clear' || status === 'Normotonic') next = null;
          else next = 'Inhibited';
          onToggle('muscles', m, next === null ? null : next);
        };
        const getColor = (s: unknown) => {
          if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
          if (s === 'Hypertonic') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
          if (s === 'Clear' || s === 'Normotonic') return 'bg-primary/10 text-primary-strong dark:text-primary border-primary/30';
          return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
        };
        return (
          <PathwayRow key={m} itemName={m} corrections={getCorrections("muscles", m)} isPriority={isPriority("muscles", m)} onTogglePriority={() => togglePriority("muscles", m)} priorityTier={getPriorityTier("muscles", m)} onSetPriorityTier={(tier) => setPriorityTier("muscles", m, undefined, tier)} onAddCorrection={(c) => addCorrection("muscles", m, c)} onUpdateCorrection={(c)=>updateCorrection("muscles", m, c)} onToggleHolding={(id) => toggleHolding("muscles", m, id)} onRemoveCorrection={(id) => removeCorrection("muscles", m, id)}>
            <div className={cn("group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all", isPriority("muscles", m) && "bg-primary/[0.04]")}>
              <div className="flex-1 min-w-0">
                <button onClick={() => onSelectMuscle?.(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
                {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
                {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
              </div>
              <button
                onClick={cycleStatus}
                className={cn("inline-flex h-7 min-w-[52px] items-center justify-center rounded-md border px-2 transition-all shrink-0 shadow-sm hover:shadow", getColor(status))}
                title={(status === 'Inhibited' || status === 'Inhibition') ? 'Inhibited' : status === 'Hypertonic' ? 'Hypertonic' : (status === 'Clear' || status === 'Normotonic') ? 'Clear' : 'Untested'}
                aria-label={(status === 'Inhibited' || status === 'Inhibition') ? 'Inhibited' : status === 'Hypertonic' ? 'Hypertonic' : (status === 'Clear' || status === 'Normotonic') ? 'Clear' : 'Untested'}
              >
                {(status === 'Inhibited' || status === 'Inhibition') ? <ArrowDown size={13} strokeWidth={2.5} /> : status === 'Hypertonic' ? <ArrowUp size={13} strokeWidth={2.5} /> : (status === 'Clear' || status === 'Normotonic') ? <Check size={13} strokeWidth={2.5} /> : <span className="text-[10px] font-medium text-muted-foreground/60">—</span>}
              </button>
            </div>
          </PathwayRow>
        );
      }
      
      // Lateralized muscle
      const statusL = pattern.muscles?.[`${m} (L)`];
      const statusR = pattern.muscles?.[`${m} (R)`];

      const cycleStatus = (side: 'L' | 'R') => {
        const current = side === 'L' ? statusL : statusR;
        let next: string | null;
        if (current === 'Inhibited' || current === 'Inhibition') next = 'Hypertonic';
        else if (current === 'Hypertonic') next = 'Clear';
        else if (current === 'Clear' || current === 'Normotonic') next = null;
        else next = 'Inhibited';
        onToggle('muscles', m, next === null ? null : next, side);
      };

      const getColor = (s: unknown) => {
        if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
        if (s === 'Hypertonic') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
        if (s === 'Clear' || s === 'Normotonic') return 'bg-primary/10 text-primary-strong dark:text-primary border-primary/30';
        return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
      };

      const getLabel = (s: unknown) => {
        if (s === 'Inhibited' || s === 'Inhibition') return 'Inhibited';
        if (s === 'Hypertonic') return 'Hypertonic';
        if (s === 'Clear' || s === 'Normotonic') return 'Clear';
        return 'Untested';
      };

      const renderStatusIcon = (s: unknown) => {
        if (s === 'Inhibited' || s === 'Inhibition') return <ArrowDown size={13} strokeWidth={2.5} />;
        if (s === 'Hypertonic') return <ArrowUp size={13} strokeWidth={2.5} />;
        if (s === 'Clear' || s === 'Normotonic') return <Check size={13} strokeWidth={2.5} />;
        return <span className="text-[10px] font-medium text-muted-foreground/60">—</span>;
      };

      const pri = isPriority("muscles", m, "L") || isPriority("muscles", m, "R");
      return (
        <PathwayRow key={m} itemName={m} corrections={[...getCorrections("muscles", m, "L"), ...getCorrections("muscles", m, "R")]} isPriority={pri} onTogglePriority={() => { togglePriority("muscles", m, "L"); if (isPriority("muscles", m, "L") !== isPriority("muscles", m, "R")) togglePriority("muscles", m, "R"); }} priorityTier={getPriorityTier("muscles", m, "L") ?? getPriorityTier("muscles", m, "R")} onSetPriorityTier={(tier) => setPriorityTierForSides("muscles", m, ["L", "R"], tier)} onAddCorrection={(c) => addCorrection("muscles", m, c, "L")} onUpdateCorrection={(c)=>{ const side = getCorrections("muscles", m, "L").some(x=>x.id===c.id) ? "L" : getCorrections("muscles", m, "R").some(x=>x.id===c.id) ? "R" : "L"; updateCorrection("muscles", m, c, side); }} onToggleHolding={(id) => { if (getCorrections("muscles", m, "L").some(c=>c.id===id)) toggleHolding("muscles", m, id, "L"); else toggleHolding("muscles", m, id, "R"); }} onRemoveCorrection={(id) => { if (getCorrections("muscles", m, "L").some(c=>c.id===id)) removeCorrection("muscles", m, id, "L"); else removeCorrection("muscles", m, id, "R"); }}>
          <div className={cn("group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all", pri && "bg-amber-500/[0.04]")}>
            <div className="flex-1 min-w-0">
              <button onClick={() => onSelectMuscle?.(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
              {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
              {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">L</span>
                <button onClick={() => cycleStatus('L')} title={getLabel(statusL)} aria-label={`Left: ${getLabel(statusL)}`} className={cn("inline-flex h-7 min-w-[52px] items-center justify-center rounded-md border transition-all shadow-sm hover:shadow", getColor(statusL))}>{renderStatusIcon(statusL)}</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">R</span>
                <button onClick={() => cycleStatus('R')} title={getLabel(statusR)} aria-label={`Right: ${getLabel(statusR)}`} className={cn("inline-flex h-7 min-w-[52px] items-center justify-center rounded-md border transition-all shadow-sm hover:shadow", getColor(statusR))}>{renderStatusIcon(statusR)}</button>
              </div>
            </div>
          </div>
        </PathwayRow>
      );
    })}
      </div>
    </div>
  );
};

const PreliminaryPhaseV3 = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const hasHistory = history.length >= 2;
  const [subTab, setSubTab] = useState<SubTab>('intake');
  const [assessmentsOpen, setAssessmentsOpen] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [globalMuscleSearch, setGlobalMuscleSearch] = useState('');
  const {
    getCorrections,
    isPriority,
    getPriorityTier,
    setPriorityTier,
    setPriorityTierForSides,
    addCorrection,
    updateCorrection,
    toggleHolding,
    removeCorrection,
    togglePriority,
  } = useItemCorrections(appointment, saveField, onUpdate);
  const tabs = hasHistory
    ? [{ id: 'recheck' as SubTab, label: 'Recheck', icon: RotateCcw }, ...SUB_TABS]
    : SUB_TABS;

  const previousSession = history.length >= 2 ? history[1] : null;
  const lastSessionDate = previousSession?.date;
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  const hasCogsNotes = Boolean(
    appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes,
  );
  const hasNeuroNotes = Boolean(
    appointment.fakuda_notes || appointment.sharpened_rhombergs_notes ||
    appointment.frontal_lobe_notes || appointment.righting_reflex_notes,
  );
  const recordedAssessments = Number(hasCogsNotes) + Number(hasNeuroNotes);

  return (
    <Section className="space-y-5">

        {/* Stale alert — soft warning banner */}
        {isStale && (
          <AlertBanner
            variant="warning"
            icon={AlertTriangle}
            title={`Over ${Math.floor(daysSinceLast / 30)} months since the last session`}
            className="border-warning/30 bg-warning/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-foreground/80">
                Baseline findings and CO₂ tolerance may have shifted. Check what carried over before you begin.
              </p>
              <SecondaryButton
                onClick={() => setSubTab('recheck')}
                className="h-8 shrink-0 rounded-lg px-3 text-[12px]"
              >
                Review baseline shifts <ArrowRight size={13} />
              </SecondaryButton>
            </div>
          </AlertBanner>
        )}

        {/* Baseline vitals are now shown in the header status strip — no duplicate here. */}

        {/* Sub-tab bar — segmented track attached to the content it filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SegmentedTabs tabs={tabs} activeTab={subTab} onChange={(id: string) => setSubTab(id as SubTab)} />
          </div>
          <button
            onClick={() => setSubTab('report')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 border",
              subTab === 'report' ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted/50 text-foreground/80 border-border"
            )}
          >
            <FileText size={14} />
            Report
          </button>
        </div>

        {/* Sub-tab content */}
        <div key={subTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {subTab === 'recheck' && (
            <Card className="space-y-4" padding="comfortable">
              <SectionHeader
                icon={RotateCcw}
                title="Recheck since last visit"
                subtitle="Carry forward or retire unresolved findings"
              />
              <RecheckTabV2
                appointment={appointment}
                history={history}
                onUpdate={onUpdate}
                updatePriorityPattern={updatePriorityPattern}
                saveField={saveField}
                onJumpToPhase={onJumpToPhase}
              />
            </Card>
          )}

          {subTab === 'intake' && (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_340px]">
              {/* Left: clinical measurements */}
              <div className="order-2 min-w-0 space-y-4 lg:order-1">
                {/* Baseline Vitals Card — primary card */}
                <Card className="space-y-4" padding="comfortable">
                  <SectionHeader
                    icon={Activity}
                    title="Baseline vitals"
                    subtitle="Breath, heart rate and CO₂ tolerance"
                  />
                  <BoltTestSection
                    appointmentId={appointment.id}
                    initialBoltScore={appointment.bolt_score}
                    onUpdate={onUpdate}
                    history={history}
                  />
                  <div className="divider" />
                  <CoherenceAssessment
                    appointmentId={appointment.id}
                    initialHeartRate={appointment.heart_rate}
                    initialBreathRate={appointment.breath_rate}
                    initialCoherenceScore={appointment.coherence_score}
                    onUpdate={onUpdate}
                    history={history}
                    flat
                  />
                </Card>

                {/* Secondary assessments — tucked away so the baseline reads first */}
                <div className="space-y-3 border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setAssessmentsOpen((open) => !open)}
                    aria-expanded={assessmentsOpen}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block text-card-title">Assessments</span>
                      <span className="mt-0.5 block text-meta">
                        COGS and neurological baseline · {recordedAssessments} of 2 recorded
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn("shrink-0 text-muted-foreground transition-transform", assessmentsOpen && "rotate-180")}
                    />
                  </button>

                  {assessmentsOpen && (
                    <div className="space-y-4">
                      <Card padding="comfortable">
                        <CogsAssessment
                          appointmentId={appointment.id}
                          initialSagittalNotes={appointment.sagittal_plane_notes}
                          initialFrontalNotes={appointment.frontal_plane_notes}
                          initialTransverseNotes={appointment.transverse_plane_notes}
                          onUpdate={onUpdate}
                        />
                      </Card>

                      <Card padding="comfortable">
                        <NeurologicalAssessments
                          appointmentId={appointment.id}
                          initialFakudaNotes={appointment.fakuda_notes}
                          initialRhombergsNotes={appointment.sharpened_rhombergs_notes}
                          initialFrontalLobeNotes={appointment.frontal_lobe_notes}
                          initialRightingReflexNotes={appointment.righting_reflex_notes}
                          onUpdate={onUpdate}
                        />
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: narrative/context (sticky) */}
              <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
                <Card className="space-y-4" padding="comfortable">
                  <SectionHeader icon={Compass} title="Session goal" />
                  <EditableField
                    key={`goal-${appointment.id}`}
                    field="goal"
                    label=""
                    value={appointment.goal}
                    multiline
                    placeholder="e.g. Resolve chronic neck pain, improve sleep quality..."
                    onSave={saveField}
                    className="border-none p-0 shadow-none bg-transparent text-body"
                  />

                  <div className="divider" />

                  <SectionHeader icon={ClipboardList} title="Primary concern" />
                  <EditableField
                    key={`issue-${appointment.id}`}
                    field="issue"
                    label=""
                    value={appointment.issue}
                    multiline
                    placeholder="Describe the current symptoms and history..."
                    onSave={saveField}
                    className="border-none p-0 shadow-none bg-transparent text-body"
                  />
                </Card>
              </div>
            </div>
          )}

          {subTab === 'quick' && (() => {
            const pattern = safeParse<QuickPattern>(appointment.priority_pattern, {});
            const quickToggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
              updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
            };
            const reflexCorrections = (pattern as any).reflexCorrections as Record<string, ReflexCorrection[]> | undefined;
            const priorities = (pattern.priorities ?? {}) as Record<string, string | undefined>;
            // Cranial nerve toggle: when a stim line is marked inhibited, also mark the parent nerve.
            // When a stim line is cleared, un-inhibit the parent if no other stim lines remain inhibited.
            const clearStimPattern = (nerveId: number, side?: 'L' | 'R') => {
              cranialStimPatternFindings(pattern.cranialNerves)
                .filter(p => p.nerve.id === nerveId && (!side || !p.side || p.side === side))
                .forEach(p => updatePriorityPattern('cranialNerves', p.nerveName, null, p.side));
            };
            const nerveForName = (name: string) =>
              CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === name);

            const cnToggle = (name: string, nextStatus: string, side?: 'L' | 'R', parentName?: string) => {
              quickToggle('cranialNerves', name, nextStatus, side);

              if (!parentName) {
                // Correcting the nerve also corrects its stims — the stim is
                // information on the nerve, not its own finding.
                if (nextStatus === 'Clear' || nextStatus === 'Normotonic') {
                  const nerve = nerveForName(name);
                  if (nerve) clearStimPattern(nerve.id, side);
                }
                return;
              }

              if (nextStatus !== 'Clear') {
                // Marking as inhibited → ensure parent is also inhibited
                quickToggle('cranialNerves', parentName, 'Inhibited', side);
              } else {
                // Clearing → check if any other stim lines for this nerve are still inhibited
                const nerve = nerveForName(parentName);
                if (!nerve) return;
                const allStimLines = nerveStimLines(nerve);
                const otherStimLines = allStimLines.filter(l => l !== name);
                const anyStillInhibited = otherStimLines.some(line => {
                  const key = side ? `${parentName} — ${line} (${side})` : `${parentName} — ${line}`;
                  const status = pattern.cranialNerves?.[key];
                  return status === 'Inhibited' || status === 'Inhibition';
                });
                if (!anyStillInhibited) {
                  quickToggle('cranialNerves', parentName, 'Clear', side);
                  clearStimPattern(nerve.id, side);
                }
              }
            };
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Primitive Reflexes — column 1 */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Baby} title="Primitive reflexes" iconTone={categoryTone('primitiveReflexes').tile}>
                    <ResourceLink href={FNH_LINKS.primitiveReflexes} title="Primitive reflexes" />
                  </SectionHeader>
                  <div className="grid grid-cols-1 gap-4">
                    {REFLEX_TRACKS.map(({ num, label, desc, ids }) => ({
                      num, label, desc, reflexes: ids,
                    })).map(group => {
                      const groupReflexes = PRIMITIVE_REFLEXES.flatMap(r => {
                        if (r.id === 'tlr') {
                          return [
                            { ...r, id: "tlr-flexion", name: "TLR (Flexion)", track: 1 },
                            { ...r, id: 'tlr-extension', name: 'TLR (Extension)', track: 1 },
                          ];
                        }
                        if (r.id === 'stnr') {
                          return [
                            { ...r, id: 'stnr-flexion', name: 'STNR (Flexion)', track: 1 },
                            { ...r, id: 'stnr-extension', name: 'STNR (Extension)', track: 1 },
                          ];
                        }
                        return [r];
                      }).filter(r => group.reflexes.includes(r.id))
                      .sort((a, b) => group.reflexes.indexOf(a.id) - group.reflexes.indexOf(b.id));
                      if (groupReflexes.length === 0) return null;
                      const trackCorrections = groupReflexes.flatMap((r) => {
                        if (r.isLateralized) {
                          return [
                            ...((reflexCorrections?.[reflexCorrectionKey(r.name, 'L')] ?? []) as ReflexCorrection[]),
                            ...((reflexCorrections?.[reflexCorrectionKey(r.name, 'R')] ?? []) as ReflexCorrection[]),
                          ];
                        }
                        return ((reflexCorrections?.[reflexCorrectionKey(r.name)] ?? []) as ReflexCorrection[]);
                      });
                      const trackHolding = trackCorrections.filter((c) => c.holding).length;
                      const trackPriority = groupReflexes.reduce((n, r) => {
                        if (r.isLateralized) {
                          return n + (priorities[reflexPriorityKey(reflexCorrectionKey(r.name, 'L'))] ? 1 : 0) + (priorities[reflexPriorityKey(reflexCorrectionKey(r.name, 'R'))] ? 1 : 0);
                        }
                        return n + (priorities[reflexPriorityKey(reflexCorrectionKey(r.name))] ? 1 : 0);
                      }, 0);
                      return (
                        <div key={group.num} className="space-y-2">
                          <div className="flex items-center gap-3 px-1 py-1">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold text-primary-foreground bg-primary">
                              {group.num}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-[12px] font-semibold tracking-tight text-foreground">{group.label}</h3>
                              <p className="text-[11px] text-muted-foreground">{group.desc}</p>
                            </div>
                            {(trackHolding > 0 || trackPriority > 0) && (
                              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                {trackHolding > 0 ? `${trackHolding} holding` : ""}
                                {trackHolding > 0 && trackPriority > 0 ? <span className="mx-1.5 text-muted-foreground/40">·</span> : null}
                                {trackPriority > 0 ? `${trackPriority} priority` : ""}
                              </span>
                            )}
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="space-y-2">
                            {(() => {
                              // Pair TLR flexion/extension and STNR flexion/extension on
                              // the same row, but keep the track's declared order
                              // (Moro → Startle → TLR → STNR → FPR). Building the pairs
                              // first and appending `others` afterwards used to drag
                              // TLR/STNR to the top, contradicting the header.
                              const paired: { type: string; items: typeof PRIMITIVE_REFLEXES[number][] }[] = [];
                              const seen = new Set<string>();
                              const PARTNER: Record<string, string> = {
                                'tlr-flexion': 'tlr-extension',
                                'tlr-extension': 'tlr-flexion',
                                'stnr-flexion': 'stnr-extension',
                                'stnr-extension': 'stnr-flexion',
                              };
                              for (const r of groupReflexes) {
                                if (seen.has(r.id)) continue;
                                seen.add(r.id);
                                const partnerId = PARTNER[r.id];
                                if (partnerId) {
                                  const partner = groupReflexes.find(x => x.id === partnerId);
                                  if (partner) seen.add(partnerId);
                                  const items = partner ? [r, partner] : [r];
                                  paired.push({ type: items.length === 2 ? 'pair' : 'single', items });
                                } else {
                                  paired.push({ type: r.isLateralized ? 'lateral' : 'single', items: [r] });
                                }
                              }

                              const renderReflexRow = (r: typeof PRIMITIVE_REFLEXES[number], side?: 'L' | 'R') => {
                                const key = reflexCorrectionKey(r.name, side);
                                return (
                                  <ReflexQuickRow
                                    key={key}
                                    category="primitiveReflexes"
                                    name={r.name}
                                    side={side}
                                    pattern={pattern}
                                    onToggle={quickToggle}
                                    corrections={getCorrections("primitiveReflexes", r.name, side)}
                                    isPriority={isPriority("primitiveReflexes", r.name, side)}
                                    onTogglePriority={() => togglePriority("primitiveReflexes", r.name, side)}
                                    priorityTier={getPriorityTier("primitiveReflexes", r.name, side)}
                                    onSetPriorityTier={(tier) => setPriorityTier("primitiveReflexes", r.name, side, tier)}
                                    onAddCorrection={(correction) => addCorrection("primitiveReflexes", r.name, correction, side)}
                                    onUpdateCorrection={(correction) => updateCorrection("primitiveReflexes", r.name, correction, side)}
                                    onToggleHolding={(id) => toggleHolding("primitiveReflexes", r.name, id, side)}
                                    onRemoveCorrection={(id) => removeCorrection("primitiveReflexes", r.name, id, side)}
                                  />
                                );
                              };

                              return paired.map((p, pi) => {
                                if (p.type === 'pair') {
                                  return (
                                    <div key={pi} className="flex items-start gap-2">
                                      <div className="min-w-0 flex-1">{renderReflexRow(p.items[0])}</div>
                                      <div className="min-w-0 flex-1">{renderReflexRow(p.items[1])}</div>
                                    </div>
                                  );
                                }
                                if (p.type === 'lateral') {
                                  const r = p.items[0];
                                  return (
                                    <div key={pi} className="flex items-start gap-2">
                                      <div className="min-w-0 flex-1">{renderReflexRow(r, 'L')}</div>
                                      <div className="min-w-0 flex-1">{renderReflexRow(r, 'R')}</div>
                                    </div>
                                  );
                                }
                                return renderReflexRow(p.items[0]);
                              });
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Cranial Nerves + Intrinsic — column 2 */}
                <div className="space-y-4">
                <Card className="space-y-2" padding="comfortable">
                  <SectionHeader icon={Zap} title="Cranial nerves" iconTone={categoryTone('cranialNerves').tile}>
                    <ResourceLink href={FNH_LINKS.cranialNerves} title="Cranial nerves" />
                  </SectionHeader>
                  <div>
                    {CRANIAL_NERVES.map(n => (
                      <CranialNerveRow key={n.name} nerve={n} pattern={pattern} onToggle={cnToggle} getCorrections={getCorrections} isPriority={isPriority} getPriorityTier={getPriorityTier} setPriorityTier={setPriorityTier} addCorrection={addCorrection} updateCorrection={updateCorrection} toggleHolding={toggleHolding} removeCorrection={removeCorrection} togglePriority={togglePriority} />
                    ))}
                  </div>
                </Card>

                {/* Muscles — Intrinsic Stabilisation */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Dumbbell} title="Intrinsic stabilisation" iconTone={categoryTone('muscles').tile}>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                      <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold">↓</span> Inhibited</span>
                      <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold">↑</span> Hypertonic</span>
                      <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-primary-strong dark:text-primary text-[11px] font-bold">✓</span> Clear</span>
                    </div>
                    <ResourceLink href={FNH_LINKS.ligaments} title="Ligament reference" />
                  </SectionHeader>
                  <MuscleGroupGrid muscles={MUSCLE_GROUPS['Intrinsic Stabilisation'] || []} pattern={pattern} onToggle={quickToggle} onSelectMuscle={setSelectedMuscle} getCorrections={getCorrections} isPriority={isPriority} getPriorityTier={getPriorityTier} setPriorityTier={setPriorityTier} setPriorityTierForSides={setPriorityTierForSides} addCorrection={addCorrection} updateCorrection={updateCorrection} toggleHolding={toggleHolding} removeCorrection={removeCorrection} togglePriority={togglePriority} />
                </Card>
                </div>
              </div>
            );
          })()}

          {subTab === 'muscles' && (() => {
            const pattern = safeParse<QuickPattern>(appointment.priority_pattern, {});
            const toggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
              updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
            };
            const globalSearch = globalMuscleSearch;
            const setGlobalSearch = setGlobalMuscleSearch;
            const allMuscles = Object.entries(MUSCLE_GROUPS).flatMap(([group, muscles]) => muscles.map(m => ({ m, group })));
            const filtered = globalSearch.trim() ? allMuscles.filter(({ m }) => m.toLowerCase().includes(globalSearch.toLowerCase())) : null;
            return (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search all muscles (e.g., SCM, Psoas)..."
                    className="w-full pl-10 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {filtered ? (
                  <Card className="space-y-3" padding="comfortable">
                    <SectionHeader icon={Dumbbell} title="Search Results" subtitle={`${filtered.length} found`} iconTone={categoryTone('muscles').tile} />
                    <div className="divide-y divide-border/30">
                      {filtered.map(({ m, group }) => {
                        const info = getMuscleInfo(m);
                        const description = info.meridian || undefined;
                        const testingInstructions = info.testingPosition || undefined;
                        if (MIDLINE_MUSCLES.includes(m)) {
                          const status = pattern.muscles?.[m];
                          const cycleStatus = () => {
                            let next: string | null;
                            if (status === 'Inhibited' || status === 'Inhibition') next = 'Hypertonic';
                            else if (status === 'Hypertonic') next = 'Clear';
                            else if (status === 'Clear' || status === 'Normotonic') next = null;
                            else next = 'Inhibited';
                            toggle('muscles', m, next === null ? null : next);
                          };
                          const getColor = (s: unknown) => {
                            if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
                            if (s === 'Hypertonic') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
                            if (s === 'Clear' || s === 'Normotonic') return 'bg-primary/10 text-primary-strong dark:text-primary border-primary/30';
                            return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
                          };
                          return (
                            <div key={m} className="group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setSelectedMuscle(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{group}</span>
                                </div>
                                {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
                                {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
                              </div>
                              <button
                                onClick={cycleStatus}
                                className={cn("px-3 py-1 rounded-md text-[11px] font-bold border transition-all shrink-0 shadow-sm hover:shadow", getColor(status))}
                              >
                                {(status === 'Inhibited' || status === 'Inhibition') ? 'Inhibited' : status === 'Hypertonic' ? 'Hypertonic' : (status === 'Clear' || status === 'Normotonic') ? 'Clear' : 'Untested'}
                              </button>
                            </div>
                          );
                        }
                        const statusL = pattern.muscles?.[`${m} (L)`];
                        const statusR = pattern.muscles?.[`${m} (R)`];
                        const cycleStatus = (side: 'L' | 'R') => {
                          const current = side === 'L' ? statusL : statusR;
                          let next: string | null;
                          if (current === 'Inhibited' || current === 'Inhibition') next = 'Hypertonic';
                          else if (current === 'Hypertonic') next = 'Clear';
                          else if (current === 'Clear' || current === 'Normotonic') next = null;
                          else next = 'Inhibited';
                          toggle('muscles', m, next === null ? null : next, side);
                        };
                        const getColor = (s: unknown) => {
                          if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
                          if (s === 'Hypertonic') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
                          if (s === 'Clear' || s === 'Normotonic') return 'bg-primary/10 text-primary-strong dark:text-primary border-primary/30';
                          return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
                        };
                        const getLabel = (s: unknown) => {
                          if (s === 'Inhibited' || s === 'Inhibition') return 'Inhibited';
                          if (s === 'Hypertonic') return 'Hypertonic';
                          if (s === 'Clear' || s === 'Normotonic') return 'Clear';
                          return '—';
                        };
                        return (
                          <div key={m} className="group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedMuscle(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{group}</span>
                              </div>
                              {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
                              {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">L</span>
                                <button
                                  onClick={() => cycleStatus('L')}
                                  className={cn("px-3 py-1 rounded-md text-[11px] font-bold border transition-all min-w-[76px] shadow-sm hover:shadow", getColor(statusL))}
                                >
                                  {getLabel(statusL)}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.14em]">R</span>
                                <button
                                  onClick={() => cycleStatus('R')}
                                  className={cn("px-3 py-1 rounded-md text-[11px] font-bold border transition-all min-w-[76px] shadow-sm hover:shadow", getColor(statusR))}
                                >
                                  {getLabel(statusR)}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : (
                  Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
                    <Card key={groupName} className="space-y-3" padding="comfortable">
                      <SectionHeader icon={Dumbbell} title={groupName} iconTone={categoryTone('muscles').tile}>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                          <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold">↓</span> Inhibited</span>
                          <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold">↑</span> Hypertonic</span>
                          <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-primary-strong dark:text-primary text-[11px] font-bold">✓</span> Clear</span>
                        </div>
                      </SectionHeader>
                      <MuscleGroupGrid muscles={muscles} pattern={pattern} onToggle={toggle} onSelectMuscle={setSelectedMuscle} getCorrections={getCorrections} isPriority={isPriority} getPriorityTier={getPriorityTier} setPriorityTier={setPriorityTier} setPriorityTierForSides={setPriorityTierForSides} addCorrection={addCorrection} updateCorrection={updateCorrection} toggleHolding={toggleHolding} removeCorrection={removeCorrection} togglePriority={togglePriority} />
                    </Card>
                  ))
                )}
              </div>
            );
          })()}

          {subTab === 'reflexes' && (
            <Section className="space-y-3">
              <SectionHeader icon={Baby} title="Primitive reflexes" subtitle="Tap a test to record its status" iconTone={categoryTone('primitiveReflexes').tile}>
                <ResourceLink href={FNH_LINKS.primitiveReflexes} title="Primitive reflexes" />
              </SectionHeader>
              <PrimitiveReflexAssessment
                appointmentId={appointment.id}
                priorityPattern={appointment.priority_pattern}
                updatePriorityPattern={updatePriorityPattern}
                saveField={saveField}
                onUpdate={onUpdate}
              />
            </Section>
          )}

          {subTab === 'nerves' && (
            <Section className="space-y-3">
              <SectionHeader icon={Zap} title="Cranial nerves" subtitle="Laterality, stimulation and priority" iconTone={categoryTone('cranialNerves').tile}>
                <ResourceLink href={FNH_LINKS.cranialNerves} title="Cranial nerves" />
              </SectionHeader>
              <CranialNerveAssessment
                appointmentId={appointment.id}
                priorityPattern={appointment.priority_pattern}
                updatePriorityPattern={updatePriorityPattern}
                showImages
                saveField={saveField}
                onUpdate={onUpdate}
              />
            </Section>
          )}

          {subTab === 'zones' && (
            <Section className="space-y-3">
              <SectionHeader icon={Brain} title="Brain zones" subtitle="Cortical and subcortical points" iconTone={categoryTone('brainZones').tile}>
                <ResourceLink href={FNH_LINKS.brainZones} title="Brain zones" />
              </SectionHeader>
              <BrainZoneAssessment
                priorityPattern={appointment.priority_pattern}
                updatePriorityPattern={updatePriorityPattern}
                showImages
              />
            </Section>
          )}

          {subTab === 'eyes' && (() => {
            const pattern = safeParse<QuickPattern>(appointment.priority_pattern, {});
            const eyePattern = pattern.eyeSystems || {};
            const toggle = (name: string, status: 'Inhibited' | 'Clear' | null) => {
              updatePriorityPattern('eyeSystems', name, status);
            };
            const EYE_GROUPS = [
              { label: "Gaze Stabilisation", items: [
                { name: "Vergence", desc: "Convergence & divergence — eyes moving together/apart. Screen: move target toward/away from nose. CN 3, 4, 6.", subs: [
                  { name: "Vergence (Convergence) Left", desc: "Left eye moves inward as target approaches nose." },
                  { name: "Vergence (Convergence) Right", desc: "Right eye moves inward as target approaches nose." },
                  { name: "Vergence (Divergence) Left", desc: "Left eye moves outward as target moves away." },
                  { name: "Vergence (Divergence) Right", desc: "Right eye moves outward as target moves away." },
                ]},
                { name: "VOR", desc: "Vestibulo-ocular reflex — maintain gaze while head moves. Screen: fixate target, move head in all directions. CN 3, 4, 6, 8.", subs: [
                  { name: "VOR (Left)", desc: "Maintain gaze while head turns left." },
                  { name: "VOR (Right)", desc: "Maintain gaze while head turns right." },
                  { name: "VOR (Up)", desc: "Maintain gaze while head extends." },
                  { name: "VOR (Down)", desc: "Maintain gaze while head flexes." },
                ]},
                { name: "Smooth Pursuit", desc: "Tracking — follow a moving target. Screen: move pen left/right, up/down, circles. CN 3, 4, 6.", subs: [] },
              ]},
              { label: "Gaze Shifting", items: [
                { name: "Saccades", desc: "Rapid gaze shifts between targets. Screen: shift gaze between two targets 20-30° apart. CN 3, 4, 6.", subs: [
                  { name: "Saccades (Horizontal)", desc: "Rapid horizontal gaze shifts." },
                  { name: "Saccades (Vertical)", desc: "Rapid vertical gaze shifts." },
                  { name: "Saccades (Top-Right to Bottom-Left)", desc: "Rapid diagonal gaze shifts from top-right to bottom-left." },
                  { name: "Saccades (Bottom-Right to Top-Left)", desc: "Rapid diagonal gaze shifts from bottom-right to top-left." },
                ]},
                { name: "Near-Far", desc: "Fast convergence/divergence shift between close (~30cm) and distant (~5m) targets. CN 3, 4, 6.", subs: [] },
                { name: "Optokinetics", desc: "Moving-field response (OKN). Screen: use OptoDrum app, test all directions. CN 3, 4, 6.", subs: [
                  { name: "Optokinetics (Left)", desc: "Moving-field response left." },
                  { name: "Optokinetics (Right)", desc: "Moving-field response right." },
                  { name: "Optokinetics (Up)", desc: "Moving-field response up." },
                  { name: "Optokinetics (Down)", desc: "Moving-field response down." },
                ]},
              ]},
              { label: "Visual Field", items: [
                { name: "Peripheral Vision", desc: "Visual field module. Screen: distant fixation, challenge left/right peripheral fields. CN 2.", subs: [] },
              ]},
            ];
            const EyeStatusButtons = ({ name, compact = false }: { name: string; compact?: boolean }) => {
              const status = eyePattern[name];
              const isInhibited = status === 'Inhibited';
              const isClear = status === 'Clear';
              const btn = compact ? "inline-flex h-6 w-8 items-center justify-center rounded border transition-colors" : "inline-flex h-7 w-9 items-center justify-center rounded-md border transition-colors";
              const iconSize = compact ? 11 : 12;
              return (
                <div className={cn("flex items-center shrink-0", compact ? "gap-1.5" : "gap-2")}>
                  <button
                    onClick={() => toggle(name, isInhibited ? null : 'Inhibited')}
                    title="Inhibited"
                    aria-label={`${name}: inhibited`}
                    className={cn(btn, isInhibited ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" : "border-rose-300/60 text-rose-600/70 hover:bg-rose-50 dark:border-rose-700/50 dark:text-rose-400/70")}
                  >
                    <ArrowDown size={iconSize} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => toggle(name, isClear ? null : 'Clear')}
                    title="Clear"
                    aria-label={`${name}: clear`}
                    className={cn(btn, isClear ? "bg-primary/10 text-primary-strong dark:text-primary border-primary/30" : "border-primary/30 text-primary/70 hover:bg-primary/5 dark:border-primary/50 dark:text-primary/70")}
                  >
                    <Check size={iconSize} strokeWidth={2.5} />
                  </button>
                </div>
              );
            };
            return (
              <Section className="space-y-3">
                <SectionHeader icon={Eye} title="Eye Systems" subtitle="Vergence, VOR, tracking, saccades, near-far, optokinetics, peripheral" />
                <div className="space-y-4">
                  {EYE_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 px-1">
                        {group.label}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((eye) => {
                          const status = eyePattern[eye.name];
                          const isInhibited = status === 'Inhibited';
                          const isClear = status === 'Clear';
                          const hasSubs = eye.subs && eye.subs.length > 0;
                          const pri = isPriority("eyeSystems", eye.name);
                          return (
                            <PathwayRow key={eye.name} itemName={eye.name} corrections={getCorrections("eyeSystems", eye.name)} isPriority={pri} onTogglePriority={() => togglePriority("eyeSystems", eye.name)} onAddCorrection={(c) => addCorrection("eyeSystems", eye.name, c)} onUpdateCorrection={(c)=>updateCorrection("eyeSystems", eye.name, c)} onToggleHolding={(id) => toggleHolding("eyeSystems", eye.name, id)} onRemoveCorrection={(id) => removeCorrection("eyeSystems", eye.name, id)}>
                              <div
                                className={cn(
                                  "rounded-xl border p-3 space-y-2 transition-all",
                                  isInhibited ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800" :
                                  isClear ? "bg-success/[0.04] border-success/20 opacity-80" :
                                  "border-border bg-card",
                                  pri && "ring-1 ring-primary/25"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-medium text-foreground">{eye.name}</p>
                                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{eye.desc}</p>
                                  </div>
                                  <EyeStatusButtons name={eye.name} />
                                </div>
                                {hasSubs && (
                                  <div className="ml-2 pl-3 border-l-2 border-border/40 space-y-1.5 mt-2">
                                    {eye.subs!.map((sub) => {
                                      const subStatus = eyePattern[sub.name];
                                      const subInhibited = subStatus === 'Inhibited';
                                      const subClear = subStatus === 'Clear';
                                      const subPri = isPriority("eyeSystems", sub.name);
                                      return (
                                        <PathwayRow key={sub.name} itemName={sub.name} corrections={getCorrections("eyeSystems", sub.name)} isPriority={subPri} onTogglePriority={() => togglePriority("eyeSystems", sub.name)} onAddCorrection={(c) => addCorrection("eyeSystems", sub.name, c)} onUpdateCorrection={(c)=>updateCorrection("eyeSystems", sub.name, c)} onToggleHolding={(id) => toggleHolding("eyeSystems", sub.name, id)} onRemoveCorrection={(id) => removeCorrection("eyeSystems", sub.name, id)} glow={false}>
                                          <div className={cn("flex items-center justify-between gap-2 py-1 rounded-md px-1 -mx-1", subPri && "bg-primary/[0.04] ring-1 ring-primary/20")}>
                                            <div className="min-w-0">
                                              <p className="text-[11px] font-medium text-foreground/90">{sub.name.replace(eye.name + " ", "").replace(eye.name, "")}</p>
                                              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{sub.desc}</p>
                                            </div>
                                            <EyeStatusButtons name={sub.name} compact />
                                          </div>
                                        </PathwayRow>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </PathwayRow>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            );
          })()}
        </div>

        {subTab === 'report' && (() => {
          const pattern = safeParse<QuickPattern>(appointment.priority_pattern, {});
          const findings: Array<{category: string, name: string, status: string, side?: string, stims?: string[]}> = [];
          
          Object.entries(pattern.muscles || {}).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic' || val === 'Clear' || val === 'Normotonic') {
              let name = key;
              let side: string | undefined;
              if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
              else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
              findings.push({ category: 'Muscle', name, status: val as string, side });
            }
          });
          
          Object.entries(pattern.primitiveReflexes || {}).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition') {
              let name = key;
              let side: string | undefined;
              if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
              else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
              findings.push({ category: 'Primitive Reflex', name, status: 'Inhibited', side });
            }
          });
          
          Object.entries(splitCranialNervePattern(pattern.cranialNerves).findings).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic' || val === 'Clear' || val === 'Normotonic') {
              let name = key;
              let side: string | undefined;
              if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
              else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
              const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === name || n.name === name);
              const stims = nerve
                ? markedCranialStims({
                    nerve,
                    patternNerves: pattern.cranialNerves,
                    side: side as 'L' | 'R' | undefined,
                  }).map(s => `${s.label}${s.side ? ` (${s.side})` : ''}`)
                : [];
              findings.push({ category: 'Cranial Nerve', name, status: val as string, side, stims: stims.length ? stims : undefined });
            }
          });
          
          Object.entries(pattern.brainZones || {}).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic') {
              findings.push({ category: 'Brain Zone', name: key, status: val as string });
            }
          });
          
          Object.entries(pattern.eyeSystems || {}).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic') {
              findings.push({ category: 'Eye System', name: key, status: val as string });
            }
          });
          
          Object.entries(pattern.intrinsic || {}).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic') {
              let name = key;
              let side: string | undefined;
              if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
              else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
              findings.push({ category: 'Intrinsic', name, status: val as string, side });
            }
          });
          
          const grouped = findings.reduce((acc, f) => {
            if (!acc[f.category]) acc[f.category] = [];
            acc[f.category].push(f);
            return acc;
          }, {} as Record<string, typeof findings>);
          
          const getStatusColor = (s: string) => {
            if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
            if (s === 'Hypertonic') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
            if (s === 'Clear' || s === 'Normotonic') return 'bg-primary/10 text-primary-strong dark:bg-primary/20 dark:text-primary';
            return 'bg-muted text-muted-foreground';
          };
          
          return (
            <Card className="space-y-4" padding="comfortable">
              <SectionHeader icon={FileText} title="Preliminary Report" subtitle={`${findings.length} finding${findings.length !== 1 ? 's' : ''} recorded`} />
              {findings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No findings recorded yet</p>
                  <p className="text-xs mt-1">Complete assessments in the tabs above to see results here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {category}
                        <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Item</th>
                              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Side</th>
                              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {items.map((item, idx) => (
                              <Fragment key={idx}>
                                <tr className="hover:bg-muted/30 transition-colors">
                                  <td className="px-3 py-2 text-sm text-foreground">{item.name}</td>
                                  <td className="px-3 py-2 text-sm text-muted-foreground">{item.side || '—'}</td>
                                  <td className="px-3 py-2">
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(item.status))}>
                                      {item.status === 'Inhibition' ? 'Inhibited' : item.status === 'Normotonic' ? 'Normotonic' : item.status}
                                    </span>
                                  </td>
                                </tr>
                                {item.stims && item.stims.length > 0 && (
                                  <tr className="bg-muted/20">
                                    <td colSpan={3} className="px-3 py-1.5">
                                      <div className="space-y-0.5">
                                        {item.stims.map((label, stimIdx) => (
                                          <div key={stimIdx} className="flex items-baseline gap-1.5 text-[12px] leading-relaxed">
                                            <span className="font-semibold text-destructive">↓</span>
                                            <span className="min-w-0 break-words text-muted-foreground">{label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })()}

        {/* Done affordance — calm confirmation */}
        {subTab !== 'report' && onJumpToPhase && (
          <ConfirmationFooter
            title="Done with Preliminary?"
            description="Next, down-regulate the nervous system."
            action={
              <PrimaryButton onClick={() => onJumpToPhase(1)} className="h-10 gap-2 px-4 text-sm font-medium">
                Continue to Ease <ArrowRight size={14} />
              </PrimaryButton>
            }
          />
        )}
      <MuscleInfoModal
        muscleName={selectedMuscle}
        open={!!selectedMuscle}
        onOpenChange={(open) => { if (!open) setSelectedMuscle(null); }}
      />
    </Section>
  );
};

export default PreliminaryPhaseV3;