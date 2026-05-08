"use client";

import React from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { cn } from '@/lib/utils';

const CranialNerveWorksheet = () => {
  return (
    <div className="bg-white text-black p-0 sm:p-4 max-w-[210mm] mx-auto font-sans print:p-0">
      <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Cranial Nerve Worksheet</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Clinical Assessment & Log • FNH Protocol</p>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase">
            <span>Client:</span>
            <div className="w-40 border-b border-black h-4" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase">
            <span>Date:</span>
            <div className="w-40 border-b border-black h-4" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-black rounded-sm">
        <table className="w-full border-collapse text-[9px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-2 text-left font-black uppercase border-r border-black w-[15%]">Nerve</th>
              <th className="p-2 text-left font-black uppercase border-r border-black w-[35%]">Stimulus / Sub-Tests</th>
              <th className="p-2 text-center font-black uppercase border-r border-black w-[10%]">Inhib L/R</th>
              <th className="p-2 text-left font-black uppercase w-[40%]">Clinical Findings / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {CRANIAL_NERVES.map((nerve) => (
              <tr key={nerve.id} className="break-inside-avoid min-h-[60px]">
                <td className="p-2 border-r border-black bg-slate-50/50 align-top">
                  <p className="font-black text-xs">{nerve.name}</p>
                  <p className="font-bold text-[8px] text-slate-500">{nerve.latinName}</p>
                  <p className="mt-2 text-[7px] font-black uppercase opacity-40">{nerve.nuclei}</p>
                </td>
                <td className="p-2 border-r border-black align-top">
                  <p className="font-bold mb-2">{nerve.stimulus}</p>
                  {nerve.subStims && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {nerve.subStims.map(sub => (
                        <div key={sub} className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-black rounded-sm shrink-0" />
                          <span className="font-medium">{sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-2 border-r border-black align-top">
                  <div className="flex flex-col items-center gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black rounded-sm" />
                      <span className="font-black">L</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black rounded-sm" />
                      <span className="font-black">R</span>
                    </div>
                  </div>
                </td>
                <td className="p-2 align-top relative">
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
                    backgroundImage: 'linear-gradient(to bottom, transparent 19px, black 19px)',
                    backgroundSize: '100% 20px'
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="p-4 border border-black rounded-sm space-y-3">
          <h4 className="font-black text-[10px] uppercase tracking-widest border-b border-black pb-1">Assessment Logic</h4>
          <div className="grid grid-cols-2 gap-4 text-[9px] font-medium">
            <div className="space-y-1">
              <p>• <span className="font-bold">Pons:</span> Extensors (CN 5-8)</p>
              <p>• <span className="font-bold">Medulla:</span> Flexors (CN 9-12)</p>
              <p>• <span className="font-bold">Midbrain:</span> Flexors (CN 3-4)</p>
            </div>
            <div className="space-y-1">
              <p>• <span className="font-bold">Cortical:</span> Contralateral</p>
              <p>• <span className="font-bold">Subcortical:</span> Ipsilateral</p>
              <p>• <span className="font-bold">CN II:</span> Contralateral</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-black rounded-sm space-y-2">
          <h4 className="font-black text-[10px] uppercase tracking-widest border-b border-black pb-1">Next Steps</h4>
          <p className="text-[9px] leading-relaxed italic">
            "If an Indicator Response is found, determine direction: **Afferent** (Bottom-Up) or **Efferent** (Top-Down). Use the Calibration Wizard to resolve the priority layer."
          </p>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-slate-200 text-center">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Worksheet • Confidential</p>
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
        }
      `}</style>
    </div>
  );
};

export default CranialNerveWorksheet;