import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  RotateCcw,
  CalendarPlus,
  Plus,
  Calendar,
  Target,
  FileText,
  Brain,
  Dumbbell,
  Baby,
  Zap,
  X,
  ExternalLink,
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
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import {
  Card,
  Section,
  SecondaryButton,
  StatusBadge,
  EmptyState,
  SectionHeader,
} from "./DesignSystem";

interface InhibitedItem {
  id: string;
  name: string;
  category: string;
  type: 'pattern' | 'muscle';
  status: string;
  side?: 'L' | 'R';
}

const EmbedPhaseV3 = ({ appointment, history, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const [muscleTests, setMuscleTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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

  const isDemo = appointment.id === DEMO_APPOINTMENT_ID;

  const fetchMuscleTests = useCallback(async () => {
    setLoadError(false);
    // Demo fixture has no backend rows — the pattern list drives the page.
    if (isDemo) {
      setMuscleTests([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('muscle_tests')
        .select('*')
        .eq('appointment_id', appointment.id);
      if (error) throw error;
      setMuscleTests(data || []);
    } catch (err) {
      console.error("Error fetching muscle tests:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [appointment.id, isDemo]);

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
      <div className="mt-2 space-y-2">
        <p className="text-[13px] font-medium text-muted-foreground">
          Marked stims ({data.stims.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {data.stims.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 py-1 pl-2 pr-1 text-[10px] font-medium text-destructive-strong"
            >
              {s.side && <span className="font-semibold">{s.side}</span>}
              <span className="max-w-[200px] truncate leading-snug">{s.label}</span>
              <button
                onClick={() => clearStim(item, s.key)}
                disabled={clearingStimId === s.key}
                className="rounded p-1 text-destructive transition-colors hover:bg-destructive hover:text-white"
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

  const clearStims = async (item: InhibitedItem) => {
    if (item.category === 'cranialNerves') {
      const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === item.name || n.name === item.name);
      const test = nerve && nerveTests.find(t => t.nerve_id === nerve.id.toString());
      if (nerve && test?.stim_results && !isDemo) {
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
      if (reflex && gridReflex && test?.stim_results && !isDemo) {
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
    if (clearingId) return;
    setClearingId(item.id);
    try {
      if (item.type === 'muscle') {
        if (!isDemo) {
          const { error } = await supabase.from('muscle_tests').update({ status: 'Normotonic' }).eq('id', item.id);
          if (error) throw error;
        }
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
    if (clearingId) return;
    setClearingId(item.id);
    try {
      if (item.type === 'muscle') {
        const priorStatus = (metadata.cleared_muscle_status || {})[item.id];
        if (priorStatus && !isDemo) {
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

  // Ease records completion in metadata.sns_resets — that is the source V3
  // writes. Sessions recorded before that only carry the per-technique note
  // fields, so fall back to them rather than showing an empty summary.
  const snsResets: Record<string, boolean> = (metadata as any)?.sns_resets || {};
  const SNS_SUMMARY: Array<{ key: string; label: string; note?: string | null }> = [
    { key: 'lymphatic', label: 'Lymphatic', note: appointment.lymphatic_notes },
    { key: 'harmonic', label: 'Harmonic rocking', note: appointment.harmonic_rocking_notes },
    { key: 't1', label: 'T1 reset', note: appointment.t1_reset_notes },
    { key: 'diaphragm', label: 'Diaphragm', note: appointment.diaphragm_reset_notes },
    { key: 'vagus', label: 'Vagus', note: appointment.vagus_nerve_notes },
    { key: 'other', label: 'Other', note: appointment.additional_notes },
  ];
  const hasTickedResets = Object.values(snsResets).some(Boolean);
  const snsDone = (hasTickedResets
    ? SNS_SUMMARY.filter((s) => snsResets[s.key])
    : SNS_SUMMARY.filter((s) => s.note)
  ).map((s) => s.label);
  const hasSnsResets = snsDone.length > 0;

  return (
    <Section className="space-y-5">

        {/* Clinical verification */}
        <Card padding="comfortable" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeader
              icon={RefreshCw}
              title="Clinical verification"
              subtitle="Re-challenge every inhibited finding to confirm integration"
            />
            <StatusBadge variant={pendingItems.length > 0 ? 'pending' : 'recorded'}>
              {pendingItems.length > 0 ? `${pendingItems.length} pending` : 'All clear'}
            </StatusBadge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
              <p className="text-meta">Loading findings…</p>
            </div>
          ) : loadError ? (
            <EmptyState
              icon={RefreshCw}
              title="Couldn't load muscle tests"
              description="The re-check list couldn't be fetched. Your recorded data is safe."
              action={
                <SecondaryButton onClick={() => { setLoading(true); fetchMuscleTests(); }} className="h-9 text-[13px]">
                  <RotateCcw size={13} /> Try again
                </SecondaryButton>
              }
            />
          ) : pendingItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {pendingItems.map((item) => {
                const Icon = getIcon(item.category);
                const isClearing = clearingId === item.id;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                        <Icon size={17} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-[13px] font-semibold leading-snug text-foreground">{item.name}</p>
                          {item.side && (
                            <span className="rounded-md border border-border px-2 py-0 text-[10px] font-medium text-muted-foreground">
                              {item.side}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{item.status}</p>
                        <ClearableStims item={item} />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleClearItem(item)}
                      disabled={!!clearingId}
                      aria-label={`Mark ${item.name} clear`}
                      title="Mark clear"
                      className="h-10 shrink-0 rounded-md border border-success/25 bg-success/10 px-2.5 text-xs font-semibold text-success-strong hover:bg-success/20 sm:px-3"
                    >
                      {isClearing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} className="sm:mr-2" />}
                      <span className="hidden sm:inline">Mark clear</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : inhibitedItems.length > 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="All findings integrated"
              description="No pending inhibitions. The system is balanced and ready for embedding."
            />
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="No items to verify"
              description="No inhibited findings were recorded in the preliminary phase."
              action={onJumpToPhase && (
                <SecondaryButton onClick={() => onJumpToPhase(0)} className="h-9 text-[13px]">
                  Go to Preliminary
                </SecondaryButton>
              )}
            />
          )}

          {clearedItems.length > 0 && (
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Cleared findings
                </p>
                <StatusBadge variant="recorded">{clearedItems.length}</StatusBadge>
              </div>
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                {clearedItems.map((item) => {
                  const Icon = getIcon(item.category);
                  const isClearing = clearingId === item.id;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/[0.04] p-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success-strong">
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-xs font-medium leading-snug text-foreground">{item.name}</p>
                            {item.side && (
                              <span className="rounded-md border border-success/20 bg-success/10 px-1 py-0 text-[10px] font-medium text-success-strong">
                                {item.side}
                              </span>
                            )}
                          </div>
                          <p className="flex items-center gap-1 text-[10px] font-medium text-success">
                            <CheckCircle2 size={8} /> Cleared
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUndoClear(item)}
                        disabled={isClearing}
                        variant="ghost"
                        className="h-8 shrink-0 rounded-md px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {isClearing ? <Loader2 size={10} className="animate-spin" /> : 'Undo'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Session summary */}
        <Card padding="comfortable" className="space-y-4">
          <SectionHeader icon={FileText} title="Session summary" subtitle="What changed, in one glance" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:divide-x xl:divide-border/60">
            <div className="space-y-4 xl:pr-6">
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
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">SNS resets</p>
                  <div className="flex flex-wrap gap-1">
                    {snsDone.map(label => (
                      <span key={label} className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/[0.07] px-2 py-1 text-[10px] font-medium text-success-strong">
                        <CheckCircle2 size={9} /> {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 xl:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Findings</p>
              <PathwayFindingsList
                priorityPattern={appointment.priority_pattern}
                showOnlyInhibited={false}
                className="max-h-[300px] overflow-y-auto pr-1"
              />
            </div>

            <div className="space-y-4 xl:pl-6">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Corrections &amp; balances</p>
                <p className="text-xs font-medium italic leading-relaxed text-muted-foreground">{appointment.modes_balances || 'No specific corrections logged.'}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Acupoints</p>
                <p className={cn("text-xs font-medium", appointment.acupoints ? "text-primary" : "text-muted-foreground")}>{appointment.acupoints || 'None recorded'}</p>
              </div>
              {appointment.emotion_primary_selection && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Emotional context</p>
                  <StatusBadge variant="recorded">{appointment.emotion_primary_selection}</StatusBadge>
                  {appointment.emotion_notes && <p className="mt-1 text-xs italic text-muted-foreground">"{appointment.emotion_notes}"</p>}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Rebook — the one deliberate saturated CTA */}
        <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground">
          <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-[0.07]"><CalendarPlus size={150} /></div>
          <div className="relative z-10 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-4">
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
                <Button asChild className="h-10 rounded-md border-none bg-background/20 px-4 text-xs font-medium text-primary-foreground backdrop-blur-md hover:bg-background/30">
                  <Link to={`/appointments/${nextSession.id}`}>
                    <ExternalLink size={15} className="mr-2" /> View session
                  </Link>
                </Button>
              </div>
            ) : (
              <Dialog open={bookNextOpen} onOpenChange={(open) => { setBookNextOpen(open); if (!open) setSelectedSlot(null); }}>
                <DialogTrigger asChild>
                  <Button className="h-10 rounded-md border-none bg-background/20 px-4 text-xs font-medium text-primary-foreground backdrop-blur-md hover:bg-background/30">
                    <Plus size={16} className="mr-2" /> Book next session
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 flex max-h-[90vh] w-[calc(100%-2rem)] flex-col rounded-2xl p-0 sm:max-w-[600px]">
                  <div className="shrink-0 border-b border-border px-8 pb-6 pt-8">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        {selectedSlot ? "Confirm Booking" : "Select Available Time"}
                      </DialogTitle>
                      <DialogDescription className="text-sm font-medium">
                        {selectedSlot ? `Finalise details for ${appointment.clients?.name}.` : `Live availability for ${appointment.clients?.name}.`}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-8 py-6">
                    {selectedSlot ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
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
          <Card padding="comfortable" className="space-y-3">
            <SectionHeader icon={ClipboardCheck} title="Integration notes" subtitle="Re-test results and prescribed homework" />
            <EditableField
              field="session_north_star"
              label=""
              value={appointment.session_north_star}
              multiline
              placeholder="Document final re-test results and prescribed homework…"
              onSave={saveField}
              className="textarea min-h-[140px]"
            />
          </Card>
          <Card padding="comfortable" className="space-y-3">
            <SectionHeader icon={Target} title="Next session focus" subtitle="What to check when they return" />
            <EditableField
              field="next_session_note"
              label=""
              value={appointment.next_session_note}
              multiline
              placeholder="What to check at the next session? (e.g. Re-check Moro, sleep quality…)"
              onSave={saveField}
              className="textarea min-h-[140px]"
            />
          </Card>
        </div>
    </Section>
  );
};

export default EmbedPhaseV3;
