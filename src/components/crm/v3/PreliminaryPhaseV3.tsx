import { useState, useMemo } from "react";
import { ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert, Dumbbell, Baby, Zap, Brain, Activity, Compass, RotateCcw, ClipboardList, Eye, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import CheckItem from "@/components/crm/document-view/CheckItem";
import { safeParse } from "@/utils/safe-json";
import { cn } from "@/lib/utils";
import { getMuscleInfo } from "@/data/muscle-info-data";
import MuscleInfoModal from "@/components/crm/MuscleInfoModal";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

import {
  Card,
  Section,
  PrimaryButton,
  SegmentedTabs,
  SectionHeader,
  AlertBanner,
  ConfirmationFooter,
} from "./DesignSystem";

type SubTab = 'recheck' | 'intake' | 'quick' | 'intrinsic' | 'muscles' | 'reflexes' | 'nerves' | 'zones' | 'eyes' | 'report';

const SUB_TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'intake', label: 'Intake & Vitals', icon: Activity },
  { id: 'quick', label: 'Quick Assess', icon: CheckCircle2 },
  { id: 'intrinsic', label: 'Intrinsic', icon: ShieldAlert },
  { id: 'muscles', label: 'Muscles', icon: Dumbbell },
  { id: 'reflexes', label: 'Primitive Reflexes', icon: Baby },
  { id: 'nerves', label: 'Cranial Nerves', icon: Zap },
  { id: 'zones', label: 'Brain Zones', icon: Brain },
  { id: 'eyes', label: 'Eye Systems', icon: Eye },
];

const MuscleGroupGrid = ({ muscles, pattern, onToggle, onSelectMuscle }: {
  muscles: string[];
  pattern: any;
  onToggle: (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
  onSelectMuscle?: (name: string) => void;
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
        const getColor = (s: any) => {
          if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500 text-white border-rose-500';
          if (s === 'Hypertonic') return 'bg-amber-500 text-white border-amber-500';
          if (s === 'Clear' || s === 'Normotonic') return 'bg-emerald-500 text-white border-emerald-500';
          return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
        };
        return (
          <div key={m} className="group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all">
            <div className="flex-1 min-w-0">
              <button onClick={() => onSelectMuscle?.(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
              {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
              {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
            </div>
            <button
              onClick={cycleStatus}
              className={cn("px-3 py-1 rounded-md text-[9px] font-bold border transition-all shrink-0 shadow-sm hover:shadow", getColor(status))}
            >
              {(status === 'Inhibited' || status === 'Inhibition') ? 'INHIBITED' : status === 'Hypertonic' ? 'HYPERTONIC' : (status === 'Clear' || status === 'Normotonic') ? 'NORMOTONIC' : 'UNTESTED'}
            </button>
          </div>
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

      const getColor = (s: any) => {
        if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500 text-white border-rose-500';
        if (s === 'Hypertonic') return 'bg-amber-500 text-white border-amber-500';
        if (s === 'Clear' || s === 'Normotonic') return 'bg-emerald-500 text-white border-emerald-500';
        return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
      };

      const getLabel = (s: any) => {
        if (s === 'Inhibited' || s === 'Inhibition') return 'INHIBITED';
        if (s === 'Hypertonic') return 'HYPERTONIC';
        if (s === 'Clear' || s === 'Normotonic') return 'NORMOTONIC';
        return '—';
      };

      return (
        <div key={m} className="group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all">
          <div className="flex-1 min-w-0">
            <button onClick={() => onSelectMuscle?.(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
            {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
            {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">L</span>
              <button
                onClick={() => cycleStatus('L')}
                className={cn("px-3 py-1 rounded-md text-[9px] font-bold border transition-all min-w-[76px] shadow-sm hover:shadow", getColor(statusL))}
              >
                {getLabel(statusL)}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">R</span>
              <button
                onClick={() => cycleStatus('R')}
                className={cn("px-3 py-1 rounded-md text-[9px] font-bold border transition-all min-w-[76px] shadow-sm hover:shadow", getColor(statusR))}
              >
                {getLabel(statusR)}
              </button>
            </div>
          </div>
        </div>
      );
    })}
      </div>
    </div>
  );
};

const PreliminaryPhaseV3 = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const hasHistory = history.length >= 2;
  const [subTab, setSubTab] = useState<SubTab>('intake');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [globalMuscleSearch, setGlobalMuscleSearch] = useState('');
  const tabs = hasHistory
    ? [{ id: 'recheck' as SubTab, label: 'Recheck', icon: RotateCcw }, ...SUB_TABS]
    : SUB_TABS;

  const previousSession = history.length >= 2 ? history[1] : null;
  const lastSessionDate = previousSession?.date;
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  return (
    <Section className="space-y-5">

        {/* Stale alert — soft warning banner */}
        {isStale && (
          <AlertBanner
            variant="warning"
            icon={AlertTriangle}
            title={`Over ${Math.floor(daysSinceLast / 30)} months since the last session`}
          >
            Baseline findings and CO₂ tolerance may have shifted.
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

                {/* COGS — visual assessment */}
                <Card padding="comfortable">
                  <CogsAssessment
                    appointmentId={appointment.id}
                    initialSagittalNotes={appointment.sagittal_plane_notes}
                    initialFrontalNotes={appointment.frontal_plane_notes}
                    initialTransverseNotes={appointment.transverse_plane_notes}
                    onUpdate={onUpdate}
                  />
                </Card>

                {/* Neurological baseline */}
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
            const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
            const quickToggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
              updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
            };
            // Cranial nerve toggle: when a stim line is marked inhibited, also mark the parent nerve.
            // When a stim line is cleared, un-inhibit the parent if no other stim lines remain inhibited.
            const cnToggle = (name: string, nextStatus: string, side?: 'L' | 'R', parentName?: string) => {
              quickToggle('cranialNerves', name, nextStatus, side);
              if (!parentName) return;

              if (nextStatus !== 'Clear') {
                // Marking as inhibited → ensure parent is also inhibited
                quickToggle('cranialNerves', parentName, 'Inhibited', side);
              } else {
                // Clearing → check if any other stim lines for this nerve are still inhibited
                const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === parentName);
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
                }
              }
            };
            return (
              <div className="space-y-4">
                {/* Primitive Reflexes */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Baby} title="Primitive reflexes" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { num: 1, label: 'Track 1 — Sagittal / Brainstem', desc: 'Moro → Startle → TLR → STNR → FPR', reflexes: ['moro', 'startle', 'tlr-flexion', 'tlr-extension', 'stnr-flexion', 'stnr-extension', 'fear-paralysis'] },
                      { num: 2, label: 'Track 2 — Unilateral / Gait', desc: 'ATNR → Spinal Galant → Rooting → Palmar → Babinski → Sucking', reflexes: ['atnr', 'spinal-galant', 'rooting', 'palmar', 'babinski', 'sucking'] },
                      { num: 3, label: 'Track 3 — Global Override', desc: 'Tendon Guard', reflexes: ['tendon-guard'] },
                    ].map(group => {
                      const groupReflexes = PRIMITIVE_REFLEXES.flatMap(r => {
                        if (r.id === 'tlr') {
                          return [
                            { ...r, id: 'tlr-flexion', name: 'TLR (Flexion)', track: 1 },
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
                      return (
                        <div key={group.num} className="space-y-2">
                          <div className="flex items-center gap-3 px-1 py-1">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold text-primary-foreground bg-primary">
                              {group.num}
                            </div>
                            <div>
                              <h3 className="text-[10px] font-medium text-foreground uppercase tracking-wider">{group.label}</h3>
                              <p className="text-[10px] text-muted-foreground">{group.desc}</p>
                            </div>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="space-y-2">
                            {(() => {
                              // Pair TLR flexion/extension and STNR flexion/extension on
                              // the same row, but keep the track's declared order
                              // (Moro → Startle → TLR → STNR → FPR). Building the pairs
                              // first and appending `others` afterwards used to drag
                              // TLR/STNR to the top, contradicting the header.
                              const paired: any[] = [];
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

                              return paired.map((p, pi) => {
                                if (p.type === 'pair') {
                                  return (
                                    <div key={pi} className="flex items-center gap-2">
                                      <CheckItem category="primitiveReflexes" name={p.items[0].name} pattern={pattern} onToggle={quickToggle} />
                                      <CheckItem category="primitiveReflexes" name={p.items[1].name} pattern={pattern} onToggle={quickToggle} />
                                    </div>
                                  );
                                }
                                if (p.type === 'lateral') {
                                  const r = p.items[0];
                                  return (
                                    <div key={pi} className="flex items-center gap-2">
                                      <CheckItem category="primitiveReflexes" name={r.name} side="L" pattern={pattern} onToggle={quickToggle} />
                                      <CheckItem category="primitiveReflexes" name={r.name} side="R" pattern={pattern} onToggle={quickToggle} />
                                    </div>
                                  );
                                }
                                return (
                                  <CheckItem key={pi} category="primitiveReflexes" name={p.items[0].name} pattern={pattern} onToggle={quickToggle} />
                                );
                              });
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Cranial Nerves */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Zap} title="Cranial nerves" />
                  <div className="space-y-4">
                    {CRANIAL_NERVES.map(n => {
                      const nerveName = `${n.name}: ${n.latinName}`;
                      const stimLines = nerveStimLines(n);
                      const isLatStim = (i: number) => isLateralStim(n.id, i);
                      return (
                        <div key={n.name} className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
                          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-foreground">{nerveName}</p>
                              <p className="text-[9.5px] text-muted-foreground/60 mt-0.5">{n.nuclei} • {n.reflexPoint}</p>
                            </div>
                            {/* Overall nerve toggle (non-lateralized or bilateral) */}
                            {!n.isLateralized && (
                              <div className="flex items-center gap-2 shrink-0 justify-end">
                                <CheckItem category="cranialNerves" name={nerveName} pattern={pattern} onToggle={(cat, name, status, side) => cnToggle(name, status, side)} />
                              </div>
                            )}
                            {n.isLateralized && (
                              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                                <CheckItem category="cranialNerves" name={nerveName} side="L" pattern={pattern} onToggle={(cat, name, status, side) => cnToggle(name, status, side)} />
                                <CheckItem category="cranialNerves" name={nerveName} side="R" pattern={pattern} onToggle={(cat, name, status, side) => cnToggle(name, status, side)} />
                              </div>
                            )}
                          </div>
                          {/* Stim lines / directions */}
                          {stimLines.length > 1 && (
                            <div className="ml-2 pl-3 border-l-2 border-border/40 space-y-1 mt-2">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 mb-1">Stim lines</p>
                              {stimLines.map((line, i) => {
                                const lateral = isLatStim(i);
                                const compositeName = `${nerveName} — ${line}`;
                                // Helper to get status for a given side
                                const getStatus = (side?: 'L' | 'R') => {
                                  const key = side ? `${compositeName} (${side})` : compositeName;
                                  return pattern.cranialNerves?.[key] || null;
                                };
                                const toggleStatus = (side?: 'L' | 'R') => {
                                  const key = side ? `${compositeName} (${side})` : compositeName;
                                  const current = pattern.cranialNerves?.[key];
                                  const next = current === 'Inhibited' ? 'Clear' : current === 'Clear' ? null : 'Inhibited';
                                  cnToggle(compositeName, next || 'Clear', side, nerveName);
                                };
                                return (
                                  <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-3 py-1">
                                    <p className="text-[10.5px] text-foreground/80 truncate">{line}</p>
                                    <div className="flex items-center gap-1.5 justify-end">
                                      {lateral ? (
                                        <>
                                          <button
                                            onClick={() => toggleStatus('L')}
                                            className={cn(
                                              "w-7 h-6 rounded text-[9px] font-bold border transition-colors",
                                              getStatus('L') === 'Inhibited' ? "bg-rose-500 text-white border-rose-500" :
                                              getStatus('L') === 'Clear' ? "bg-emerald-500 text-white border-emerald-500" :
                                              "border-border text-muted-foreground/60 hover:border-rose-300 hover:text-rose-600"
                                            )}
                                          >
                                            L
                                          </button>
                                          <button
                                            onClick={() => toggleStatus('R')}
                                            className={cn(
                                              "w-7 h-6 rounded text-[9px] font-bold border transition-colors",
                                              getStatus('R') === 'Inhibited' ? "bg-rose-500 text-white border-rose-500" :
                                              getStatus('R') === 'Clear' ? "bg-emerald-500 text-white border-emerald-500" :
                                              "border-border text-muted-foreground/60 hover:border-rose-300 hover:text-rose-600"
                                            )}
                                          >
                                            R
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => toggleStatus()}
                                          className={cn(
                                            "w-14 h-6 rounded text-[9px] font-bold border transition-colors",
                                            getStatus() === 'Inhibited' ? "bg-rose-500 text-white border-rose-500" :
                                            getStatus() === 'Clear' ? "bg-emerald-500 text-white border-emerald-500" :
                                            "border-border text-muted-foreground/60 hover:border-rose-300 hover:text-rose-600"
                                          )}
                                        >
                                          {getStatus() === 'Inhibited' ? 'Inh' : getStatus() === 'Clear' ? 'Clr' : '—'}
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
                    })}
                  </div>
                </Card>

                {/* Muscles — Intrinsic Stabilisation */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Dumbbell} title="Intrinsic stabilisation">
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60">
                      <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-rose-500 text-white text-[9px] font-bold">↓</span> Inhibited</span>
                      <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-500 text-white text-[9px] font-bold">↑</span> Hypertonic</span>
                      <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white text-[9px] font-bold">✓</span> Clear</span>
                    </div>
                  </SectionHeader>
                  <MuscleGroupGrid muscles={MUSCLE_GROUPS['Intrinsic Stabilisation'] || []} pattern={pattern} onToggle={quickToggle} onSelectMuscle={setSelectedMuscle} />
                </Card>
              </div>
            );
          })()}

          {subTab === 'intrinsic' && (() => {
            const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
            const toggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
              updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
            };
            const intrinsicMuscles = MUSCLE_GROUPS['Intrinsic Stabilisation'] || [];
            return (
              <Card className="space-y-3" padding="comfortable">
                <SectionHeader icon={Dumbbell} title="Intrinsic stabilisation">
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60">
                    <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-rose-500 text-white text-[9px] font-bold">↓</span> Inhibited</span>
                    <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-500 text-white text-[9px] font-bold">↑</span> Hypertonic</span>
                    <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white text-[9px] font-bold">✓</span> Clear</span>
                  </div>
                </SectionHeader>
                <MuscleGroupGrid muscles={intrinsicMuscles} pattern={pattern} onToggle={toggle} onSelectMuscle={setSelectedMuscle} />
              </Card>
            );
          })()}

          {subTab === 'muscles' && (() => {
            const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
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
                    <SectionHeader icon={Dumbbell} title="Search Results" subtitle={`${filtered.length} found`} />
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
                          const getColor = (s: any) => {
                            if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500 text-white border-rose-500';
                            if (s === 'Hypertonic') return 'bg-amber-500 text-white border-amber-500';
                            if (s === 'Clear' || s === 'Normotonic') return 'bg-emerald-500 text-white border-emerald-500';
                            return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
                          };
                          return (
                            <div key={m} className="group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setSelectedMuscle(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{group}</span>
                                </div>
                                {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
                                {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
                              </div>
                              <button
                                onClick={cycleStatus}
                                className={cn("px-3 py-1 rounded-md text-[9px] font-bold border transition-all shrink-0 shadow-sm hover:shadow", getColor(status))}
                              >
                                {(status === 'Inhibited' || status === 'Inhibition') ? 'INHIBITED' : status === 'Hypertonic' ? 'HYPERTONIC' : (status === 'Clear' || status === 'Normotonic') ? 'NORMOTONIC' : 'UNTESTED'}
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
                        const getColor = (s: any) => {
                          if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500 text-white border-rose-500';
                          if (s === 'Hypertonic') return 'bg-amber-500 text-white border-amber-500';
                          if (s === 'Clear' || s === 'Normotonic') return 'bg-emerald-500 text-white border-emerald-500';
                          return 'bg-card text-muted-foreground border-border hover:bg-muted/50';
                        };
                        const getLabel = (s: any) => {
                          if (s === 'Inhibited' || s === 'Inhibition') return 'INHIBITED';
                          if (s === 'Hypertonic') return 'HYPERTONIC';
                          if (s === 'Clear' || s === 'Normotonic') return 'NORMOTONIC';
                          return '—';
                        };
                        return (
                          <div key={m} className="group py-3 px-3 -mx-3 rounded-lg flex items-start justify-between gap-6 hover:bg-muted/40 transition-all">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedMuscle(m)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left">{m}</button>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{group}</span>
                              </div>
                              {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
                              {testingInstructions && <div className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-2">{testingInstructions}</div>}
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">L</span>
                                <button
                                  onClick={() => cycleStatus('L')}
                                  className={cn("px-3 py-1 rounded-md text-[9px] font-bold border transition-all min-w-[76px] shadow-sm hover:shadow", getColor(statusL))}
                                >
                                  {getLabel(statusL)}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">R</span>
                                <button
                                  onClick={() => cycleStatus('R')}
                                  className={cn("px-3 py-1 rounded-md text-[9px] font-bold border transition-all min-w-[76px] shadow-sm hover:shadow", getColor(statusR))}
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
                      <SectionHeader icon={Dumbbell} title={groupName}>
                        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60">
                          <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-rose-500 text-white text-[9px] font-bold">↓</span> Inhibited</span>
                          <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-500 text-white text-[9px] font-bold">↑</span> Hypertonic</span>
                          <span className="flex items-center gap-1"><span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white text-[9px] font-bold">✓</span> Clear</span>
                        </div>
                      </SectionHeader>
                      <MuscleGroupGrid muscles={muscles} pattern={pattern} onToggle={toggle} onSelectMuscle={setSelectedMuscle} />
                    </Card>
                  ))
                )}
              </div>
            );
          })()}

          {subTab === 'reflexes' && (
            <Section className="space-y-3">
              <SectionHeader icon={Baby} title="Primitive reflexes" subtitle="Tap a test to record its status" />
              <PrimitiveReflexAssessment
                appointmentId={appointment.id}
                priorityPattern={appointment.priority_pattern}
                updatePriorityPattern={updatePriorityPattern}
              />
            </Section>
          )}

          {subTab === 'nerves' && (
            <Section className="space-y-3">
              <SectionHeader icon={Zap} title="Cranial nerves" subtitle="Laterality, stimulation and priority" />
              <CranialNerveAssessment
                appointmentId={appointment.id}
                priorityPattern={appointment.priority_pattern}
                updatePriorityPattern={updatePriorityPattern}
                showImages
              />
            </Section>
          )}

          {subTab === 'zones' && (
            <Section className="space-y-3">
              <SectionHeader icon={Brain} title="Brain zones" subtitle="Cortical and subcortical points" />
              <BrainZoneAssessment
                priorityPattern={appointment.priority_pattern}
                updatePriorityPattern={updatePriorityPattern}
                showImages
              />
            </Section>
          )}

          {subTab === 'eyes' && (() => {
            const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
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
            return (
              <Section className="space-y-3">
                <SectionHeader icon={Eye} title="Eye Systems" subtitle="Vergence, VOR, tracking, saccades, near-far, optokinetics, peripheral" />
                <div className="space-y-4">
                  {EYE_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1">
                        {group.label}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((eye) => {
                          const status = eyePattern[eye.name];
                          const isInhibited = status === 'Inhibited';
                          const isClear = status === 'Clear';
                          const hasSubs = eye.subs && eye.subs.length > 0;
                          return (
                            <div
                              key={eye.name}
                              className={cn(
                                "rounded-xl border p-3 space-y-2 transition-all",
                                isInhibited ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800" :
                                isClear ? "bg-success/[0.04] border-success/20 opacity-80" :
                                "border-border bg-card"
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[12px] font-medium text-foreground">{eye.name}</p>
                                  <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">{eye.desc}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => toggle(eye.name, isInhibited ? null : 'Inhibited')}
                                    className={cn(
                                      "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border",
                                      isInhibited
                                        ? "bg-rose-500 text-white border-rose-500"
                                        : "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400"
                                    )}
                                  >
                                    Inhibited
                                  </button>
                                  <button
                                    onClick={() => toggle(eye.name, isClear ? null : 'Clear')}
                                    className={cn(
                                      "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border",
                                      isClear
                                        ? "bg-emerald-500 text-white border-emerald-500"
                                        : "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                                    )}
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              {hasSubs && (
                                <div className="ml-2 pl-3 border-l-2 border-border/40 space-y-1.5 mt-2">
                                  {eye.subs!.map((sub) => {
                                    const subStatus = eyePattern[sub.name];
                                    const subInhibited = subStatus === 'Inhibited';
                                    const subClear = subStatus === 'Clear';
                                    return (
                                      <div key={sub.name} className="flex items-center justify-between gap-2 py-1">
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-medium text-foreground/90">{sub.name.replace(eye.name + " ", "").replace(eye.name, "")}</p>
                                          <p className="text-[9px] text-muted-foreground/60 leading-relaxed">{sub.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            onClick={() => toggle(sub.name, subInhibited ? null : 'Inhibited')}
                                            className={cn(
                                              "px-2 py-0.5 rounded text-[9px] font-medium transition-colors border",
                                              subInhibited
                                                ? "bg-rose-500 text-white border-rose-500"
                                                : "border-rose-300/50 text-rose-600/70 hover:bg-rose-50 dark:border-rose-700/50 dark:text-rose-400/70"
                                            )}
                                          >
                                            Inh
                                          </button>
                                          <button
                                            onClick={() => toggle(sub.name, subClear ? null : 'Clear')}
                                            className={cn(
                                              "px-2 py-0.5 rounded text-[9px] font-medium transition-colors border",
                                              subClear
                                                ? "bg-emerald-500 text-white border-emerald-500"
                                                : "border-emerald-300/50 text-emerald-600/70 hover:bg-emerald-50 dark:border-emerald-700/50 dark:text-emerald-400/70"
                                            )}
                                          >
                                            Clr
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
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
          const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
          const findings: Array<{category: string, name: string, status: string, side?: string}> = [];
          
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
          
          Object.entries(pattern.cranialNerves || {}).forEach(([key, val]) => {
            if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic' || val === 'Clear' || val === 'Normotonic') {
              let name = key;
              let side: string | undefined;
              if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
              else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
              findings.push({ category: 'Cranial Nerve', name, status: val as string, side });
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
            if (s === 'Clear' || s === 'Normotonic') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
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
                              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-2 text-sm text-foreground">{item.name}</td>
                                <td className="px-3 py-2 text-sm text-muted-foreground">{item.side || '—'}</td>
                                <td className="px-3 py-2">
                                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(item.status))}>
                                    {item.status === 'Inhibition' ? 'Inhibited' : item.status === 'Normotonic' ? 'Normotonic' : item.status}
                                  </span>
                                </td>
                              </tr>
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