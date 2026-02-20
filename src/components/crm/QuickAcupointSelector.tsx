"use client";

import React from 'react';
import { ACUPOINTS } from '@/data/acupoint-data';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAcupointSelectorProps {
  currentValue: string | null | undefined;
  onSelect: (newValue: string) => void;
}

const COMMON_POINTS = ["GV20", "KI27", "CV17", "LI4", "PC6", "ST36", "LV3", "SP6", "HT7", "LU1"];

const QuickAcupointSelector = ({ currentValue, onSelect }: QuickAcupointSelectorProps) => {
  const handleAddPoint = (code: string) => {
    const current = currentValue || "";
    if (current.includes(code)) return;
    
    const newValue = current 
      ? `${current.trim()}, ${code}`
      : code;
    
    onSelect(newValue);
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-500">
      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
        <Sparkles size={10} className="text-amber-400" /> Quick Add Points
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_POINTS.map(code => {
          const isUsed = currentValue?.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleAddPoint(code)}
              disabled={isUsed}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1",
                isUsed 
                  ? "bg-emerald-500/20 text-emerald-400 cursor-default" 
                  : "bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white border border-white/5"
              )}
            >
              {!isUsed && <Plus size={10} />}
              {code}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAcupointSelector;