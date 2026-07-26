
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  CheckCircle2, 
  RotateCcw, 
  Loader2, 
  Dumbbell, 
  Brain, 
  Activity, 
  Baby,
  Target,
  Calendar,
  RefreshCw,
  Info,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { safeParse } from "@/utils/safe-json";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import { processNeurologicalHistory } from "@/utils/neurological-history";

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

interface RecheckGroup {
  name: string;
  category: string;
  type: 'muscle' | 'pattern';
  left?: RecheckItem;
  right?: RecheckItem;
  midline?: RecheckItem;
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

  const historyStats = useMemo(() => processNeurologicalHistory(history), [history]);

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

  const recheckGroups = useMemo(() => {
    if (!previousSession) return [];

    const groups: Record<string, RecheckGroup> = {};
    const currentPattern = safeParse(appointment.priority_pattern, {} as any);
    const prevPattern = safeParse(previousSession.priority_pattern, {} as any);

    const getCanonicalName = (key: string) => {
      const reflex = PRIMITIVE_REFLEXES.find(r => r.id === key || r.name === key);
      if (reflex) return reflex.name;
      const brainPoint = BRAIN_REFLEX_POINTS.find(p => p.id === key || p.name === key);
      if (brainPoint) return brainPoint.name;
      return key;
    };

    // Process Patterns
    Object.entries(prevPattern).forEach(([catKey, categoryItems]: [string, any]) => {
      Object.entries(categoryItems).forEach(([rawName, status]) => {
        const sideMatch = rawName.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = rawName.replace(/ \([LR]\)$/, '').trim();
        const canonicalBase = getCanonicalName(baseName);
        
        const groupKey = `${catKey}-${canonicalBase}`;
        if (!groups[groupKey]) {
          groups[groupKey] = { name: canonicalBase, category: catKey, type: 'pattern' };
        }

        const fullName = side ? `${canonicalBase} (${side})` : canonicalBase;
        const currentStatus = currentPattern[catKey]?.[fullName] || null;

        const item: RecheckItem = {
          id: `pattern-${catKey}-${rawName}`,
          name: canonicalBase,
          category: catKey,
          type: 'pattern',
          previousStatus: status as string,
          currentStatus,
          side
        };

        if (side === 'L') groups[groupKey].left = item;
        else if (side === 'R') groups[groupKey].right = item;
        else groups[groupKey].midline = item;
      });
    });

    // Process Muscles
    prevMuscleTests.forEach(test => {
      const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
      const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
      const baseName = test.muscle_name.replace(/ \([LR]\)$/, '').trim();
      
      const groupKey = `muscle-${baseName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { name: baseName, category: 'Muscles', type: 'muscle' };
      }

      const currentTest = currentMuscleTests.find(t => t.muscle_name === test.muscle_name);
      const currentStatus = currentTest?.status || null;

      const item: RecheckItem = {
        id: `muscle-${test.id}`,
        name: baseName,
        category: 'Muscles',
        type: 'muscle',
        previousStatus: test.status,
        currentStatus,
        side
      };

      if (side === 'L') groups[groupKey].left = item;
      else if (side === 'R') groups[groupKey].right = item;
      else groups[groupKey].midline = item;
    });

    return Object.values(groups)
      .filter(group => {
        const items = [group.left, group.right, group.midline].filter(Boolean);
        return items.some(item => {
          if (item.previousStatus === 'Inhibited' || item.previousStatus !== 'Normotonic') return true;
          const fullName = item.side ? `${item.name} (${item.side})` : item.name;
          const findingHistory = historyStats.find(h => h.name === fullName);
          const wasEverInhibited = findingHistory?.history.some(h => h.status === 'Inhibited' || (h.status as any) !== 'Normotonic');
          return wasEverInhibited;
        });
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });
  }, [previousSession, prevMuscleTests, currentMuscleTests, appointment.priority_pattern, historyStats]);

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
      showSuccess(`${item.name}${item.side ? ` (${item.side})` : ''} marked as Clear.`);
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
      showSuccess(`${item.name}${item.side ? ` (${item.side})` : ''} marked as Inhibited.`);
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

  const StatusControl = ({ item, sideLabel }: { item: RecheckItem, sideLabel: string }) => {
    const isProcessing = processingId === item.id;
    const isTestedNow = !!item.currentStatus;
    const isDysfunctionalNow = isTestedNow && item.currentStatus !== 'Normotonic' && item.currentStatus !== 'Clear';

    return (
      <div className={cn(
        "flex-1 p-4 rounded-xl border transition-all",
        isTestedNow ? "bg-muted/50 border-border" : "bg-card border-border shadow-sm",
        isDysfunctionalNow && "border-rose-200 bg-rose-50/30"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (item.currentStatus === 'Clear' || item.currentStatus === 'Normotonic') {
                  handleMarkInhibited(item);
                } else {
                  handleMarkClear(item);
                }
              }}
              className={cn(
                "text-[9px] font-medium px-2 py-0.5 rounded-md border tracking-widest transition-all hover:scale-110 active:scale-95",
                sideLabel === 'LEFT' ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" : 
                sideLabel === 'RIGHT' ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100" :
                "bg-muted text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {sideLabel}
            </button>
            <p className={cn(
              "text-[8px] font-bold uppercase tracking-widest",
              item.previousStatus === 'Inhibited' || item.previousStatus !== 'Normotonic' ? "text-rose-500" : "text-indigo-500"
            )}>
              Last: {item.previousStatus}
            </p>
          </div>
          {isTestedNow && (
            <Badge className={cn(
              "border-none font-medium text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full",
              isDysfunctionalNow ? "bg-destructive text-destructive-foreground" : "bg-primary/5 text-primary-foreground"
            )}>
              {item.currentStatus}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {isTestedNow ? (
            <>
              {isDysfunctionalNow && (
                <Button 
                  onClick={() => handleCalibrate(item)}
                  className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl h-9 font-medium text-[10px] uppercase tracking-wider shadow-sm"
                >
                  <Target size={14} className="mr-1.5" /> Calibrate
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleMarkClear(item)}
                className="h-9 w-9 rounded-xl text-muted-foreground/60 hover:text-indigo-600"
              >
                <RefreshCw size={16} />
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => handleMarkClear(item)}
                disabled={isProcessing}
                className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl h-9 font-medium text-[10px] uppercase tracking-wider transition-all border border-emerald-100"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                Clear
              </Button>
              <Button 
                onClick={() => handleMarkInhibited(item)}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl h-9 font-medium text-[10px] uppercase tracking-wider transition-all"
              >
                Inhib
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (!previousSession) {
    return (
      <div className="text-center py-20 bg-muted rounded-[3rem] border-2 border-dashed border-border">
        <History className="mx-auto text-muted-foreground/60 mb-4" size={48} />
        <h3 className="text-xl font-medium text-foreground">No Previous Session</h3>
        <p className="text-muted-foreground mt-2">This appears to be the client's first recorded session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="p-8 bg-primary text-primary-foreground rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><History size={150} /></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-50 text-indigo-700 border-none font-medium text-[10px] uppercase tracking-widest px-3 py-1">Previous Session Context</Badge>
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Calendar size={14} /> {format(new Date(previousSession.date), "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <h2 className="text-3xl font-medium tracking-tight">Recheck List</h2>
          <p className="text-indigo-200 font-medium text-lg leading-relaxed max-w-2xl">
            Verify findings that were inhibited last session or have a history of dysfunction. Items that have always been clear are hidden to keep your focus sharp.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
      ) : recheckGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {recheckGroups.map((group, idx) => {
            const Icon = getIcon(group.category);
            const isLateralized = !!(group.left || group.right);

            return (
              <Card key={idx} className="border-none shadow-md rounded-xl bg-card overflow-hidden group hover:shadow-sm transition-all">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110",
                      group.category.includes('Reflex') ? "bg-indigo-50 text-indigo-600" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-medium text-xl text-foreground">{group.name}</h4>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{group.category}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {isLateralized ? (
                      <>
                        {group.left && <StatusControl item={group.left} sideLabel="LEFT" />}
                        {group.right && <StatusControl item={group.right} sideLabel="RIGHT" />}
                      </>
                    ) : (
                      group.midline && <StatusControl item={group.midline} sideLabel="MIDLINE" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
<div className="text-center py-20 bg-muted rounded-xl border-2 border-dashed border-border">
          <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-foreground">No Items to Recheck</h3>
            <p className="text-muted-foreground font-medium max-w-md mx-auto">
              Nothing flagged from last session ({format(new Date(previousSession.date), "MMM d")}). If you notice new inhibitions during today's session, they'll appear here next time.
            </p>
          </div>
        </div>
      )}

      <div className="p-8 bg-muted rounded-xl border border-border flex items-start gap-6">
        <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-[0.3em]">Clinical Strategy</p>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
            "Rechecking previous findings is the only way to verify lasting neurological change. If a pattern consistently returns as inhibited across multiple sessions, it indicates a deeper fractal root or a missing physiological priority."
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecheckTab;