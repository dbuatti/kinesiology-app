"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Hand, Info } from 'lucide-react';

const PulsePointReference = ({ organ }: { organ?: string }) => {
  const points = [
    { side: 'Left', pos: 'Distal (Cun)', light: 'Small Intestine', deep: 'Heart' },
    { side: 'Left', pos: 'Middle (Guan)', light: 'Gallbladder', deep: 'Liver' },
    { side: 'Left', pos: 'Proximal (Chi)', light: 'Bladder', deep: 'Kidney' },
    { side: 'Right', pos: 'Distal (Cun)', light: 'Large Intestine', deep: 'Lung' },
    { side: 'Right', pos: 'Middle (Guan)', light: 'Stomach', deep: 'Spleen' },
    { side: 'Right', pos: 'Proximal (Chi)', light: 'Triple Warmer', deep: 'Pericardium' },
  ];

  const activePoint = points.find(p => 
    p.light.toLowerCase() === organ?.toLowerCase() || 
    p.deep.toLowerCase() === organ?.toLowerCase()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <Hand size={14} className="text-indigo-500" /> Pulse Point Locator
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {['Left', 'Right'].map(side => (
          <div key={side} className="space-y-2">
            <p className="text-[9px] font-black text-center uppercase text-slate-500">{side} Wrist</p>
            <div className="space-y-1">
              {points.filter(p => p.side === side).map((p, i) => {
                const isMatch = p.light === organ || p.deep === organ;
                const isDeep = p.deep === organ;
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "p-2 rounded-lg border text-[8px] font-bold transition-all",
                      isMatch ? "bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105 z-10" : "bg-slate-50 border-slate-100 text-slate-400"
                    )}
                  >
                    <div className="flex justify-between mb-1">
                      <span>{p.pos}</span>
                      {isMatch && <span className="animate-pulse">●</span>}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(isMatch && !isDeep ? "text-white" : "")}>Light: {p.light}</span>
                      <span className={cn(isMatch && isDeep ? "text-white" : "")}>Deep: {p.deep}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {activePoint && (
        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
          <Info size={14} className="text-indigo-600 mt-0.5" />
          <p className="text-[10px] text-indigo-900 font-medium leading-relaxed">
            Hold the <strong>{activePoint.side} Wrist</strong> at the <strong>{activePoint.pos}</strong> position with <strong>{activePoint.deep === organ ? 'Deep' : 'Light'}</strong> pressure.
          </p>
        </div>
      )}
    </div>
  );
};

export default PulsePointReference;