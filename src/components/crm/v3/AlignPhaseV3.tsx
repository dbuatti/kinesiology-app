import { useState, useMemo } from "react";
import { Target, Route, BookMarked, ArrowRight, SearchX, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/components/crm/v2/categoryConstants";
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
  nerveStimLines,
  isLateralStim,
  cranialStimKey,
  cranialSideKey,
} from "@/components/crm/pathway-reflex-stim-data";
import type { PhaseProps } from "@/components/crm/v2/v2-types";
import PriorityTierControl from "@/components/crm/PriorityTierControl";
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
  priorityLevel: FindingPriority | null;
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
      priorityLevel: f.priorityLevel,
    }));
    const rank = (level: FindingPriority | null) => level === 'primary' ? 2 : level === 'priority' ? 1 : 0;
    items.sort((a, b) => {
      const scoreA = rank(a.priorityLevel);
      const scoreB = rank(b.priorityLevel);
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
      if (filter === 'priority') return f.priorityLevel !== null;
      if (filter !== 'all') return f.category === filter;
      return true;
    });
  }, [allFindings, filter]);

  const priorityPathway = (meta as Record<string, unknown>)?.priority_pathway as string || '';
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
                  <p className="text-meta">
                    Use the None / Priority / Primary priority control on each finding. Primary is the single main target; Set pathway opens it in Correct.
                  </p>
                </div>
              </div>
              {priorityCount > 0 && (
                <StatusBadge variant="pending">
                  {priorityCount} priority{primaryCount > 0 ? ` · ${primaryCount} primary` : ''}
                </StatusBadge>
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
                const label = f === 'all' ? 'All' : f === 'priority' ? 'Priority' : (CATEGORY_LABELS[f] || f);
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
              const isPrimary = item.priorityLevel === 'primary';
              const isPriority = item.priorityLevel !== null;
              const itemPathway = findingLabel(item.category, item.name, item.side);
              const isPathway = priorityPathway === itemPathway;
              const stims = item.category === 'cranialNerves' ? nerveStimsFor(item.name, item.side) : [];
              return (
                <div
                  key={`${item.category}-${item.name}-${item.side || ''}-${i}`}
                  className={cn(
                    'transition-colors',
                    isPrimary
                      ? 'bg-gold/[0.08] ring-1 ring-inset ring-gold/30'
                      : isPriority || isPathway
                        ? 'bg-primary/[0.05]'
                        : 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        isPrimary
                          ? 'bg-gold/15 text-gold-strong'
                          : isPriority ? 'bg-primary/10 text-primary-strong' : 'bg-muted/60 text-muted-foreground'
                      )}>
                        {Icon && <Icon size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold text-foreground">
                          <span className="truncate">{item.name}</span>
                          {item.side && <span className="font-normal text-muted-foreground">({item.side})</span>}
                          {isPrimary && <StatusBadge variant="recorded" className="badge-gold">Primary priority</StatusBadge>}
                          {isPathway && <StatusBadge variant="recorded">Pathway</StatusBadge>}
                        </p>
                        <p className="mt-1 text-meta">
                          {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityTierControl
                        value={item.priorityLevel}
                        onChange={(next) => setFindingPriority(item, next)}
                        label={`Priority level for ${item.name}${item.side ? ` (${item.side})` : ''}`}
                      />
                      <button
                        type="button"
                        title="Open the corrections reference for this finding"
                        aria-label="Open corrections reference"
                        onClick={() => openDock(correctionTargetFor(item.category))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <BookMarked size={15} />
                      </button>
                      <SecondaryButton
                        onClick={() => setPriorityPathway(itemPathway)}
                        title="Choose this finding as the correction pathway and open Correct"
                        className="h-10 text-[12px]"
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
                        {stims.map(entry => (
                          <div key={entry.stimKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card py-2 pl-3 pr-2">
                            <span className="min-w-0 truncate text-[13px] text-foreground/80">
                              {entry.side && <span className="mr-2 font-semibold text-destructive">{entry.side}</span>}
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
