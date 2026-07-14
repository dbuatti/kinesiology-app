import { Zap, Shield } from "lucide-react";
import SnsList from "@/components/crm/v2/SnsList";
import { AppointmentWithClient } from "@/types/crm";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

const EasePhase = ({ appointment, onUpdate, saveField }: PhaseProps) => {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
          <Zap size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Ease</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Down-regulate the sympathetic nervous system before deeper assessment.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Shield size={16} className="text-muted-foreground" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">SNS Down-Regulation</h3>
      </div>

      <SnsList appointment={appointment} onSaveField={saveField} onUpdate={onUpdate} />
    </div>
  );
};

export default EasePhase;