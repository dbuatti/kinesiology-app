"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateBrainstemTone, Nuclei } from '@/utils/brainstem-logic';
import { cn } from '@/lib/utils';
import { ShieldAlert, Activity, Zap, Layers, Brain, Info, Workflow, FilterX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface BrainstemToneMapProps {
  priorityPattern: string | null;
  activeFilter?: Nuclei | null;
  onSelectNuclei?: (nuclei: Nuclei | null) => void;
}

const BrainstemToneMap = ({ priorityPattern, activeFilter, onSelectNuclei }: BrainstemToneMapProps) => {
  const nucleiData = useMemo(() => calculateBrainstemTone(priorityPattern), [priorityPattern]);
  
  const totalThreat = nucleiData.reduce((sum, n) => sum + n.threatLevel, 0);
  const hasData = nucleiData.some(n => n.findings.length > 0);

  if (!hasData) {
    return (
      <Card className="border-none shadow-sm bg-muted/30 rounded-[2rem] border-2 border-dashed border-border">
        <CardContent className="p-12 text-center">
          <Brain size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-foreground">No Tone Data Available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Log inhibited nerves or muscles in the Pathway tab to see the Brainstem Tone Map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nucleiData.map((nuclei) => {
          const isActive = activeFilter === nuclei.name;
          
          return (
            <Card 
              key={nuclei.name} 
              onClick={() => onSelectNuclei?.(isActive ? null : nuclei.name)}
              className={cn(
                "border-none shadow-md rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer group",
                isActive ? "ring-2 ring-indigo-500 scale-[1.02] shadow-xl" : "hover:shadow-lg",
                nuclei.threatLevel > 50 ? "bg-rose-50 dark:bg-rose-950/10 border-2 border-rose-200" : "bg-card"
              )}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                    nuclei.name === 'Midbrain' ? "bg-amber-500" :
                    nuclei.name === 'Pons' ? "bg-indigo-600" :
                    nuclei.name === 'Medulla' ? "bg-rose-600" : "bg-purple-600"
                  )}>
                    {nuclei.name === 'Midbrain' ? <Zap size={20} /> :
                     nuclei.name === 'Pons' ? <Layers size={20} /> :
                     nuclei.name === 'Medulla' ? <Activity size={20} /> : <Brain size={20} />}
                  </div>
                  <Badge variant="outline" className={cn(
                    "font-black text-[8px] uppercase tracking-widest",
                    nuclei.toneEffect === 'Flexors' ? "text-blue-600 border-blue-200" : "text-rose-600 border-rose-200"
                  )}>
                    {nuclei.toneEffect}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-black text-lg text-foreground">{nuclei.name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nuclei Status</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-muted-foreground">Threat Level</span>
                    <span className={cn(nuclei.threatLevel > 50 ? "text-rose-600" : "text-indigo-600")}>{nuclei.threatLevel}%</span>
                  </div>
                  <Progress value={nuclei.threatLevel} className={cn("h-1.5", nuclei.threatLevel > 50 ? "[&>div]:bg-rose-500" : "[&>div]:bg-indigo-500")} />
                </div>

                <div className="pt-2">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Inhibited Findings</p>
                  <div className="flex flex-wrap gap-1">
                    {nuclei.findings.map(f => (
                      <Badge key={f} className="bg-muted text-muted-foreground border-none text-[8px] font-bold px-1.5 py-0">
                        {f}
                      </Badge>
                    ))}
                    {nuclei.findings.length === 0 && <span className="text-[8px] text-slate-300 italic">None</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <Workflow size={20} className="text-white" />
          </div>
          <p className="text-xs text-muted-foreground font-medium max-w-md">
            {activeFilter 
              ? `Filtering Pathway list by ${activeFilter} associated findings.` 
              : "Click a region above to filter the Pathway Assessment list."}
          </p>
        </div>
        {activeFilter && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelectNuclei?.(null)}
            className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50"
          >
            <FilterX size={14} className="mr-2" /> Clear Filter
          </Button>
        )}
      </div>
    </div>
  );
};

export default BrainstemToneMap;