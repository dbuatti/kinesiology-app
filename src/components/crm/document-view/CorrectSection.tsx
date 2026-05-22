"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, BookOpen, ExternalLink, Info, CheckCircle2, Sparkles, Brain, Activity, Heart, ShieldAlert, Wind, Droplets, ArrowDownCircle, ArrowUpCircle, Layers, Eye } from 'lucide-react';
import DocInput from './DocInput';
import { cn } from '@/lib/utils';
import { AFFERENT_PATHWAYS, EFFERENT_PATHWAYS } from '@/data/pathway-logic-data';

interface CorrectSectionProps {
  metadata: any;
  acupoints: string | null | undefined;
  brainZoneOptions: { id: string; name: string; category: string }[];
  inhibitedFindings: string[];
  updateMetadataField: (key: string, value: any) => Promise<void>;
  saveField: (field: string, value: any) => Promise<void>;
}

const NOCICEPTIVE_PROTOCOL = {
  id: 'Nociceptive',
  label: 'Nociceptive Threat',
  direction: 'Afferent (Bottom-Up)',
  icon: ShieldAlert,
  color: 'text-orange-500',
  description: 'Clearing threat from scars, old injuries, or specific movements.',
  protocols: [
    'Identify the threat (scar, old injury, movement, or visualization).',
    'Stimulate/irritate the threat (prod, rub, perform movement, or visualize).',
    'Test Indicator Muscle (IM) — should inhibit under threat.',
    'Find correction direction (Afferent vs Efferent) and specific system.',
    'Apply correction + Nasal breathing.',
    'Re-assess: Re-stimulate threat and test IM (should be clear).'
  ]
};

const CorrectSection = ({ 
  metadata, 
  acupoints, 
  brainZoneOptions, 
  inhibitedFindings,
  updateMetadataField, 
  saveField 
}: CorrectSectionProps) => {
  const corticalOptions = useMemo(() => brainZoneOptions.filter(o => o.category === 'Cortical'), [brainZoneOptions]);
  const subcorticalOptions = useMemo(() => brainZoneOptions.filter(o => o.category === 'Subcortical'), [brainZoneOptions]);

  const [showCustomInput, setShowCustomInput] = useState(() => {
    if (!metadata.wizard_finding) return false;
    return !inhibitedFindings.includes(metadata.wizard_finding);
  });

  const [localFinding, setLocalFinding] = useState(metadata.wizard_finding || "");
  const [isFindingFocused, setIsFindingFocused] = useState(false);
  const findingDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (metadata.wizard_finding && !inhibitedFindings.includes(metadata.wizard_finding)) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  }, [metadata.wizard_finding, inhibitedFindings]);

  useEffect(() => {
    if (!isFindingFocused) {
      setLocalFinding(metadata.wizard_finding || "");
    }
  }, [metadata.wizard_finding, isFindingFocused]);

  const handleFindingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalFinding(val);
    
    if (findingDebounceTimer.current) clearTimeout(findingDebounceTimer.current);
    findingDebounceTimer.current = setTimeout(() => {
      updateMetadataField('wizard_finding', val);
    }, 1000);
  };

  const handleFindingBlur = () => {
    setIsFindingFocused(false);
    if (findingDebounceTimer.current) clearTimeout(findingDebounceTimer.current);
    updateMetadataField('wizard_finding', localFinding);
  };

  // Find active protocol based on selection
  const activeProtocol = useMemo(() => {
    if (!metadata.wizard_system) return null;
    
    if (metadata.wizard_system === 'Nociceptive') {
      return NOCICEPTIVE_PROTOCOL;
    }

    const allPathways = [...AFFERENT_PATHWAYS, ...EFFERENT_PATHWAYS];
    return allPathways.find(p => p.id.toLowerCase().includes(metadata.wizard_system.toLowerCase()) || metadata.wizard_system.toLowerCase().includes(p.id.toLowerCase()));
  }, [metadata.wizard_system]);

  const ProtocolBlock = ({ title, icon: Icon, color, steps, desc }: { title: string, icon: any, color: string, steps: string[], desc?: string }) => (
    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white", color)}>
          <Icon size={14} />
        </div>
        <h5 className="text-xs font-black uppercase tracking-tight">{title}</h5>
      </div>
      {desc && <p className="text-[11px] text-slate-500 italic leading-relaxed">"{desc}"</p>}
      <div className="space-y-1.5">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-2 items-start text-[11px] leading-relaxed text-slate-700">
            <span className="font-black text-black shrink-0">{idx + 1}.</span>
            <p className="font-medium">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Interactive Wizard Card */}
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
              <select 
                value={showCustomInput ? "CUSTOM_INPUT" : (metadata.wizard_finding || "")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "CUSTOM_INPUT") {
                    setShowCustomInput(true);
                    setLocalFinding("");
                    updateMetadataField('wizard_finding', "");
                  } else {
                    setShowCustomInput(false);
                    updateMetadataField('wizard_finding', val);
                  }
                }}
                className="w-full bg-transparent border-b border-slate-200 py-1.5 text-sm font-bold focus:border-black outline-none transition-all"
              >
                <option value="" className="text-slate-400">Select inhibited finding...</option>
                {inhibitedFindings.map(finding => (
                  <option key={finding} value={finding} className="text-black font-bold">
                    {finding}
                  </option>
                ))}
                <option value="CUSTOM_INPUT" className="text-indigo-600 font-bold">+ Custom Entry...</option>
              </select>

              {showCustomInput && (
                <input 
                  type="text"
                  value={localFinding}
                  onChange={handleFindingChange}
                  onFocus={() => setIsFindingFocused(true)}
                  onBlur={handleFindingBlur}
                  className="w-full bg-transparent border-b border-slate-200 py-1.5 text-sm font-bold focus:border-black outline-none transition-all mt-2 animate-in slide-in-from-top-1"
                  placeholder="Type custom finding..."
                />
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pathway Direction</label>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="dir-afferent"
                    checked={metadata.wizard_direction === 'Afferent'}
                    onCheckedChange={(checked) => {
                      updateMetadataField('wizard_direction', checked ? 'Afferent' : null);
                      updateMetadataField('wizard_system', null); // Reset system on direction change
                    }}
                    className="h-4 w-4 border-black rounded-none data-[state=checked]:bg-black"
                  />
                  <label htmlFor="dir-afferent" className="text-xs font-bold cursor-pointer">Afferent (Bottom-Up)</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="dir-efferent"
                    checked={metadata.wizard_direction === 'Efferent'}
                    onCheckedChange={(checked) => {
                      updateMetadataField('wizard_direction', checked ? 'Efferent' : null);
                      updateMetadataField('wizard_system', null); // Reset system on direction change
                    }}
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Calibration Coordinates</p>
                <a 
                  href="/resources/brain-zones/print" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 hover:underline uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={10} /> View Brain Zone Map
                </a>
              </div>
              
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-400">Coordinate 1 (Zone Name)</label>
                <select 
                  value={metadata.wizard_coord1_name || ""}
                  onChange={(e) => updateMetadataField('wizard_coord1_name', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 py-1.5 text-xs font-bold focus:border-black outline-none transition-all"
                >
                  <option value="" className="text-slate-400">Select Zone...</option>
                  <optgroup label="Cortical Brain Zones">
                    {corticalOptions.map(option => (
                      <option key={`c1-${option.id}`} value={option.name} className="text-black font-bold">
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Subcortical Brain Zones">
                    {subcorticalOptions.map(option => (
                      <option key={`c1-${option.id}`} value={option.name} className="text-black font-bold">
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
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
                  <optgroup label="Cortical Brain Zones">
                    {corticalOptions.map(option => (
                      <option key={`c2-${option.id}`} value={option.name} className="text-black font-bold">
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Subcortical Brain Zones">
                    {subcorticalOptions.map(option => (
                      <option key={`c2-${option.id}`} value={option.name} className="text-black font-bold">
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
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
      </div>

      {/* AFFERENT PROTOCOLS SECTION */}
      <div id="c-afferent" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-black pb-2">
          <ArrowDownCircle size={16} className="text-blue-600" />
          <h4 className="text-sm font-black uppercase tracking-widest text-blue-600">Afferent (Bottom-Up) Protocols</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div id="c-mechano">
            <ProtocolBlock 
              title="Mechanoreceptor (Joint/Muscle)"
              icon={Activity}
              color="bg-blue-500"
              desc="Physical input from joints, muscles, and skin receptors. 15% conscious (DCML to S1), 85% unconscious (Spinocerebellar to Cerebellum)."
              steps={[
                "CONSCIOUS: TL opposing sensory cortex → Isometric contraction (30-40%, 3-5s) + Nasal breathing",
                "UNCONSCIOUS: Hold GV16 → Locate ligament → Stretch + Tuning fork on cranium (3-5s)",
                "Re-test original pathway after each layer"
              ]}
            />
          </div>

          <div id="c-vestibular">
            <ProtocolBlock 
              title="Vestibular / Ocular"
              icon={Eye}
              color="bg-cyan-500"
              desc="Balance and visual system inputs to the cerebellum. Critical for spatial orientation and postural control."
              steps={[
                "Perform VOR (Vestibulo-Ocular Reflex) or saccadic eye movements",
                "Use head rotations or balance challenges",
                "Integrate with specific eye positions",
                "Hold correction with nasal breathing"
              ]}
            />
          </div>

          <div id="c-physiological">
            <ProtocolBlock 
              title="Physiological"
              icon={Droplets}
              color="bg-emerald-500"
              desc="Biochemical, nutritional, and organ-based signals. Addresses systemic imbalances."
              steps={[
                "Address biochemical or organ-specific reflexes",
                "Check for nutritional or hydration priorities",
                "Use specific neurolymphatic or neurovascular points",
                "Consider meridian-based corrections"
              ]}
            />
          </div>

          <div id="c-nociceptive">
            <ProtocolBlock 
              title="Nociceptive Threat"
              icon={ShieldAlert}
              color="bg-orange-500"
              desc="Clearing threat from scars, old injuries, or specific movements."
              steps={[
                "Identify the threat (scar, old injury, movement, or visualization).",
                "Stimulate/irritate the threat (prod, rub, perform movement, or visualize).",
                "Test Indicator Muscle (IM) — should inhibit under threat.",
                "Find correction direction (Afferent vs Efferent) and specific system.",
                "Apply correction + Nasal breathing.",
                "Re-assess: Re-stimulate threat and test IM (should be clear)."
              ]}
            />
          </div>
        </div>
      </div>

      {/* EFFERENT PROTOCOLS SECTION */}
      <div id="c-efferent" className="space-y-6 scroll-mt-24">
        <div className="flex items-center gap-2 border-b border-black pb-2">
          <ArrowUpCircle size={16} className="text-purple-600" />
          <h4 className="text-sm font-black uppercase tracking-widest text-purple-600">Efferent (Top-Down) Protocols</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div id="c-cortical">
            <ProtocolBlock 
              title="Cortical (Top-Down)"
              icon={Brain}
              color="bg-purple-500"
              desc="Intentional, cognitive, and motor planning processes. Contralateral logic: right cortex controls left body."
              steps={[
                "Identify primary cortical zone (PFC, M1, S1, etc.) and lateralize",
                "Identify secondary zone (cortical or subcortical)",
                "Apply correction: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork",
                "Include pathway name during intention: 'Left Psoas, Right PFC, Left Limbic'"
              ]}
            />
          </div>

          <div id="c-subcortical">
            <ProtocolBlock 
              title="Subcortical (Autonomic)"
              icon={Layers}
              color="bg-amber-500"
              desc="Automatic, reflexive, and autonomic regulation. Ipsilateral logic: left cerebellum controls left body."
              steps={[
                "Identify subcortical zone (Limbic, Cerebellum, Hypothalamus, etc.)",
                "Lateralize response (Left = historical trauma, Right = current processing)",
                "Use rhythmic movements or breathing patterns",
                "Apply correction method: Tapping, Holding + Intention, or Tuning Fork"
              ]}
            />
          </div>

          <div id="c-emotional">
            <ProtocolBlock 
              title="Emotional"
              icon={Heart}
              color="bg-rose-500"
              desc="Limbic system and emotional processing. Final check if afferent and efferent are clear."
              steps={[
                "Apply ESR (Emotional Stress Release) points",
                "Acknowledge and release associated stressors",
                "Use specific meridian-based emotional balancing",
                "Complete full emotional process before re-assessing"
              ]}
            />
          </div>
        </div>
      </div>

      {/* DETAILED STEP-BY-STEP PROTOCOL INSTRUCTIONS */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detailed Correction Instructions</p>
        
        {activeProtocol ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                <Info size={16} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight">{activeProtocol.label} Protocol</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activeProtocol.direction}</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
              "{activeProtocol.description}"
            </p>

            <div className="space-y-2">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Step-by-Step Steps:</p>
              <div className="space-y-2">
                {activeProtocol.protocols.map((stepText, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-xs leading-relaxed text-slate-700">
                    <span className="font-black text-black shrink-0">{idx + 1}.</span>
                    <p className="font-medium">{stepText}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center space-y-4">
            <Info size={24} className="mx-auto text-slate-300" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500">No Specific System Selected</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Select a **Pathway Direction** and **Specific System** on the left to view detailed step-by-step clinical instructions.
              </p>
            </div>
          </div>
        )}
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