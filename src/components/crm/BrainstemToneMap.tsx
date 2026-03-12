"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateBrainstemTone, NucleiStatus } from '@/utils/brainstem-logic';
import { cn } from '@/lib/utils';
import { ShieldAlert, Activity, Zap, Layers, Brain, Info, Workflow } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BrainstemToneMapProps {
  priorityPattern: string | null;
}

const BrainstemToneMap = ({ priorityPattern }: BrainstemToneMapProps) => {
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
        {nucleiData.map((nuclei) => (
          <Card key={nuclei.name} className={cn(
            "border-none shadow-md rounded-3xl overflow-hidden transition-all duration-500",
            nuclei.threatLevel > 50 ? "bg-rose-50 dark:bg-rose-950/10 border-2 border-rose-200" : "bg-card"
          )}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={100} /></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl">
            <Workflow size={40} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black flex items-center gap-2">
              <Info size={20} className="text-indigo-400" /> Clinical Pattern Analysis
            </h4>
            <p className="text-slate-400 font-medium leading-relaxed">
              {totalThreat > 150 
                ? "Systemic brainstem threat detected. Prioritize SNS down-regulation and foundational cranial nerve integration (Pons/Medulla) before specific structural work."
                : "Brainstem tone is relatively stable. Focus on specific cortical smudging (S1) or localized mechanoreceptive corrections."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainstemToneMap;