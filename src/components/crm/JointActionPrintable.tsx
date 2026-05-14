"use client";

import React from 'react';
import { JOINT_ACTION_LIBRARY } from '@/data/joint-action-data';
import { cn } from '@/lib/utils';

const JointActionPrintable = () => {
  return (
    <div className="bg-white text-black p-2 max-w-[297mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-2 border-black pb-1 mb-1 flex justify-between items-end">
        <div className="space-y-0">
          <h1 className="text-xl font-serif font-bold tracking-tight uppercase leading-none">Joint Action Reference Table</h1>
          <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em]">Functional Neuro Health • Clinical Infrastructure • v1.5</p>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Geometry of Movement Map</p>
        </div>
      </div>

      {/* The Master Table */}
      <div className="overflow-hidden border border-black rounded-none">
        <table className="w-full border-collapse text-[7.5px] leading-[1.05]">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-1 text-left font-black uppercase border-r border-black w-[12%]">Joint</th>
              <th className="p-1 text-left font-black uppercase border-r border-black w-[29%] bg-blue-50/50">Sagittal Plane</th>
              <th className="p-1 text-left font-black uppercase border-r border-black w-[29%] bg-emerald-50/50">Frontal Plane</th>
              <th className="p-1 text-left font-black uppercase w-[30%] bg-orange-50/50">Transverse Plane</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {JOINT_ACTION_LIBRARY.map((joint) => (
              <tr key={joint.name} className="break-inside-avoid">
                <td className="p-1 border-r border-black bg-slate-50/30 align-middle">
                  <p className="font-black text-[8px] leading-none">{joint.name}</p>
                  <p className="font-bold text-[5.5px] text-slate-500 uppercase mt-0.5">{joint.type} • {joint.region}</p>
                </td>
                
                {/* Sagittal */}
                <td className="p-1 border-r border-black align-top space-y-0.5">
                  {joint.actions.Sagittal.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "hidden")}>
                      <span className="font-black uppercase text-[6.5px] text-blue-600">{a.label}</span>
                      <p className="text-slate-600 font-medium inline ml-1">{a.howTo}</p>
                    </div>
                  ))}
                </td>

                {/* Frontal */}
                <td className="p-1 border-r border-black align-top space-y-0.5">
                  {joint.actions.Frontal.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "hidden")}>
                      <span className="font-black uppercase text-[6.5px] text-emerald-600">{a.label}</span>
                      <p className="text-slate-600 font-medium inline ml-1">{a.howTo}</p>
                    </div>
                  ))}
                </td>

                {/* Transverse */}
                <td className="p-1 align-top space-y-0.5">
                  {joint.actions.Transverse.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "hidden")}>
                      <span className="font-black uppercase text-[6.5px] text-orange-600">{a.label}</span>
                      <p className="text-slate-600 font-medium inline ml-1">{a.howTo}</p>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Logic Footer */}
      <div className="mt-1 grid grid-cols-3 gap-2">
        <div className="p-1.5 border border-black bg-slate-50">
          <h4 className="text-[7px] font-black uppercase tracking-widest border-b border-black/10 pb-0.5 mb-0.5">Localization Hierarchy</h4>
          <p className="text-[6.5px] font-bold text-slate-600 leading-tight">
            1. Region • 2. Laterality • 3. Skeleton • 4. Specific Joint & Plane
          </p>
        </div>
        <div className="p-1.5 border border-black bg-slate-50">
          <h4 className="text-[7px] font-black uppercase tracking-widest border-b border-black/10 pb-0.5 mb-0.5">Correction Logic</h4>
          <p className="text-[6.5px] font-bold text-slate-600 leading-tight">
            <strong>Conscious:</strong> Contra S1 + Iso (60s). <strong>Unconscious:</strong> Ipsi GV16 + Stretch + Fork.
          </p>
        </div>
        <div className="p-1.5 border border-black bg-black text-white flex flex-col justify-center text-center">
          <p className="text-[8px] font-serif italic leading-tight">
            "Joints act, muscles and tissues react."
          </p>
        </div>
      </div>

      <div className="mt-1 pt-0.5 border-t border-slate-200 text-center">
        <p className="text-[6px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Confidential Practitioner Resource • Resonance Clinical Infrastructure
        </p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default JointActionPrintable;