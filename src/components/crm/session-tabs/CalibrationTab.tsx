"use client";

import React from 'react';
import ClinicalSyntaxInput from '../ClinicalSyntaxInput';
import { AppointmentWithClient } from '@/types/crm';

interface CalibrationTabProps {
  appointment: AppointmentWithClient;
  saveField: (field: string, value: any) => Promise<void>;
}

const CalibrationTab = ({ appointment, saveField }: CalibrationTabProps) => {
  return (
    <div className="space-y-8">
      <ClinicalSyntaxInput 
        value={appointment.modes_balances} 
        onSave={(val) => saveField('modes_balances', val)} 
      />
      
      <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl">
        <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs">?</span>
          Why use shorthand?
        </h4>
        <p className="text-slate-400 text-sm leading-relaxed font-medium">
          Using the <code>: [Priority] - [Target] || [Dir], [Fix] >> [Note]</code> syntax allows the system to track specific findings like <strong>Babinski</strong> or <strong>CN X</strong> across multiple sessions. This data is automatically aggregated in the client's <strong>Clinical Timeline</strong>.
        </p>
      </div>
    </div>
  );
};

export default CalibrationTab;