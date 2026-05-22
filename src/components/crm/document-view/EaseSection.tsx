"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import DocInput from './DocInput';

interface EaseSectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
}

const EaseSection = ({ appointment, saveField }: EaseSectionProps) => {
  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-widest">Harmonic Rocking</h4>
              <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.harmonic_rocking_notes} 
              field="harmonic_rocking_notes" 
              placeholder="Client response..." 
              onChange={handleFieldChange}
            />
          </div>
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-widest">T1 Sympathetic Reset</h4>
              <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.t1_reset_notes} 
              field="t1_reset_notes" 
              placeholder="Side, Psoas response..." 
              onChange={handleFieldChange}
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-widest">Diaphragm Reset</h4>
              <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.diaphragm_reset_notes} 
              field="diaphragm_reset_notes" 
              placeholder="Tender points, breath shift..." 
              onChange={handleFieldChange}
            />
          </div>
          <div className="p-6 border border-black space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-widest">Vagus Nerve Process</h4>
              <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
            </div>
            <DocInput 
              label="Notes" 
              value={appointment.vagus_nerve_notes} 
              field="vagus_nerve_notes" 
              placeholder="Branch, function, reset..." 
              onChange={handleFieldChange}
            />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <DocInput 
          label="Other SNS Techniques" 
          value={appointment.additional_notes} 
          field="additional_notes" 
          placeholder="ESR, Vagus Nerve, etc..." 
          multiline 
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default EaseSection;