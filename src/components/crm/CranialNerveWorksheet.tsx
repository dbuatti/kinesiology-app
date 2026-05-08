"use client";

import React from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { cn } from '@/lib/utils';

const NERVE_CHECKS: Record<number, string[]> = {
  1: ["Left Nostril", "Right Nostril"],
  2: ["Superior", "Inferior", "Nasal", "Temporal"],
  3: ["Up", "Down", "Medial"],
  4: ["Down & In"],
  5: ["V1 (Forehead)", "V2 (Cheek)", "V3 (Jaw)"],
  6: ["Lateral Left", "Lateral Right"],
  7: ["Facial Motor", "Taste (Ant 2/3)"],
  8: ["Auditory", "Vestibular: Up/Dn", "Vestibular: Rot", "Vestibular: Tilt"],
  9: ["Taste (Post 1/3)", "Swallowing", "Humming"],
  10: ["Humming", "Swallowing", "Aaah"],
  11: ["Shrug (Traps)", "Rotation (SCM)"],
  12: ["Out", "Left / Right", "Up / Down"]
};

const CranialNerveWorksheet = () => {
  return (
    <div className="bg-white text-black p-0 sm:p-4 max-w-[210mm] mx-auto font-sans print:p-0">
      <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Cranial Nerve Worksheet</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Clinical Assessment & Manual Log</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client: ___________________________</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date: ____ / ____ / ____</p>
        </div>
      </div>

      <div className="overflow-hidden border-2 border-black rounded-sm">
        <table className="w-full border-collapse text-[10px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-black">
              <th className="p-3 text-left font-black uppercase border-r-2 border-black w-[15%]">Nerve / Nuclei</th>
              <th className="p-3 text-center font-black uppercase border-r-2 border-black w-[10%]">Inhib</th>
              <th className="p-3 text-left font-black uppercase border-r-2 border-black w-[35%]">Specific Stimulus Checks</th>
              <th className="p-3 text-left font-black uppercase w-[40%]">Clinical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {CRANIAL_NERVES.map((nerve) => (
              <tr key={nerve.id} className="break-inside-avoid h-24">
                <td className="p-3 border-r-2 border-black bg-slate-50/50">
                  <p className="font-black text-sm">{nerve.name}</p>
                  <p className="font-bold text-[8px] text-slate-500 uppercase">{nerve.latinName}</p>
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-[7px] uppercase tracking-tighter">Nuclei: {nerve.nuclei}</p>
                    <p className={cn(
                      "font-black text-[7px] uppercase tracking-tighter",
                      nerve.toneEffect === 'Flexors' ? "text-blue-700" : 
                      nerve.toneEffect === 'Extensors' ? "text-rose-700" : "text-slate-400"
                    )}>Tone: {nerve.toneEffect}</p>
                  </div>
                </td>
                
                <td className="p-3 border-r-2 border-black">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black rounded-sm" />
                      <span className="font-black text-[9px]">L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black rounded-sm" />
                      <span className="font-black text-[9px]">R</span>
                    </div>
                  </div>
                </td>

                <td className="p-3 border-r-2 border-black align-top">
                  <p className="font-bold text-[8px] text-slate-400 uppercase mb-2">Reflex: {nerve.reflexPoint}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    {NERVE_CHECKS[nerve.id]?.map((check) => (
                      <div key={check} className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-black rounded-sm shrink-0" />
                        <span className="text-[8px] font-bold text-slate-700 truncate">{check}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <p className="text-[7px] italic text-slate-400 leading-tight">
                      {nerve.stimulus}
                    </p>
                  </div>
                </td>

                <td className="p-3 align-top relative">
                  <div className="space-y-3">
                    <div className="h-px w-full bg-slate-200 mt-4" />
                    <div className="h-px w-full bg-slate-200" />
                    <div className="h-px w-full bg-slate-200" />
                    <div className="h-px w-full bg-slate-200" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 border-2 border-black rounded-sm bg-slate-50">
        <h4 className="font-black text-xs uppercase tracking-widest mb-4 border-b border-black pb-2">Post-Assessment Integration</h4>
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-black rounded-sm" />
              <p className="text-[10px] font-bold uppercase">Afferent Priority (Bottom-Up)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-black rounded-sm" />
              <p className="text-[10px] font-bold uppercase">Efferent Priority (Top-Down)</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase">Primary Correction Applied:</p>
            <div className="h-px w-full bg-slate-300 mt-4" />
            <div className="h-px w-full bg-slate-300 mt-4" />
          </div>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-slate-200 text-center">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Worksheet v1.1</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CranialNerveWorksheet;