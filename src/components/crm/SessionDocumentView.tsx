"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Check, 
  FileText, 
  Printer, 
  ArrowLeft, 
  Save, 
  Loader2,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AppointmentWithClient } from '@/types/crm';
import { safeParse } from '@/utils/safe-json';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from '@/data/muscle-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SessionDocumentViewProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  onClose: () => void;
}

const SessionDocumentView = ({ 
  appointment, 
  onUpdate, 
  saveField, 
  updatePriorityPattern,
  onClose
}: SessionDocumentViewProps) => {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  const SectionHeader = ({ id, title, subtitle }: { id: string, title: string, subtitle?: string }) => (
    <div id={id} className="border-b-2 border-black pb-1 mb-6 mt-16 first:mt-0 scroll-mt-24">
      <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
      {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>}
    </div>
  );

  const SubHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 mt-10 border-l-4 border-slate-200 pl-3">{children}</h3>
  );

  const DocInput = ({ label, value, field, placeholder, multiline = false, type = "text" }: any) => (
    <div className="space-y-1.5 group">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-black transition-colors">{label}</label>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => {
            saveField(field, e.target.value);
            setLastSaved(new Date());
          }}
          placeholder={placeholder}
          className="w-full min-h-[100px] bg-slate-50/30 border border-slate-200 rounded-none p-4 text-sm font-medium focus:border-black focus:bg-white focus:ring-0 transition-all resize-none"
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => {
            saveField(field, e.target.value);
            setLastSaved(new Date());
          }}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-slate-200 py-2 text-sm font-bold focus:border-black outline-none transition-all placeholder:text-slate-200"
        />
      )}
    </div>
  );

  const CheckItem = ({ category, name, side }: { category: string, name: string, side?: 'L' | 'R' }) => {
    const fullName = side ? `${name} (${side})` : name;
    const isChecked = pattern[category]?.[fullName] === 'Inhibited';

    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-1.5 transition-all cursor-pointer group border border-transparent",
          isChecked ? "bg-slate-900 text-white" : "hover:bg-slate-50"
        )}
        onClick={() => {
          updatePriorityPattern(category, name, isChecked ? 'Clear' : 'Inhibited', side);
          setLastSaved(new Date());
        }}
      >
        <div className={cn(
          "w-3.5 h-3.5 border flex items-center justify-center transition-all shrink-0",
          isChecked ? "bg-white border-white text-black" : "border-slate-300 group-hover:border-black"
        )}>
          {isChecked && <Check size={10} strokeWidth={4} />}
        </div>
        <span className={cn(
          "text-[10px] font-bold truncate",
          isChecked ? "text-white" : "text-slate-600"
        )}>
          {side ? `${side}: ${name}` : name}
        </span>
      </div>
    );
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-40 animate-in fade-in duration-500">
      {/* Document Controls */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-black px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none h-9 px-4 font-black text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all">
            <ArrowLeft size={14} className="mr-2" /> Exit
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Record</span>
            <span className="text-sm font-black">{appointment.clients.name}</span>
          </div>
          <Badge variant="outline" className="rounded-none border-black font-black text-[8px] uppercase px-2 py-0.5">
            {appointment.status}
          </Badge>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
          <button onClick={() => scrollTo('p-sec')} className="hover:text-black transition-colors">P</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('e-sec')} className="hover:text-black transition-colors">E</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('a-sec')} className="hover:text-black transition-colors">A</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('c-sec')} className="hover:text-black transition-colors">C</button>
          <span className="opacity-20">/</span>
          <button onClick={() => scrollTo('e2-sec')} className="hover:text-black transition-colors">E</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Sync</p>
            <p className="text-[10px] font-bold tabular-nums">{format(lastSaved, "HH:mm:ss")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-none border-black font-black text-[10px] uppercase tracking-widest h-9 px-4 hover:bg-slate-50">
            <Printer size={14} className="mr-2" /> Print
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 md:p-20 space-y-16 print:p-0 print:m-0">
        {/* Header */}
        <div className="flex justify-between items-end border-b-4 border-black pb-10">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Session Log</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • v2.4</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xl font-black">{appointment.clients.name}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{format(appointment.date, "EEEE, MMMM d, yyyy")}</p>
            <p className="text-[9px] font-mono text-slate-300 uppercase">{appointment.display_id || appointment.id}</p>
          </div>
        </div>

        {/* P - PRELIMINARY */}
        <section>
          <SectionHeader id="p-sec" title="P — Preliminary Assessment" subtitle="Intake & Baseline Vitals" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-10">
              <DocInput label="Session Goal" value={appointment.goal} field="goal" placeholder="Primary objective..." />
              <DocInput label="Main Concern" value={appointment.issue} field="issue" placeholder="Presenting symptoms..." />
              
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">BOLT Score</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={appointment.bolt_score || ""} 
                      onChange={(e) => saveField('bolt_score', e.target.value)}
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
                      onChange={(e) => saveField('coherence_score', e.target.value)}
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
              <DocInput label="ROM / Cogs Notes" value={appointment.sagittal_plane_notes} field="sagittal_plane_notes" placeholder="Sagittal, Frontal, Transverse findings..." multiline />
            </div>
          </div>

          <SubHeader>Global Neurological Assessments</SubHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            <DocInput label="Fakuda Step Test" value={appointment.fakuda_notes} field="fakuda_notes" placeholder="Rotation, drift, or instability..." multiline />
            <DocInput label="Sharpened Rhombergs" value={appointment.sharpened_rhombergs_notes} field="sharpened_rhombergs_notes" placeholder="Sway pattern, time held..." multiline />
            <DocInput label="Frontal Lobe" value={appointment.frontal_lobe_notes} field="frontal_lobe_notes" placeholder="Hand drill speed/coordination..." multiline />
            <DocInput label="Righting Reflexes" value={appointment.righting_reflex_notes} field="righting_reflex_notes" placeholder="Ocular vs Labyrinthine..." multiline />
          </div>
        </section>

        {/* E - EASE */}
        <section>
          <SectionHeader id="e-sec" title="E — Ease the System" subtitle="SNS Down-Regulation" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="p-6 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Harmonic Rocking</h4>
                  <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                </div>
                <DocInput label="Notes" value={appointment.harmonic_rocking_notes} field="harmonic_rocking_notes" placeholder="Client response..." />
              </div>
              <div className="p-6 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest">T1 Sympathetic Reset</h4>
                  <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                </div>
                <DocInput label="Notes" value={appointment.t1_reset_notes} field="t1_reset_notes" placeholder="Side, Psoas response..." />
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-6 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Diaphragm Reset</h4>
                  <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                </div>
                <DocInput label="Notes" value={appointment.diaphragm_reset_notes} field="diaphragm_reset_notes" placeholder="Tender points, breath shift..." />
              </div>
              <div className="p-6 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Vagus Nerve Process</h4>
                  <Checkbox className="border-black rounded-none data-[state=checked]:bg-black" />
                </div>
                <DocInput label="Notes" value={appointment.vagus_nerve_notes} field="vagus_nerve_notes" placeholder="Branch, function, reset..." />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <DocInput label="Other SNS Techniques" value={appointment.additional_notes} field="additional_notes" placeholder="ESR, Vagus Nerve, etc..." multiline />
          </div>
        </section>

        {/* A - ALIGN */}
        <section>
          <SectionHeader id="a-sec" title="A — Align the Hierarchy" subtitle="Neurological Findings & Patterns" />
          
          <div className="space-y-16">
            <div>
              <SubHeader>Primitive Reflexes</SubHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                {PRIMITIVE_REFLEXES.map(reflex => (
                  <div key={reflex.id} className="space-y-0.5">
                    <CheckItem category="primitiveReflexes" name={reflex.name} side="L" />
                    <CheckItem category="primitiveReflexes" name={reflex.name} side="R" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SubHeader>Cranial Nerves</SubHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                {CRANIAL_NERVES.map(nerve => {
                  const name = `${nerve.name}: ${nerve.latinName}`;
                  return (
                    <div key={nerve.id} className="space-y-0.5">
                      <CheckItem category="cranialNerves" name={name} side="L" />
                      <CheckItem category="cranialNerves" name={name} side="R" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SubHeader>Muscle Assessment</SubHeader>
              <div className="space-y-12">
                {Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => (
                  <div key={group} className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 border-l-2 border-slate-200 pl-2 tracking-widest">{group}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-0.5">
                      {muscles.map(muscle => (
                        <div key={muscle} className="space-y-0.5">
                          {MIDLINE_MUSCLES.includes(muscle) ? (
                            <CheckItem category="muscles" name={muscle} />
                          ) : (
                            <>
                              <CheckItem category="muscles" name={muscle} side="L" />
                              <CheckItem category="muscles" name={muscle} side="R" />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* C - CORRECT */}
        <section>
          <SectionHeader id="c-sec" title="C — Correct" subtitle="Calibration & Integration" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-10">
              <DocInput label="Modes & Balances Applied" value={appointment.modes_balances} field="modes_balances" placeholder="Document the specific corrections, brain zones, and logic used..." multiline />
              <DocInput label="Acupoints Used" value={appointment.acupoints} field="acupoints" placeholder="GV20, KI27, etc..." />
            </div>
            <div className="space-y-10">
              <div className="p-8 border-2 border-black space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest border-b border-black pb-2">Emotional Context</h4>
                <div className="grid grid-cols-2 gap-6">
                  <DocInput label="Luscher Pair" value={appointment.luscher_color_1 ? `${appointment.luscher_color_1} + ${appointment.luscher_color_2}` : ""} field="luscher_color_1" placeholder="e.g. 3 + 4" />
                  <DocInput label="Primary Emotion" value={appointment.emotion_primary_selection} field="emotion_primary_selection" placeholder="e.g. Anger" />
                </div>
                <DocInput label="Emotional Notes" value={appointment.emotion_notes} field="emotion_notes" placeholder="Triggers, insights..." multiline />
              </div>
            </div>
          </div>
        </section>

        {/* E - EMBED */}
        <section>
          <SectionHeader id="e2-sec" title="E — Embed" subtitle="Re-Assessment & Homework" />
          <div className="space-y-10">
            <DocInput label="Final Re-Assessment & Prescribed Homework" value={appointment.session_north_star} field="session_north_star" placeholder="Verify integration and define the client's daily practice..." multiline />
            <DocInput label="General Session Notes" value={appointment.notes} field="notes" placeholder="Any additional observations or context..." multiline />
            <DocInput label="Practitioner Reflection (Private)" value={appointment.journal} field="journal" placeholder="Personal insights for the Sandbox..." multiline />
          </div>
        </section>

        {/* Footer */}
        <div className="pt-32 border-t-2 border-black text-center space-y-4">
          <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Verified</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Integrated</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Encrypted</div>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">Fractal Resolution OS • Resonance Clinical Infrastructure</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          textarea {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          input {
            border-bottom: 1px solid #eee !important;
          }
          .scroll-mt-24 {
            scroll-margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionDocumentView;