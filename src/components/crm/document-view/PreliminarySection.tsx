"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import DocInput from './DocInput';

interface PreliminarySectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
}

const PreliminarySection = ({ appointment, saveField }: PreliminarySectionProps) => {
  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
      <div className="space-y-10">
        <DocInput 
          label="Session Goal" 
          value={appointment.goal} 
          field="goal" 
          placeholder="Primary objective..." 
          onChange={handleFieldChange}
        />
        <DocInput 
          label="Main Concern" 
          value={appointment.issue} 
          field="issue" 
          placeholder="Presenting symptoms..." 
          onChange={handleFieldChange}
        />
        
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">BOLT Score</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={appointment.bolt_score || ""} 
                onChange={(e) => handleFieldChange('bolt_score', e.target.value)}
                className="w-20 bg-transparent border-b-2 border-slate-100 py-1 text-3xl font-black outline-none focus:border-black transition-colors"
              />
              <span className="text-[10px] font-black uppercase text-slate-300">Sec</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Coherence</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                step="0.1"
                value={appointment.coherence_score || ""} 
                onChange={(e) => handleFieldChange('coherence_score', e.target.value)}
                className="w-20 bg-transparent border-b-2 border-slate-100 py-1 text-3xl font-black outline-none focus:border-black transition-colors"
              />
              <span className="text-[10px] font-black uppercase text-slate-300">Ratio</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100">
          <div className="space-y-0.5">
            <p className="text-[11px] font-black uppercase tracking-widest">Hydration Check</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase">Systemic Conductivity</p>
          </div>
          <Checkbox 
            checked={appointment.hydrated || false} 
            onCheckedChange={(checked) => saveField('hydrated', !!checked)}
            className="h-8 w-8 border-black rounded-none data-[state=checked]:bg-black"
          />
        </div>
        <DocInput 
          label="ROM / Cogs Notes" 
          value={appointment.sagittal_plane_notes} 
          field="sagittal_plane_notes" 
          placeholder="Sagittal, Frontal, Transverse findings..." 
          multiline 
          onChange={handleFieldChange}
        />
      </div>
    </div>
  );
};

export default PreliminarySection;