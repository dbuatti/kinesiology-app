import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, AlertTriangle, CheckCircle2, ShieldAlert, Dumbbell, Baby, Zap, Brain, Activity, Compass, RotateCcw, ClipboardList } from "lucide-react";
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
import { safeParse } from "@/utils/safe-json";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

import {
  Card,
  Section,
  SectionTitle,
  CardTitle,
  PrimaryButton,
  StatusBadge,
  SegmentedTabs,
  SectionHeader,
  AlertBanner,
  ConfirmationFooter,
} from "./DesignSystem";

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
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
        <div key={m} className="contents">
          <CheckItem category="muscles" name={m} side="L" pattern={pattern} description={description} testingInstructions={testingInstructions} showFullInstructions onToggle={onToggle} />
          <CheckItem category="muscles" name={m} side="R" pattern={pattern} description={description} testingInstructions={testingInstructions} showFullInstructions onToggle={onToggle} />
        </div>
      );
    })}
  </div>
);

const PreliminaryPhaseV3 = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
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

        {/* Baseline readout — one muted line instead of a row of chips. */}
        {(() => {
          const readout: [string, string][] = [];
          if (appointment.bolt_score != null) readout.push(["BOLT", `${appointment.bolt_score}s`]);
          if (appointment.coherence_score != null) readout.push(["Coherence", String(appointment.coherence_score)]);
          if (appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes) readout.push(["COGS", "captured"]);
          if (appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes) readout.push(["Neuro", "captured"]);
          if (readout.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-none text-muted-foreground">
              {readout.map(([label, value], i) => (
                <span key={label} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-border">·</span>}
                  <span>
                    {label} <span className="font-semibold text-foreground/80 tabular-nums">{value}</span>
                  </span>
                </span>
              ))}
            </div>
          );
        })()}

        {/* Sub-tab bar — segmented track attached to the content it filters */}
        <SegmentedTabs tabs={tabs} activeTab={subTab} onChange={(id: string) => setSubTab(id as SubTab)} />

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
            return (
              <div className="space-y-4">
                {/* Primitive Reflexes */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Baby} title="Primitive reflexes" />
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                    {PRIMITIVE_REFLEXES.map(r => r.isLateralized ? (
                      <div key={r.id} className="contents">
                        <CheckItem category="primitiveReflexes" name={r.name} side="L" pattern={pattern} onToggle={quickToggle} />
                        <CheckItem category="primitiveReflexes" name={r.name} side="R" pattern={pattern} onToggle={quickToggle} />
                      </div>
                    ) : (
                      <CheckItem key={r.id} category="primitiveReflexes" name={r.name} pattern={pattern} onToggle={quickToggle} />
                    ))}
                  </div>
                </Card>

                {/* Cranial Nerves */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Zap} title="Cranial nerves" />
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                    {CRANIAL_NERVES.map(n => {
                      const nerveName = `${n.name}: ${n.latinName}`;
                      return n.isLateralized ? (
                        <div key={n.name} className="contents">
                          <CheckItem category="cranialNerves" name={nerveName} side="L" pattern={pattern} onToggle={quickToggle} />
                          <CheckItem category="cranialNerves" name={nerveName} side="R" pattern={pattern} onToggle={quickToggle} />
                        </div>
                      ) : (
                        <CheckItem key={n.name} category="cranialNerves" name={nerveName} pattern={pattern} onToggle={quickToggle} />
                      );
                    })}
                  </div>
                </Card>

                {/* Muscles — Intrinsic Stabilisation */}
                <Card className="space-y-3" padding="comfortable">
                  <SectionHeader icon={Dumbbell} title="Intrinsic stabilisation" />
                  <MuscleGroupGrid muscles={MUSCLE_GROUPS['Intrinsic Stabilisation'] || []} pattern={pattern} onToggle={quickToggle} />
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
                <SectionHeader icon={Dumbbell} title="Intrinsic stabilisation" />
                <MuscleGroupGrid muscles={intrinsicMuscles} pattern={pattern} onToggle={toggle} />
              </Card>
            );
          })()}

          {subTab === 'muscles' && (() => {
            const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
            const toggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
              updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
            };
            return (
              <div className="space-y-4">
                {Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
                  <Card key={groupName} className="space-y-3" padding="comfortable">
                    <SectionHeader icon={Dumbbell} title={groupName} />
                    <MuscleGroupGrid muscles={muscles} pattern={pattern} onToggle={toggle} />
                  </Card>
                ))}
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
        </div>

        {/* Done affordance — calm confirmation */}
        {onJumpToPhase && (
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
    </Section>
  );
};

export default PreliminaryPhaseV3;