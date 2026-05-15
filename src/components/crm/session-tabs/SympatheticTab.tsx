"use client";

import React from 'react';
import SympatheticDownRegulation from '../SympatheticDownRegulation';
import T1SympatheticReset from '../T1SympatheticReset';
import DiaphragmReset from '../DiaphragmReset';
import VagusNerveProcess from '../VagusNerveProcess';
import EditableField from '@/components/shared/EditableField';
import { AppointmentWithClient } from '@/types/crm';
import { Zap, Activity, Wind, Brain, Layers, Sparkles } from 'lucide-react';

interface SympatheticTabProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const SympatheticTab = ({ appointment, onUpdate, saveField }: SympatheticTabProps) => {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4 px-2">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">Ease: SNS Down-Regulation</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reset the sympathetic nervous system</p>
        </div>
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800 ml-4" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Additional SNS Techniques</span>
        </div>
        <EditableField 
          field="additional_notes" 
          label="Other SNS Techniques" 
          value={appointment.additional_notes} 
          multiline 
          placeholder="ESR, Vagus Nerve, etc..." 
          onSave={saveField} 
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[120px]" 
        />
      </div>
    </div>
  );
};

export default SympatheticTab;