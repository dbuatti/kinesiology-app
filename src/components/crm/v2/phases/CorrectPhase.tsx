import { useRef } from "react";
import { Target, Activity } from "lucide-react";
import EditableField from "@/components/shared/EditableField";
import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import { AppointmentWithClient } from "@/types/crm";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

const CorrectPhase = ({ appointment, onUpdate, saveField }: PhaseProps) => {
  const wizardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-10">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
          <Target size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Correct</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Determine afferent vs efferent, identify coordinates, and apply the correction.
          </p>
        </div>
      </div>

      <div ref={wizardRef}>
        <PathwayLogicWizard
          onSave={(summary) => saveField('modes_balances', summary)}
          onClearItem={() => onUpdate()}
          priorityPattern={appointment.priority_pattern}
          appointmentId={appointment.id}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Target size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Corrections & Balances Applied</h3>
        </div>
        <EditableField
          field="modes_balances"
          label=""
          value={appointment.modes_balances}
          multiline
          placeholder="Document the coordinates, polarity, and methods applied..."
          onSave={saveField}
          className="bg-card border border-border p-6 rounded-xl shadow-sm min-h-[200px]"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Activity size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Acupoints</h3>
        </div>
        <EditableField
          field="acupoints"
          label=""
          value={appointment.acupoints}
          multiline
          placeholder="Record any acupressure points held..."
          onSave={saveField}
          className="bg-card border border-border p-6 rounded-xl shadow-sm min-h-[120px]"
        />
      </div>
    </div>
  );
};

export default CorrectPhase;