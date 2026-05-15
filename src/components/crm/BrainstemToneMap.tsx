"use client";

import React, { useMemo } from 'react';
import { calculateBrainstemTone, Nuclei } from '@/utils/brainstem-logic';
import { cn } from '@/lib/utils';
import { Activity, Zap, Layers, Brain, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
      <div className="p-4 bg-slate-50 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          No findings recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nucleiData.map((nuclei) => {
        const isActive = activeFilter === nuclei.name;
        const isHighThreat = nuclei.threatLevel > 50;
        
        return (
          <div 
            key={nuclei.name} 
            onClick={() => onSelectNuclei?.(isActive ? null : nuclei.name)}
            className={cn(
              "p-3 transition-all cursor-pointer group border-l-4",
              isActive ? "bg-primary text-white border-primary" : 
              isHighThreat ? "bg-rose-50 border-rose-500" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {nuclei.name === 'Midbrain' ? <Zap size={12} /> :
                 nuclei.name === 'Pons' ? <Layers size={12} /> :
                 nuclei.name === 'Medulla' ? <Activity size={12} /> : <Brain size={12} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{nuclei.name}</span>
              </div>
              <span className="text-[9px] font-black">{nuclei.threatLevel}%</span>
            </div>

            <Progress value={nuclei.threatLevel} className={cn("h-1 bg-black/5", isActive ? "[&>div]:bg-white" : isHighThreat ? "[&>div]:bg-rose-500" : "[&>div]:bg-primary")} />
            
            {isActive && nuclei.findings.length > 0 && (
              <div className="mt-3 space-y-1 animate-in fade-in duration-200">
                {nuclei.findings.map(f => (
                  <p key={f} className="text-[9px] font-bold uppercase tracking-tight opacity-80">• {f}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BrainstemToneMap;