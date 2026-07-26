import { useState, useMemo } from "react";
import { GitBranch, Target, AlertCircle, Zap, Dumbbell, Baby, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { PhaseHeader } from "@/components/crm/v2/PhaseComponents";
import type { PhaseProps } from "@/components/crm/v2/v2-types";

const CATEGORY_LABELS: Record<string, string> = {
  primitiveReflexes: 'Primitive Reflex',
  cranialNerves: 'Cranial Nerve',
  muscles: 'Muscle',
  brainZones: 'Brain Zone',
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  primitiveReflexes: Baby,
  cranialNerves: Zap,
  muscles: Dumbbell,
  brainZones: Brain,
};

interface Finding {
  name: string;
  category: string;
  status: string;
  side?: 'L' | 'R';
  priorityLevel: 'priority' | null;
}

const AlignPhase = ({ appointment, onUpdate, saveField, updatePriorityPattern, onJumpToPhase }: PhaseProps) => {
  const pattern = safeParse(appointment.priority_pattern, {} as any);
  const meta = useMemo(() => {
    if (!appointment.metadata) return {};
    if (typeof appointment.metadata === 'string') return safeParse(appointment.metadata, {});
    return appointment.metadata;
  }, [appointment.metadata]);

  const priorities = pattern?.priorities || {};

  const [showOnlyPriority, setShowOnlyPriority] = useState(false);

  const allFindings = useMemo(() => {
    const items: Finding[] = [];
    Object.entries(pattern).forEach(([catKey, categoryItems]: [string, any]) => {
      if (catKey === 'priorities') return;
      Object.entries(categoryItems).forEach(([name, status]) => {
        if (status === 'Inhibited' || status === 'Inhibition' || status === 'Hypertonic') {
          const sideMatch = name.match(/\(([LR])\)$/);
          const side = sideMatch ? sideMatch[1] as 'L' | 'R' : undefined;
          const baseName = name.replace(/ \([LR]\)$/, '');
          const priorityKey = `${catKey}|${name}`;
          const pLevel = priorities[priorityKey] as 'priority' | undefined || null;
          items.push({ name: baseName, category: catKey, status: status as string, side, priorityLevel: pLevel });
        }
      });
    });
    items.sort((a, b) => {
      const scoreA = a.priorityLevel === 'priority' ? 1 : 0;
      const scoreB = b.priorityLevel === 'priority' ? 1 : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
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

  const priorityPathway = (meta as any)?.priority_pathway || "";

  const priorityCount = allFindings.filter(f => f.priorityLevel === 'priority').length;

  const handleSetPriority = async (finding: Finding) => {
    const key = `${finding.category}|${finding.name}${finding.side ? ` (${finding.side})` : ''}`;
    const currentLevel = priorities[key];
    const nextLevel = currentLevel === 'priority' ? null : 'priority';
    await updatePriorityPattern('priorities', key, nextLevel || 'Clear');
    onUpdate();
  };

  const setPriorityPathway = async (pathway: string) => {
    await saveField('metadata', { ...meta, priority_pathway: pathway });
    onUpdate();
    if (pathway) onJumpToPhase(3);
  };

  return (
    <div className="space-y-8">
      <PhaseHeader icon={GitBranch} title="Align" description="Review inhibited findings, set priorities, and choose the primary correction." />

      {/* Filter toggles */}
      {allFindings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
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
      )}

      {/* Findings grouped by category */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            const groups: Record<string, Finding[]> = {};
            filteredFindings.forEach(f => {
              if (!groups[f.category]) groups[f.category] = [];
              groups[f.category].push(f);
            });
            return Object.entries(groups).map(([catKey, findings]) => {
              const Icon = CATEGORY_ICONS[catKey];
              return (
                <div key={catKey} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon size={13} className="text-muted-foreground" />}
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{CATEGORY_LABELS[catKey] || catKey}</h4>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] font-medium text-muted-foreground">{findings.length}</span>
                  </div>
                  <div className="divide-y divide-border border border-border rounded-lg">
                    {findings.map((item, i) => {
                      const isPriority = item.priorityLevel === 'priority';
                      return (
                        <div key={`${item.category}-${item.name}-${item.side || ''}-${i}`} className={cn(
                          "flex items-center justify-between gap-4 py-3 px-4 transition-colors",
                          isPriority ? "bg-chart-emerald/8" : "hover:bg-muted/30"
                        )}>
                          <div className="flex items-center gap-3 min-w-0">
                            {Icon && <Icon size={16} className="shrink-0 text-muted-foreground" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {item.name}
                                {item.side && <span className="text-muted-foreground ml-1">({item.side})</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium">
                                {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSetPriority(item)}
                              className={cn(
                                "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border transition-all",
                                isPriority
                                  ? "bg-chart-emerald text-primary-foreground border-chart-emerald"
                                  : "bg-card border-border text-muted-foreground hover:border-chart-emerald/50 hover:text-chart-emerald"
                              )}
                            >
                              1°
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-lg ml-1"
                              onClick={() => setPriorityPathway(`${item.name}${item.side ? ` (${item.side})` : ''} — ${CATEGORY_LABELS[item.category] || item.category}`)}
                            >
                              Set 1°
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
          <AlertCircle size={24} className="text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">
            {allFindings.length === 0
              ? "No inhibited findings yet. Complete assessments in Preliminary first."
              : "No findings match the current filter."}
          </p>
        </div>
      )}

      {/* Priority Pathway */}
      {priorityPathway && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
          <Target size={18} className="text-primary shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Priority Pathway</p>
            <p className="text-sm font-semibold text-foreground">{priorityPathway}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-[10px] text-muted-foreground hover:bg-muted rounded-lg"
            onClick={() => setPriorityPathway('')}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default AlignPhase;
