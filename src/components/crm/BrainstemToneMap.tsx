
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateBrainstemTone, Nuclei } from '@/utils/brainstem-logic';
import { cn } from '@/lib/utils';
import { ShieldAlert, Activity, Zap, Layers, Brain, Info, Workflow, FilterX, ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react';
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
      <div className="p-4 bg-muted/50 dark:bg-foreground/50 rounded-2xl border border-border/50 dark:border-foreground/50 flex items-center justify-between group hover:border-indigo-300 transition-all cursor-default">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-card dark:bg-foreground/50 flex items-center justify-center text-muted-foreground/60">
            <Brain size={16} />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Log pathway findings to activate →
          </p>
        </div>
        <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-indigo-400 transition-colors" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nucleiData.map((nuclei) => {
          const isActive = activeFilter === nuclei.name;
          const isHighThreat = nuclei.threatLevel > 50;
          
          return (
            <Card 
              key={nuclei.name} 
              onClick={() => onSelectNuclei?.(isActive ? null : nuclei.name)}
              className={cn(
                "border-none shadow-md rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer group",
                isActive ? "ring-2 ring-indigo-500 scale-[1.02] shadow-xl" : "hover:shadow-lg",
                isHighThreat ? "bg-destructive/5 dark:bg-destructive/10 border-2 border-destructive/20" : "bg-card"
              )}
            >
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg transition-transform group-hover:scale-110",
                    nuclei.name === 'Midbrain' ? "bg-primary" :
                    nuclei.name === 'Pons' ? "bg-primary" :
                    nuclei.name === 'Medulla' ? "bg-destructive" : "bg-primary"
                  )}>
                    {nuclei.name === 'Midbrain' ? <Zap size={24} /> :
                     nuclei.name === 'Pons' ? <Layers size={24} /> :
                     nuclei.name === 'Medulla' ? <Activity size={24} /> : <Brain size={24} />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={cn(
                      "font-black text-[8px] uppercase tracking-widest px-2 py-0.5 border-none rounded-full flex items-center gap-1",
                      nuclei.toneEffect === 'Flexors' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    )}>
                      {nuclei.toneEffect === 'Flexors' ? <ArrowDownCircle size={10} /> : <ArrowUpCircle size={10} />}
                      {nuclei.toneEffect}
                    </Badge>
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Tone Effect</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-xl text-foreground tracking-tight">{nuclei.name}</h4>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Nuclei Status</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Threat Level</span>
                    <span className={cn(isHighThreat ? "text-destructive" : "text-indigo-600")}>{nuclei.threatLevel}%</span>
                  </div>
                  <Progress value={nuclei.threatLevel} className={cn("h-2 bg-muted dark:bg-foreground/50", isHighThreat ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")} />
                </div>

                <div className="pt-2 border-t border-border/50 dark:border-foreground/50">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Inhibited Findings</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nuclei.findings.map(f => (
                      <Badge key={f} className="bg-muted text-muted-foreground border-none text-[8px] font-bold px-2 py-0.5 rounded-md">
                        {f}
                      </Badge>
                    ))}
                    {nuclei.findings.length === 0 && <span className="text-[8px] text-muted-foreground/60 italic">None detected</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/50 dark:bg-foreground/50 rounded-2xl border border-border/50 dark:border-foreground/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Workflow size={20} className="text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground font-medium max-w-md leading-relaxed">
            {activeFilter 
              ? `Filtering Pathway list by ${activeFilter} associated findings.` 
              : "The Brainstem Tone Map visualizes the cumulative neurological load on each region based on your findings."}
          </p>
        </div>
        {activeFilter && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelectNuclei?.(null)}
            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 rounded-xl border border-destructive/20"
          >
            <FilterX size={14} className="mr-2" /> Clear Filter
          </Button>
        )}
      </div>
    </div>
  );
};

export default BrainstemToneMap;