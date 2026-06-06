
import React from 'react';
import { Check, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CheckItemProps {
  category: string;
  name: string;
  side?: 'L' | 'R';
  pattern: any;
  onToggle: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
}

const CheckItem = ({ category, name, side, pattern, onToggle }: CheckItemProps) => {
  const fullName = side ? `${name} (${side})` : name;
  let rawStatus = pattern[category]?.[fullName];

  // Fallback to non-lateralized status if lateralized is not found
  if (!rawStatus && side && pattern[category]?.[name]) {
    rawStatus = pattern[category]?.[name];
  }

  const isMuscle = category === 'muscles';

  // Normalize status and check if cleared
  const isCleared = rawStatus?.endsWith('_Cleared') || rawStatus === 'Normotonic_Cleared';
  const baseStatus = rawStatus?.replace('_Cleared', '') || 'Clear';

  const status = isMuscle
    ? (baseStatus === 'Inhibition' || baseStatus === 'Inhibited' ? 'Inhibited' : baseStatus === 'Hypertonic' ? 'Hypertonic' : 'Clear')
    : (baseStatus === 'Inhibited' ? 'Inhibited' : 'Clear');

  const handleCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus = 'Clear';

    if (isMuscle) {
      if (status === 'Clear') nextStatus = 'Inhibited';
      else if (status === 'Inhibited' && !isCleared) nextStatus = 'Hypertonic';
      else nextStatus = 'Clear';
    } else {
      nextStatus = (status === 'Clear' || isCleared) ? 'Inhibited' : 'Clear';
    }

    onToggle(category, name, nextStatus, side);
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-1.5 transition-all cursor-pointer group border rounded-md",
        status === 'Inhibited' 
          ? isCleared 
            ? "bg-emerald-50/30 border-emerald-200 text-slate-700" 
            : "bg-rose-50 border-rose-200 text-rose-900"
          : status === 'Hypertonic'
            ? isCleared
              ? "bg-emerald-50/30 border-emerald-200 text-slate-700"
              : "bg-amber-50 border-amber-200 text-amber-900"
            : "hover:bg-slate-50 border-transparent text-slate-600"
      )}
      onClick={handleCycle}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Tri-state Indicator Box */}
        <div className={cn(
          "w-4 h-4 border flex items-center justify-center transition-all shrink-0 rounded-sm",
          status === 'Inhibited' 
            ? isCleared 
              ? "bg-emerald-500 border-emerald-500 text-white" 
              : "bg-rose-600 border-rose-600 text-white"
            : status === 'Hypertonic'
              ? isCleared
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-amber-500 border-amber-500 text-white"
              : "border-slate-300 group-hover:border-black bg-white"
        )}>
          {status === 'Inhibited' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowDown size={10} strokeWidth={4} />)}
          {status === 'Hypertonic' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowUp size={10} strokeWidth={4} />)}
        </div>

        <span className={cn(
          "text-[10px] font-bold truncate",
          status === 'Inhibited' && !isCleared && "text-rose-900",
          status === 'Hypertonic' && !isCleared && "text-amber-900",
          isCleared && "text-slate-500 line-through"
        )}>
          {side ? `${side}: ${name}` : name}
        </span>
      </div>

      {isCleared && (
        <Badge className="bg-emerald-500 text-white border-none font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0">
          Cleared
        </Badge>
      )}
    </div>
  );
};

export default CheckItem;