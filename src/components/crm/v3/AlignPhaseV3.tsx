import { useState, useMemo } from "react";
import { Target, Route, Star, BookMarked, ArrowRight, SearchX, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/components/crm/v2/categoryConstants";
import { getInhibitedFindings, priorityKey, findingLabel, stimPriorityKey } from "@/components/crm/v2/v2-utils";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import {
  nerveStimLines,
  isLateralStim,
  cranialStimKey,
  cranialSideKey,
} from "@/components/crm/pathway-reflex-stim-data";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import { useCorrectionDock, type CorrectionTab } from "@/components/crm/corrections/CorrectionDockContext";
import {
  Card,
  Section,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  StatusBadge,
  EmptyState,
  ConfirmationFooter,
} from "./DesignSystem";

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

type Filter = 'all' | 'priority' | string;

const AlignPhaseV3 = ({ appointment, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const { tests: nerveTests } = useCranialNerveTests(appointment.id, appointment.priority_pattern, updatePriorityPattern);
  const { openDock } = useCorrectionDock();

  const correctionTargetFor = (category: string): { tab: CorrectionTab; item: string } =>
    category === 'brainZones'
      ? { tab: 'efferent', item: 'cortical' }
      : { tab: 'afferent', item: 'mechanoreceptor' };

  const meta = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const [filter, setFilter] = useState<Filter>('all');

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

  const categoriesPresent = useMemo(() => {
    const order: string[] = [];
    allFindings.forEach(f => { if (!order.includes(f.category)) order.push(f.category); });
    return order;
  }, [allFindings]);

  const filteredFindings = useMemo(() => {
    return allFindings.filter(f => {
      if (filter === 'priority') return f.priorityLevel === 'priority';
      if (filter !== 'all') return f.category === filter;
      return true;
    });
  }, [allFindings, filter]);

  const priorityPathway = (meta as any)?.priority_pathway || '';
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
    nerveStimLines(nerve).forEach((line, i) => {
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

  const countFor = (f: Filter) =>
    f === 'all' ? allFindings.length
    : f === 'priority' ? priorityCount
    : allFindings.filter(x => x.category === f).length;

  return (
    <Section className="space-y-5">

        {/* Priority pathway card — always visible, strong when set */}
        {priorityPathway ? (
          <Card padding="comfortable" className="border-primary/25 bg-primary/[0.05]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-strong">
                  <Target size={17} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary/80">
                    Priority pathway
                  </p>
                  <p className="text-[15px] font-semibold leading-snug text-foreground">
                    {priorityPathway}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <GhostButton onClick={() => setPriorityPathway('')} className="h-9 text-[13px]">
                  Change
                </GhostButton>
                <PrimaryButton onClick={() => onJumpToPhase(3)} className="h-9 text-[13px]">
                  Open in Correct <ArrowRight size={14} />
                </PrimaryButton>
              </div>
            </div>
          </Card>
        ) : (
          <Card padding="comfortable" className="border-dashed">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                  <Target size={17} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">No priority pathway chosen</p>
                  <p className="text-meta">Tap Set pathway on a finding below to choose the correction target.</p>
                </div>
              </div>
              {priorityCount > 0 && (
                <StatusBadge variant="pending">{priorityCount} marked 1°</StatusBadge>
              )}
            </div>
          </Card>
        )}

        {/* Filter chips */}
        {allFindings.length > 0 && (
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex w-max items-center gap-1 rounded-xl border border-border/50 bg-muted/40 p-1">
              {(['all', 'priority', ...categoriesPresent] as Filter[]).map((f) => {
                const active = filter === f;
                const label = f === 'all' ? 'All' : f === 'priority' ? '1° Priority' : (CATEGORY_LABELS[f] || f);
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={active}
                    className={cn(
                      'flex h-8 items-center gap-2 whitespace-nowrap rounded-md px-2 text-xs font-medium transition-colors',
                      active
                        ? 'bg-card text-foreground shadow-xs ring-1 ring-border/50'
                        : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                    )}
                  >
                    {f === 'priority' && <Target size={11} className={active ? 'text-success' : undefined} />}
                    {label}
                    <span className="tabular-nums text-muted-foreground/70">{countFor(f)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Findings list */}
        {filteredFindings.length > 0 ? (
          <Card padding="none" className="divide-y divide-border/60 overflow-hidden">
            {filteredFindings.map((item, i) => {
              const Icon = CATEGORY_ICONS[item.category];
              const isPriority = item.priorityLevel === 'priority';
              const itemPathway = findingLabel(item.category, item.name, item.side);
              const isPathway = priorityPathway === itemPathway;
              const stims = item.category === 'cranialNerves' ? nerveStimsFor(item.name, item.side) : [];
              return (
                <div
                  key={`${item.category}-${item.name}-${item.side || ''}-${i}`}
                  className={cn(
                    'transition-colors',
                    (isPriority || isPathway) ? 'bg-primary/[0.05]' : 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        isPriority ? 'bg-primary/10 text-primary-strong' : 'bg-muted/60 text-muted-foreground'
                      )}>
                        {Icon && <Icon size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold text-foreground">
                          <span className="truncate">{item.name}</span>
                          {item.side && <span className="font-normal text-muted-foreground">({item.side})</span>}
                          {isPathway && <StatusBadge variant="recorded">Pathway</StatusBadge>}
                        </p>
                        <p className="mt-1 text-meta">
                          {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        title={isPriority ? 'Remove from 1° priorities' : 'Mark as 1° priority'}
                        aria-pressed={isPriority}
                        onClick={() => handleSetPriority(item)}
                        className={cn(
                          'h-10 rounded-md border px-4 text-[13px] font-semibold transition-colors',
                          isPriority
                            ? 'border-success bg-success text-white'
                            : 'border-border bg-background text-muted-foreground hover:border-success/60 hover:text-success'
                        )}
                      >
                        1°
                      </button>
                      <button
                        type="button"
                        title="Open the corrections reference for this finding"
                        aria-label="Open corrections reference"
                        onClick={() => openDock(correctionTargetFor(item.category))}
                        className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <BookMarked size={15} />
                      </button>
                      <SecondaryButton
                        onClick={() => setPriorityPathway(itemPathway)}
                        title="Choose this finding as the correction pathway and open Correct"
                        className="h-10 text-[13px]"
                      >
                        <Route size={13} /> Set pathway
                      </SecondaryButton>
                    </div>
                  </div>
                  {stims.length > 0 && (
                    <div className="border-t border-border/50 bg-muted/20 px-4 py-2">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Stims</span>
                        <span className="text-[10px] tabular-nums text-muted-foreground/60">{stims.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stims.map(entry => {
                          const status = stimStatus(entry.stimKey);
                          const stimIsPriority = status === 'priority' || status === 'primary';
                          const isPrimary = status === 'primary';
                          return (
                            <div key={entry.stimKey} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card py-2 pl-3 pr-2">
                              <span className="min-w-0 truncate text-[13px] text-foreground/80">
                                {entry.side && <span className="mr-2 font-semibold text-destructive">{entry.side}</span>}
                                {entry.label}
                              </span>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  title={stimIsPriority ? 'Remove from stim priorities' : 'Mark this stim as 1° priority'}
                                  onClick={() => setStimPriority(entry.stimKey, !stimIsPriority)}
                                  className={cn(
                                    'h-7 rounded-md border px-2 text-[11px] font-semibold transition-colors',
                                    stimIsPriority
                                      ? 'border-success bg-success text-white'
                                      : 'border-border bg-background text-muted-foreground hover:border-success/60 hover:text-success'
                                  )}
                                >
                                  1°
                                </button>
                                <button
                                  type="button"
                                  title={isPrimary ? 'Remove primary stim (keeps 1°)' : 'Set this stim as the primary priority'}
                                  onClick={() => setStimPrimary(entry.stimKey)}
                                  className={cn(
                                    'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition-colors',
                                    isPrimary
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary'
                                  )}
                                >
                                  <Star size={10} /> Primary
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
          </Card>
        ) : (
          <Card padding="none">
            {allFindings.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No inhibited findings recorded yet"
                description="Complete the assessments in Preliminary — inhibited muscles, reflexes, nerves and brain zones will collect here for prioritisation."
                action={onJumpToPhase && (
                  <SecondaryButton onClick={() => onJumpToPhase(0)} className="h-9 text-[13px]">
                    <RotateCcw size={13} /> Go to Preliminary
                  </SecondaryButton>
                )}
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nothing matches this filter"
                description="Try a different filter to see the rest of this session's findings."
                action={
                  <SecondaryButton onClick={() => setFilter('all')} className="h-9 text-[13px]">
                    Show all findings
                  </SecondaryButton>
                }
              />
            )}
          </Card>
        )}

        {onJumpToPhase && allFindings.length > 0 && (
          <ConfirmationFooter
            title="Done with Align?"
            description="Next, run the correction."
            action={
              <PrimaryButton onClick={() => onJumpToPhase(3)} className="h-10 gap-2 px-4 text-sm font-medium">
                Continue to Correct <ArrowRight size={14} />
              </PrimaryButton>
            }
          />
        )}
    </Section>
  );
};

export default AlignPhaseV3;
