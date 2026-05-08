"use client";

import React from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { cn } from '@/lib/utils';

const NERVE_CHECKS: Record<number, string[]> = {
  1: ["L Nostril", "R Nostril"],
  2: ["Sup", "Inf", "Nasal", "Temp"],
  3: ["Up", "Down", "Medial"],
  4: ["Down & In"],
  5: ["V1", "V2", "V3"],
  6: ["Lat L", "Lat R"],
  7: ["Motor", "Taste"],
  8: ["Aud", "V: U/D", "V: Rot", "V: Tilt"],
  9: ["Taste", "Swallow", "Hum"],
  10: ["Hum", "Swallow", "Aaah"],
  11: ["Shrug", "Rotate"],
  12: ["Out", "L / R", "U / D"]
};

const CranialNerveWorksheet = () => {
  return (
    <div className="bg-white text-black p-0 sm:p-2 max-w-[210mm] mx-auto font-sans print:p-0">
      <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Cranial Nerve Worksheet</h1>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Clinical Assessment & Manual Log</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Client: ___________________________</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date: ____ / ____ / ____</p>
        </div>
      </div>

      <div className="overflow-hidden border border-black rounded-sm">
        <table className="w-full border-collapse text-[9px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[12%]">Nerve</th>
              <th className="p-1.5 text-center font-black uppercase border-r border-black w-[8%]">Inhib</th>
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[35%]">Stimulus Checks</th>
              <th className="p-1.5 text-left font-black uppercase w-[45%]">Clinical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {CRANIAL_NERVES.map((nerve) => (
              <tr key={nerve.id} className="break-inside-avoid h-[58px]">
                <td className="p-1.5 border-r border-black bg-slate-50/50">
                  <p className="font-black text-xs leading-none">{nerve.name}</p>
                  <p className="font-bold text-[7px] text-slate-500 uppercase mt-0.5">{nerve.latinName}</p>
                  <p className="font-bold text-[6px] uppercase tracking-tighter mt-1 opacity-60">{nerve.nuclei}</p>
                </td>
                
                <td className="p-1 border-r border-black">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 border border-black rounded-sm" />
                      <span className="font-black text-[7px]">L</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 border border-black rounded-sm" />
                      <span className="font-black text-[7px]">R</span>
                    </div>
                  </div>
                </td>

                <td className="p-1.5 border-r border-black align-top">
                  <div className="grid grid-cols-2 gap-x-1 gap-y-1">
                    {NERVE_CHECKS[nerve.id]?.map((check) => (
                      <div key={check} className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-black rounded-sm shrink-0" />
                        <span className="text-[7px] font-bold text-slate-700 truncate">{check}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[6px] italic text-slate-400 leading-tight line-clamp-1">
                    {nerve.stimulus}
                  </p>
                </td>

                <td className="p-1.5 align-top relative">
                  <div className="space-y-2.5">
                    <div className="h-px w-full bg-slate-100 mt-2" />
                    <div className="h-px w-full bg-slate-100" />
                    <div className="h-px w-full bg-slate-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 border border-black rounded-sm bg-slate-50">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="font-black text-[9px] uppercase tracking-widest border-b border-black/20 pb-1">Priority</h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-black rounded-sm" />
                <p className="text-[8px] font-bold uppercase">Afferent (Bottom-Up)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-black rounded-sm" />
                <p className="text-[8px] font-bold uppercase">Efferent (Top-Down)</p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[8px] font-black text-slate-400 uppercase">Primary Correction Applied:</p>
            <div className="h-px w-full bg-slate-300 mt-3" />
            <div className="h-px w-full bg-slate-300 mt-3" />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-slate-200 text-center">
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Worksheet v1.2</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 5mm;
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