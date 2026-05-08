"use client";

import React from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { cn } from '@/lib/utils';

const NERVE_CHECKS: Record<number, string[]> = {
  1: ["L Nostril", "R Nostril"],
  2: ["Front L", "Front R", "Sup L", "Sup R", "Inf L", "Inf R", "Nasal L", "Nasal R", "Temp L", "Temp R"],
  3: ["Up L", "Up R", "Down L", "Down R", "Med L", "Med R"],
  4: ["D&I L", "D&I R"],
  5: ["V1 L", "V1 R", "V2 L", "V2 R", "V3 L", "V3 R", "Soft L", "Soft R"],
  6: ["Lat L", "Lat R"],
  7: ["Sq L", "Sq R", "Loud L", "Loud R"],
  8: ["Aud L", "Aud R", "V:U", "V:D", "V:RL", "V:RR", "V:TL", "V:TR"],
  9: ["Hum", "Swallow", "Taste"],
  10: ["Hum", "Swallow", "Aaah"],
  11: ["Shrug L", "Shrug R", "Rot L", "Rot R"],
  12: ["Out", "L", "R", "U", "D"]
};

const CranialNerveWorksheet = () => {
  return (
    <div className="bg-white text-black p-4 max-w-[297mm] mx-auto font-sans print:p-0">
      {/* Header Section */}
      <div className="border-b-4 border-slate-900 pb-3 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Cranial Nerve Worksheet</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Clinical Assessment Log • Landscape Edition</p>
        </div>
        <div className="text-right flex gap-12">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Client: ________________________________</p>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Date: ____ / ____ / ____</p>
        </div>
      </div>

      <div className="overflow-hidden border-2 border-black rounded-none">
        <table className="w-full border-collapse text-xs leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-black">
              <th className="p-3 text-left font-black uppercase border-r-2 border-black w-[12%]">Nerve</th>
              <th className="p-3 text-center font-black uppercase border-r-2 border-black w-[10%]">Inhib</th>
              <th className="p-3 text-left font-black uppercase border-r-2 border-black w-[38%]">Stimulus Checks</th>
              <th className="p-3 text-left font-black uppercase w-[40%]">Clinical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {CRANIAL_NERVES.map((nerve) => (
              <tr key={nerve.id} className="break-inside-avoid">
                <td className="p-4 border-r-2 border-black bg-slate-50/30">
                  <p className="font-black text-sm leading-none">{nerve.name}</p>
                  <p className="font-bold text-[10px] text-slate-500 uppercase mt-1">{nerve.latinName}</p>
                </td>
                
                <td className="p-2 border-r-2 border-black">
                  <div className="flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black rounded-none" />
                      <span className="font-black text-xs">L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black rounded-none" />
                      <span className="font-black text-xs">R</span>
                    </div>
                  </div>
                </td>

                <td className="p-4 border-r-2 border-black align-top">
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    {NERVE_CHECKS[nerve.id]?.map((check) => (
                      <div key={check} className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black rounded-none shrink-0" />
                        <span className="text-[10px] font-bold text-slate-700 truncate">{check}</span>
                      </div>
                    ))}
                  </div>
                </td>

                <td className="p-4 align-top relative">
                  <div className="space-y-4">
                    <div className="h-px w-full bg-slate-200 mt-2" />
                    <div className="h-px w-full bg-slate-200" />
                    <div className="h-px w-full bg-slate-200" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-6 p-6 border-2 border-black bg-slate-50 flex justify-between items-start gap-12">
        <div className="space-y-4 flex-1">
          <h4 className="font-black text-xs uppercase tracking-widest border-b-2 border-black/10 pb-1">Priority Logic</h4>
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-black" />
              <p className="text-xs font-bold uppercase">Afferent (Bottom-Up)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-black" />
              <p className="text-xs font-bold uppercase">Efferent (Top-Down)</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 flex-[2]">
          <p className="text-xs font-black text-slate-400 uppercase">Primary Correction Applied:</p>
          <div className="h-px w-full bg-slate-300 mt-4" />
          <div className="h-px w-full bg-slate-300 mt-4" />
        </div>
      </div>

      <div className="mt-6 pt-2 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Worksheet v1.6</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
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