
import React, { useState } from 'react';
import { JOINT_ACTION_LIBRARY } from '@/data/joint-action-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Columns, Rows, Maximize2, Minimize2 } from 'lucide-react';

const JointActionPrintable = () => {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isCompact, setIsCompact] = useState(true);

  return (
    <div className={cn(
      "bg-white text-black p-4 mx-auto font-sans print:p-0 print:m-0 transition-all duration-500",
      orientation === 'landscape' ? "max-w-[297mm]" : "max-w-[210mm]"
    )}>
      {/* Print Controls - Hidden during print */}
      <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <Button 
              variant={orientation === 'landscape' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setOrientation('landscape')}
              className="rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
            >
              <Columns size={14} className="mr-2" /> Landscape
            </Button>
            <Button 
              variant={orientation === 'portrait' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setOrientation('portrait')}
              className="rounded-lg h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
            >
              <Rows size={14} className="mr-2" /> Portrait
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCompact(!isCompact)}
            className="rounded-xl h-9 px-4 font-bold text-[10px] uppercase tracking-widest border-slate-200 bg-white"
          >
            {isCompact ? <Maximize2 size={14} className="mr-2" /> : <Minimize2 size={14} className="mr-2" />}
            {isCompact ? "Normal Text" : "Compact Text"}
          </Button>
        </div>
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Current: {orientation.toUpperCase()} • {isCompact ? 'COMPACT' : 'NORMAL'}
        </p>
      </div>

      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-3 flex justify-between items-end">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-serif font-bold tracking-tight uppercase leading-none">Joint Action Reference Table</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Neuro Health • Clinical Infrastructure • v1.6</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Geometry of Movement Map</p>
        </div>
      </div>

      {/* The Master Table */}
      <div className="overflow-hidden border border-black rounded-none">
        <table className={cn(
          "w-full border-collapse transition-all",
          isCompact ? "text-[7.5px] leading-[1.05]" : "text-[9px] leading-tight"
        )}>
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
                    <div key={i} className={cn(a.label === '-' && "hidden")}>
                      <span className="font-black uppercase text-blue-600">{a.label}</span>
                      <p className="text-slate-600 font-medium inline ml-1">{a.howTo}</p>
                    </div>
                  ))}
                </td>

                {/* Frontal */}
                <td className="p-1.5 border-r border-black align-top space-y-1">
                  {joint.actions.Frontal.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "hidden")}>
                      <span className="font-black uppercase text-emerald-600">{a.label}</span>
                      <p className="text-slate-600 font-medium inline ml-1">{a.howTo}</p>
                    </div>
                  ))}
                </td>

                {/* Transverse */}
                <td className="p-1.5 align-top space-y-1">
                  {joint.actions.Transverse.map((a, i) => (
                    <div key={i} className={cn(a.label === '-' && "hidden")}>
                      <span className="font-black uppercase text-orange-600">{a.label}</span>
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
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div className="p-2 border border-black bg-slate-50">
          <h4 className="text-[8px] font-black uppercase tracking-widest border-b border-black/10 pb-0.5 mb-1">Localization Hierarchy</h4>
          <p className="text-[7px] font-bold text-slate-600 leading-tight">
            1. Region • 2. Laterality • 3. Skeleton • 4. Specific Joint & Plane
          </p>
        </div>
        <div className="p-2 border border-black bg-slate-50">
          <h4 className="text-[8px] font-black uppercase tracking-widest border-b border-black/10 pb-0.5 mb-1">Correction Logic</h4>
          <p className="text-[7px] font-bold text-slate-600 leading-tight">
            <strong>Conscious:</strong> Contra S1 + Iso (60s). <strong>Unconscious:</strong> Ipsi GV16 + Stretch + Fork.
          </p>
        </div>
        <div className="p-2 border border-black bg-black text-white flex flex-col justify-center text-center">
          <p className="text-[8px] font-serif italic leading-tight">
            "Joints act, muscles and tissues react."
          </p>
        </div>
      </div>

      <div className="mt-4 pt-1 border-t border-slate-200 text-center">
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Confidential Practitioner Resource • Resonance Clinical Infrastructure
        </p>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 5mm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default JointActionPrintable;