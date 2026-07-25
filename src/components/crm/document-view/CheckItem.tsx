
import type { MouseEvent } from 'react';
import { Check, ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CheckItemProps {
  category: string;
  name: string;
  side?: 'L' | 'R';
  pattern: any;
  description?: string;
  testingInstructions?: string;
  showFullInstructions?: boolean;
  onToggle: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
}

const CheckItem = ({ category, name, side, pattern, description, testingInstructions, showFullInstructions = false, onToggle }: CheckItemProps) => {
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

  const handleCycle = (e: MouseEvent) => {
    e.stopPropagation();
    let nextStatus = 'Clear';

    if (isMuscle) {
      if (status === 'Clear') nextStatus = 'Inhibited';
      else if (status === 'Inhibited' && !isCleared) nextStatus = 'Hypertonic';
      else if (status === 'Hypertonic' && !isCleared) nextStatus = 'Inhibited_Cleared';
      else nextStatus = 'Clear';
    } else {
      if (status === 'Clear') nextStatus = 'Inhibited';
      else if (status === 'Inhibited' && !isCleared) nextStatus = 'Inhibited_Cleared';
      else nextStatus = 'Clear';
    }

    onToggle(category, name, nextStatus, side);
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-1.5 transition-all cursor-pointer group border rounded-md",
        status === 'Inhibited' 
          ? isCleared 
            ? "bg-emerald-500/10 border-emerald-500/30 text-foreground/80" 
            : "bg-destructive/10 border-destructive/30 text-destructive"
          : status === 'Hypertonic'
            ? isCleared
              ? "bg-emerald-500/10 border-emerald-500/30 text-foreground/80"
              : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300"
            : "hover:bg-muted/50 border-transparent text-muted-foreground"
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
              : "bg-amber-500 border-amber-500 text-white"
            : status === 'Hypertonic'
              ? isCleared
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-rose-600 border-rose-600 text-white"
              : "border-border group-hover:border-foreground bg-background"
        )}>
          {status === 'Inhibited' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowDown size={10} strokeWidth={4} />)}
          {status === 'Hypertonic' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowUp size={10} strokeWidth={4} />)}
        </div>

        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-[10px] font-bold truncate",
            status === 'Inhibited' && !isCleared && "text-amber-600 dark:text-amber-300",
            status === 'Hypertonic' && !isCleared && "text-destructive",
            isCleared && "text-muted-foreground line-through"
          )}>
            {side ? `${side}: ${name}` : name}
          </span>
          {description && (
            <span className="text-[10px] text-muted-foreground/50 truncate leading-tight italic">{description}</span>
          )}
          {testingInstructions && (
            <span className={cn(
              "text-[9px] text-indigo-400 dark:text-indigo-300/70 leading-tight flex items-start gap-1",
              showFullInstructions ? "mt-1" : "truncate"
            )}>
              <Zap size={8} className="shrink-0 mt-0.5" />{testingInstructions}
            </span>
          )}
        </div>
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