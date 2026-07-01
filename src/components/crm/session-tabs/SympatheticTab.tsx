
import SympatheticDownRegulation from '../SympatheticDownRegulation';
import T1SympatheticReset from '../T1SympatheticReset';
import DiaphragmReset from '../DiaphragmReset';
import VagusNerveProcess from '../VagusNerveProcess';
import EditableField from '@/components/shared/EditableField';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { AppointmentWithClient } from '@/types/crm';

interface SympatheticTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const SympatheticTab = ({ appointment, onUpdate, saveField }: SympatheticTabProps) => {
  return (
    <div className="space-y-6">
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
              <Sparkles size={20} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Other SNS Techniques</h3>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">ESR, Vagus Nerve, etc.</p>
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
  );
};

export default SympatheticTab;