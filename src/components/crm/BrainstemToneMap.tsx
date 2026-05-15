"use client";

import React, { useMemo } from 'react';
import { calculateBrainstemTone, Nuclei } from '@/utils/brainstem-logic';
import { cn } from '@/lib/utils';
import { Activity, Zap, Layers, Brain, Workflow, FilterX, ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface BrainstemToneMapProps {
  priorityPattern: string | null;
  activeFilter?: Nuclei | null;
  onSelectNuclei?: (nuclei: Nuclei | null) => void;
}

const BrainstemToneMap = ({ priorityPattern, activeFilter, onSelectNuclei }: BrainstemToneMapProps) => {
  const nucleiData = useMemo(() => calculateBrainstemTone(priorityPattern), [priorityPattern]);
  
  const hasData = nucleiData.some(n => n.findings.length > 0);

  if (!hasData) {
    return (
      <div className="p-6 border border-border bg-muted/30 flex items-center justify-between group hover:bg-muted transition-colors cursor-default">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground">
            <Brain size={18} />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Log pathway findings to activate →
          </p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
        {nucleiData.map((nuclei) => {
          const isActive = activeFilter === nuclei.name;
          const isHighThreat = nuclei.threatLevel > 50;
          
          return (
            <div 
              key={nuclei.name} 
              onClick={() => onSelectNuclei?.(isActive ? null : nuclei.name)}
              className={cn(
                "p-6 border-r border-b border-border last:border-r-0 transition-colors cursor-pointer group",
                isActive ? "bg-primary text-primary-foreground" : 
                isHighThreat ? "bg-destructive/10" : "bg-background hover:bg-muted"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "w-10 h-10 border border-border flex items-center justify-center",
                  isActive ? "border-primary-foreground" : "text-primary"
                )}>
                  {nuclei.name === 'Midbrain' ? <Zap size={20} /> :
                   nuclei.name === 'Pons' ? <Layers size={20} /> :
                   nuclei.name === 'Medulla' ? <Activity size={20} /> : <Brain size={20} />}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-1 border border-border",
                    isActive ? "border-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {nuclei.toneEffect}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-lg uppercase tracking-tight">{nuclei.name}</h4>
                <p className={cn(
                  "text-[8px] font-bold uppercase tracking-widest mt-1",
                  isActive ? "opacity-80" : "text-muted-foreground"
                )}>Nuclei Status</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className={isActive ? "opacity-80" : "text-muted-foreground"}>Threat Level</span>
                  <span className={cn(isActive ? "text-primary-foreground" : isHighThreat ? "text-destructive" : "text-primary")}>{nuclei.threatLevel}%</span>
                </div>
                <Progress value={nuclei.threatLevel} className={cn("h-1 bg-muted", isActive ? "[&>div]:bg-primary-foreground" : isHighThreat ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")} />
              </div>

              <div className="pt-6 mt-6 border-t border-border">
                <p className={cn(
                  "text-[8px] font-bold uppercase tracking-widest mb-3",
                  isActive ? "opacity-80" : "text-muted-foreground"
                )}>Inhibited Findings</p>
                <div className="flex flex-wrap gap-2">
                  {nuclei.findings.map(f => (
                    <span key={f} className={cn(
                      "text-[8px] font-bold uppercase tracking-tight border border-border px-2 py-1",
                      isActive ? "border-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {f}
                    </span>
                  ))}
                  {nuclei.findings.length === 0 && <span className="text-[8px] opacity-40 italic">None detected</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-border flex items-center justify-center text-primary">
            <Workflow size={20} />
          </div>
          <p className="text-xs text-muted-foreground font-medium max-w-md leading-relaxed uppercase tracking-tight">
            {activeFilter 
              ? `Filtering Pathway list by ${activeFilter} associated findings.` 
              : "The Brainstem Tone Map visualizes the cumulative neurological load on each region based on your findings."}
          </p>
        </div>
        {activeFilter && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSelectNuclei?.(null)}
            className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest border-border hover:bg-muted"
          >
            <FilterX size={14} className="mr-2" /> Clear Filter
          </Button>
        )}
      </div>
    </div>
  );
};

export default BrainstemToneMap;