"use client";

import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Baby, Zap, Brain } from "lucide-react";
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { safeParse } from '@/utils/safe-json';

interface PathwayFindingsListProps {
  priorityPattern: string | null | undefined;
  className?: string;
  showOnlyInhibited?: boolean;
}

const getCanonicalName = (name: string): string => {
  const cleanName = name.replace(/ \([LR]\)$/, '').trim().toLowerCase();
  const reflex = PRIMITIVE_REFLEXES.find(r => r.id.toLowerCase() === cleanName || r.name.toLowerCase() === cleanName);
  if (reflex) return reflex.name;
  const point = BRAIN_REFLEX_POINTS.find(p => p.id.toLowerCase() === cleanName || p.name.toLowerCase() === cleanName);
  if (point) return point.name.split(':')[0].trim();
  return name;
};

const PathwayFindingsList = ({ priorityPattern, className, showOnlyInhibited = true }: PathwayFindingsListProps) => {
  const findings = useMemo(() => {
    if (!priorityPattern) return [];
    
    const parsed = safeParse(priorityPattern, {} as Record<string, Record<string, string>>);
    const items: { name: string; status: string; category: string }[] = [];
    
    Object.entries(parsed).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, status]) => {
        if (showOnlyInhibited && status !== 'Inhibited') return;
        
        const base = getCanonicalName(key);
        items.push({ 
          name: key, 
          status: status as string, 
          category: category.replace(/([A-Z])/g, ' $1').trim() 
        });
      });
    });
    
    return items;
  }, [priorityPattern, showOnlyInhibited]);

  if (findings.length === 0) {
    return <p className="text-[10px] text-slate-400 italic text-center py-4">No active priorities.</p>;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {findings.map((finding, idx) => (
        <div 
          key={idx} 
          className={cn(
            "flex items-center justify-between p-1.5 transition-all",
            finding.status === 'Inhibited' ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          )}
        >
          <div className="flex items-center gap-2 truncate mr-2">
            {finding.category.toLowerCase().includes('primitive') ? <Baby size={10} /> :
             finding.category.toLowerCase().includes('cranial') ? <Zap size={10} /> :
             <Brain size={10} />}
            <span className="text-[10px] font-bold truncate">{finding.name}</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
            {finding.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PathwayFindingsList;