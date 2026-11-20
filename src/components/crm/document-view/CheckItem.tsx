
import type { SyntheticEvent } from 'react';
import { Check, ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckItemProps {
  category: string;
  name: string;
  side?: 'L' | 'R';
  pattern: Record<string, Record<string, string | undefined>>;
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

  const handleCycle = (e: SyntheticEvent) => {
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
        "flex items-center justify-between px-2 py-1.5 transition-all cursor-pointer group border rounded-lg",
        status === 'Inhibited' 
          ? isCleared 
            ? "bg-primary/[0.06] border-primary/25 text-foreground/80" 
            : "bg-rose-500/[0.06] border-rose-500/25 text-rose-700 dark:text-rose-300"
          : status === 'Hypertonic'
            ? isCleared
              ? "bg-primary/[0.06] border-primary/25 text-foreground/80"
              : "bg-amber-500/[0.08] border-amber-500/25 text-amber-700 dark:text-amber-300"
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
          "w-4 h-4 border flex items-center justify-center transition-all shrink-0 rounded-md",
          status === 'Inhibited' 
            ? isCleared 
              ? "bg-primary/90 border-primary/90 text-white" 
              : "bg-rose-500/90 border-rose-500/90 text-white"
            : status === 'Hypertonic'
              ? isCleared
                ? "bg-primary/90 border-primary/90 text-white"
                : "bg-amber-500/90 border-amber-500/90 text-white"
              : "border-border/80 group-hover:border-foreground/40 bg-background"
        )}>
          {status === 'Inhibited' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowDown size={10} strokeWidth={4} />)}
          {status === 'Hypertonic' && (isCleared ? <Check size={10} strokeWidth={4} /> : <ArrowUp size={10} strokeWidth={4} />)}
        </div>

        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-[13px] font-medium break-words leading-snug",
            status === 'Inhibited' && !isCleared && "text-rose-600 dark:text-rose-300",
            status === 'Hypertonic' && !isCleared && "text-amber-600 dark:text-amber-300",
            isCleared && "text-muted-foreground line-through"
          )}>
            {side ? `${side}: ${name}` : name}
          </span>
          {description && (
            <span className="text-[11px] text-muted-foreground/60 break-words leading-tight italic">{description}</span>
          )}
          {testingInstructions && (
            <span className={cn(
              "text-[11px] text-primary/70 leading-tight flex items-start gap-1",
              showFullInstructions ? "mt-1" : "truncate"
            )}>
              <Zap size={10} className="shrink-0 mt-0.5" />{testingInstructions}
            </span>
          )}
        </div>
      </div>

      {isCleared && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-primary-strong dark:text-primary">
          Cleared
        </span>
      )}
    </div>
  );
};

export default CheckItem;
