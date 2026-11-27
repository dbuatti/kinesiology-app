
import { useState, useMemo } from 'react';
import { Baby, Zap, Dumbbell, Brain, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeFindingPriority, type FindingPriority } from '@/components/crm/v2/v2-utils';
import { categoryTone } from '@/components/crm/v2/categoryConstants';
import { splitCranialNervePattern } from '@/lib/cranial-stim-findings';
import PriorityTierControl from '@/components/crm/PriorityTierControl';

interface AlignSectionProps {
  pattern: any;
  onToggle: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
  onSetPriorityPathway?: (pathway: string) => void;
  currentPathway?: string;
}

interface Finding {
  category: string;
  categoryName: string;
  name: string;
  displayName: string;
  side?: 'L' | 'R';
  status: string;
  priorityLevel: FindingPriority | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  muscles: { label: 'Muscles', icon: Dumbbell },
  primitiveReflexes: { label: 'Primitive Reflexes', icon: Baby },
  cranialNerves: { label: 'Cranial Nerves', icon: Zap },
  brainZones: { label: 'Brain Zones', icon: Brain },
};

const AlignSection = ({ pattern, onToggle, onSetPriorityPathway, currentPathway }: AlignSectionProps) => {
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);

  const priorities = useMemo(() => pattern?.priorities || {}, [pattern]);

  const allFindings = useMemo(() => {
    const items: Finding[] = [];

    Object.entries(CATEGORY_CONFIG).forEach(([catKey, config]) => {
      const rawItems = pattern?.[catKey];
      if (!rawItems || typeof rawItems !== 'object') return;
      const catItems = catKey === 'cranialNerves'
        ? splitCranialNervePattern(rawItems).findings
        : rawItems;

      Object.entries(catItems).forEach(([rawName, rawStatus]) => {
        const strStatus = rawStatus as string;
        const baseStatus = strStatus.replace('_Cleared', '');

        if (baseStatus !== 'Inhibited' && baseStatus !== 'Inhibition' && baseStatus !== 'Hypertonic') return;

        const sideMatch = rawName.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = rawName.replace(/ \([LR]\)$/, '');

        const priorityKey = `${catKey}|${rawName}`;
        const pLevel = normalizeFindingPriority(priorities[priorityKey]);

        items.push({
          category: catKey,
          categoryName: config.label,
          name: baseName,
          displayName: rawName,
          side,
          status: baseStatus === 'Inhibition' ? 'Inhibited' : baseStatus,
          priorityLevel: pLevel,
          icon: config.icon,
        });
      });
    });

    const rank = (level: FindingPriority | null) => level === 'primary' ? 2 : level === 'priority' ? 1 : 0;
    items.sort((a, b) => {
      const scoreA = rank(a.priorityLevel);
      const scoreB = rank(b.priorityLevel);
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [pattern, priorities]);

  const filteredFindings = useMemo(() => {
    return allFindings.filter(f => {
      if (showOnlyPriority && f.priorityLevel === null) return false;
      return true;
    });
  }, [allFindings, showOnlyPriority]);

  const groupedFindings = useMemo(() => {
    const groups: Record<string, Finding[]> = {};
    filteredFindings.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, [filteredFindings]);

  const setFindingPriority = (finding: Finding, nextLevel: FindingPriority | null) => {
    const key = `${finding.category}|${finding.displayName}`;
    if (nextLevel === 'primary') {
      // One primary priority per session — replace any existing one.
      Object.entries(priorities).forEach(([otherKey, value]) => {
        if (otherKey !== key && normalizeFindingPriority(value) === 'primary') {
          onToggle('priorities', otherKey, 'priority');
        }
      });
    }
    onToggle('priorities', key, nextLevel ?? 'Clear');
  };

  const handleSetPathway = (finding: Finding) => {
    if (!onSetPriorityPathway) return;
    const label = `${finding.name}${finding.side ? ` (${finding.side})` : ''} — ${finding.categoryName}`;
    onSetPriorityPathway(label);
  };

  const priorityCount = allFindings.filter(f => f.priorityLevel !== null).length;
  const primaryCount = allFindings.filter(f => f.priorityLevel === 'primary').length;

  if (allFindings.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
        <Target size={24} className="text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">No inhibited findings yet. Complete assessments in Preliminary first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          onClick={() => setShowOnlyPriority(false)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
            !showOnlyPriority
              ? "bg-foreground text-primary-foreground border-foreground"
              : "bg-card border-border text-muted-foreground hover:border-foreground/40"
          )}
        >
          All ({allFindings.length})
        </button>
        <button
          onClick={() => setShowOnlyPriority(!showOnlyPriority)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5",
            showOnlyPriority
              ? "bg-primary/10 text-primary-strong border-primary/30"
              : "bg-card border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          <Target size={10} /> Priority ({priorityCount}){primaryCount > 0 ? ` · ${primaryCount} primary` : ''}
        </button>
      </div>

      {currentPathway && onSetPriorityPathway && (
        <div className="flex items-center gap-2.5 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <Target size={13} className="text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.14em]">Priority Pathway</p>
            <p className="text-[11px] font-semibold text-foreground truncate">{currentPathway}</p>
          </div>
          <button
            onClick={() => onSetPriorityPathway('')}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedFindings).map(([catKey, findings]) => {
          const config = CATEGORY_CONFIG[catKey];
          if (!config) return null;
          const Icon = config.icon;
          const tone = categoryTone(catKey);

          return (
            <div key={catKey} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={13} className={cn(tone.text)} />
                <h4 className="text-xs font-medium text-muted-foreground">{config.label}</h4>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground">{findings.length}</span>
              </div>

              <div className="space-y-1">
                {findings.map((finding, idx) => {
                  const isPrimary = finding.priorityLevel === 'primary';
                  const isPriority = finding.priorityLevel !== null;

                  return (
                    <div
                      key={`${finding.category}-${finding.displayName}-${idx}`}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 py-2 px-3 rounded-lg border transition-all",
                        isPrimary
                          ? "bg-gold/[0.08] border-gold/40"
                          : isPriority
                            ? "bg-primary/[0.05] border-primary/25"
                            : "bg-destructive/5 border-border hover:border-destructive/25"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0",
                          tone.tile
                        )}>
                          <Icon size={11} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn(
                              "text-[11px] font-bold truncate",
                              isPrimary ? "text-gold-strong" : isPriority ? "text-primary-strong" : "text-foreground"
                            )}>
                              {finding.name}
                            </span>
                            {finding.side && (
                              <span className="text-[10px] font-bold text-muted-foreground">({finding.side})</span>
                            )}
                            {isPrimary && (
                              <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-strong ring-1 ring-gold/40">
                                Primary priority
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground/60">
                            {finding.status}{finding.side ? ` · ${finding.side}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <PriorityTierControl
                          compact
                          value={finding.priorityLevel}
                          onChange={(next) => setFindingPriority(finding, next)}
                          label={`Priority level for ${finding.name}${finding.side ? ` (${finding.side})` : ''}`}
                        />
                        {onSetPriorityPathway && (
                          <button
                            type="button"
                            onClick={() => handleSetPathway(finding)}
                            title="Choose this finding as the correction pathway and open Correct"
                            className="px-2 py-1 rounded text-[11px] font-medium border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary-strong hover:border-primary/30 transition-all"
                          >
                            Set pathway
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlignSection;
