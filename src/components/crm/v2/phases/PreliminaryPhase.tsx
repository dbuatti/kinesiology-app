import React, { useState } from "react";
import { cn } from "@/lib/utils";
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
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { PRIMARY_14_MUSCLES, MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";
import { AppointmentWithClient } from "@/types/crm";
import { safeParse } from "@/utils/safe-json";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | 'Unsure' | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToPhase: (index: number) => void;
}

type SubTab = 'recheck' | 'intake' | 'quick' | 'intrinsic' | 'muscles' | 'reflexes' | 'nerves' | 'zones';

const SUB_TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'recheck', label: 'Recheck', icon: RotateCcw },
  { id: 'intake', label: 'Intake & Vitals', icon: Activity },
  { id: 'quick', label: 'Quick Assess', icon: CheckCircle2 },
  { id: 'intrinsic', label: 'Intrinsic', icon: ShieldAlert },
  { id: 'muscles', label: 'Muscles', icon: Dumbbell },
  { id: 'reflexes', label: 'Primitive Reflexes', icon: Baby },
  { id: 'nerves', label: 'Cranial Nerves', icon: Zap },
  { id: 'zones', label: 'Brain Zones', icon: Brain },
];

const PreliminaryPhase = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const [subTab, setSubTab] = useState<SubTab>('recheck');

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

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto no-scrollbar">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all",
              subTab === tab.id
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <div className="space-y-8">
            {/* Goal & Concern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn(
                "rounded-xl p-6 transition-all",
                !appointment.goal ? "bg-muted/30 border border-dashed border-border" : "bg-card border border-border shadow-sm"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <Compass size={18} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Goal</h3>
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

              <div className={cn(
                "rounded-xl p-6 transition-all",
                !appointment.issue ? "bg-muted/30 border border-dashed border-border" : "bg-card border border-border shadow-sm"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <ClipboardList size={18} className="text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Concern</h3>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Activity size={18} className="text-muted-foreground" />
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
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Eye size={18} className="text-muted-foreground" />
                <h3 className="text-xs font-bold text-foreground tracking-tight uppercase tracking-wider">COGS — Visual Assessment</h3>
              </div>
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
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <ShieldAlert size={18} className="text-muted-foreground" />
                <h3 className="text-xs font-bold text-foreground tracking-tight uppercase tracking-wider">Neurological Baseline</h3>
              </div>
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
              {/* Cranial Nerves */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Cranial Nerves</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {CRANIAL_NERVES.map(n => n.isLateralized ? (
                    <React.Fragment key={n.name}>
                      <CheckItem category="cranial_nerves" name={n.name} side="L" pattern={pattern} onToggle={quickToggle} />
                      <CheckItem category="cranial_nerves" name={n.name} side="R" pattern={pattern} onToggle={quickToggle} />
                    </React.Fragment>
                  ) : (
                    <CheckItem key={n.name} category="cranial_nerves" name={n.name} pattern={pattern} onToggle={quickToggle} />
                  ))}
                </div>
              </div>

              {/* Primitive Reflexes */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Primitive Reflexes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {PRIMITIVE_REFLEXES.map(r => r.isLateralized ? (
                    <React.Fragment key={r.id}>
                      <CheckItem category="primitive_reflexes" name={r.name} side="L" pattern={pattern} onToggle={quickToggle} />
                      <CheckItem category="primitive_reflexes" name={r.name} side="R" pattern={pattern} onToggle={quickToggle} />
                    </React.Fragment>
                  ) : (
                    <CheckItem key={r.id} category="primitive_reflexes" name={r.name} pattern={pattern} onToggle={quickToggle} />
                  ))}
                </div>
              </div>

              {/* Muscles — Primary 14 */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Muscles — Primary 14</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {PRIMARY_14_MUSCLES.map(m => (
                    <React.Fragment key={m}>
                      <CheckItem category="muscles" name={m} side="L" pattern={pattern} onToggle={quickToggle} />
                      <CheckItem category="muscles" name={m} side="R" pattern={pattern} onToggle={quickToggle} />
                    </React.Fragment>
                  ))}
                </div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {intrinsicMuscles.map(m => MIDLINE_MUSCLES.includes(m) ? (
                    <CheckItem key={m} category="muscles" name={m} pattern={pattern} onToggle={toggle} />
                  ) : (
                    <React.Fragment key={m}>
                      <CheckItem category="muscles" name={m} side="L" pattern={pattern} onToggle={toggle} />
                      <CheckItem category="muscles" name={m} side="R" pattern={pattern} onToggle={toggle} />
                    </React.Fragment>
                  ))}
                </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {muscles.map(m => MIDLINE_MUSCLES.includes(m) ? (
                      <CheckItem key={m} category="muscles" name={m} pattern={pattern} onToggle={toggle} />
                    ) : (
                      <React.Fragment key={m}>
                        <CheckItem category="muscles" name={m} side="L" pattern={pattern} onToggle={toggle} />
                        <CheckItem category="muscles" name={m} side="R" pattern={pattern} onToggle={toggle} />
                      </React.Fragment>
                    ))}
                  </div>
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
    </div>
  );
};

export default PreliminaryPhase;