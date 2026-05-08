"use client";

import React from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { cn } from '@/lib/utils';

interface NerveCheckGroup {
  left?: string[];
  right?: string[];
  midline?: string[];
}

const NERVE_CHECKS: Record<number, NerveCheckGroup> = {
  1: { left: ["Nostril"], right: ["Nostril"] },
  2: { 
    left: ["Front", "Sup", "Inf", "Nasal", "Temp"], 
    right: ["Front", "Sup", "Inf", "Nasal", "Temp"] 
  },
  3: { 
    left: ["Up", "Down", "Med"], 
    right: ["Up", "Down", "Med"] 
  },
  4: { left: ["D&I"], right: ["D&I"] },
  5: { 
    left: ["V1", "V2", "V3", "Soft"], 
    right: ["V1", "V2", "V3", "Soft"] 
  },
  6: { left: ["Lat"], right: ["Lat"] },
  7: { 
    left: ["Sq", "Loud"], 
    right: ["Sq", "Loud"] 
  },
  8: { 
    left: ["Aud"], 
    right: ["Aud"],
    midline: ["V:U", "V:D", "V:RL", "V:RR", "V:TL", "V:TR"]
  },
  9: { midline: ["Hum", "Swallow", "Taste"] },
  10: { midline: ["Hum", "Swallow", "Aaah"] },
  11: { 
    left: ["Shrug", "Rot"], 
    right: ["Shrug", "Rot"] 
  },
  12: { midline: ["Out", "L", "R", "U", "D"] }
};

const CranialNerveWorksheet = () => {
  return (
    <div className="bg-white text-black w-full max-w-[297mm] mx-auto font-sans print:p-0 overflow-hidden">
      {/* Header Section */}
      <div className="border-b-2 border-slate-900 pb-1 mb-1 flex justify-between items-end px-2">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Cranial Nerve Worksheet</h1>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Clinical Assessment Log • Landscape Edition</p>
        </div>
        <div className="text-right flex gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client: ________________________</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date: ___/___/___</p>
        </div>
      </div>

      <div className="overflow-hidden border border-black rounded-none mx-2">
        <table className="w-full border-collapse text-[9px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-1 text-left font-black uppercase border-r border-black w-[10%]">Nerve</th>
              <th className="p-1 text-center font-black uppercase border-r border-black w-[6%]">Inhib</th>
              <th className="p-1 text-left font-black uppercase border-r border-black w-[44%]">Stimulus Checks (L / R)</th>
              <th className="p-1 text-left font-black uppercase w-[40%]">Clinical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {CRANIAL_NERVES.map((nerve) => {
              const checks = NERVE_CHECKS[nerve.id];
              const isLateralized = !!(checks?.left || checks?.right);

              return (
                <tr key={nerve.id} className="break-inside-avoid">
                  <td className="p-1 border-r border-black bg-slate-50/30">
                    <p className="font-black text-[10px] leading-none">{nerve.name}</p>
                    <p className="font-bold text-[7px] text-slate-500 uppercase mt-0.5">{nerve.latinName}</p>
                  </td>
                  
                  <td className="p-0.5 border-r border-black">
                    <div className="flex justify-center gap-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-3 h-3 border border-black rounded-none" />
                        <span className="font-black text-[6px]">L</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-3 h-3 border border-black rounded-none" />
                        <span className="font-black text-[6px]">R</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-1 border-r border-black align-top">
                    <div className="flex gap-3 h-full">
                      {isLateralized ? (
                        <>
                          <div className="flex-1 space-y-1 border-r border-slate-100 pr-1">
                            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                              {checks.left?.map((check) => (
                                <div key={check} className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 border border-black rounded-none shrink-0" />
                                  <span className="text-[8px] font-bold text-slate-700 truncate">L: {check}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1 pl-1">
                            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                              {checks.right?.map((check) => (
                                <div key={check} className="flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 border border-black rounded-none shrink-0" />
                                  <span className="text-[8px] font-bold text-slate-700 truncate">R: {check}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full">
                          <div className="grid grid-cols-4 gap-x-1 gap-y-0.5">
                            {checks?.midline?.map((check) => (
                              <div key={check} className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 border border-black rounded-none shrink-0" />
                                <span className="text-[8px] font-bold text-slate-700 truncate">{check}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-1 align-top relative">
                    <div className="space-y-2">
                      <div className="h-px w-full bg-slate-100 mt-1" />
                      <div className="h-px w-full bg-slate-100" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-1 p-2 border border-black bg-slate-50 flex justify-between items-start gap-6 mx-2">
        <div className="space-y-1 flex-1">
          <h4 className="font-black text-[8px] uppercase tracking-widest border-b border-black/10 pb-0.5">Priority Logic</h4>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border border-black" />
              <p className="text-[8px] font-bold uppercase">Afferent</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border border-black" />
              <p className="text-[8px] font-bold uppercase">Efferent</p>
            </div>
          </div>
        </div>
        <div className="space-y-0.5 flex-[2]">
          <p className="text-[8px] font-black text-slate-400 uppercase">Primary Correction Applied:</p>
          <div className="h-px w-full bg-slate-300 mt-2" />
        </div>
      </div>

      <div className="mt-1 pt-0.5 border-t border-slate-200 text-center">
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Worksheet v1.9</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 3mm;
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