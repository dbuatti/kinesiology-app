"use client";

import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Zap, Baby, Brain } from "lucide-react";

interface PathwayFindingsListProps {
  priorityPattern: string | null | undefined;
  className?: string;
  showOnlyInhibited?: boolean;
}

const PathwayFindingsList = ({ priorityPattern, className, showOnlyInhibited = true }: PathwayFindingsListProps) => {
  const findings = useMemo(() => {
    if (!priorityPattern) return [];
    try {
      const parsed = JSON.parse(priorityPattern);
      const items: { name: string; status: string; category: string }[] = [];
      
      Object.entries(parsed).forEach(([category, values]: [string, any]) => {
        Object.entries(values).forEach(([name, status]) => {
          if (!showOnlyInhibited || status === 'Inhibited') {
            items.push({ 
              name, 
              status: status as string, 
              category: category.replace(/([A-Z])/g, ' $1').trim() 
            });
          }
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
            {finding.category.includes('Primitive') ? <Baby size={12} /> :
             finding.category.includes('Cranial') ? <Zap size={12} /> :
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