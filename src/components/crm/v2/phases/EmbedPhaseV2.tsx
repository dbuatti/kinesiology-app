import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, RefreshCw, CheckCircle2, Loader2, ShieldCheck,
  CalendarPlus, Plus, Calendar, Target, Zap,
  FileText, Brain, Dumbbell, Baby, X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { safeParse } from "@/utils/safe-json";
import { showSuccess, showError } from "@/utils/toast";
import EditableField from "@/components/shared/EditableField";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { getInhibitedFindings } from "@/components/crm/v2/v2-utils";
import {
  findGridReflex,
  primitiveSideKey,
  primitiveStimKey,
  primitiveStimKeyAt,
  nerveStimLines,
  isLateralStim,
  cranialSideKey,
  cranialStimKey,
} from "@/components/crm/pathway-reflex-stim-data";
import { PhaseHeader } from "@/components/crm/v2/PhaseComponents";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import AppointmentForm from "@/components/crm/AppointmentForm";
import CompactAvailabilityPicker from "@/components/crm/CompactAvailabilityPicker";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

interface InhibitedItem {
  id: string;
  name: string;
  category: string;
  type: 'pattern' | 'muscle';
  status: string;
  side?: 'L' | 'R';
}

const EmbedPhaseV2 = ({ appointment, onUpdate, saveField, updatePriorityPattern }: PhaseProps) => {
  const [muscleTests, setMuscleTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [clearingStimId, setClearingStimId] = useState<string | null>(null);
  const [bookNextOpen, setBookNextOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string; slotTime: string } | null>(null);
  const { tests: reflexTests, refresh: refreshReflexTests, updateTest: reflexUpdate } = usePrimitiveReflexTests(appointment.id, appointment.priority_pattern);
  const { tests: nerveTests, refresh: refreshNerveTests, updateTest: nerveUpdate } = useCranialNerveTests(appointment.id, appointment.priority_pattern);

  const metadata = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const clearedFindings: Set<string> = useMemo(() => {
    return new Set(metadata.cleared_findings || []);
  }, [metadata]);

  const fetchMuscleTests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      if (!error) setMuscleTests(data || []);
    } catch (err) {
      console.error("Error fetching muscle tests:", err);
    } finally {
      setLoading(false);
    }
  }, [appointment.id]);

  useEffect(() => {
    fetchMuscleTests();
  }, [fetchMuscleTests]);

  const inhibitedItems = useMemo(() => {
    const items: InhibitedItem[] = [];
    getInhibitedFindings(appointment.priority_pattern).forEach(f => {
      items.push({ id: `${f.catKey}-${f.fullName}`, name: f.baseName, category: f.catKey, type: 'pattern', status: f.status, side: f.side });
    });
    muscleTests.forEach(test => {
      if (test.status !== 'Normotonic') {
        const sideMatch = test.muscle_name.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = test.muscle_name.replace(/ \([LR]\)$/, '').trim();
        if (!items.find(i => i.name === baseName && i.side === side)) {
          items.push({ id: test.id, name: baseName, category: 'Muscles', type: 'muscle', status: test.status, side });
        }
      }
    });
    return items;
  }, [appointment.priority_pattern, muscleTests]);

  const pendingItems = useMemo(() => {
    return inhibitedItems.filter(item => !clearedFindings.has(item.id));
  }, [inhibitedItems, clearedFindings]);

  // List the marked stims for a finding, each mapped back to its storage key so
  // individual stims can be cleared during re-challenge.
  const itemStims = (item: InhibitedItem) => {
    if (item.category === 'cranialNerves') {
      const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === item.name || n.name === item.name);
      const test = nerve && nerveTests.find(t => t.nerve_id === nerve.id.toString());
      if (!nerve || !test?.stim_results) return null;
      const stims: { key: string; label: string; side?: 'L' | 'R' }[] = [];
      nerveStimLines(nerve).forEach((line, i) => {
        if (isLateralStim(nerve.id, i)) {
          (['L', 'R'] as const).forEach((side) => {
            const key = cranialSideKey(nerve.id, i, side);
            if (test.stim_results![key]) stims.push({ key, label: line, side });
          });
        } else {
          const key = cranialStimKey(nerve.id, i);
          if (test.stim_results![key]) stims.push({ key, label: line });
        }
      });
      return { stims: item.side ? stims.filter(s => s.side === item.side) : stims };
    }
    if (item.category === 'primitiveReflexes') {
      const reflex = PRIMITIVE_REFLEXES.find(r => r.name === item.name);
      const gridReflex = findGridReflex(reflex?.id || '', reflex?.name);
      const test = reflex && reflexTests.find(t => t.reflex_id === reflex.id);
      if (!reflex || !gridReflex || !test?.stim_results) return null;
      const stims: { key: string; label: string; side?: 'L' | 'R' }[] = [];
      if (gridReflex.lateralized) {
        (['L', 'R'] as const).forEach((side) => {
          const key = primitiveSideKey(gridReflex, side);
          if (test.stim_results![key]) stims.push({ key, label: reflex.stimulus, side });
        });
      } else if (gridReflex.stims?.length) {
        gridReflex.stims.forEach((label, i) => {
          const key = primitiveStimKeyAt(gridReflex, i);
          if (test.stim_results![key]) stims.push({ key, label });
        });
      } else {
        const key = primitiveStimKey(gridReflex);
        if (test.stim_results![key]) stims.push({ key, label: reflex.stimulus });
      }
      return { stims: item.side ? stims.filter(s => s.side === item.side) : stims };
    }
    return null;
  };

  const clearStim = async (item: InhibitedItem, stimKey: string) => {
    setClearingStimId(stimKey);
    try {
      if (item.category === 'cranialNerves') {
        const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === item.name || n.name === item.name);
        if (!nerve) return;
        const existing = nerveTests.find(t => t.nerve_id === nerve.id.toString());
        const current = (existing && existing.stim_results) || {};
        const next = { ...current };
        delete next[stimKey];
        const isInhibited = Object.values(next).some(Boolean);
        await nerveUpdate(nerve.id.toString(), { stim_results: next, is_inhibited: isInhibited }, item.side);
      } else if (item.category === 'primitiveReflexes') {
        const reflex = PRIMITIVE_REFLEXES.find(r => r.name === item.name);
        if (!reflex) return;
        const existing = reflexTests.find(t => t.reflex_id === reflex.id);
        const current = (existing && existing.stim_results) || {};
        const next = { ...current };
        delete next[stimKey];
        const isInhibited = Object.values(next).some(Boolean);
        await reflexUpdate(reflex.id, { stim_results: next, is_inhibited: isInhibited }, item.side, reflex.name);
      }
    } finally {
      setClearingStimId(null);
    }
  };

  const ClearableStims = ({ item }: { item: InhibitedItem }) => {
    const data = itemStims(item);
    if (!data || data.stims.length === 0) return null;
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Marked Stims ({data.stims.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.stims.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1 pl-1.5 pr-0.5 py-0.5 rounded-md text-[9px] font-medium bg-chart-destructive/10 text-chart-destructive border border-chart-destructive/20"
            >
              {s.side && <span className="font-black">{s.side}</span>}
              <span className="max-w-[200px] truncate leading-snug">{s.label}</span>
              <button
                onClick={() => clearStim(item, s.key)}
                disabled={clearingStimId === s.key}
                className="rounded p-0.5 text-chart-destructive hover:bg-chart-destructive hover:text-white transition-colors"
                title={`Clear "${s.label}"`}
              >
                {clearingStimId === s.key ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const clearedItems = useMemo(() => {
    return inhibitedItems.filter(item => clearedFindings.has(item.id));
  }, [inhibitedItems, clearedFindings]);

  // Clear the underlying stim marks (and the priority_pattern entry) for a
  // pattern finding, so the GRID reflects the cleared state after re-challenge.
  const clearStims = async (item: InhibitedItem) => {
    if (item.category === 'cranialNerves') {
      const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === item.name || n.name === item.name);
      const test = nerve && nerveTests.find(t => t.nerve_id === nerve.id.toString());
      if (nerve && test?.stim_results) {
        const next = { ...test.stim_results };
        if (item.side && nerve.isLateralized) {
          nerveStimLines(nerve).forEach((_, i) => {
            if (isLateralStim(nerve.id, i)) delete next[cranialSideKey(nerve.id, i, item.side!)];
          });
        } else {
          nerveStimLines(nerve).forEach((_, i) => {
            if (isLateralStim(nerve.id, i)) {
              delete next[cranialSideKey(nerve.id, i, 'L')];
              delete next[cranialSideKey(nerve.id, i, 'R')];
            } else {
              delete next[cranialStimKey(nerve.id, i)];
            }
          });
        }
        const isInhibited = Object.values(next).some(Boolean);
        const { error } = await supabase
          .from('cranial_nerve_tests')
          .update({ stim_results: next, is_inhibited: isInhibited, updated_at: new Date().toISOString() })
          .eq('id', test.id);
        if (error) throw error;
      }
      if (nerve) {
        await updatePriorityPattern('cranialNerves', `${nerve.name}: ${nerve.latinName}`, null, item.side);
      }
    } else if (item.category === 'primitiveReflexes') {
      const reflex = PRIMITIVE_REFLEXES.find(r => r.name === item.name);
      const gridReflex = findGridReflex(reflex?.id || '', reflex?.name);
      const test = reflex && reflexTests.find(t => t.reflex_id === reflex.id);
      if (reflex && gridReflex && test?.stim_results) {
        const next = { ...test.stim_results };
        if (item.side && gridReflex.lateralized) {
          delete next[primitiveSideKey(gridReflex, item.side)];
        } else if (gridReflex.stims?.length) {
          gridReflex.stims.forEach((_, i) => delete next[primitiveStimKeyAt(gridReflex, i)]);
        } else {
          delete next[primitiveStimKey(gridReflex)];
        }
        const isInhibited = Object.values(next).some(Boolean);
        const { error } = await supabase
          .from('primitive_reflex_tests')
          .update({ stim_results: next, is_inhibited: isInhibited, updated_at: new Date().toISOString() })
          .eq('id', test.id);
        if (error) throw error;
      }
      if (reflex) {
        await updatePriorityPattern('primitiveReflexes', reflex.name, null, item.side);
      }
    }
  };

  const handleClearItem = async (item: InhibitedItem) => {
    setClearingId(item.id);
    try {
      if (item.type === 'muscle') {
        const { error } = await supabase.from('muscle_tests').update({ status: 'Normotonic' }).eq('id', item.id);
        if (error) throw error;
        await fetchMuscleTests();
      } else {
        await clearStims(item);
        refreshNerveTests();
        refreshReflexTests();
      }
      const newCleared = [...(metadata.cleared_findings || []), item.id];
      const clearedMuscleStatus = {
        ...(metadata.cleared_muscle_status || {}),
        ...(item.type === 'muscle' ? { [item.id]: item.status } : {}),
      };
      await saveField('metadata', { ...metadata, cleared_findings: newCleared, cleared_muscle_status: clearedMuscleStatus });
      showSuccess(`${item.name} marked as Clear.`);
      onUpdate();
    } catch {
      showError("Failed to clear item.");
    } finally {
      setClearingId(null);
    }
  };

  const handleUndoClear = async (item: any) => {
    setClearingId(item.id);
    try {
      if (item.type === 'muscle') {
        const priorStatus = (metadata.cleared_muscle_status || {})[item.id];
        if (priorStatus) {
          const { error } = await supabase.from('muscle_tests').update({ status: priorStatus }).eq('id', item.id);
          if (error) throw error;
        }
        await fetchMuscleTests();
      }
      const newCleared = (metadata.cleared_findings || []).filter((id: string) => id !== item.id);
      const clearedMuscleStatus = { ...(metadata.cleared_muscle_status || {}) };
      delete clearedMuscleStatus[item.id];
      await saveField('metadata', { ...metadata, cleared_findings: newCleared, cleared_muscle_status: clearedMuscleStatus });
      showSuccess(`${item.name} restored.`);
      onUpdate();
    } catch {
      showError("Failed to restore item.");
    } finally {
      setClearingId(null);
    }
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('reflex')) return Baby;
    if (cat.includes('nerve')) return Zap;
    if (cat.includes('muscle')) return Dumbbell;
    return Brain;
  };

  const hasSnsResets = !!(appointment.lymphatic_notes || appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes);

  return (
    <div className="space-y-12">
      {/* Intro */}
      <PhaseHeader icon={ClipboardCheck} title="Embed" description="Re-challenge all inhibited findings, confirm integration, document homework, and schedule the follow-up session." />

      {/* Clinical Verification (Re-challenge) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Clinical Verification</h3>
              <p className="text-xs text-muted-foreground font-medium">Re-challenge all inhibited findings to confirm integration.</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-muted border-border text-muted-foreground font-medium">
            {pendingItems.length} Items
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : pendingItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingItems.map((item) => {
              const Icon = getIcon(item.category);
              const isClearing = clearingId === item.id;
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{item.name}</p>
                        {item.side && (
                          <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 border-border text-muted-foreground">
                            {item.side}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground">{item.status}</p>
                      <ClearableStims item={item} />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleClearItem(item)}
                    disabled={isClearing}
                    className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl h-10 px-4 font-medium text-[10px] border border-emerald-500/20"
                  >
                    {isClearing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                    Mark Clear
                  </Button>
                </div>
              );
            })}
          </div>
        ) : inhibitedItems.length > 0 ? (
          <div className="text-center py-16 bg-muted rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck size={32} className="text-chart-emerald" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">All Findings Integrated</h3>
            <p className="text-muted-foreground font-medium text-sm max-w-xs mx-auto mt-1">
              No pending inhibitions. The system is balanced and ready for embedding.
            </p>
          </div>
        ) : (
          <div className="text-center py-16 bg-muted rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ClipboardCheck size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Items to Verify</h3>
            <p className="text-muted-foreground font-medium text-sm max-w-xs mx-auto mt-1">
              No inhibited findings recorded in the preliminary phase.
            </p>
          </div>
        )}

        {clearedItems.length > 0 && (
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-2 px-2">
              <div className="w-5 h-5 rounded bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={12} />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">Cleared Findings ({clearedItems.length})</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {clearedItems.map((item) => {
                const Icon = getIcon(item.category);
                const isClearing = clearingId === item.id;
                return (
                  <div key={item.id} className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                          {item.side && (
                            <Badge variant="outline" className="text-[8px] font-medium px-1 py-0 border-emerald-500/20 text-emerald-600 bg-emerald-500/10">
                              {item.side}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 size={8} /> Cleared</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUndoClear(item)}
                      disabled={isClearing}
                      variant="ghost"
                      className="h-7 px-2 text-[9px] text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      {isClearing ? <Loader2 size={10} className="animate-spin" /> : 'Undo'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Session Summary */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <FileText size={18} className="text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Session Summary</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intake & Vitals */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Goal</p>
              <p className="text-xs font-medium text-foreground leading-relaxed">{appointment.goal || 'Not set'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-xl border border-border text-center">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">BOLT</p>
                <p className="text-lg font-semibold text-chart-primary">{appointment.bolt_score ? `${appointment.bolt_score}s` : '—'}</p>
              </div>
              <div className="p-3 bg-muted rounded-xl border border-border text-center">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">COH</p>
                <p className="text-lg font-semibold text-chart-destructive">{appointment.coherence_score ? appointment.coherence_score.toFixed(2) : '—'}</p>
              </div>
            </div>
            {hasSnsResets && (
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground">SNS Resets</p>
                {appointment.lymphatic_notes && <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12} className="text-chart-emerald" /> Lymphatic</p>}
                {appointment.harmonic_rocking_notes && <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12} className="text-chart-emerald" /> Harmonic Rocking</p>}
                {appointment.t1_reset_notes && <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12} className="text-chart-emerald" /> T1 Reset</p>}
                {appointment.diaphragm_reset_notes && <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12} className="text-chart-emerald" /> Diaphragm Reset</p>}
                {appointment.vagus_nerve_notes && <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12} className="text-chart-emerald" /> Vagus Process</p>}
              </div>
            )}
          </div>

          {/* Findings */}
          <div>
            <PathwayFindingsList
              priorityPattern={appointment.priority_pattern}
              showOnlyInhibited={false}
              className="max-h-[300px] overflow-y-auto pr-2"
            />
          </div>

          {/* Corrections */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Corrections & Balances</p>
              <p className="text-xs font-medium text-muted-foreground italic leading-relaxed">{appointment.modes_balances || 'No specific corrections logged.'}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Acupoints</p>
              <p className="text-xs font-medium text-chart-primary">{appointment.acupoints || 'None recorded'}</p>
            </div>
            {appointment.emotion_primary_selection && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Emotional Context</p>
                <Badge className="bg-primary text-primary-foreground border-none font-medium text-[10px]">{appointment.emotion_primary_selection}</Badge>
                {appointment.emotion_notes && <p className="text-xs text-muted-foreground italic mt-1">"{appointment.emotion_notes}"</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rebook */}
      <div className="p-6 bg-primary rounded-xl text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><CalendarPlus size={150} /></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-background/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
              <CalendarPlus size={28} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Schedule Follow-up</h3>
              <p className="text-primary-foreground/80 text-sm font-medium">Lock in the next session for {appointment.clients?.name}.</p>
            </div>
          </div>
          <Dialog open={bookNextOpen} onOpenChange={(open) => { setBookNextOpen(open); if (!open) setSelectedSlot(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-background/20 backdrop-blur-md text-primary-foreground hover:bg-background/30 border-none rounded-xl h-12 px-8 font-medium text-xs uppercase tracking-wider">
                <Plus size={18} className="mr-2" /> Book Next Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[90vh]">
              <div className="px-8 pt-8 pb-5 border-b border-border shrink-0">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    {selectedSlot ? "Confirm Booking" : "Select Available Time"}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium">
                    {selectedSlot ? `Finalise details for ${appointment.clients?.name}.` : `Live availability for ${appointment.clients?.name}.`}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="overflow-y-auto flex-1 px-8 py-6">
                {selectedSlot ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Selected Slot</p>
                          <p className="text-sm font-medium text-foreground">
                            {format(selectedSlot.date, "EEEE, MMM do")} @ {format(selectedSlot.date, "h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSlot(null)} className="text-xs text-muted-foreground">
                        Change
                      </Button>
                    </div>
                    <AppointmentForm
                      initialClientId={appointment.clients?.id}
                      initialDate={selectedSlot.date}
                      initialTime={selectedSlot.time}
                      slotTime={selectedSlot.slotTime}
                      onSuccess={() => { setBookNextOpen(false); setSelectedSlot(null); onUpdate(); }}
                    />
                  </div>
                ) : (
                  <CompactAvailabilityPicker onSlotSelect={(date, time, slotTime) => setSelectedSlot({ date, time, slotTime })} />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <ClipboardCheck size={16} />
            </div>
            <h4 className="text-sm font-medium text-muted-foreground">Integration Notes</h4>
          </div>
          <EditableField
            field="session_north_star"
            label=""
            value={appointment.session_north_star}
            multiline
            placeholder="Document final re-test results and prescribed homework..."
            onSave={saveField}
            className="bg-card p-6 rounded-xl border border-border shadow-sm min-h-[200px]"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <Target size={16} />
            </div>
            <h4 className="text-sm font-medium text-muted-foreground">Next Session Focus</h4>
          </div>
          <EditableField
            field="next_session_note"
            label=""
            value={appointment.next_session_note}
            multiline
            placeholder="What to check at the next session? (e.g. Re-check Moro, sleep quality...)"
            onSave={saveField}
            className="bg-card border border-border p-6 rounded-xl shadow-sm min-h-[200px]"
          />
        </div>
      </div>
    </div>
  );
};

export default EmbedPhaseV2;