import { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface CorrectionEntry {
  finding: string;
  summary: string;
  timestamp: string;
  status?: 'pending' | 'cleared' | 'still_showing';
  recheckTimestamp?: string;
}

interface ShowingLogProps {
  corrections: CorrectionEntry[];
  onStatusChange: (index: number, status: 'cleared' | 'still_showing') => void;
  onDelete?: (index: number) => void;
  compact?: boolean;
}

export const ShowingLog = ({ corrections, onStatusChange, onDelete, compact }: ShowingLogProps) => {
  const [expanded, setExpanded] = useState(!compact);
  const [showCleared, setShowCleared] = useState(true);

  if (corrections.length === 0) return null;

  const pending = corrections.filter(c => !c.status || c.status === 'pending');
  const cleared = corrections.filter(c => c.status === 'cleared');
  const stillShowing = corrections.filter(c => c.status === 'still_showing');

  const visible = showCleared 
    ? corrections 
    : corrections.filter(c => c.status !== 'cleared');

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors print:hidden"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-xs font-medium text-foreground">Showing Log</span>
          <div className="flex gap-1">
            {pending.length > 0 && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 rounded-full border-border text-muted-foreground">
                {pending.length} pending
              </Badge>
            )}
            {stillShowing.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] px-1.5 py-0 rounded-full">
                {stillShowing.length} showing
              </Badge>
            )}
            {cleared.length > 0 && (
              <Badge className="bg-chart-emerald/10 text-chart-emerald border-none text-[8px] px-1.5 py-0 rounded-full">
                {cleared.length} cleared
              </Badge>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border">
          {corrections.length > 1 && (
            <div className="flex items-center gap-2 pt-2 print:hidden">
              <button
                onClick={() => setShowCleared(!showCleared)}
                className="text-[9px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCleared ? 'Hide cleared' : 'Show cleared'}
              </button>
            </div>
          )}

          {visible.length === 0 && (
            <p className="text-[10px] text-muted-foreground py-2">No corrections logged yet.</p>
          )}

          {visible.map((correction, i) => {
            const realIndex = corrections.indexOf(correction);
            const isCleared = correction.status === 'cleared';
            const isShowing = correction.status === 'still_showing';
            const isPending = !correction.status || correction.status === 'pending';

            return (
              <div
                key={i}
                className={cn(
                  "p-2.5 rounded-lg border transition-all",
                  isCleared && "bg-chart-emerald/5 border-chart-emerald/20",
                  isShowing && "bg-amber-500/5 border-amber-500/20",
                  isPending && "bg-muted/30 border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isCleared && <CheckCircle2 size={10} className="text-chart-emerald shrink-0" />}
                      {isShowing && <AlertCircle size={10} className="text-amber-500 shrink-0" />}
                      {isPending && <Clock size={10} className="text-muted-foreground shrink-0" />}
                      <span className={cn(
                        "text-[10px] font-bold truncate",
                        isCleared && "text-chart-emerald line-through",
                        isShowing && "text-amber-600 dark:text-amber-300",
                        isPending && "text-foreground"
                      )}>
                        {correction.finding}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      {correction.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] text-muted-foreground/60">
                        {new Date(correction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {correction.recheckTimestamp && (
                        <span className="text-[8px] text-muted-foreground/60">
                          rechecked {new Date(correction.recheckTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {!compact && (
                    <div className="flex items-center gap-1 shrink-0 print:hidden">
                      {(isPending || isShowing) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(realIndex, 'cleared')}
                          className="h-6 px-2 text-[8px] font-medium text-chart-emerald hover:bg-chart-emerald/10 rounded-md"
                        >
                          <CheckCircle2 size={10} className="mr-1" /> Clear
                        </Button>
                      )}
                      {(isPending || isCleared) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(realIndex, 'still_showing')}
                          className="h-6 px-2 text-[8px] font-medium text-amber-500 hover:bg-amber-500/10 rounded-md"
                        >
                          <AlertCircle size={10} className="mr-1" /> Still Showing
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(realIndex)}
                          className="h-6 px-1.5 text-muted-foreground hover:text-destructive rounded-md"
                        >
                          <Trash2 size={10} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
