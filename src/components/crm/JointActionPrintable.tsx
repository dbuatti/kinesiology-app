"use client";

import React from 'react';
import { JOINT_ACTION_LIBRARY } from '@/data/joint-action-data';
import { cn } from '@/lib/utils';

const JointActionPrintable = () => {
  return (
    <div className="bg-white text-black p-4 max-w-[297mm] mx-auto font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-end">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-serif font-bold tracking-tight uppercase leading-none">Joint Action Reference Table</h1>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Neuro Health • Clinical Infrastructure • v1.4</p>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Geometry of Movement Map</p>
        </div>
      </div>

      {/* The Master Table */}
      <div className="overflow-hidden border border-black rounded-none">
        <table className="w-full border-collapse text-[8px] leading-tight">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[12%]">Joint</th>
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[29%] bg-blue-50/50">Sagittal Plane</th>
              <th className="p-1.5 text-left font-black uppercase border-r border-black w-[29%] bg-emerald-50/50">Frontal Plane</th>
              <th className="p-1.5 text-left font-black uppercase w-[30%] bg-orange-50/50">Transverse Plane</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {JOINT_ACTION_LIBRARY.map((joint) => (
              <tr key={joint.name} className="break-inside-avoid">
                <td className="p-1.5 border-r border-black bg-slate-50/30 align-middle">
                  <p className="font-black text-[9px] leading-none">{joint.name}</p>
                  <p className="font-bold text-[6px] text-slate-500 uppercase mt-0.5">{joint.type} • {joint.region}</p>
                </td>
                
                {/* Sagittal */}
                <td className="p-1.5 border-r border-black align-top space-y-1">
                  {joint.actions.Sagittal.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "opacity-20")}>
                      <span className="font-black uppercase text-[7px] text-blue-600">{a.label}</span>
                      {a.label !== '-' && <p className="text-slate-600 font-medium leading-[1.1] mt-0.5">{a.howTo}</p>}
                    </div>
                  ))}
                </td>

                {/* Frontal */}
                <td className="p-1.5 border-r border-black align-top space-y-1">
                  {joint.actions.Frontal.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "opacity-20")}>
                      <span className="font-black uppercase text-[7px] text-emerald-600">{a.label}</span>
                      {a.label !== '-' && <p className="text-slate-600 font-medium leading-[1.1] mt-0.5">{a.howTo}</p>}
                    </div>
                  ))}
                </td>

                {/* Transverse */}
                <td className="p-1.5 align-top space-y-1">
                  {joint.actions.Transverse.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "opacity-20")}>
                      <span className="font-black uppercase text-[7px] text-orange-600">{a.label}</span>
                      {a.label !== '-' && <p className="text-slate-600 font-medium leading-[1.1] mt-0.5">{a.howTo}</p>}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Logic Footer */}
      <div className="mt-2 grid grid-cols-3 gap-4">
        <div className="p-2 border border-black bg-slate-50">
          <h4 className="text-[8px] font-black uppercase tracking-widest border-b border-black/10 pb-0.5 mb-1">Localization Hierarchy</h4>
          <p className="text-[7px] font-bold text-slate-600 leading-tight">
            1. Region (Upper/Lower) • 2. Laterality (L/R/Midline) <br/>
            3. Skeleton (Axial/Appendicular) • 4. Specific Joint & Plane
          </p>
        </div>
        <div className="p-2 border border-black bg-slate-50">
          <h4 className="text-[8px] font-black uppercase tracking-widest border-b border-black/10 pb-0.5 mb-1">Correction Logic</h4>
          <p className="text-[7px] font-bold text-slate-600 leading-tight">
            <strong>Conscious:</strong> Contralateral S1 + Isometric Hold (60s). <br/>
            <strong>Unconscious:</strong> Ipsilateral GV16 + Ligament Stretch + Tuning Fork.
          </p>
        </div>
        <div className="p-2 border border-black bg-black text-white flex flex-col justify-center text-center">
          <p className="text-[7px] font-black uppercase tracking-[0.2em] mb-0.5">Clinical Rule</p>
          <p className="text-[9px] font-serif italic leading-tight">
            "Joints act, muscles and tissues react."
          </p>
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-slate-200 text-center">
        <p className="text-[6px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Confidential Practitioner Resource • Resonance Clinical Infrastructure
        </p>
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
        }
      `}</style>
    </div>
  );
};

export default JointActionPrintable;