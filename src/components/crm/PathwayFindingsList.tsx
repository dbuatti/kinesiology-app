"use client";

import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Zap, Baby, Brain } from "lucide-react";
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';

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
    try {
      const parsed = JSON.parse(priorityPattern);
      const items: { name: string; status: string; category: string }[] = [];
      
      Object.entries(parsed).forEach(([category, values]: [string, any]) => {
        // 1. Normalize all items in this category first
        const sessionItems: { base: string, side: string, status: string }[] = [];
        Object.entries(values).forEach(([key, status]) => {
          if (showOnlyInhibited && status !== 'Inhibited') return;
          
          const sideMatch = key.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] : "";
          const base = getCanonicalName(key);
          sessionItems.push({ base, side, status: status as string });
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
    } catch (e) {
      return [];
    }
  }, [priorityPattern, showOnlyInhibited]);

  if (findings.length === 0) {
    return <p className="text-xs text-slate-400 italic">No active priorities recorded.</p>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {findings.map((finding, idx) => (
        <div 
          key={idx} 
          className={cn(
            "flex items-center justify-between p-2 rounded-lg border text-[10px] font-bold transition-all",
            finding.status === 'Inhibited' 
              ? "bg-rose-50 border-rose-100 text-rose-700" 
              : "bg-emerald-50 border-emerald-100 text-emerald-700"
          )}
        >
          <div className="flex items-center gap-2 truncate mr-2">
            {finding.category.toLowerCase().includes('primitive') ? <Baby size={12} /> :
             finding.category.toLowerCase().includes('cranial') ? <Zap size={12} /> :
             <Brain size={12} />}
            <span className="truncate">{finding.name}</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "h-4 px-1.5 text-[7px] font-black uppercase border-none",
              finding.status === 'Inhibited' ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
            )}
          >
            {finding.status}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default PathwayFindingsList;