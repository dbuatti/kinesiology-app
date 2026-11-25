import { useState, useMemo } from "react";
import { getReportSortPriority } from "@/lib/report-settings";
import { Target, Route, BookMarked, ArrowRight, SearchX, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_ORDER, categoryTone } from "@/components/crm/v2/categoryConstants";
import { REFLEX_TRACKS, reflexSortRank } from "@/lib/reflex-order";
import {
  getInhibitedFindings,
  priorityKey,
  findingLabel,
  normalizeFindingPriority,
  type FindingPriority,
} from "@/components/crm/v2/v2-utils";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { markedCranialStims, type MarkedCranialStim } from "@/lib/cranial-stim-findings";
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

type MarkedStimEntry = MarkedCranialStim;

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
    const sortByPriority = getReportSortPriority();
    const categoryRank = (category: string) => {
      const index = CATEGORY_ORDER.indexOf(category);
      return index === -1 ? CATEGORY_ORDER.length : index;
    };
    const priorityRank = (level: FindingPriority | null) => level === 'primary' ? 2 : level === 'priority' ? 1 : 0;
    const sideRank = (side?: 'L' | 'R') => side === 'L' ? 0 : side === 'R' ? 1 : 2;
    items.sort((a, b) => {
      const categoryDiff = categoryRank(a.category) - categoryRank(b.category);
      if (categoryDiff !== 0) return categoryDiff;

      // Reflexes follow the clinical severity order, never the alphabet.
      if (a.category === 'primitiveReflexes') {
        const orderA = reflexSortRank(a.name);
        const orderB = reflexSortRank(b.name);
        if (orderA.track !== orderB.track) return orderA.track - orderB.track;
        if (orderA.index !== orderB.index) return orderA.index - orderB.index;
        return sideRank(a.side) - sideRank(b.side);
      }

      if (sortByPriority) {
        const scoreA = priorityRank(a.priorityLevel);
        const scoreB = priorityRank(b.priorityLevel);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      const byName = a.name.localeCompare(b.name);
      return byName !== 0 ? byName : sideRank(a.side) - sideRank(b.side);
    });
    return items;
  }, [appointment.priority_pattern]);

  const categoriesPresent = useMemo(
    () => CATEGORY_ORDER.filter(category => allFindings.some(f => f.category === category)),
    [allFindings],
  );

  const filteredFindings = useMemo(() => {
    return allFindings.filter(f => {
      if (filter === 'priority') return f.priorityLevel !== null;
      if (filter !== 'all') return f.category === filter;
      return true;
    });
  }, [allFindings, filter]);

  const findingGroups = useMemo(
    () => CATEGORY_ORDER
      .map(category => ({ category, items: filteredFindings.filter(f => f.category === category) }))
      .filter(group => group.items.length > 0),
    [filteredFindings],
  );

  const priorityPathway = (meta as Record<string, unknown>)?.priority_pathway as string || '';
  const priorityCount = allFindings.filter(f => f.priorityLevel !== null).length;
  const primaryCount = allFindings.filter(f => f.priorityLevel === 'primary').length;

  const allPriorities = useMemo(() => {
    const pattern = safeParse<Record<string, Record<string, string | undefined>>>(appointment.priority_pattern, {});
    return (pattern.priorities || {}) as Record<string, string | undefined>;
  }, [appointment.priority_pattern]);

  const patternNerves = useMemo(
    () => safeParse<Record<string, Record<string, string | undefined>>>(appointment.priority_pattern, {}).cranialNerves,
    [appointment.priority_pattern],
  );

  /** Stims are information on the nerve — never separate findings or pathways. */
  const nerveStimsFor = (name: string, side?: 'L' | 'R'): MarkedStimEntry[] => {
    const nerve = CRANIAL_NERVES.find(n => `${n.name}: ${n.latinName}` === name || n.name === name);
    if (!nerve) return [];
    const test = nerveTests.find(t => t.nerve_id === nerve.id.toString());
    return markedCranialStims({ nerve, patternNerves, stimResults: test?.stim_results, side });
  };

  /** There is one primary priority per session. */
  const clearOtherPrimaries = async (exceptKey: string) => {
    for (const [key, value] of Object.entries(allPriorities)) {
      if (key !== exceptKey && normalizeFindingPriority(value) === 'primary') {
        await updatePriorityPattern('priorities', key, 'priority');
      }
    }
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

  const renderFinding = (item: Finding) => {
    const Icon = CATEGORY_ICONS[item.category];
    const isPrimary = item.priorityLevel === 'primary';
    const isPriority = item.priorityLevel !== null;
    const itemPathway = findingLabel(item.category, item.name, item.side);
    const isPathway = priorityPathway === itemPathway;
    const stims = item.category === 'cranialNerves' ? nerveStimsFor(item.name, item.side) : [];
    const tone = categoryTone(item.category);
    return (
      <div
        key={`${item.category}-${item.name}-${item.side || ''}`}
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
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone.tile)}>
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
          <div className="border-t border-border/50 bg-muted/20 px-4 py-2.5">
            <div className="space-y-0.5">
              {stims.map(entry => (
                <div
                  key={entry.patternKey ?? entry.stimKey ?? `${entry.label}-${entry.side ?? ''}`}
                  className="flex items-baseline gap-1.5 text-[12px] leading-relaxed"
                >
                  <span className="font-semibold text-destructive">↓</span>
                  <span className="min-w-0 break-words text-foreground/80">
                    {entry.label}
                    {entry.side && <span className="text-muted-foreground"> ({entry.side})</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const reflexTrackGroups = (items: Finding[]) => {
    const groups = REFLEX_TRACKS.map(track => ({
      label: track.shortLabel,
      items: items.filter(item => reflexSortRank(item.name).track === track.num),
    })).filter(group => group.items.length > 0);
    const other = items.filter(item => reflexSortRank(item.name).track > REFLEX_TRACKS.length);
    if (other.length > 0) groups.push({ label: 'Other reflexes', items: other });
    return groups;
  };

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
        {findingGroups.length > 0 ? (
          <div className="space-y-4">
            {findingGroups.map(({ category, items }) => {
              const Icon = CATEGORY_ICONS[category];
              const tone = categoryTone(category);
              return (
                <section key={category} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    {Icon && <Icon size={12} className={cn("shrink-0", tone.text)} />}
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                    <span className="text-[10px] tabular-nums text-muted-foreground/50">{items.length}</span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                  {category === 'primitiveReflexes' ? (
                    <div className="space-y-2">
                      {reflexTrackGroups(items).map(group => (
                        <div key={group.label} className="space-y-1.5">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
                              {group.label}
                            </span>
                            <div className="h-px flex-1 bg-border/40" />
                          </div>
                          <Card padding="none" className="divide-y divide-border/60 overflow-hidden">
                            {group.items.map(renderFinding)}
                          </Card>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card padding="none" className="divide-y divide-border/60 overflow-hidden">
                      {items.map(renderFinding)}
                    </Card>
                  )}
                </section>
              );
            })}
          </div>
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
