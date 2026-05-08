"use client";

import React from 'react';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { cn } from '@/lib/utils';

const CranialNervePrintable = () => {
  return (
    <div className="bg-white text-black p-0 sm:p-4 max-w-[210mm] mx-auto font-sans print:p-0">
      <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Cranial Nerve Reference</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Functional Neuro Health • Clinical Protocol</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fractal Resolution OS</p>
        </div>
      </div>

      <div className="overflow-hidden border border-black rounded-sm">
        <table className="w-full border-collapse text-[10px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-2 text-left font-black uppercase border-r border-black w-[8%]">ID</th>
              <th className="p-2 text-left font-black uppercase border-r border-black w-[15%]">Name</th>
              <th className="p-2 text-left font-black uppercase border-r border-black w-[10%]">Nuclei</th>
              <th className="p-2 text-left font-black uppercase border-r border-black w-[10%]">Tone</th>
              <th className="p-2 text-left font-black uppercase border-r border-black w-[25%]">Reflex Point (Touch)</th>
              <th className="p-2 text-left font-black uppercase w-[32%]">Stimulus (Action)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {CRANIAL_NERVES.map((nerve) => (
              <tr key={nerve.id} className="hover:bg-slate-50 transition-colors break-inside-avoid">
                <td className="p-2 font-black border-r border-black bg-slate-50/50">{nerve.name}</td>
                <td className="p-2 border-r border-black">
                  <p className="font-bold">{nerve.latinName}</p>
                </td>
                <td className="p-2 border-r border-black font-medium">{nerve.nuclei}</td>
                <td className={cn(
                  "p-2 border-r border-black font-bold",
                  nerve.toneEffect === 'Flexors' ? "text-blue-700" : 
                  nerve.toneEffect === 'Extensors' ? "text-rose-700" : "text-slate-400"
                )}>
                  {nerve.toneEffect}
                </td>
                <td className="p-2 border-r border-black leading-snug">
                  {nerve.reflexPoint}
                </td>
                <td className="p-2 leading-snug italic">
                  {nerve.stimulus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="p-4 border border-black rounded-sm space-y-2">
          <h4 className="font-black text-[9px] uppercase tracking-widest border-b border-black pb-1">Brainstem Logic</h4>
          <ul className="text-[9px] space-y-1 font-medium">
            <li>• <span className="font-bold">Midbrain:</span> Flexors (CN 3-4)</li>
            <li>• <span className="font-bold">Pons:</span> Extensors (CN 5-8)</li>
            <li>• <span className="font-bold">Medulla:</span> Flexors (CN 9-12)</li>
          </ul>
        </div>
        <div className="p-4 border border-black rounded-sm space-y-2">
          <h4 className="font-black text-[9px] uppercase tracking-widest border-b border-black pb-1">Lateralization</h4>
          <ul className="text-[9px] space-y-1 font-medium">
            <li>• <span className="font-bold">Cortical:</span> Contralateral (Opposite)</li>
            <li>• <span className="font-bold">Subcortical:</span> Ipsilateral (Same Side)</li>
            <li>• <span className="font-bold">CN II:</span> Contralateral Logic</li>
          </ul>
        </div>
        <div className="p-4 border border-black rounded-sm space-y-2">
          <h4 className="font-black text-[9px] uppercase tracking-widest border-b border-black pb-1">Clinical Rule</h4>
          <p className="text-[9px] leading-relaxed italic">
            "If a CN reflex point test produces an Indicator Response, determine direction: Afferent (Bottom-Up) or Efferent (Top-Down). No response = pathway normal."
          </p>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-slate-200 text-center">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Resonance Clinical Infrastructure • Confidential</p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
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

export default CranialNervePrintable;