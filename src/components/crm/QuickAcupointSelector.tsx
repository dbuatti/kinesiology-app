"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
        Quick Add Points
      </div>
      <div className="flex flex-wrap gap-0 border border-border">
        {COMMON_POINTS.map(code => {
          const isUsed = currentValue?.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleAddPoint(code)}
              disabled={isUsed}
              className={cn(
                "px-3 py-2 border-r border-b border-border last:border-r-0 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2",
                isUsed 
                  ? "bg-success/10 text-success cursor-default" 
                  : "bg-background hover:bg-muted text-muted-foreground hover:text-primary"
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