import type { MouseEvent } from 'react';
import { ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AssessmentStatus = 'Normotonic' | 'Inhibited' | 'Hypertonic' | null;

interface AssessmentItemProps {
  name: string;
  side?: 'L' | 'R';
  status: AssessmentStatus;
  isMuscle?: boolean;
  description?: string;
  testingInstructions?: string;
  showFullInstructions?: boolean;
  onStatusChange: (name: string, status: AssessmentStatus, side?: 'L' | 'R') => void;
}

const CYCLE_NON_MUSCLE: Record<string, AssessmentStatus> = {
  'null': 'Inhibited',
  'Inhibited': null,
};

const CYCLE_MUSCLE: Record<string, AssessmentStatus> = {
  'null': 'Inhibited',
  'Inhibited': 'Hypertonic',
  'Hypertonic': null,
};

export const AssessmentItem = ({
  name,
  side,
  status,
  isMuscle = false,
  description,
  testingInstructions,
  showFullInstructions = false,
  onStatusChange,
}: AssessmentItemProps) => {
  const handleCycle = (e: MouseEvent) => {
    e.stopPropagation();
    const cycle = isMuscle ? CYCLE_MUSCLE : CYCLE_NON_MUSCLE;
    const next = cycle[String(status)] ?? null;
    onStatusChange(name, next, side);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-1.5 rounded-md border transition-all cursor-pointer group",
        status === 'Inhibited'
          ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800"
          : status === 'Hypertonic'
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
            : "hover:bg-muted/50 border-transparent"
      )}
      onClick={handleCycle}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Status indicator */}
        <div className={cn(
          "w-4 h-4 border flex items-center justify-center transition-all shrink-0 rounded-sm",
          status === 'Inhibited'
            ? "bg-rose-500 border-rose-500 text-white"
            : status === 'Hypertonic'
              ? "bg-amber-500 border-amber-500 text-white"
              : "border-border group-hover:border-foreground bg-background"
        )}>
          {status === 'Inhibited' && <ArrowDown size={10} strokeWidth={4} />}
          {status === 'Hypertonic' && <ArrowUp size={10} strokeWidth={4} />}
        </div>

        <div className="flex flex-col min-w-0">
          <span className={cn(
            "text-[10px] font-bold truncate",
            status === 'Inhibited' && "text-rose-600 dark:text-rose-300",
            status === 'Hypertonic' && "text-amber-600 dark:text-amber-300",
            !status && "text-muted-foreground"
          )}>
            {side ? `${side}: ${name}` : name}
          </span>
          {description && (
            <span className="text-[10px] text-muted-foreground/50 truncate leading-tight italic">{description}</span>
          )}
          {testingInstructions && (
            <span className={cn(
              "text-[10px] text-chart-primary/70 leading-tight flex items-start gap-1",
              showFullInstructions ? "mt-1" : "truncate"
            )}>
              <Zap size={8} className="shrink-0 mt-0.5" />{testingInstructions}
            </span>
          )}
        </div>
      </div>

      {status && (
        <span className={cn(
          "text-[7px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0",
          status === 'Inhibited' && "bg-rose-500/15 text-rose-600 dark:text-rose-300",
          status === 'Hypertonic' && "bg-amber-500/15 text-amber-600 dark:text-amber-300"
        )}>
          {status === 'Inhibited' ? '↓ Inhib' : '↑ Hyper'}
        </span>
      )}
    </div>
  );
};
