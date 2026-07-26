
import { useState, useMemo, type ReactNode } from 'react';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { MUSCLE_GROUPS } from '@/data/muscle-data';
import { getMuscleInfo } from '@/data/muscle-info-data';
import { Baby, Zap, Dumbbell, Brain, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  priorityLevel: 'priority' | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  muscles: { label: 'Muscles', icon: Dumbbell },
  primitiveReflexes: { label: 'Primitive Reflexes', icon: Baby },
  cranialNerves: { label: 'Cranial Nerves', icon: Zap },
  brainZones: { label: 'Brain Zones', icon: Brain },
};

const muscleDesc = (name: string) => {
  const info = getMuscleInfo(name);
  return info.meridian || undefined;
};

const SubHeader = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h3 id={id} className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 mt-10 border-l-4 border-border pl-3 scroll-mt-24">{children}</h3>
);

const AlignSection = ({ pattern, onToggle, onSetPriorityPathway, currentPathway }: AlignSectionProps) => {
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);

  const priorities = pattern?.priorities || {};

  const allFindings = useMemo(() => {
    const items: Finding[] = [];

    Object.entries(CATEGORY_CONFIG).forEach(([catKey, config]) => {
      const catItems = pattern?.[catKey];
      if (!catItems || typeof catItems !== 'object') return;

      Object.entries(catItems).forEach(([rawName, rawStatus]) => {
        const strStatus = rawStatus as string;
        const baseStatus = strStatus.replace('_Cleared', '');

        if (baseStatus !== 'Inhibited' && baseStatus !== 'Inhibition' && baseStatus !== 'Hypertonic') return;

        const sideMatch = rawName.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
        const baseName = rawName.replace(/ \([LR]\)$/, '');

        const priorityKey = `${catKey}|${rawName}`;
        const pLevel = priorities[priorityKey] as 'priority' | undefined || null;

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

    items.sort((a, b) => {
      const scoreA = a.priorityLevel === 'priority' ? 1 : 0;
      const scoreB = b.priorityLevel === 'priority' ? 1 : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [pattern, priorities]);

  const filteredFindings = useMemo(() => {
    return allFindings.filter(f => {
      if (showOnlyPriority && f.priorityLevel !== 'priority') return false;
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

  const handleSetPriority = (finding: Finding) => {
    const key = `${finding.category}|${finding.displayName}`;
    const currentLevel = priorities[key];
    const nextLevel = currentLevel === 'priority' ? null : 'priority';
    onToggle('priorities', key, nextLevel || 'Clear');
  };

  const handleSetPathway = (finding: Finding) => {
    if (!onSetPriorityPathway) return;
    const label = `${finding.name}${finding.side ? ` (${finding.side})` : ''} — ${finding.categoryName}`;
    onSetPriorityPathway(label);
  };

  const priorityCount = allFindings.filter(f => f.priorityLevel === 'priority').length;

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
            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
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
            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5",
            showOnlyPriority
              ? "bg-chart-emerald text-primary-foreground border-chart-emerald"
              : "bg-card border-border text-muted-foreground hover:border-chart-emerald/40"
          )}
        >
          <Target size={10} /> 1° ({priorityCount})
        </button>
      </div>

      {currentPathway && onSetPriorityPathway && (
        <div className="flex items-center gap-2.5 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <Target size={13} className="text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Priority Pathway</p>
            <p className="text-[11px] font-semibold text-foreground truncate">{currentPathway}</p>
          </div>
          <button
            onClick={() => onSetPriorityPathway('')}
            className="text-[9px] font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0"
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

          return (
            <div key={catKey} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={13} className="text-muted-foreground" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{config.label}</h4>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] font-medium text-muted-foreground">{findings.length}</span>
              </div>

              <div className="space-y-1">
                {findings.map((finding, idx) => {
                  const isPriority = finding.priorityLevel === 'priority';

                  return (
                    <div
                      key={`${finding.category}-${finding.displayName}-${idx}`}
                      className={cn(
                        "flex items-center justify-between gap-3 py-2 px-3 rounded-lg border transition-all",
                        isPriority
                          ? "bg-chart-emerald/8 border-chart-emerald/25"
                          : "bg-destructive/5 border-border hover:border-destructive/25"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0",
                          isPriority ? "bg-chart-emerald text-primary-foreground" :
                          "bg-destructive/15 text-destructive"
                        )}>
                          <Icon size={11} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-[11px] font-bold truncate",
                              isPriority && "text-chart-emerald",
                              !isPriority && "text-foreground"
                            )}>
                              {finding.name}
                            </span>
                            {finding.side && (
                              <span className="text-[9px] font-bold text-muted-foreground">({finding.side})</span>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground/60">
                            {finding.status}{finding.side ? ` · ${finding.side}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleSetPriority(finding)}
                          className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border transition-all",
                            isPriority
                              ? "bg-chart-emerald text-primary-foreground border-chart-emerald"
                              : "bg-card border-border text-muted-foreground hover:border-chart-emerald/50 hover:text-chart-emerald"
                          )}
                        >
                          1°
                        </button>
                        {onSetPriorityPathway && (
                          <button
                            onClick={() => handleSetPathway(finding)}
                            className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                          >
                            Set 1°
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
