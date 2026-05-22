"use client";

import React from 'react';
import { Check, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckItemProps {
  category: string;
  name: string;
  side?: 'L' | 'R';
  pattern: any;
  onToggle: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
}

const CheckItem = ({ category, name, side, pattern, onToggle }: CheckItemProps) => {
  const fullName = side ? `${name} (${side})` : name;
  const rawStatus = pattern[category]?.[fullName];

  const isMuscle = category === 'muscles';

  // Normalize status
  const status = isMuscle
    ? (rawStatus === 'Inhibition' || rawStatus === 'Inhibited' ? 'Inhibited' : rawStatus === 'Hypertonic' ? 'Hypertonic' : 'Clear')
    : (rawStatus === 'Inhibited' ? 'Inhibited' : 'Clear');

  const handleCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus = 'Clear';

    if (isMuscle) {
      if (status === 'Clear') nextStatus = 'Inhibited';
      else if (status === 'Inhibited') nextStatus = 'Hypertonic';
      else nextStatus = 'Clear';
    } else {
      nextStatus = status === 'Clear' ? 'Inhibited' : 'Clear';
    }

    onToggle(category, name, nextStatus, side);
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-1.5 transition-all cursor-pointer group border border-transparent rounded-md",
        status === 'Inhibited' ? "bg-rose-50 text-rose-900" :
        status === 'Hypertonic' ? "bg-amber-50 text-amber-900" :
        "hover:bg-slate-50 text-slate-600"
      )}
      onClick={handleCycle}
    >
      {/* Tri-state Indicator Box */}
      <div className={cn(
        "w-4 h-4 border flex items-center justify-center transition-all shrink-0 rounded-sm",
        status === 'Inhibited' ? "bg-rose-600 border-rose-600 text-white" :
        status === 'Hypertonic' ? "bg-amber-500 border-amber-500 text-white" :
        "border-slate-300 group-hover:border-black bg-white"
      )}>
        {status === 'Inhibited' && <ArrowDown size={10} strokeWidth={4} />}
        {status === 'Hypertonic' && <ArrowUp size={10} strokeWidth={4} />}
      </div>

      <span className={cn(
        "text-[10px] font-bold truncate",
        status === 'Inhibited' ? "text-rose-900" :
        status === 'Hypertonic' ? "text-amber-900" :
        "text-slate-600"
      )}>
        {side ? `${side}: ${name}` : name}
      </span>
    </div>
  );
};

export default CheckItem;