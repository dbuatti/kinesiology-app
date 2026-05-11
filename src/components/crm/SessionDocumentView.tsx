"use client";

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { 
  Check, 
  Square, 
  CheckSquare, 
  FileText, 
  Zap, 
  Activity, 
  Target, 
  Brain, 
  Baby, 
  Dumbbell,
  ChevronRight,
  Printer,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AppointmentWithClient } from '@/types/crm';
import { safeParse } from '@/utils/safe-json';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from '@/data/muscle-data';
import { Button } from '@/components/ui/button';

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
  const pattern = useMemo(() => safeParse(appointment.priority_pattern, {} as any), [appointment.priority_pattern]);

  const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="border-b-2 border-black pb-1 mb-6 mt-12 first:mt-0">
      <h2 className="text-xl font-black uppercase tracking-tighter">{title}</h2>
      {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>}
    </div>
  );

  const SubHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 mt-8">{children}</h3>
  );

  const DocInput = ({ label, value, field, placeholder, multiline = false }: any) => (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => saveField(field, e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[80px] bg-transparent border border-slate-200 rounded-lg p-3 text-sm font-medium focus:border-black focus:ring-0 transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => saveField(field, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-slate-200 py-1 text-sm font-bold focus:border-black outline-none transition-all"
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
          "flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer group",
          isChecked ? "bg-slate-100" : "hover:bg-slate-50"
        )}
        onClick={() => updatePriorityPattern(category, name, isChecked ? 'Clear' : 'Inhibited', side)}
      >
        <div className={cn(
          "w-4 h-4 border flex items-center justify-center transition-all",
          isChecked ? "bg-black border-black text-white" : "border-slate-300 group-hover:border-slate-900"
        )}>
          {isChecked && <Check size={12} strokeWidth={4} />}
        </div>
        <span className={cn(
          "text-[11px] font-bold",
          isChecked ? "text-black" : "text-slate-500"
        )}>
          {side ? `${side}: ${name}` : name}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-40 animate-in fade-in duration-500">
      {/* Document Controls */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} className="mr-2" /> Exit Document
          </Button>
          <div className="h-6 w-px bg-slate-100" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Session</span>
            <span className="text-sm font-black">{appointment.clients.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest">
            <Printer size={16} className="mr-2" /> Print
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 md:p-16 space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end border-b-4 border-black pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase">Session Log</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">Resonance Clinical Infrastructure</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-lg font-black">{appointment.clients.name}</p>
            <p className="text-sm font-bold text-slate-400">{format(appointment.date, "EEEE, MMMM d, yyyy")}</p>
          </div>
        </div>

        {/* P - PRELIMINARY */}
        <section>
          <SectionHeader title="P — Preliminary Assessment" subtitle="Intake & Baseline Vitals" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <DocInput label="Session Goal" value={appointment.goal} field="goal" placeholder="Primary objective..." />
              <DocInput label="Main Concern" value={appointment.issue} field="issue" placeholder="Presenting symptoms..." />
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">BOLT Score</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={appointment.bolt_score || ""} 
                      onChange={(e) => saveField('bolt_score', e.target.value)}
                      className="w-16 bg-transparent border-b border-slate-200 py-1 text-xl font-black outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">seconds</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Coherence</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.1"
                      value={appointment.coherence_score || ""} 
                      onChange={(e) => saveField('coherence_score', e.target.value)}
                      className="w-16 bg-transparent border-b border-slate-200 py-1 text-xl font-black outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">ratio</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest">Hydration Check</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Systemic Conductivity</p>
                </div>
                <Checkbox 
                  checked={appointment.hydrated || false} 
                  onCheckedChange={(checked) => saveField('hydrated', !!checked)}
                  className="h-6 w-6 border-black rounded-none"
                />
              </div>
              <DocInput label="ROM / Cogs Notes" value={appointment.sagittal_plane_notes} field="sagittal_plane_notes" placeholder="Sagittal, Frontal, Transverse findings..." multiline />
            </div>
          </div>

          <SubHeader>Global Neurological Assessments</SubHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DocInput label="Fakuda Step Test" value={appointment.fakuda_notes} field="fakuda_notes" placeholder="Rotation, drift, or instability..." multiline />
            <DocInput label="Sharpened Rhombergs" value={appointment.sharpened_rhombergs_notes} field="sharpened_rhombergs_notes" placeholder="Sway pattern, time held..." multiline />
            <DocInput label="Frontal Lobe" value={appointment.frontal_lobe_notes} field="frontal_lobe_notes" placeholder="Hand drill speed/coordination..." multiline />
            <DocInput label="Righting Reflexes" value={appointment.righting_reflex_notes} field="righting_reflex_notes" placeholder="Ocular vs Labyrinthine..." multiline />
          </div>
        </section>

        {/* E - EASE */}
        <section>
          <SectionHeader title="E — Ease the System" subtitle="SNS Down-Regulation" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="p-4 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest">Harmonic Rocking</h4>
                  <Checkbox className="border-black rounded-none" />
                </div>
                <DocInput label="Notes" value={appointment.harmonic_rocking_notes} field="harmonic_rocking_notes" placeholder="Client response..." />
              </div>
              <div className="p-4 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest">T1 Sympathetic Reset</h4>
                  <Checkbox className="border-black rounded-none" />
                </div>
                <DocInput label="Notes" value={appointment.t1_reset_notes} field="t1_reset_notes" placeholder="Side, Psoas response..." />
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-4 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest">Diaphragm Reset</h4>
                  <Checkbox className="border-black rounded-none" />
                </div>
                <DocInput label="Notes" value={appointment.diaphragm_reset_notes} field="diaphragm_reset_notes" placeholder="Tender points, breath shift..." />
              </div>
              <div className="p-4 border border-black space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest">Vagus Nerve Process</h4>
                  <Checkbox className="border-black rounded-none" />
                </div>
                <DocInput label="Notes" value={appointment.vagus_nerve_notes} field="vagus_nerve_notes" placeholder="Branch, function, reset..." />
              </div>
            </div>
          </div>
        </section>

        {/* A - ALIGN */}
        <section>
          <SectionHeader title="A — Align the Hierarchy" subtitle="Neurological Findings & Patterns" />
          
          <div className="space-y-12">
            <div>
              <SubHeader>Primitive Reflexes</SubHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                {PRIMITIVE_REFLEXES.map(reflex => (
                  <div key={reflex.id} className="space-y-1">
                    <CheckItem category="primitiveReflexes" name={reflex.name} side="L" />
                    <CheckItem category="primitiveReflexes" name={reflex.name} side="R" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SubHeader>Cranial Nerves</SubHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                {CRANIAL_NERVES.map(nerve => {
                  const name = `${nerve.name}: ${nerve.latinName}`;
                  return (
                    <div key={nerve.id} className="space-y-1">
                      <CheckItem category="cranialNerves" name={name} side="L" />
                      <CheckItem category="cranialNerves" name={name} side="R" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SubHeader>Muscle Assessment</SubHeader>
              <div className="space-y-8">
                {Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => (
                  <div key={group} className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 border-l-2 border-slate-200 pl-2">{group}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
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
          <SectionHeader title="C — Correct" subtitle="Calibration & Integration" />
          <div className="space-y-6">
            <DocInput label="Modes & Balances Applied" value={appointment.modes_balances} field="modes_balances" placeholder="Document the specific corrections, brain zones, and logic used..." multiline />
            <DocInput label="Acupoints Used" value={appointment.acupoints} field="acupoints" placeholder="GV20, KI27, etc..." />
          </div>
        </section>

        {/* E - EMBED */}
        <section>
          <SectionHeader title="E — Embed" subtitle="Re-Assessment & Homework" />
          <div className="space-y-6">
            <DocInput label="Final Re-Assessment & Prescribed Homework" value={appointment.session_north_star} field="session_north_star" placeholder="Verify integration and define the client's daily practice..." multiline />
            <DocInput label="General Session Notes" value={appointment.notes} field="notes" placeholder="Any additional observations or context..." multiline />
          </div>
        </section>

        {/* Footer */}
        <div className="pt-20 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Fractal Resolution OS • Resonance Clinical Infrastructure</p>
        </div>
      </div>
    </div>
  );
};

export default SessionDocumentView;