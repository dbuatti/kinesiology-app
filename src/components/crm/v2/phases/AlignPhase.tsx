import { useState, useMemo } from "react";
import { GitBranch, Target, Route, AlertCircle, Star, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { PhaseHeader, PhaseEmptyState, PathwayBanner } from "@/components/crm/v2/PhaseComponents";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/components/crm/v2/categoryConstants";
import { getInhibitedFindings, priorityKey, findingLabel, stimPriorityKey } from "@/components/crm/v2/v2-utils";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import {
  nerveStimEntries,
  isLateralStim,
  cranialStimKey,
  cranialSideKey,
} from "@/components/crm/pathway-reflex-stim-data";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import { useCorrectionDock, type CorrectionTab } from "@/components/crm/corrections/CorrectionDockContext";

interface Finding {
  name: string;
  category: string;
  status: string;
  side?: 'L' | 'R';
  priorityLevel: 'priority' | null;
}

interface MarkedStimEntry {
  stimKey: string;
  label: string;
  side?: 'L' | 'R';
}

const AlignPhase = ({ appointment, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const { tests: nerveTests } = useCranialNerveTests(appointment.id, appointment.priority_pattern, updatePriorityPattern);
  const { openDock } = useCorrectionDock();

  // Brain-zone findings resolve efferently; everything else lands on the
  // afferent entry point so the practitioner isn't hunting for the section.
  const correctionTargetFor = (category: string): { tab: CorrectionTab; item: string } =>
    category === 'brainZones'
      ? { tab: 'efferent', item: 'cortical' }
      : { tab: 'afferent', item: 'mechanoreceptor' };

  const meta = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const [showOnlyPriority, setShowOnlyPriority] = useState(false);

  const allFindings = useMemo(() => {
    const items: Finding[] = getInhibitedFindings(appointment.priority_pattern).map(f => ({
      name: f.baseName,
      category: f.catKey,
      status: f.status,
      side: f.side,
      priorityLevel: f.priority ? 'priority' as const : null,
    }));
    items.sort((a, b) => {
      const scoreA = a.priorityLevel === 'priority' ? 1 : 0;
      const scoreB = b.priorityLevel === 'priority' ? 1 : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [appointment.priority_pattern]);

  const filteredFindings = useMemo(() => {
    return allFindings.filter(f => {
      if (showOnlyPriority && f.priorityLevel !== 'priority') return false;
      return true;
    });
  }, [allFindings, showOnlyPriority]);

  const priorityPathway = (meta as any)?.priority_pathway || "";

  const priorityCount = allFindings.filter(f => f.priorityLevel === 'priority').length;

  const stimPriorities = useMemo(() => {
    const pattern = safeParse<Record<string, any>>(appointment.priority_pattern, {});
    return (pattern.priorities || {}) as Record<string, string>;
  }, [appointment.priority_pattern]);

  const stimStatus = (stimKey: string): 'priority' | 'primary' | null => {
    const status = stimPriorities[stimPriorityKey(stimKey)];
    if (status === 'primary') return 'primary';
    if (status === 'priority') return 'priority';
    return null;
  };

  const nerveStimsFor = (name: string, side?: 'L' | 'R'): MarkedStimEntry[] => {
    const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === name);
    if (!nerve) return [];
    const test = nerveTests.find(t => t.nerve_id === nerve.id.toString());
    const stimResults = test?.stim_results;
    const out: MarkedStimEntry[] = [];
    nerveStimEntries(nerve).forEach(({ line, index: i }) => {
      if (isLateralStim(nerve.id, i)) {
        (['L', 'R'] as const).forEach(s => {
          if (!side || s === side) {
            const key = cranialSideKey(nerve.id, i, s);
            if (stimResults?.[key]) out.push({ stimKey: key, label: line, side: s });
          }
        });
      } else if (!side) {
        const key = cranialStimKey(nerve.id, i);
        if (stimResults?.[key]) out.push({ stimKey: key, label: line });
      }
    });
    return out;
  };

  const setStimPriority = async (stimKey: string, isPriority: boolean) => {
    const current = stimStatus(stimKey);
    if (isPriority && !current) {
      await updatePriorityPattern('priorities', stimPriorityKey(stimKey), 'priority');
    } else if (!isPriority && (current === 'priority' || current === 'primary')) {
      await updatePriorityPattern('priorities', stimPriorityKey(stimKey), null);
    }
    onUpdate();
  };

  const setStimPrimary = async (stimKey: string) => {
    const current = stimStatus(stimKey);
    if (current === 'primary') {
      await updatePriorityPattern('priorities', stimPriorityKey(stimKey), 'priority');
    } else {
      const primaryKeys = Object.keys(stimPriorities).filter(k => stimPriorities[k] === 'primary');
      for (const k of primaryKeys) {
        await updatePriorityPattern('priorities', k, null);
      }
      await updatePriorityPattern('priorities', stimPriorityKey(stimKey), 'primary');
    }
    onUpdate();
  };

  const handleSetPriority = async (finding: Finding) => {
    const key = priorityKey(finding.category, `${finding.name}${finding.side ? ` (${finding.side})` : ''}`);
    const currentLevel = finding.priorityLevel === 'priority';
    await updatePriorityPattern('priorities', key, currentLevel ? null : 'priority');
    onUpdate();
  };

  const setPriorityPathway = async (pathway: string) => {
    await saveField('metadata', { ...meta, priority_pathway: pathway });
    onUpdate();
    if (pathway) onJumpToPhase(3);
  };

  return (
    <div className="space-y-4">
      <PhaseHeader icon={GitBranch} title="Align" description="Review inhibited findings, set priorities, and choose the primary correction." />

      {/* The session's chosen correction, kept above the list so it never gets lost. */}
      {priorityPathway && (
        <PathwayBanner
          icon={Target}
          value={priorityPathway}
          actions={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-2 text-[11px] font-medium text-muted-foreground hover:bg-background/60"
              onClick={() => setPriorityPathway('')}
            >
              Clear
            </Button>
          }
        />
      )}

      {/* Filter toggles */}
      {allFindings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-1">
            <button
              onClick={() => setShowOnlyPriority(false)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
                !showOnlyPriority
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All <span className="tabular-nums text-muted-foreground/70">{allFindings.length}</span>
            </button>
            <button
              onClick={() => setShowOnlyPriority(!showOnlyPriority)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
                showOnlyPriority
                  ? "bg-card text-chart-emerald shadow-xs ring-1 ring-chart-emerald/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Target size={11} /> 1° <span className="tabular-nums text-muted-foreground/70">{priorityCount}</span>
            </button>
          </div>
          <p className="hidden text-[11px] text-muted-foreground/70 sm:block">
            {showOnlyPriority ? "Showing priority findings only" : "Tap 1° on a finding to mark it as priority"}
          </p>
        </div>
      )}

      {/* Findings grouped by category */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-3">
          {(() => {
            const groups: Record<string, Finding[]> = {};
            filteredFindings.forEach(f => {
              if (!groups[f.category]) groups[f.category] = [];
              groups[f.category].push(f);
            });
            return Object.entries(groups).map(([catKey, findings]) => {
              const Icon = CATEGORY_ICONS[catKey];
              return (
                <section key={catKey} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                  <header className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-3.5 py-2">
                    {Icon && <Icon size={13} className="shrink-0 text-muted-foreground" />}
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                      {CATEGORY_LABELS[catKey] || catKey}
                    </h4>
                    <span className="ml-auto rounded-full bg-card px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
                      {findings.length}
                    </span>
                  </header>
                  <div className="divide-y divide-border/60">
                    {findings.map((item, i) => {
                      const isPriority = item.priorityLevel === 'priority';
                      const itemPathway = findingLabel(item.category, item.name, item.side);
                      const isPathway = priorityPathway === itemPathway;
                      const stims =
                        item.category === 'cranialNerves'
                          ? nerveStimsFor(item.name, item.side)
                          : [];
                      return (
                        <div key={`${item.category}-${item.name}-${item.side || ''}-${i}`} className={cn(
                          "transition-colors",
                          isPriority ? "bg-chart-emerald/[0.06]" : "hover:bg-muted/30",
                          isPathway && "bg-primary/[0.04] ring-1 ring-inset ring-primary/25"
                        )}>
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3.5 py-2.5 sm:flex-nowrap">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {Icon && <Icon size={15} className="shrink-0 text-muted-foreground" />}
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-foreground">
                                  {item.name}
                                  {item.side && <span className="ml-1 font-normal text-muted-foreground">({item.side})</span>}
                                  {isPathway && (
                                    <span className="ml-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wider text-primary-strong ring-1 ring-primary/20">
                                      pathway
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground">
                                  {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                title={isPriority ? "Remove from 1° priorities" : "Mark as 1° priority"}
                                aria-pressed={isPriority}
                                onClick={() => handleSetPriority(item)}
                                className={cn(
                                  "h-9 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors",
                                  isPriority
                                    ? "border-chart-emerald bg-chart-emerald text-white"
                                    : "border-border/70 bg-card text-muted-foreground hover:border-chart-emerald/50 hover:text-chart-emerald"
                                )}
                              >
                                1°
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Open the corrections reference for this finding"
                                aria-label="Open corrections reference"
                                className="h-9 w-9 rounded-lg p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => openDock(correctionTargetFor(item.category))}
                              >
                                <BookMarked size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Choose this finding as the correction pathway and open Correct"
                                className="h-9 rounded-lg px-2.5 text-[11px] font-medium text-primary-strong hover:bg-primary/10"
                                onClick={() => setPriorityPathway(itemPathway)}
                              >
                                <Route size={12} className="mr-1" /> Set pathway
                              </Button>
                            </div>
                          </div>
                          {stims.length > 0 && (
                            <div className="border-t border-border/50">
                              <div className="flex items-center gap-1.5 px-3.5 pt-2 pb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Stims</span>
                                <span className="text-[10px] tabular-nums text-muted-foreground/60">{stims.length}</span>
                              </div>
                              <div className="space-y-1 px-3.5 pb-2.5">
                                {stims.map(entry => {
                                  const status = stimStatus(entry.stimKey);
                                  const isPriority = status === 'priority' || status === 'primary';
                                  const isPrimary = status === 'primary';
                                  return (
                                    <div key={entry.stimKey} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/60 py-1 pl-3 pr-2">
                                      <span className="min-w-0 truncate text-xs text-foreground/80">
                                        {entry.side && <span className="mr-1 font-semibold text-chart-destructive">{entry.side}</span>}
                                        {entry.label}
                                      </span>
                                      <div className="flex shrink-0 items-center gap-1">
                                        <button
                                          type="button"
                                          title={isPriority ? "Remove from stim priorities" : "Mark this stim as 1° priority"}
                                          onClick={() => setStimPriority(entry.stimKey, !isPriority)}
                                          className={cn(
                                            "h-6 cursor-pointer rounded border px-1.5 text-[10px] font-semibold transition-colors",
                                            isPriority
                                              ? "border-chart-emerald bg-chart-emerald text-white"
                                              : "border-border bg-card text-muted-foreground hover:border-chart-emerald/50 hover:text-chart-emerald"
                                          )}
                                        >
                                          1°
                                        </button>
                                        <button
                                          type="button"
                                          title={isPrimary ? "Remove primary stim (keeps 1°)" : "Set this stim as the primary priority"}
                                          onClick={() => setStimPrimary(entry.stimKey)}
                                          className={cn(
                                            "inline-flex h-6 cursor-pointer items-center gap-1 rounded border px-1.5 text-[10px] font-semibold transition-colors",
                                            isPrimary
                                              ? "border-primary bg-primary text-primary-foreground"
                                              : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
                                          )}
                                        >
                                          <Star size={9} /> Primary
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            });
          })()}
        </div>
      ) : (
        <PhaseEmptyState
          icon={AlertCircle}
          title={allFindings.length === 0 ? "No inhibited findings yet" : "Nothing matches this filter"}
          description={
            allFindings.length === 0
              ? "Complete the assessments in Preliminary and the inhibited findings will collect here."
              : "Switch back to All to see every finding for this session."
          }
        />
      )}
    </div>
  );
};

export default AlignPhase;
