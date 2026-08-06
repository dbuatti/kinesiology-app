import { useState, useMemo } from "react";
import { GitBranch, Target, Route, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { PhaseHeader } from "@/components/crm/v2/PhaseComponents";
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
    const pattern = safeParse(appointment.priority_pattern, {});
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
                      const itemPathway = findingLabel(item.category, item.name, item.side);
                      const isPathway = priorityPathway === itemPathway;
                      const stims =
                        item.category === 'cranialNerves'
                          ? nerveStimsFor(item.name, item.side)
                          : [];
                      return (
                        <div key={`${item.category}-${item.name}-${item.side || ''}-${i}`} className={cn(
                          "transition-colors",
                          isPriority ? "bg-chart-emerald/8" : "hover:bg-muted/30",
                          isPathway && "ring-1 ring-inset ring-primary/30"
                        )}>
                          <div className="flex items-center justify-between gap-4 py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {Icon && <Icon size={16} className="shrink-0 text-muted-foreground" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {item.name}
                                {item.side && <span className="text-muted-foreground ml-1">({item.side})</span>}
                                {isPathway && (
                                  <span className="ml-1.5 inline-block align-middle text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                    pathway
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium">
                                {CATEGORY_LABELS[item.category] || item.category} · {item.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              title={isPriority ? "Remove from 1° priorities" : "Mark as 1° priority"}
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
                              title="Choose this finding as the correction pathway and open Correct"
                              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-lg ml-1"
                              onClick={() => setPriorityPathway(itemPathway)}
                            >
                              <Route size={11} className="mr-1" /> Set Pathway
                            </Button>
                          </div>
                          </div>
                          {stims.length > 0 && (
                            <div className="border-t border-border/50">
                              <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Stims</span>
                                <span className="text-[9px] font-medium text-muted-foreground/60">{stims.length}</span>
                              </div>
                              <div className="px-4 pb-2.5 space-y-1">
                                {stims.map(entry => {
                                  const status = stimStatus(entry.stimKey);
                                  const isPriority = status === 'priority' || status === 'primary';
                                  const isPrimary = status === 'primary';
                                  return (
                                    <div key={entry.stimKey} className="flex items-center justify-between gap-3 rounded-lg bg-background/60 border border-border/50 pl-3 pr-2 py-1">
                                      <span className="text-xs text-foreground/80 min-w-0 truncate">
                                        {entry.side && <span className="font-black text-chart-destructive mr-1">{entry.side}</span>}
                                        {entry.label}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          title={isPriority ? "Remove from stim priorities" : "Mark this stim as 1° priority"}
                                          onClick={() => setStimPriority(entry.stimKey, !isPriority)}
                                          className={cn(
                                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
                                            isPriority
                                              ? "bg-chart-emerald text-primary-foreground border-chart-emerald"
                                              : "bg-card border-border text-muted-foreground hover:border-chart-emerald/50 hover:text-chart-emerald"
                                          )}
                                        >
                                          1°
                                        </button>
                                        <button
                                          type="button"
                                          title={isPrimary ? "Remove primary stim (keeps 1°)" : "Set this stim as the primary priority"}
                                          onClick={() => setStimPrimary(entry.stimKey)}
                                          className={cn(
                                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
                                            isPrimary
                                              ? "bg-primary text-primary-foreground border-primary"
                                              : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
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
