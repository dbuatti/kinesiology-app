"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  CheckCircle2, 
  Zap, 
  RotateCcw, 
  Loader2, 
  Dumbbell, 
  Brain, 
  Activity, 
  Baby,
  ArrowRight,
  Target,
  Calendar,
  AlertCircle,
  RefreshCw,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { safeParse } from "@/utils/safe-json";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";

interface RecheckTabProps {
  appointment: any;
  history: any[];
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
}

interface RecheckItem {
  id: string;
  name: string;
  category: string;
  type: 'muscle' | 'pattern';
  previousStatus: string;
  currentStatus?: string | null;
  side?: 'L' | 'R';
}

const RecheckTab = ({ appointment, history, onUpdate, saveField, updatePriorityPattern }: RecheckTabProps) => {
  const [loading, setLoading] = useState(true);
  const [prevMuscleTests, setPrevMuscleTests] = useState<any[]>([]);
  const [currentMuscleTests, setCurrentMuscleTests] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const previousSession = useMemo(() => {
    if (!history || history.length < 2) return null;
    return history[1];
  }, [history]);

  const fetchSessionData = async () => {
    if (!previousSession) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [prevMuscles, currMuscles] = await Promise.all([
        supabase.from('muscle_tests').select('*').eq('appointment_id', previousSession.id),
        supabase.from('muscle_tests').select('*').eq('appointment_id', appointment.id)
      ]);

      setPrevMuscleTests(prevMuscles.data || []);
      setCurrentMuscleTests(currMuscles.data || []);
    } catch (err) {
      console.error("Error fetching recheck data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [previousSession?.id, appointment.id]);

  const recheckItems = useMemo(() => {
    if (!previousSession) return [];

    const items: RecheckItem[] = [];
    const currentPattern = safeParse(appointment.priority_pattern, {} as any);
    const prevPattern = safeParse(previousSession.priority_pattern, {} as any);

    // Helper to find canonical name for an ID
    const getCanonicalName = (key: string) => {
      const reflex = PRIMITIVE_REFLEXES.find(r => r.id === key || r.name === key);
      if (reflex) return reflex.name;
      const brainPoint = BRAIN_REFLEX_POINTS.find(p => p.id === key || p.name === key);
      if (brainPoint) return brainPoint.name;
      return key;
    };

    const processedKeys = new Set<string>();

    Object.entries(prevPattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([rawName, status]) => {
        const sideMatch = rawName.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = rawName.replace(/ \([LR]\)$/, '');
        
        const canonicalBase = getCanonicalName(baseName);
        const canonicalFullName = side ? `${canonicalBase} (${side})` : canonicalBase;

        // Skip if we've already processed this canonical item
        if (processedKeys.has(canonicalFullName)) return;
        processedKeys.add(canonicalFullName);

        const currentStatus = currentPattern[catKey]?.[canonicalFullName] || currentPattern[catKey]?.[rawName] || null;

        items.push({
          id: `pattern-${catKey}-${canonicalFullName}`,
          name: canonicalBase,
          category: catKey,
          type: 'pattern',
          previousStatus: status as string,
          currentStatus,
          side
        });
      });
    });

    prevMuscleTests.forEach(test => {
      if (processedKeys.has(test.muscle_name)) return;
      processedKeys.add(test.muscle_name);

      const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
      const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
      const baseName = test.muscle_name.replace(/ \([LR]\)$/, '');

      const currentTest = currentMuscleTests.find(t => t.muscle_name === test.muscle_name);
      const currentStatus = currentTest?.status || null;

      items.push({
        id: `muscle-${test.id}`,
        name: baseName,
        category: 'Muscles',
        type: 'muscle',
        previousStatus: test.status,
        currentStatus,
        side
      });
    });

    return items.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.name.localeCompare(b.name);
    });
  }, [previousSession, prevMuscleTests, currentMuscleTests, appointment.priority_pattern]);

  const handleMarkClear = async (item: RecheckItem) => {
    setProcessingId(item.id);
    try {
      if (item.type === 'pattern') {
        await updatePriorityPattern(item.category, item.name, 'Clear', item.side);
      } else {
        const user = (await supabase.auth.getUser()).data.user;
        const dbMuscleName = item.side ? `${item.name} (${item.side})` : item.name;
        
        const existing = currentMuscleTests.find(t => t.muscle_name === dbMuscleName);
        if (existing) {
          await supabase.from('muscle_tests').update({ status: 'Normotonic' }).eq('id', existing.id);
        } else {
          await supabase.from('muscle_tests').insert({
            user_id: user?.id,
            appointment_id: appointment.id,
            muscle_name: dbMuscleName,
            status: 'Normotonic'
          });
        }
      }
      showSuccess(`${item.name} marked as Clear.`);
      await fetchSessionData();
      onUpdate();
    } catch (err) {
      showError("Failed to update status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkInhibited = async (item: RecheckItem) => {
    setProcessingId(item.id);
    try {
      if (item.type === 'pattern') {
        await updatePriorityPattern(item.category, item.name, 'Inhibited', item.side);
      } else {
        const user = (await supabase.auth.getUser()).data.user;
        const dbMuscleName = item.side ? `${item.name} (${item.side})` : item.name;
        
        const existing = currentMuscleTests.find(t => t.muscle_name === dbMuscleName);
        if (existing) {
          await supabase.from('muscle_tests').update({ status: 'Inhibited' }).eq('id', existing.id);
        } else {
          await supabase.from('muscle_tests').insert({
            user_id: user?.id,
            appointment_id: appointment.id,
            muscle_name: dbMuscleName,
            status: 'Inhibited'
          });
        }
      }
      showSuccess(`${item.name} marked as Inhibited.`);
      await fetchSessionData();
      onUpdate();
    } catch (err) {
      showError("Failed to update status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCalibrate = (item: RecheckItem) => {
    const event = new CustomEvent('jump-to-calibrate', { 
      detail: { itemName: item.side ? `${item.name} (${item.side})` : item.name } 
    });
    window.dispatchEvent(event);
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    return Brain;
  };

  if (!previousSession) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
        <History className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-xl font-black text-slate-900">No Previous Session</h3>
        <p className="text-slate-500 mt-2">This appears to be the client's first recorded session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="p-8 bg-indigo-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><History size={150} /></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Previous Session Context</Badge>
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Calendar size={14} /> {format(new Date(previousSession.date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Recheck List</h2>
          <p className="text-indigo-200 font-medium text-lg leading-relaxed max-w-2xl">
            Verify the findings from the last session to track progress and identify recurring patterns.
          </p>
          {previousSession.goal && (
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 inline-block">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Last Goal</p>
              <p className="text-sm font-bold italic">"{previousSession.goal}"</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>
      ) : recheckItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {recheckItems.map((item) => {
            const Icon = getIcon(item.category);
            const isProcessing = processingId === item.id;
            const isTestedNow = !!item.currentStatus;
            const isDysfunctionalNow = isTestedNow && item.currentStatus !== 'Normotonic' && item.currentStatus !== 'Clear';

            return (
              <Card key={item.id} className={cn(
                "border-none shadow-sm transition-all duration-300 rounded-2xl overflow-hidden group",
                isTestedNow ? "bg-slate-50/50 opacity-60" : "bg-white hover:shadow-md",
                isDysfunctionalNow && "border-l-4 border-rose-500 opacity-100"
              )}>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110",
                      item.previousStatus === 'Inhibited' || item.previousStatus === 'Hypertonic' ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-lg text-slate-900 truncate">{item.name}</h4>
                        {item.side && (
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0 border-slate-200 text-slate-400">
                            {item.side}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category}</p>
                        <span className="text-slate-200">•</span>
                        <p className={cn(
                          "text-[9px] font-bold uppercase tracking-widest",
                          item.previousStatus === 'Inhibited' ? "text-rose-500" : "text-indigo-500"
                        )}>
                          Last: {item.previousStatus}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isTestedNow ? (
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm",
                          isDysfunctionalNow ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                        )}>
                          {isDysfunctionalNow ? <Zap size={12} className="mr-1.5 fill-current" /> : <CheckCircle2 size={12} className="mr-1.5" />}
                          {item.currentStatus}
                        </Badge>
                        {isDysfunctionalNow && (
                          <Button 
                            onClick={() => handleCalibrate(item)}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100"
                          >
                            <Target size={16} className="mr-2" /> Calibrate
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleMarkClear(item)}
                          className="h-10 w-10 rounded-xl text-slate-300 hover:text-indigo-600"
                        >
                          <RefreshCw size={18} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleMarkClear(item)}
                          disabled={isProcessing}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest transition-all border border-emerald-100"
                        >
                          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
                          Mark Clear
                        </Button>
                        <Button 
                          onClick={() => handleMarkInhibited(item)}
                          disabled={isProcessing}
                          variant="outline"
                          className="border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          Still Inhibited
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Items to Recheck</h3>
          <p className="text-slate-500 mt-1 font-medium">
            No muscle tests or patterns were recorded in the previous session.
          </p>
        </div>
      )}

      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-start gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Clinical Strategy</p>
          <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
            "Rechecking previous findings is the only way to verify lasting neurological change. If a pattern consistently returns as inhibited across multiple sessions, it indicates a deeper fractal root or a missing physiological priority."
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecheckTab;