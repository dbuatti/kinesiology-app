import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Compass, ClipboardList, Activity, ShieldAlert, AlertTriangle,
  Dumbbell, Baby, Zap, Brain, Dumbbell as MusclesIcon,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "@/components/shared/EditableField";
import IntrinsicMusclesAssessment from "@/components/crm/IntrinsicMusclesAssessment";
import { MuscleAssessment } from "@/components/crm/MuscleAssessment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "@/components/crm/BrainZoneAssessment";
import { AppointmentWithClient } from "@/types/crm";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

type SubTab = 'intake' | 'intrinsic' | 'muscles' | 'reflexes' | 'nerves' | 'zones';

const SUB_TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'intake', label: 'Intake & Vitals', icon: Activity },
  { id: 'intrinsic', label: 'Intrinsic', icon: ShieldAlert },
  { id: 'muscles', label: 'Muscles', icon: Dumbbell },
  { id: 'reflexes', label: 'Primitive Reflexes', icon: Baby },
  { id: 'nerves', label: 'Cranial Nerves', icon: Zap },
  { id: 'zones', label: 'Brain Zones', icon: Brain },
];

const PreliminaryPhase = ({ appointment, history, onUpdate, saveField, updatePriorityPattern }: PhaseProps) => {
  const [subTab, setSubTab] = useState<SubTab>('intake');

  const previousSession = history.length >= 2 ? history[1] : null;
  const lastSessionDate = previousSession?.date;
  const daysSinceLast = lastSessionDate ? differenceInDays(new Date(), new Date(lastSessionDate)) : 0;
  const isStale = daysSinceLast > 30;

  return (
    <div className="space-y-8">
      {/* Stale alert */}
      {isStale && (
        <Alert className="bg-amber-50 border-amber-200 rounded-xl animate-in slide-in-from-top-2 duration-500">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertDescription className="text-sm text-amber-900 font-medium">
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
          </div>
        )}

        {subTab === 'intrinsic' && (
          <IntrinsicMusclesAssessment
            findings={appointment.intrinsic_muscle_findings}
            onSave={(json) => saveField('intrinsic_muscle_findings', json)}
          />
        )}

        {subTab === 'muscles' && (
          <MuscleAssessment
            priorityPattern={appointment.priority_pattern}
            updatePriorityPattern={updatePriorityPattern}
            showImages
          />
        )}

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