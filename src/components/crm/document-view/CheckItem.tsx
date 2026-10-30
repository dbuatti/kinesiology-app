
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
  /** Override the name used as the pattern key (for display deduplication). */
  patternName?: string;
}

const CheckItem = ({ category, name, side, pattern, description, testingInstructions, showFullInstructions = false, onToggle, patternName }: CheckItemProps) => {
  const keyName = patternName || name;
  const fullName = side ? `${keyName} (${side})` : keyName;
  let rawStatus = pattern[category]?.[fullName];

  if (!rawStatus && side && pattern[category]?.[keyName]) {
    rawStatus = pattern[category]?.[keyName];
  }

  const isMuscle = category === 'muscles';

  const isCleared = rawStatus?.endsWith('_Cleared') || rawStatus === 'Normotonic_Cleared';
  const baseStatus = rawStatus?.replace('_Cleared', '') || null;

  const status = isMuscle
    ? (baseStatus === 'Inhibition' || baseStatus === 'Inhibited' ? 'Inhibited' : baseStatus === 'Hypertonic' ? 'Hypertonic' : null)
    : (baseStatus === 'Inhibited' ? 'Inhibited' : null);

  const handleCycle = (e: MouseEvent) => {
    e.stopPropagation();
    let nextStatus: string;

    if (isMuscle) {
      if (!status) nextStatus = 'Inhibited';
      else if (status === 'Inhibited') nextStatus = 'Hypertonic';
      else if (status === 'Hypertonic') nextStatus = 'Clear';
      else nextStatus = 'Clear';
    } else {
      if (!status) nextStatus = 'Inhibited';
      else nextStatus = 'Clear';
    }

    onToggle(category, keyName, nextStatus, side);
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-2 transition-all cursor-pointer group border rounded-md",
        status === 'Inhibited' 
          ? isCleared 
            ? "bg-success/8 border-success/25 text-foreground/80" 
            : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300"
          : status === 'Hypertonic'
            ? isCleared
              ? "bg-success/8 border-success/25 text-foreground/80"
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
            : "hover:bg-muted/50 border-transparent text-muted-foreground"
      )}
      role="button"
      tabIndex={0}
      onClick={handleCycle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCycle(e);
        }
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          "w-4 h-4 border flex items-center justify-center transition-all shrink-0 rounded-sm",
          status === 'Inhibited' 
            ? isCleared 
              ? "bg-success border-success text-white" 
              : "bg-rose-500 border-rose-500 text-white"
            : status === 'Hypertonic'
              ? isCleared
                ? "bg-success border-success text-white"
                : "bg-amber-500 border-amber-500 text-white"
              : "border-border group-hover:border-foreground bg-background"
        )}>
          {status === 'Inhibited' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowDown size={10} strokeWidth={4} />)}
          {status === 'Hypertonic' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowUp size={10} strokeWidth={4} />)}
        </div>

        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-[10px] font-semibold truncate",
            status === 'Inhibited' && !isCleared && "text-rose-600 dark:text-rose-300",
            status === 'Hypertonic' && !isCleared && "text-amber-600 dark:text-amber-300",
            status === 'Hypotonic' && !isCleared && "text-sky-600 dark:text-sky-300",
            isCleared && "text-muted-foreground line-through"
          )}>
            {side ? `${side}: ${name}` : name}
          </span>
          {description && (
            <span className="text-[10px] text-muted-foreground/50 truncate leading-tight italic">{description}</span>
          )}
          {testingInstructions && (
            <span className={cn(
              "text-[10px] text-primary/70 leading-tight flex items-start gap-1",
              showFullInstructions ? "mt-1" : "truncate"
            )}>
              <Zap size={8} className="shrink-0 mt-1" />{testingInstructions}
            </span>
          )}
        </div>
      </div>

      {isCleared && (
        <Badge className="bg-success text-primary-foreground border-none font-semibold text-[7px] uppercase tracking-wider px-2 py-1 rounded-sm shrink-0">
          Cleared
        </Badge>
      )}
    </div>
  );
};

export default CheckItem;
