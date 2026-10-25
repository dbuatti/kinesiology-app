import { useState, Fragment } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Compass, ClipboardList, Activity, ShieldAlert, AlertTriangle,
  Dumbbell, Baby, Zap, Brain, RotateCcw, Eye, CheckCircle2,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { PhaseHeader } from "@/components/crm/v2/PhaseComponents";
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
  const [subTab, setSubTab] = useState<SubTab>(hasHistory ? 'recheck' : 'intake');

  const previousSession = history.length >= 2 ? history[1] : null;
  const lastSessionDate = previousSession?.date;
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  return (
    <div className="space-y-8">
      {/* Stale alert */}
      {isStale && (
        <Alert className="bg-amber-500/10 border-amber-500/20 rounded-xl animate-in slide-in-from-top-2 duration-500">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertDescription className="text-sm text-amber-600 dark:text-amber-300 font-medium">
            It has been over {Math.floor(daysSinceLast / 30)} months since the last session. Baseline findings and CO₂ tolerance may have shifted significantly.
          </AlertDescription>
        </Alert>
      )}

      {/* Completed summary strip */}
      {(() => {
        const chips: string[] = [];
        if (appointment.bolt_score != null) chips.push(`BOLT ${appointment.bolt_score}s`);
        if (appointment.coherence_score != null) chips.push(`Coherence ${appointment.coherence_score}`);
        if (appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes) chips.push("COGS ✓");
        if (appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes) chips.push("Neuro ✓");
        const pattern = safeParse(appointment.priority_pattern, {} as any);
        const zones = pattern?.brainZones || {};
        const reflexDone = Object.keys(zones).filter(k => k !== "Fakuda Step Test" && k !== "Sharpened Rhombergs Test" && k !== "Frontal Lobe Assessment" && k !== "Righting Reflexes").length;
        // count completed primitive reflexes/cranial/muscles from priority_pattern
        const completedChecks = (Object.values(pattern || {}) as any[]).reduce((n: number, v: any) => {
          if (Array.isArray(v)) return n + v.filter((x: any) => x && x.status && x.status !== "Clear").length;
          return n;
        }, 0);
        if (completedChecks > 0) chips.push(`${completedChecks} checks`);
        if (chips.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            {chips.map((c, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-muted/50 border border-border">{c}</span>
            ))}
          </div>
        );
      })()}

      {/* Recheck — persistent top strip */}
      {(history?.length ?? 0) >= 2 && (
        <div className="border-b border-border pb-4">
          <RecheckTabV2
            appointment={appointment}
            history={history}
            onUpdate={onUpdate}
            updatePriorityPattern={updatePriorityPattern}
            saveField={saveField}
            onJumpToPhase={onJumpToPhase}
          />
        </div>
      )}

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all",
              subTab === tab.id
                ? "bg-muted text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div key={subTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {subTab === 'recheck' && (
          <RecheckTabV2
            appointment={appointment}
            history={history}
            onUpdate={onUpdate}
            updatePriorityPattern={updatePriorityPattern}
            saveField={saveField}
            onJumpToPhase={onJumpToPhase}
          />
        )}

        {subTab === 'intake' && (
          <div className="space-y-6">
            {/* Goal & Concern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-muted-foreground" />
                  <h3 className="text-xs font-medium text-muted-foreground">Session Goal</h3>
                </div>
                <EditableField
                  key={`goal-${appointment.id}`}
                  field="goal"
                  label="What is the primary objective?"
                  value={appointment.goal}
                  multiline
                  placeholder="e.g. Resolve chronic neck pain, improve sleep quality..."
                  onSave={saveField}
                  className="border-none p-0 shadow-none bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} className="text-muted-foreground" />
                  <h3 className="text-xs font-medium text-muted-foreground">Primary Concern</h3>
                </div>
                <EditableField
                  key={`issue-${appointment.id}`}
                  field="issue"
                  label="Main Concern / Presenting Symptoms"
                  value={appointment.issue}
                  multiline
                  placeholder="Describe the current symptoms and history..."
                  onSave={saveField}
                  className="border-none p-0 shadow-none bg-transparent"
                />
              </div>
            </div>

            {/* Baseline Vitals */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-bold text-foreground tracking-tight uppercase tracking-wider">Baseline Vitals</h3>
              </div>
              <BoltTestSection
                appointmentId={appointment.id}
                initialBoltScore={appointment.bolt_score}
                onUpdate={onUpdate}
                history={history}
              />
              <CoherenceAssessment
                appointmentId={appointment.id}
                initialHeartRate={appointment.heart_rate}
                initialBreathRate={appointment.breath_rate}
                initialCoherenceScore={appointment.coherence_score}
                onUpdate={onUpdate}
                history={history}
              />
            </div>

            {/* COGS — Visual Assessment */}
            <div className="space-y-4">
              <CogsAssessment
                appointmentId={appointment.id}
                initialSagittalNotes={appointment.sagittal_plane_notes}
                initialFrontalNotes={appointment.frontal_plane_notes}
                initialTransverseNotes={appointment.transverse_plane_notes}
                onUpdate={onUpdate}
              />
            </div>

            {/* Neurological Baseline */}
            <div className="space-y-4">
              <NeurologicalAssessments
                appointmentId={appointment.id}
                initialFakudaNotes={appointment.fakuda_notes}
                initialRhombergsNotes={appointment.sharpened_rhombergs_notes}
                initialFrontalLobeNotes={appointment.frontal_lobe_notes}
                initialRightingReflexNotes={appointment.righting_reflex_notes}
                onUpdate={onUpdate}
              />
            </div>
          </div>
        )}

        {subTab === 'quick' && (() => {
          const pattern = safeParse(appointment.priority_pattern, {} as any);
          const quickToggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
            updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
          };
          return (
            <div className="space-y-6">
              {/* Primitive Reflexes */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Primitive Reflexes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {PRIMITIVE_REFLEXES.map(r => r.isLateralized ? (
                    <Fragment key={r.id}>
                      <CheckItem category="primitiveReflexes" name={r.name} side="L" pattern={pattern} onToggle={quickToggle} />
                      <CheckItem category="primitiveReflexes" name={r.name} side="R" pattern={pattern} onToggle={quickToggle} />
                    </Fragment>
                  ) : (
                    <CheckItem key={r.id} category="primitiveReflexes" name={r.name} pattern={pattern} onToggle={quickToggle} />
                  ))}
                </div>
              </div>

              {/* Cranial Nerves */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Cranial Nerves</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
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
              </div>

              {/* Muscles — Intrinsic Stabilisation */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Intrinsic Stabilisation</h3>
                <MuscleGroupGrid muscles={MUSCLE_GROUPS['Intrinsic Stabilisation'] || []} pattern={pattern} onToggle={quickToggle} />
              </div>
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
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Intrinsic Stabilisation</h3>
                <MuscleGroupGrid muscles={intrinsicMuscles} pattern={pattern} onToggle={toggle} />
              </div>
            </div>
          );
        })()}

        {subTab === 'muscles' && (() => {
          const pattern = safeParse(appointment.priority_pattern, {} as any);
          const toggle = (cat: string, name: string, nextStatus: string, side?: 'L' | 'R') => {
            updatePriorityPattern(cat, name, nextStatus === 'Clear' ? null : nextStatus, side);
          };
          return (
            <div className="space-y-6">
              {Object.entries(MUSCLE_GROUPS).map(([groupName, muscles]) => (
                <div key={groupName}>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">{groupName}</h3>
                  <MuscleGroupGrid muscles={muscles} pattern={pattern} onToggle={toggle} />
                </div>
              ))}
            </div>
          );
        })()}

        {subTab === 'reflexes' && (
          <PrimitiveReflexAssessment
            appointmentId={appointment.id}
            priorityPattern={appointment.priority_pattern}
            updatePriorityPattern={updatePriorityPattern}
          />
        )}

        {subTab === 'nerves' && (
          <CranialNerveAssessment
            appointmentId={appointment.id}
            priorityPattern={appointment.priority_pattern}
            updatePriorityPattern={updatePriorityPattern}
            showImages
          />
        )}

        {subTab === 'zones' && (
          <BrainZoneAssessment
            priorityPattern={appointment.priority_pattern}
            updatePriorityPattern={updatePriorityPattern}
            showImages
          />
        )}
      </div>

      {/* Done affordance */}
      {onJumpToPhase && (
        <div className="pt-4 border-t border-border flex justify-end">
          <Button onClick={() => onJumpToPhase(1)} className="h-9 rounded-md text-xs font-medium gap-1.5">
            Preliminary complete <ArrowRight size={13} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PreliminaryPhase;