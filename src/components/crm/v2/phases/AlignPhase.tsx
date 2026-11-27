import { useState, useMemo } from "react";
import { getReportSortPriority } from "@/lib/report-settings";
import { GitBranch, Target, Route, AlertCircle, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { PhaseHeader, PhaseEmptyState, PathwayBanner } from "@/components/crm/v2/PhaseComponents";
import { CATEGORY_LABELS, CATEGORY_ICONS, categoryTone } from "@/components/crm/v2/categoryConstants";
import {
  getInhibitedFindings,
  priorityKey,
  findingLabel,
  stimPriorityKey,
  normalizeFindingPriority,
  type FindingPriority,
} from "@/components/crm/v2/v2-utils";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import {
  nerveStimEntries,
  isLateralStim,
  cranialStimKey,
  cranialSideKey,
} from "@/components/crm/pathway-reflex-stim-data";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import PriorityTierControl from "@/components/crm/PriorityTierControl";
import { useCorrectionDock, type CorrectionTab } from "@/components/crm/corrections/CorrectionDockContext";

interface Finding {
  name: string;
  category: string;
  status: string;
  side?: 'L' | 'R';
  priorityLevel: FindingPriority | null;
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
      priorityLevel: f.priorityLevel,
    }));
    const sortByPriority = getReportSortPriority();
    const rank = (level: FindingPriority | null) => level === 'primary' ? 2 : level === 'priority' ? 1 : 0;
    items.sort((a, b) => {
      if (sortByPriority) {
        const scoreA = rank(a.priorityLevel);
        const scoreB = rank(b.priorityLevel);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [appointment.priority_pattern]);

  const filteredFindings = useMemo(() => {
    return allFindings.filter(f => {
      if (showOnlyPriority && f.priorityLevel === null) return false;
      return true;
    });
  }, [allFindings, showOnlyPriority]);

  const priorityPathway = (meta as any)?.priority_pathway || "";

  const priorityCount = allFindings.filter(f => f.priorityLevel !== null).length;
  const primaryCount = allFindings.filter(f => f.priorityLevel === 'primary').length;

  const allPriorities = useMemo(() => {
    const pattern = safeParse<Record<string, Record<string, string | undefined>>>(appointment.priority_pattern, {});
    return (pattern.priorities || {}) as Record<string, string | undefined>;
  }, [appointment.priority_pattern]);

  const stimStatus = (stimKey: string): FindingPriority | null =>
    normalizeFindingPriority(allPriorities[stimPriorityKey(stimKey)]);

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

  /** There is one primary priority per session, whether finding or stim. */
  const clearOtherPrimaries = async (exceptKey: string) => {
    for (const [key, value] of Object.entries(allPriorities)) {
      if (key !== exceptKey && normalizeFindingPriority(value) === 'primary') {
        await updatePriorityPattern('priorities', key, 'priority');
      }
    }
  };

  const setStimTier = async (stimKey: string, nextLevel: FindingPriority | null) => {
    const key = stimPriorityKey(stimKey);
    if (nextLevel === 'primary') await clearOtherPrimaries(key);
    await updatePriorityPattern('priorities', key, nextLevel);
    onUpdate();
  };

  const setFindingPriority = async (finding: Finding, nextLevel: FindingPriority | null) => {
    const key = priorityKey(
      finding.category,
      `${finding.name}${finding.side ? ` (${finding.side})` : ''}`,
    );
    if (nextLevel === 'primary') {
      await clearOtherPrimaries(key);
      await updatePriorityPattern('priorities', key, 'primary');
    } else {
      await updatePriorityPattern('priorities', key, nextLevel);
    }
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
                  ? "bg-card text-primary-strong shadow-xs ring-1 ring-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Target size={11} /> Priority <span className="tabular-nums text-muted-foreground/70">{priorityCount}</span>
            </button>
          </div>
          <p className="hidden text-[11px] text-muted-foreground/70 sm:block">
            {showOnlyPriority
              ? `Showing priority findings only${primaryCount > 0 ? ` · ${primaryCount} primary` : ''}`
              : 'Use None / Priority / Primary priority on each finding. Primary is the single main target.'}
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
              const tone = categoryTone(catKey);
              return (
                <section key={catKey} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                  <header className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-3.5 py-2">
                    {Icon && <Icon size={13} className={cn("shrink-0", tone.text)} />}
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                      {CATEGORY_LABELS[catKey] || catKey}
                    </h4>
                    <span className="ml-auto rounded-full bg-card px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
                      {findings.length}
                    </span>
                  </header>
                  <div className="divide-y divide-border/60">
                    {findings.map((item, i) => {
                      const isPrimary = item.priorityLevel === 'primary';
                      const isPriority = item.priorityLevel !== null;
                      const itemPathway = findingLabel(item.category, item.name, item.side);
                      const isPathway = priorityPathway === itemPathway;
                      const stims =
                        item.category === 'cranialNerves'
                          ? nerveStimsFor(item.name, item.side)
                          : [];
                      return (
                        <div key={`${item.category}-${item.name}-${item.side || ''}-${i}`} className={cn(
                          "transition-colors",
                          isPrimary
                            ? "bg-gold/[0.08] ring-1 ring-inset ring-gold/30"
                            : isPriority
                              ? "bg-primary/[0.05]"
                              : "hover:bg-muted/30",
                          isPathway && "bg-primary/[0.04] ring-1 ring-inset ring-primary/25"
                        )}>
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3.5 py-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {Icon && <Icon size={15} className={cn("shrink-0", tone.text)} />}
                              <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-semibold text-foreground">
                                  <span>{item.name}</span>
                                  {item.side && <span className="font-normal text-muted-foreground">({item.side})</span>}
                                  {isPrimary && (
                                    <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-strong ring-1 ring-gold/40">
                                      Primary priority
                                    </span>
                                  )}
                                  {isPathway && (
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-strong ring-1 ring-primary/20">
                                      Pathway
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground">
                                  {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <PriorityTierControl
                                value={item.priorityLevel}
                                onChange={(next) => setFindingPriority(item, next)}
                                label={`Priority level for ${item.name}${item.side ? ` (${item.side})` : ''}`}
                              />
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
                                {stims.map(entry => (
                                  <div key={entry.stimKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/60 py-1 pl-3 pr-2">
                                    <span className="min-w-0 truncate text-xs text-foreground/80">
                                      {entry.side && <span className="mr-1 font-semibold text-chart-destructive">{entry.side}</span>}
                                      {entry.label}
                                    </span>
                                    <PriorityTierControl
                                      compact
                                      value={stimStatus(entry.stimKey)}
                                      onChange={(next) => setStimTier(entry.stimKey, next)}
                                      label={`Priority level for stim ${entry.label}`}
                                    />
                                  </div>
                                ))}
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
