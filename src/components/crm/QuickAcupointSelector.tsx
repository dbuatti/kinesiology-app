"use client";

import React from 'react';
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
    const newValue = current ? `${current.trim()}, ${code}` : code;
    onSelect(newValue);
  };

  return (
    <div className="grid grid-cols-5 gap-1">
      {COMMON_POINTS.map(code => {
        const isUsed = currentValue?.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => handleAddPoint(code)}
            disabled={isUsed}
            className={cn(
              "h-7 flex items-center justify-center text-[9px] font-black transition-all border",
              isUsed 
                ? "bg-emerald-500 text-white border-emerald-500" 
                : "bg-slate-50 border-slate-100 text-slate-400 hover:border-primary hover:text-primary"
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
};

export default QuickAcupointSelector;