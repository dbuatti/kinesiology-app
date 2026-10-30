import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  CalendarPlus,
  Plus,
  Calendar,
  Target,
  Zap,
  FileText,
  Brain,
  Dumbbell,
  Baby,
  X,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
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
  nerveStimEntries,
  nerveStimAllIndexes,
  isLateralStim,
  cranialSideKey,
  cranialStimKey,
} from "@/components/crm/pathway-reflex-stim-data";
import { PhaseHeader, PhasePanel, SectionHeading, PhaseEmptyState } from "@/components/crm/v2/PhaseComponents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const EmbedPhaseV2 = ({ appointment, history, onUpdate, saveField, updatePriorityPattern }: PhaseProps) => {
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

  const nextSession = useMemo(() => {
    const now = new Date();
    return history
      .filter((a: any) => a.id !== appointment.id && a.status !== 'Cancelled' && new Date(a.date) > now)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
  }, [history, appointment.id]);

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
      nerveStimEntries(nerve).forEach(({ line, index: i }) => {
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
        <p className="text-xs font-medium text-muted-foreground">
          Marked Stims ({data.stims.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.stims.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1 pl-1.5 pr-0.5 py-0.5 rounded-md text-[10px] font-medium bg-chart-destructive/10 text-chart-destructive border border-chart-destructive/20"
            >
              {s.side && <span className="font-semibold">{s.side}</span>}
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
          nerveStimAllIndexes(nerve).forEach((i) => {
            if (isLateralStim(nerve.id, i)) delete next[cranialSideKey(nerve.id, i, item.side!)];
          });
        } else {
          nerveStimAllIndexes(nerve).forEach((i) => {
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
  const snsDone = [
    appointment.lymphatic_notes && 'Lymphatic',
    appointment.harmonic_rocking_notes && 'Harmonic rocking',
    appointment.t1_reset_notes && 'T1 reset',
    appointment.diaphragm_reset_notes && 'Diaphragm',
    appointment.vagus_nerve_notes && 'Vagus',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      {/* Intro */}
      <PhaseHeader icon={ClipboardCheck} title="Embed" description="Re-challenge all inhibited findings, confirm integration, document homework, and schedule the follow-up session." />

      {/* Clinical Verification (Re-challenge) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            icon={RefreshCw}
            title="Clinical verification"
            hint="Re-challenge every inhibited finding to confirm integration"
          />
          <Badge variant="outline" className="shrink-0 border-border/70 bg-card font-medium tabular-nums text-muted-foreground">
            {pendingItems.length} pending
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : pendingItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pendingItems.map((item) => {
              const Icon = getIcon(item.category);
              const isClearing = clearingId === item.id;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs transition-colors hover:border-border">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-foreground">{item.name}</p>
                        {item.side && (
                          <Badge variant="outline" className="border-border px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
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
                    className="h-9 shrink-0 rounded-lg border border-chart-emerald/25 bg-chart-emerald/10 px-2.5 text-[11px] font-medium text-chart-emerald hover:bg-chart-emerald/20"
                  >
                    {isClearing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} className="mr-1.5" />}
                    Mark clear
                  </Button>
                </div>
              );
            })}
          </div>
        ) : inhibitedItems.length > 0 ? (
          <PhaseEmptyState
            icon={ShieldCheck}
            title="All findings integrated"
            description="No pending inhibitions. The system is balanced and ready for embedding."
          />
        ) : (
          <PhaseEmptyState
            icon={ClipboardCheck}
            title="No items to verify"
            description="No inhibited findings were recorded in the preliminary phase."
          />
        )}

        {clearedItems.length > 0 && (
          <PhasePanel className="mt-4 space-y-3">
            <SectionHeading
              icon={CheckCircle2}
              title="Cleared findings"
              badge={
                <span className="rounded-full bg-chart-emerald/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-chart-emerald">
                  {clearedItems.length}
                </span>
              }
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {clearedItems.map((item) => {
                const Icon = getIcon(item.category);
                const isClearing = clearingId === item.id;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-chart-emerald/20 bg-chart-emerald/[0.04] p-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-emerald/10 text-chart-emerald">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                          {item.side && (
                            <Badge variant="outline" className="border-chart-emerald/20 bg-chart-emerald/10 px-1 py-0 text-[10px] font-medium text-chart-emerald">
                              {item.side}
                            </Badge>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-[10px] font-medium text-chart-emerald">
                          <CheckCircle2 size={8} /> Cleared
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUndoClear(item)}
                      disabled={isClearing}
                      variant="ghost"
                      className="h-7 shrink-0 rounded-lg px-2 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {isClearing ? <Loader2 size={10} className="animate-spin" /> : 'Undo'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </PhasePanel>
        )}
      </div>

      {/* Session Summary */}
      <PhasePanel className="space-y-4">
        <SectionHeading icon={FileText} title="Session summary" hint="What changed, in one glance" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:divide-x lg:divide-border/60">
          {/* Intake & Vitals */}
          <div className="space-y-4 lg:pr-5">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Goal</p>
              <p className="text-xs font-medium leading-relaxed text-foreground">{appointment.goal || 'Not set'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">BOLT</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{appointment.bolt_score ? `${appointment.bolt_score}s` : '—'}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Coherence</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{appointment.coherence_score ? appointment.coherence_score.toFixed(2) : '—'}</p>
              </div>
            </div>
            {hasSnsResets && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">SNS resets</p>
                <div className="flex flex-wrap gap-1">
                  {snsDone.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 rounded-full border border-chart-emerald/20 bg-chart-emerald/[0.07] px-2 py-0.5 text-[10px] font-medium text-chart-emerald">
                      <CheckCircle2 size={9} /> {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Findings */}
          <div className="space-y-2 lg:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Findings</p>
            <PathwayFindingsList
              priorityPattern={appointment.priority_pattern}
              showOnlyInhibited={false}
              className="max-h-[300px] overflow-y-auto pr-1"
            />
          </div>

          {/* Corrections */}
          <div className="space-y-4 lg:pl-5">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Corrections & balances</p>
              <p className="text-xs font-medium italic leading-relaxed text-muted-foreground">{appointment.modes_balances || 'No specific corrections logged.'}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Acupoints</p>
              <p className="text-xs font-medium text-primary">{appointment.acupoints || 'None recorded'}</p>
            </div>
            {appointment.emotion_primary_selection && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Emotional context</p>
                <Badge className="border-none bg-primary text-[10px] font-medium text-primary-foreground">{appointment.emotion_primary_selection}</Badge>
                {appointment.emotion_notes && <p className="mt-1 text-xs italic text-muted-foreground">"{appointment.emotion_notes}"</p>}
              </div>
            )}
          </div>
        </div>
      </PhasePanel>

      {/* Rebook */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-[0.07]"><CalendarPlus size={150} /></div>
        <div className="relative z-10 flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/20 shadow-inner backdrop-blur-md">
              <CalendarPlus size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Schedule follow-up</h3>
              {nextSession ? (
                <p className="text-sm font-medium text-primary-foreground/80">
                  Next session for {appointment.clients?.name} is already booked.
                </p>
              ) : (
                <p className="text-sm font-medium text-primary-foreground/80">Lock in the next session for {appointment.clients?.name}.</p>
              )}
            </div>
          </div>
          {nextSession ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-foreground/60">Next session</p>
                <p className="text-sm font-semibold">{format(new Date(nextSession.date), "EEE, MMM d · h:mm a")}</p>
              </div>
              <Button asChild className="h-10 rounded-lg border-none bg-background/20 px-4 text-xs font-medium text-primary-foreground backdrop-blur-md hover:bg-background/30">
                <Link to={`/appointments/${nextSession.id}`}>
                  <ExternalLink size={15} className="mr-2" /> View session
                </Link>
              </Button>
            </div>
          ) : (
            <Dialog open={bookNextOpen} onOpenChange={(open) => { setBookNextOpen(open); if (!open) setSelectedSlot(null); }}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-lg border-none bg-background/20 px-5 text-xs font-medium text-primary-foreground backdrop-blur-md hover:bg-background/30">
                  <Plus size={16} className="mr-2" /> Book next session
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
                    <div className="space-y-4">
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
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PhasePanel className="space-y-3">
          <SectionHeading icon={ClipboardCheck} title="Integration notes" hint="Re-test results and prescribed homework" />
          <EditableField
            field="session_north_star"
            label=""
            value={appointment.session_north_star}
            multiline
            placeholder="Document final re-test results and prescribed homework..."
            onSave={saveField}
            className="min-h-[200px] rounded-xl border border-border/60 bg-background/50 p-4"
          />
        </PhasePanel>
        <PhasePanel className="space-y-3">
          <SectionHeading icon={Target} title="Next session focus" hint="What to check when they return" />
          <EditableField
            field="next_session_note"
            label=""
            value={appointment.next_session_note}
            multiline
            placeholder="What to check at the next session? (e.g. Re-check Moro, sleep quality...)"
            onSave={saveField}
            className="min-h-[200px] rounded-xl border border-border/60 bg-background/50 p-4"
          />
        </PhasePanel>
      </div>
    </div>
  );
};

export default EmbedPhaseV2;