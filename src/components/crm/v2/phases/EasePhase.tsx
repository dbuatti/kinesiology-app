import {
  Zap, Activity, Wind, Heart, Shield, Droplets
} from "lucide-react";
import BoltTestSection from "@/components/crm/BoltTestSection";
import CoherenceAssessment from "@/components/crm/CoherenceAssessment";
import LymphaticAssessment from "@/components/crm/LymphaticAssessment";
import SympatheticDownRegulation from "@/components/crm/SympatheticDownRegulation";
import T1SympatheticReset from "@/components/crm/T1SympatheticReset";
import DiaphragmReset from "@/components/crm/DiaphragmReset";
import VagusNerveProcess from "@/components/crm/VagusNerveProcess";
import EditableField from "@/components/shared/EditableField";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentWithClient } from "@/types/crm";

interface PhaseProps {
  appointment: AppointmentWithClient;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | 'Hypertonic' | null, side?: 'L' | 'R') => Promise<void>;
}

const EasePhase = ({ appointment, history, onUpdate, saveField }: PhaseProps) => {
  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
          <Zap size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Ease</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Down-regulate the sympathetic nervous system and establish baseline vitals (CO₂ tolerance, heart coherence) before deeper assessment.
          </p>
        </div>
      </div>

      {/* Vitals */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Activity size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">Baseline Vitals</h3>
        </div>
        <div className="space-y-4">
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
      </div>

      {/* SNS Techniques */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <Shield size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground tracking-tight">SNS Down-Regulation</h3>
        </div>
        <div className="space-y-4">
          <LymphaticAssessment
            appointmentId={appointment.id}
            initialSutureSide={appointment.lymphatic_suture_side}
            initialPriorityZone={appointment.lymphatic_priority_zone}
            initialNotes={appointment.lymphatic_notes}
            onSaveField={saveField}
          />
          <SympatheticDownRegulation
            appointmentId={appointment.id}
            initialNotes={appointment.harmonic_rocking_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <T1SympatheticReset
            appointmentId={appointment.id}
            initialNotes={appointment.t1_reset_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <DiaphragmReset
            appointmentId={appointment.id}
            initialNotes={appointment.diaphragm_reset_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <VagusNerveProcess
            appointmentId={appointment.id}
            initialNotes={appointment.vagus_nerve_notes}
            onSaveField={saveField}
            onUpdate={onUpdate}
          />
          <Card className="border-none shadow-sm rounded-xl bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Droplets size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">Other Techniques</h4>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">ESR, Vagus, etc.</p>
                </div>
              </div>
              <EditableField
                field="additional_notes"
                label=""
                value={appointment.additional_notes}
                multiline
                placeholder="Document any additional SNS techniques used..."
                onSave={saveField}
                className="border border-border p-0 shadow-none bg-transparent rounded-2xl"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EasePhase;