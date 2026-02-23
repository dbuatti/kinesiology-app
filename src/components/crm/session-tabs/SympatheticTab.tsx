"use client";

import React from 'react';
import SympatheticDownRegulation from '../SympatheticDownRegulation';
import T1SympatheticReset from '../T1SympatheticReset';
import DiaphragmReset from '../DiaphragmReset';
import VagusNerveProcess from '../VagusNerveProcess';
import EditableField from '../EditableField';
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
      <EditableField 
        field="additional_notes" 
        label="Other SNS Techniques" 
        value={appointment.additional_notes} 
        multiline 
        placeholder="ESR, Vagus Nerve, etc..." 
        onSave={saveField} 
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" 
      />
    </div>
  );
};

export default SympatheticTab;