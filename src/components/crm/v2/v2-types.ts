import { AppointmentWithClient } from "@/types/crm";

export interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | 'Unsure' | null, side?: 'L' | 'R') => Promise<void>;
  onJumpToPhase: (index: number) => void;
}
