"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Minus, 
  TrendingUp, 
  Brain, 
  Zap, 
  Baby, 
  Dumbbell,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { processNeurologicalHistory, FindingHistory } from '@/utils/neurological-history';
import { format } from 'date-fns';

interface NeurologicalHistoryTrackerProps {
  appointments: any[];
}

const NeurologicalHistoryTracker = ({ appointments }: NeurologicalHistoryTrackerProps) => {
  const historyData = useMemo(() => processNeurologicalHistory(appointments), [appointments]);
  
  const sessionDates = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(app => {
      if (app.priority_pattern) {
        dates.add(format(new Date(app.date), "MMM d, yyyy"));
      }
    });
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [appointments]);

  if (historyData.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-muted/30 rounded-[2rem] border-2 border-dashed border-border">
        <CardContent className="p-12 text-center">
          <History size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-foreground">No Neurological History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start logging findings in the "Pathway" tab of your sessions to see long-term trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  const resolvedCount = historyData.filter(h => h.isResolved).length;
  const activeCount = historyData.length - resolvedCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Brain size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Findings</p>
            <p className="text-xl font-black text-foreground">{historyData.length}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resolved</p>
            <p className="text-xl font-black text-foreground">{resolvedCount}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Priorities</p>
            <p className="text-xl font-black text-foreground">{activeCount}</p>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className="p-8 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <TrendingUp size={24} className="text-indigo-600" /> Neurological Evolution
              </CardTitle>
              <CardDescription className="font-medium">Tracking reflex and nerve resolution across sessions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-6 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[200px]">Finding</th>
                  {sessionDates.map(date => (
                    <th key={date} className="p-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground min-w-[100px]">
                      {date}
                    </th>
                  ))}
                  <th className="p-6 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((finding, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/20 transition-colors group">
                    <td className="p-6 sticky left-0 bg-card group-hover:bg-muted/20 z-10">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          finding.category.includes('Primitive') ? "bg-amber-50 text-amber-600" :
                          finding.category.includes('Cranial') ? "bg-rose-50 text-rose-600" :
                          "bg-indigo-50 text-indigo-600"
                        )}>
                          {finding.category.includes('Primitive') ? <Baby size={16} /> :
                           finding.category.includes('Cranial') ? <Zap size={16} /> :
                           <Brain size={16} />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground">{finding.name}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{finding.category}</p>
                        </div>
                      </div>
                    </td>
                    {sessionDates.map(date => {
                      const session = finding.history.find(h => h.date === date);
                      return (
                        <td key={date} className="p-4 text-center">
                          {session ? (
                            <div className={cn(
                              "w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all",
                              session.status === 'Clear' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                            )}>
                              {session.status === 'Clear' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                          ) : (
                            <Minus size={16} className="mx-auto text-muted-foreground/20" />
                          )}
                        </td>
                      );
                    })}
                    <td className="p-6 text-right">
                      {finding.isResolved ? (
                        <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-200 text-rose-600 font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                          Active
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-4">
        <Info size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight">Clinical Logic</p>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
            This grid tracks the "Fractal Resolution" of the client's nervous system. A finding is marked as <strong>Resolved</strong> if it tested <strong>Clear</strong> in the most recent session it was assessed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeurologicalHistoryTracker;