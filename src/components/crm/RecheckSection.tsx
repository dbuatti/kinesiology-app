import { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safeParse } from '@/utils/safe-json';
import type { AppointmentWithClient } from '@/types/crm';

interface RecheckItem {
  name: string;
  category: string;
  previousStatus: string;
  side?: 'L' | 'R';
  correctionSummary?: string;
}

interface RecheckSectionProps {
  currentAppointment: AppointmentWithClient;
  history: AppointmentWithClient[];
  onSetPriority: (finding: string) => void;
  onMarkResolved: (finding: string) => void;
}

export const RecheckSection = ({ 
  currentAppointment, 
  history, 
  onSetPriority, 
  onMarkResolved 
}: RecheckSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  const previousSession = useMemo(() => {
    if (!currentAppointment?.date) return history[0];
    const currentTs = new Date(currentAppointment.date).getTime();
    return history.find((h) => {
      const ts = new Date(h.date).getTime();
      return ts < currentTs;
    }) || null;
  }, [history, currentAppointment]);

  const recheckItems = useMemo(() => {
    if (!previousSession) return [];
    
    const items: RecheckItem[] = [];
    const pattern = safeParse(previousSession.priority_pattern, {} as any);
    
    Object.entries(pattern).forEach(([category, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (status && status !== 'Clear' && status !== 'Normotonic') {
          const match = name.match(/(.+) \(([LR])\)$/);
          items.push({
            name: match ? match[1] : name,
            category,
            previousStatus: status as string,
            side: match ? (match[2] as 'L' | 'R') : undefined,
          });
        }
      });
    });

    // Check metadata for corrections
    const metadata = safeParse(previousSession.metadata, {} as any);
    const corrections = metadata.corrections || [];
    corrections.forEach((c: any) => {
      const existing = items.find(i => i.name === c.finding || c.pathway?.includes(i.name));
      if (existing && c.summary) {
        existing.correctionSummary = c.summary;
      }
    });

    return items;
  }, [previousSession]);

  if (recheckItems.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors print:hidden"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <div className="w-7 h-7 rounded-lg bg-chart-primary/10 flex items-center justify-center">
            <Clock size={14} className="text-chart-primary" />
          </div>
          <div className="text-left">
            <span className="text-xs font-medium text-foreground block">Re-assess Previous Findings</span>
            <span className="text-[10px] text-muted-foreground">
              {recheckItems.length} finding{recheckItems.length !== 1 ? 's' : ''} from {previousSession?.date ? new Date(previousSession.date).toLocaleDateString() : 'last session'}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground text-[8px] px-1.5 py-0 rounded-full">
          {recheckItems.length}
        </Badge>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-1.5 border-t border-border">
          <p className="text-[9px] text-muted-foreground pt-2 leading-relaxed">
            Re-check each finding from the previous session. Mark as resolved or carry forward as a priority.
          </p>
          {recheckItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                  item.previousStatus === 'Inhibited' || item.previousStatus === 'Inhibition'
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-destructive/10 text-destructive"
                )}>
                  {item.previousStatus === 'Hypertonic' ? (
                    <span className="text-[10px] font-bold">↑</span>
                  ) : (
                    <span className="text-[10px] font-bold">↓</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-foreground block truncate">
                    {item.side ? `${item.side}: ${item.name}` : item.name}
                  </span>
                  {item.correctionSummary && (
                    <span className="text-[8px] text-muted-foreground block truncate">
                      Last: {item.correctionSummary.split('|')[0]?.trim()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 print:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkResolved(item.name)}
                  className="h-6 px-2 text-[8px] font-medium text-chart-emerald hover:bg-chart-emerald/10 rounded-md"
                >
                  <CheckCircle2 size={10} className="mr-1" /> Resolved
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetPriority(item.name)}
                  className="h-6 px-2 text-[8px] font-medium text-chart-primary hover:bg-chart-primary/10 rounded-md"
                >
                  <ArrowRight size={10} className="mr-1" /> Set 1°
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
