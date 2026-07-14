import { ShieldAlert, Activity, Eye, GitBranch } from "lucide-react";
import CogsAssessment from "@/components/crm/CogsAssessment";
import NeurologicalAssessments from "@/components/crm/NeurologicalAssessments";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import { AppointmentWithClient } from "@/types/crm";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

const AlignPhase = ({ appointment, onUpdate }: PhaseProps) => {
  return (
    <div className="space-y-10">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
          <GitBranch size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Align</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Global assessments and a clear picture of all inhibited findings from the P phase assessments.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Eye size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">COGS — Visual Assessment</h3>
        </div>
        <CogsAssessment
          appointmentId={appointment.id}
          initialSagittalNotes={appointment.sagittal_plane_notes}
          initialFrontalNotes={appointment.frontal_plane_notes}
          initialTransverseNotes={appointment.transverse_plane_notes}
          onUpdate={onUpdate}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <ShieldAlert size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Neurological Baseline</h3>
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

      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Activity size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Inhibited Findings Summary</h3>
        </div>
        <PathwayFindingsList
          priorityPattern={appointment.priority_pattern}
          showOnlyInhibited
          className="max-h-[500px] overflow-y-auto pr-2"
        />
      </div>
    </div>
  );
};

export default AlignPhase;