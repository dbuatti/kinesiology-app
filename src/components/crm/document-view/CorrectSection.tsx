"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, BookOpen } from 'lucide-react';
import DocInput from './DocInput';

interface CorrectSectionProps {
  metadata: any;
  acupoints: string | null | undefined;
  brainZoneOptions: { id: string; name: string }[];
  updateMetadataField: (key: string, value: any) => Promise<void>;
  saveField: (field: string, value: any) => Promise<void>;
}

const CorrectSection = ({ metadata, acupoints, brainZoneOptions, updateMetadataField, saveField }: CorrectSectionProps) => {
  return (
    <div className="p-8 border-2 border-black space-y-8 bg-white">
      <div className="flex items-center gap-3 border-b border-black pb-3">
        <Zap size={20} className="text-black" />
        <h3 className="text-sm font-black uppercase tracking-widest">Lofi Calibration Wizard</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Target & Direction */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Finding</label>
            <input 
              type="text"
              value={metadata.wizard_finding || ""}
              onChange={(e) => updateMetadataField('wizard_finding', e.target.value)}
              className="w-full bg-transparent border-b border-slate-200 py-1.5 text-sm font-bold focus:border-black outline-none transition-all"
              placeholder="e.g. Left Psoas, Moro Reflex..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pathway Direction</label>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="dir-afferent"
                  checked={metadata.wizard_direction === 'Afferent'}
                  onCheckedChange={(checked) => updateMetadataField('wizard_direction', checked ? 'Afferent' : null)}
                  className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                />
                <label htmlFor="dir-afferent" className="text-xs font-bold cursor-pointer">Afferent (Bottom-Up)</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="dir-efferent"
                  checked={metadata.wizard_direction === 'Efferent'}
                  onCheckedChange={(checked) => updateMetadataField('wizard_direction', checked ? 'Efferent' : null)}
                  className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                />
                <label htmlFor="dir-efferent" className="text-xs font-bold cursor-pointer">Efferent (Top-Down)</label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Specific System</label>
            {metadata.wizard_direction === 'Afferent' ? (
              <div className="grid grid-cols-2 gap-2">
                {['Mechanoreceptor', 'Vestibular/Ocular', 'Physiological', 'Nociceptive'].map(sys => (
                  <div key={sys} className="flex items-center gap-2">
                    <Checkbox 
                      id={`sys-${sys}`}
                      checked={metadata.wizard_system === sys}
                      onCheckedChange={(checked) => updateMetadataField('wizard_system', checked ? sys : null)}
                      className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                    />
                    <label htmlFor={`sys-${sys}`} className="text-xs font-bold cursor-pointer">{sys}</label>
                  </div>
                ))}
              </div>
            ) : metadata.wizard_direction === 'Efferent' ? (
              <div className="grid grid-cols-2 gap-2">
                {['Cortical', 'Subcortical', 'Emotional'].map(sys => (
                  <div key={sys} className="flex items-center gap-2">
                    <Checkbox 
                      id={`sys-${sys}`}
                      checked={metadata.wizard_system === sys}
                      onCheckedChange={(checked) => updateMetadataField('wizard_system', checked ? sys : null)}
                      className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                    />
                    <label htmlFor={`sys-${sys}`} className="text-xs font-bold cursor-pointer">{sys}</label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Select a pathway direction first.</p>
            )}
          </div>
        </div>

        {/* Right Column: Coordinates & Polarity */}
        <div className="space-y-6">
          <div className="space-y-4 border-l-2 border-slate-100 pl-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Calibration Coordinates</p>
            
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-slate-400">Coordinate 1 (Zone Name)</label>
              <select 
                value={metadata.wizard_coord1_name || ""}
                onChange={(e) => updateMetadataField('wizard_coord1_name', e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 py-1.5 text-xs font-bold focus:border-black outline-none transition-all"
              >
                <option value="" className="text-slate-400">Select Zone...</option>
                {brainZoneOptions.map(option => (
                  <option key={`c1-${option.id}`} value={option.name} className="text-black font-bold">
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-4 pt-1">
                {['Left', 'Right', 'Bilateral'].map(side => (
                  <div key={side} className="flex items-center gap-1.5">
                    <Checkbox 
                      id={`c1-side-${side}`}
                      checked={metadata.wizard_coord1_side === side}
                      onCheckedChange={(checked) => updateMetadataField('wizard_coord1_side', checked ? side : null)}
                      className="h-3.5 w-3.5 border-black rounded-none data-[state=checked]:bg-black"
                    />
                    <label htmlFor={`c1-side-${side}`} className="text-[10px] font-bold cursor-pointer">{side}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[8px] font-black uppercase text-slate-400">Coordinate 2 (Zone Name)</label>
              <select 
                value={metadata.wizard_coord2_name || ""}
                onChange={(e) => updateMetadataField('wizard_coord2_name', e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 py-1.5 text-xs font-bold focus:border-black outline-none transition-all"
              >
                <option value="" className="text-slate-400">Select Zone...</option>
                {brainZoneOptions.map(option => (
                  <option key={`c2-${option.id}`} value={option.name} className="text-black font-bold">
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-4 pt-1">
                {['Left', 'Right', 'Bilateral'].map(side => (
                  <div key={side} className="flex items-center gap-1.5">
                    <Checkbox 
                      id={`c2-side-${side}`}
                      checked={metadata.wizard_coord2_side === side}
                      onCheckedChange={(checked) => updateMetadataField('wizard_coord2_side', checked ? side : null)}
                      className="h-3.5 w-3.5 border-black rounded-none data-[state=checked]:bg-black"
                    />
                    <label htmlFor={`c2-side-${side}`} className="text-[10px] font-bold cursor-pointer">{side}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Polarity</label>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="pol-in"
                checked={metadata.wizard_polarity === 'IN'}
                onCheckedChange={(checked) => updateMetadataField('wizard_polarity', checked ? 'IN' : null)}
                className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
              />
              <label htmlFor="pol-in" className="text-xs font-bold cursor-pointer">Energy IN (+)</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="pol-out"
                checked={metadata.wizard_polarity === 'OUT'}
                onCheckedChange={(checked) => updateMetadataField('wizard_polarity', checked ? 'OUT' : null)}
                className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
              />
              <label htmlFor="pol-out" className="text-xs font-bold cursor-pointer">Energy OUT (-)</label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Correction Method</label>
          <div className="flex flex-wrap gap-4">
            {['Tapping', 'Holding + Intention', 'Tuning Fork'].map(method => (
              <div key={method} className="flex items-center gap-2">
                <Checkbox 
                  id={`method-${method}`}
                  checked={metadata.wizard_method === method}
                  onCheckedChange={(checked) => updateMetadataField('wizard_method', checked ? method : null)}
                  className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                />
                <label htmlFor={`method-${method}`} className="text-xs font-bold cursor-pointer">{method}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <DocInput 
          label="Acupoints Used" 
          value={acupoints} 
          field="acupoints" 
          placeholder="e.g. GV20, KI27..." 
          onChange={(field, val) => saveField(field, val)}
        />
      </div>
    </div>
  );
};

export default CorrectSection;