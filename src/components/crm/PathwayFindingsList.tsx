
import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Baby, Zap, Brain, Dumbbell } from "lucide-react";
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { safeParse } from '@/utils/safe-json';

interface PathwayFindingsListProps {
  priorityPattern: string | null | undefined;
  className?: string;
  showOnlyInhibited?: boolean;
}

const getCanonicalName = (name: string): string => {
  const cleanName = name.replace(/ \([LR]\)$/, '').trim();
  const lowerClean = cleanName.toLowerCase();
  const reflex = PRIMITIVE_REFLEXES.find(r => 
    r.id.toLowerCase() === lowerClean || 
    r.name.toLowerCase() === lowerClean ||
    r.name.toLowerCase().includes(lowerClean)
  );
  if (reflex) return reflex.name;
  const point = BRAIN_REFLEX_POINTS.find(p => 
    p.id.toLowerCase() === lowerClean || 
    p.name.toLowerCase() === lowerClean ||
    p.name.toLowerCase().split(':')[0].trim() === lowerClean
  );
  if (point) return point.name.split(':')[0].trim();
  return cleanName;
};

const PathwayFindingsList = ({ priorityPattern, className, showOnlyInhibited = true }: PathwayFindingsListProps) => {
  const findings = useMemo(() => {
    if (!priorityPattern) return [];
    
    const parsed = safeParse(priorityPattern, {} as Record<string, Record<string, string>>);
    const items: { name: string; status: string; category: string }[] = [];
    
    Object.entries(parsed).forEach(([category, values]) => {
      // 1. Normalize all items in this category first
      const sessionItems: { base: string, side: string, status: string }[] = [];
      Object.entries(values).forEach(([key, status]) => {
        const strStatus = status as string;
        const isCleared = strStatus.endsWith('_Cleared');
        const baseStatus = strStatus.replace('_Cleared', '');

        if (showOnlyInhibited && isCleared) return;
        if (showOnlyInhibited && baseStatus !== 'Inhibited' && baseStatus !== 'Hypertonic') return;
        
        // Filter out non-dysfunctional 'Clear' or 'Normotonic' items
        if (!showOnlyInhibited && baseStatus === 'Clear' && !isCleared) return;
        if (!showOnlyInhibited && baseStatus === 'Normotonic' && !isCleared) return;
        
        const sideMatch = key.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] : "";
        const base = getCanonicalName(key);
        sessionItems.push({ base, side, status: strStatus });
      });

      // 2. Filter out base items if lateralized ones exist
      const filteredSessionItems = sessionItems.filter(item => {
        if (item.side === "") {
          const hasLateral = sessionItems.some(other => other.base === item.base && other.side !== "");
          if (hasLateral) return false;
        }
        return true;
      });

      // 3. Add to final list
      filteredSessionItems.forEach(item => {
        const displayName = item.side ? `${item.base} (${item.side})` : item.base;
        items.push({ 
          name: displayName, 
          status: item.status, 
          category: category.replace(/([A-Z])/g, ' $1').trim() 
        });
      });
    });
    
    return items;
  }, [priorityPattern, showOnlyInhibited]);

  if (findings.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No active priorities recorded.</p>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {findings.map((finding, idx) => {
        const isCleared = finding.status.endsWith('_Cleared') || finding.status === 'Normotonic';
        const displayStatus = finding.status.replace('_Cleared', ' (Cleared)');
        
        return (
          <div 
            key={idx} 
            className={cn(
              "flex items-center justify-between p-2 rounded-lg border text-[10px] font-bold transition-all",
              isCleared 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            )}
          >
            <div className="flex items-center gap-2 truncate mr-2">
              {finding.category.toLowerCase().includes('primitive') ? <Baby size={12} /> :
               finding.category.toLowerCase().includes('cranial') ? <Zap size={12} /> :
               finding.category.toLowerCase().includes('muscle') ? <Dumbbell size={12} /> :
               <Brain size={12} />}
              <span className={cn("truncate", isCleared && "line-through text-muted-foreground")}>{finding.name}</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "h-4 px-1.5 text-[7px] font-black uppercase tracking-widest border-none",
                isCleared ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              )}
            >
              {displayStatus}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export default PathwayFindingsList;