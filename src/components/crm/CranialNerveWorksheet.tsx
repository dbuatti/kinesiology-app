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
    <div className="bg-white text-black p-2 max-w-[297mm] mx-auto font-sans print:p-0">
      {/* Header Section */}
      <div className="border-b-2 border-slate-900 pb-1 mb-2 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Cranial Nerve Worksheet</h1>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Clinical Assessment Log • Landscape Edition</p>
        </div>
        <div className="text-right flex gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client: ________________________</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date: ___/___/___</p>
        </div>
      </div>

      <div className="overflow-hidden border border-black rounded-none">
        <table className="w-full border-collapse text-[9px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[10%]">Nerve</th>
              <th className="p-1.5 text-center font-black uppercase border-r border-black w-[8%]">Inhib</th>
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[42%]">Stimulus Checks</th>
              <th className="p-1.5 text-left font-black uppercase w-[40%]">Clinical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {CRANIAL_NERVES.map((nerve) => (
              <tr key={nerve.id} className="break-inside-avoid">
                <td className="p-1.5 border-r border-black bg-slate-50/30">
                  <p className="font-black text-[10px] leading-none">{nerve.name}</p>
                  <p className="font-bold text-[7px] text-slate-500 uppercase mt-0.5">{nerve.latinName}</p>
                </td>
                
                <td className="p-1 border-r border-black">
                  <div className="flex justify-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-black rounded-none" />
                      <span className="font-black text-[8px]">L</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-black rounded-none" />
                      <span className="font-black text-[8px]">R</span>
                    </div>
                  </div>
                </td>

                <td className="p-1.5 border-r border-black align-top">
                  <div className="grid grid-cols-4 gap-x-2 gap-y-1.5">
                    {NERVE_CHECKS[nerve.id]?.map((check) => (
                      <div key={check} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 border border-black rounded-none shrink-0" />
                        <span className="text-[8px] font-bold text-slate-700 truncate">{check}</span>
                      </div>
                    ))}
                  </div>
                </td>

                <td className="p-1.5 align-top relative">
                  <div className="space-y-2">
                    <div className="h-px w-full bg-slate-100 mt-1" />
                    <div className="h-px w-full bg-slate-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-2 p-3 border border-black bg-slate-50 flex justify-between items-start gap-8">
        <div className="space-y-2 flex-1">
          <h4 className="font-black text-[9px] uppercase tracking-widest border-b border-black/10 pb-0.5">Priority Logic</h4>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border border-black" />
              <p className="text-[8px] font-bold uppercase">Afferent (Bottom-Up)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border border-black" />
              <p className="text-[8px] font-bold uppercase">Efferent (Top-Down)</p>
            </div>
          </div>
        </div>
        <div className="space-y-1 flex-[2]">
          <p className="text-[8px] font-black text-slate-400 uppercase">Primary Correction Applied:</p>
          <div className="h-px w-full bg-slate-300 mt-2" />
          <div className="h-px w-full bg-slate-300 mt-2" />
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-slate-200 text-center">
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Worksheet v1.7</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
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