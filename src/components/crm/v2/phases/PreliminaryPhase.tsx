import { useState, Fragment } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Compass, ClipboardList, Activity, ShieldAlert, AlertTriangle,
  Dumbbell, Baby, Zap, Brain, RotateCcw, CheckCircle2,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import EditableField from "@/components/shared/EditableField";
import BoltTestSection from "@/components/crm/BoltTestSection";
import CoherenceAssessment from "@/components/crm/CoherenceAssessment";
import NeurologicalAssessments from "@/components/crm/NeurologicalAssessments";
import CogsAssessment from "@/components/crm/CogsAssessment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "@/components/crm/BrainZoneAssessment";
import RecheckTabV2 from "@/components/crm/v2/RecheckTabV2";
import CheckItem from "@/components/crm/document-view/CheckItem";
import { PhaseHeader, PhasePanel, SectionHeading } from "@/components/crm/v2/PhaseComponents";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { safeParse } from "@/utils/safe-json";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

type SubTab = 'recheck' | 'intake' | 'quick' | 'intrinsic' | 'muscles' | 'reflexes' | 'nerves' | 'zones';

const SUB_TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'intake', label: 'Intake & Vitals', icon: Activity },
  { id: 'quick', label: 'Quick Assess', icon: CheckCircle2 },
  { id: 'intrinsic', label: 'Intrinsic', icon: ShieldAlert },
  { id: 'muscles', label: 'Muscles', icon: Dumbbell },
  { id: 'reflexes', label: 'Primitive Reflexes', icon: Baby },
  { id: 'nerves', label: 'Cranial Nerves', icon: Zap },
  { id: 'zones', label: 'Brain Zones', icon: Brain },
];

const MuscleGroupGrid = ({ muscles, pattern, onToggle }: {
  muscles: string[];
  pattern: any;
  onToggle: (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
    {muscles.map(m => {
      const info = getMuscleInfo(m);
      const description = info.meridian || undefined;
      const testingInstructions = info.testingPosition || undefined;
      if (MIDLINE_MUSCLES.includes(m)) {
        return (
          <CheckItem key={m} category="muscles" name={m} pattern={pattern} description={description} testingInstructions={testingInstructions} showFullInstructions onToggle={onToggle} />
        );
      }
      return (
        <Fragment key={m}>
          <CheckItem category="muscles" name={m} side="L" pattern={pattern} description={description} testingInstructions={testingInstructions} showFullInstructions onToggle={onToggle} />
          <CheckItem category="muscles" name={m} side="R" pattern={pattern} description={description} testingInstructions={testingInstructions} showFullInstructions onToggle={onToggle} />
        </Fragment>
      );
    })}
  </div>
);

const PreliminaryPhase = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const hasHistory = history.length >= 2;
  const [subTab, setSubTab] = useState<SubTab>('intake');
  const tabs = hasHistory
    ? [{ id: 'recheck' as SubTab, label: 'Recheck', icon: RotateCcw }, ...SUB_TABS]
    : SUB_TABS;

  const previousSession = history.length >= 2 ? history[1] : null;
  const lastSessionDate = previousSession?.date;
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  return (
    <div className="space-y-4">
      <PhaseHeader
        icon={Compass}
        title="Preliminary"
        description="Set the session context, capture baseline vitals, then map the findings that will drive the correction."
      />

      {/* Stale alert */}
      {isStale && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            Over {Math.floor(daysSinceLast / 30)} months since the last session — baseline findings and CO₂ tolerance may have shifted.
          </p>
        </div>
      )}

      {/* Completed summary strip */}
      {(() => {
        const chips: string[] = [];
        if (appointment.bolt_score != null) chips.push(`BOLT ${appointment.bolt_score}s`);
        if (appointment.coherence_score != null) chips.push(`Coherence ${appointment.coherence_score}`);
        if (appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes) chips.push("COGS ✓");
        if (appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes) chips.push("Neuro ✓");
        // Quick-assess counts are intentionally omitted — too noisy for a summary strip.
        if (chips.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            {chips.map((c, i) => (
              <span key={i} className="rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 font-medium tabular-nums">
                {c}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Sub-tab bar */}
      <div className="-mx-1 overflow-x-auto no-scrollbar">
        <div className="mx-auto flex w-max items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-1">
          {tabs.map(tab => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                aria-pressed={active}
                className={cn(
                  "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                <tab.icon size={13} className={active ? "text-primary" : undefined} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div key={subTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {subTab === 'recheck' && (
          <PhasePanel className="space-y-4">
            <SectionHeading
              icon={RotateCcw}
              title="Recheck since last visit"
              hint="Carry forward or retire unresolved findings"
            />
            <RecheckTabV2
              appointment={appointment}
              history={history}
              onUpdate={onUpdate}
              updatePriorityPattern={updatePriorityPattern}
              saveField={saveField}
              onJumpToPhase={onJumpToPhase}
            />
          </PhasePanel>
        )}

        {subTab === 'intake' && (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
            {/* Left: clinical measurements */}
            <div className="order-2 min-w-0 space-y-4 lg:order-1">
              <PhasePanel className="space-y-4">
                <SectionHeading
                  icon={Activity}
                  title="Baseline vitals"
                  hint="Breath, heart rate and CO₂ tolerance"
                />
                <BoltTestSection
                  appointmentId={appointment.id}
                  initialBoltScore={appointment.bolt_score}
                  onUpdate={onUpdate}
                  history={history}
                />
                <div className="h-px bg-border/60" />
                <CoherenceAssessment
                  appointmentId={appointment.id}
                  initialHeartRate={appointment.heart_rate}
                  initialBreathRate={appointment.breath_rate}
                  initialCoherenceScore={appointment.coherence_score}
                  onUpdate={onUpdate}
                  history={history}
                  flat
                />
              </PhasePanel>

              {/* COGS — visual assessment */}
              <PhasePanel>
                <CogsAssessment
                  appointmentId={appointment.id}
                  initialSagittalNotes={appointment.sagittal_plane_notes}
                  initialFrontalNotes={appointment.frontal_plane_notes}
                  initialTransverseNotes={appointment.transverse_plane_notes}
                  onUpdate={onUpdate}
                />
              </PhasePanel>

              {/* Neurological baseline */}
              <PhasePanel>
                <NeurologicalAssessments
                  appointmentId={appointment.id}
                  initialFakudaNotes={appointment.fakuda_notes}
                  initialRhombergsNotes={appointment.sharpened_rhombergs_notes}
                  initialFrontalLobeNotes={appointment.frontal_lobe_notes}
                  initialRightingReflexNotes={appointment.righting_reflex_notes}
                  onUpdate={onUpdate}
                />
              </PhasePanel>
            </div>

            {/* Right: narrative/context (sticky) */}
            <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-32">
              <PhasePanel className="space-y-3">
                <SectionHeading icon={Compass} title="Session goal" />
                <EditableField
                  key={`goal-${appointment.id}`}
                  field="goal"
                  label=""
                  value={appointment.goal}
                  multiline
                  placeholder="e.g. Resolve chronic neck pain, improve sleep quality..."
                  onSave={saveField}
                  className="border-none p-0 shadow-none bg-transparent"
                />

                <div className="h-px bg-border/60" />

                <SectionHeading icon={ClipboardList} title="Primary concern" />
                <EditableField
                  key={`issue-${appointment.id}`}
                  field="issue"
                  label=""
                  value={appointment.issue}
                  multiline
                  placeholder="Describe the current symptoms and history..."
                  onSave={saveField}
                  className="border-none p-0 shadow-none bg-transparent"
                />
              </PhasePanel>
            </div>
          </div>
        )}

        {subTab === 'quick' && (() => {
          const pattern = safeParse(appointment.priority_pattern, {} as any);
          const quickToggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
            updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
          };
          return (
            <div className="space-y-4">
              {/* Primitive Reflexes */}
              <PhasePanel className="space-y-3">
                <SectionHeading icon={Baby} title="Primitive reflexes" />
                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4">
                  {PRIMITIVE_REFLEXES.map(r => r.isLateralized ? (
                    <Fragment key={r.id}>
                      <CheckItem category="primitiveReflexes" name={r.name} side="L" pattern={pattern} onToggle={quickToggle} />
                      <CheckItem category="primitiveReflexes" name={r.name} side="R" pattern={pattern} onToggle={quickToggle} />
                    </Fragment>
                  ) : (
                    <CheckItem key={r.id} category="primitiveReflexes" name={r.name} pattern={pattern} onToggle={quickToggle} />
                  ))}
                </div>
              </PhasePanel>

              {/* Cranial Nerves */}
              <PhasePanel className="space-y-3">
                <SectionHeading icon={Zap} title="Cranial nerves" />
                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4">
                  {CRANIAL_NERVES.map(n => {
                    const nerveName = `${n.name}: ${n.latinName}`;
                    return n.isLateralized ? (
                      <Fragment key={n.name}>
                        <CheckItem category="cranialNerves" name={nerveName} side="L" pattern={pattern} onToggle={quickToggle} />
                        <CheckItem category="cranialNerves" name={nerveName} side="R" pattern={pattern} onToggle={quickToggle} />
                      </Fragment>
                    ) : (
                      <CheckItem key={n.name} category="cranialNerves" name={nerveName} pattern={pattern} onToggle={quickToggle} />
                    );
                  })}
                </div>
              </PhasePanel>

              {/* Muscles — Intrinsic Stabilisation */}
              <PhasePanel className="space-y-3">
                <SectionHeading icon={Dumbbell} title="Intrinsic stabilisation" />
                <MuscleGroupGrid muscles={MUSCLE_GROUPS['Intrinsic Stabilisation'] || []} pattern={pattern} onToggle={quickToggle} />
              </PhasePanel>
            </div>
          );
        })()}

        {subTab === 'intrinsic' && (() => {
          const pattern = safeParse(appointment.priority_pattern, {} as any);
          const toggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
            updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
          };
          const intrinsicMuscles = MUSCLE_GROUPS['Intrinsic Stabilisation'] || [];
          return (
            <PhasePanel className="space-y-3">
              <SectionHeading icon={Dumbbell} title="Intrinsic stabilisation" />
              <MuscleGroupGrid muscles={intrinsicMuscles} pattern={pattern} onToggle={toggle} />
            </PhasePanel>
          );
        })()}

        {subTab === 'muscles' && (() => {
          const pattern = safeParse(appointment.priority_pattern, {} as any);
          const toggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
            updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
          };
          return (
            <div className="space-y-4">
              {Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
                <PhasePanel key={groupName} className="space-y-3">
                  <SectionHeading icon={Dumbbell} title={groupName} />
                  <MuscleGroupGrid muscles={muscles} pattern={pattern} onToggle={toggle} />
                </PhasePanel>
              ))}
            </div>
          );
        })()}

        {subTab === 'reflexes' && (
          <div className="space-y-3">
            <SectionHeading icon={Baby} title="Primitive reflexes" hint="Tap a test to record its status" />
            <PrimitiveReflexAssessment
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
            />
          </div>
        )}

        {subTab === 'nerves' && (
          <div className="space-y-3">
            <SectionHeading icon={Zap} title="Cranial nerves" hint="Laterality, stimulation and priority" />
            <CranialNerveAssessment
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              showImages
            />
          </div>
        )}

        {subTab === 'zones' && (
          <div className="space-y-3">
            <SectionHeading icon={Brain} title="Brain zones" hint="Cortical and subcortical points" />
            <BrainZoneAssessment
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              showImages
            />
          </div>
        )}
      </div>

      {/* Done affordance */}
      {onJumpToPhase && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-xs">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">Done with Preliminary?</p>
            <p className="text-[11px] text-muted-foreground">Next, down-regulate the nervous system.</p>
          </div>
          <Button onClick={() => onJumpToPhase(1)} className="h-9 gap-1.5 rounded-lg text-xs font-medium">
            Continue to Ease <ArrowRight size={13} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PreliminaryPhase;