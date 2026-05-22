"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckItemProps {
  category: string;
  name: string;
  side?: 'L' | 'R';
  pattern: any;
  onToggle: (category: string, name: string, isChecked: boolean, side?: 'L' | 'R') => void;
}

const CheckItem = ({ category, name, side, pattern, onToggle }: CheckItemProps) => {
  const fullName = side ? `${name} (${side})` : name;
  const isChecked = pattern[category]?.[fullName] === 'Inhibited';

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-1.5 transition-all cursor-pointer group border border-transparent",
        isChecked ? "bg-slate-900 text-white" : "hover:bg-slate-50"
      )}
      onClick={() => onToggle(category, name, isChecked, side)}
    >
      <div className={cn(
        "w-3.5 h-3.5 border flex items-center justify-center transition-all shrink-0",
        isChecked ? "bg-white border-white text-black" : "border-slate-300 group-hover:border-black"
      )}>
        {isChecked && <Check size={10} strokeWidth={4} />}
      </div>
      <span className={cn(
        "text-[10px] font-bold truncate",
        isChecked ? "text-white" : "text-slate-600"
      )}>
        {side ? `${side}: ${name}` : name}
      </span>
    </div>
  );
};

export default CheckItem;