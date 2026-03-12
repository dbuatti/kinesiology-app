"use client";

import React from 'react';
import { format } from 'date-fns';
import { Activity, Zap, Heart, Brain, Target, ClipboardList, Wind, Droplets } from 'lucide-react';

interface SessionWorksheetTemplateProps {
  clientName: string;
  date: Date;
}

const SessionWorksheetTemplate = ({ clientName, date }: SessionWorksheetTemplateProps) => {
  const Section = ({ title, icon: Icon, height = "100px" }: any) => (
    <div className="border-2 border-slate-200 rounded-2xl overflow-hidden mb-6 break-inside-avoid">
      <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
        <Icon size={16} className="text-slate-400" />
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">{title}</h3>
      </div>
      <div style={{ height }} className="p-4" />
    </div>
  );

  return (
    <div className="hidden print:block p-8 bg-white text-slate-900 font-sans">
      <div className="flex justify-between items-end border-b-4 border-indigo-600 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black">Session Worksheet</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Antigravity Kinesiology Practice</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-lg font-black text-indigo-600">{clientName}</p>
          <p className="text-sm font-bold text-slate-400">{format(date, "EEEE, MMMM d, yyyy")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Section title="Session Goal" icon={Target} height="80px" />
        <Section title="Main Concern / Issue" icon={ClipboardList} height="80px" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-slate-100 rounded-xl p-3 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">BOLT Score</p>
          <div className="h-10 border-b border-slate-200 mx-4" />
        </div>
        <div className="border-2 border-slate-100 rounded-xl p-3 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Coherence (HR/BR)</p>
          <div className="h-10 border-b border-slate-200 mx-4" />
        </div>
        <div className="border-2 border-slate-100 rounded-xl p-3 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Hydration</p>
          <div className="flex justify-center gap-4 mt-2">
            <div className="w-4 h-4 border-2 border-slate-300 rounded" /> <span className="text-[10px] font-bold">Pass</span>
            <div className="w-4 h-4 border-2 border-slate-300 rounded" /> <span className="text-[10px] font-bold">Fail</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Section title="SNS Reset (Harmonic, T1, Diaphragm, Vagus)" icon={Zap} height="120px" />
        <Section title="Pathway Findings (Reflexes, Cranials, Muscles)" icon={Activity} height="250px" />
        <Section title="Corrections & Integration (Logic Used)" icon={Brain} height="150px" />
        <Section title="Emotional Context / Luscher" icon={Heart} height="100px" />
        <Section title="Re-Assessment & Homework" icon={Wind} height="120px" />
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Fractal Resolution • Antigravity CRM</p>
      </div>
    </div>
  );
};

export default SessionWorksheetTemplate;