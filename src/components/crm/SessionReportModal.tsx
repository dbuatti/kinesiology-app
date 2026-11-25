import { Fragment, useState, useMemo, useCallback, useEffect } from "react";
import { getReportSortPriority } from "@/lib/report-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, CheckCircle2, ChevronDown, Search, BookOpen, Flag, Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { useCorrectionDock, type InhibitionPathwayStatus } from "@/components/crm/corrections/CorrectionDockContext";
import { PATHWAY_DIRECTION, directionForProcess, directionFromText } from "@/lib/pathway-direction";
import { clickableProps } from "@/lib/a11y";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ReflexCorrectionModal } from "@/components/crm/reflex-corrections/ReflexCorrectionModal";
import { itemCorrectionKey, itemPriorityKey, type ItemCorrection, type ReflexCorrectionDirection, type ReflexCorrectionPathway } from "@/components/crm/reflex-corrections/types";
import { normalizeFindingPriority, type FindingPriority } from "@/components/crm/v2/v2-utils";
import { categoryTone } from "@/components/crm/v2/categoryConstants";
import { collectCorrectionRecords, correctionSummary, removeQuickCorrectionRecord, upsertQuickCorrectionRecord } from "@/lib/corrections";
import { showUndo } from "@/utils/toast";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import {
  cranialNerveFullName,
  markedCranialStims,
  splitCranialNervePattern,
} from "@/lib/cranial-stim-findings";

interface Finding {
  type: string;
  key: string;
  name: string;
  status: string;
  side?: "L" | "R";
  category: string;
  correction?: string;
  cleared?: boolean;
  patternCategory: string;
  priorityTier: FindingPriority | null;
}

interface SessionMetadata {
  corrections?: any[];
  cleared_findings?: string[];
  [key: string]: any;
}

interface SessionReportModalProps {
  open: boolean;
  onClose: () => void;
  appointment: any;
  updateMetadata: (metadata: any) => Promise<void>;
  saveField: (field: string, value: any) => Promise<void>;
  onUpdate: () => void;
}

type CorrectionTarget = {
  finding: Finding;
  direction: ReflexCorrectionDirection;
  pathway: ReflexCorrectionPathway;
  correction?: ItemCorrection | null;
};

const CATEGORY_MAP: Record<string, string> = {
  Muscles: "muscles",
  Reflexes: "primitiveReflexes",
  "Cranial Nerves": "cranialNerves",
  "Brain Zones": "brainZones",
  "Eye Systems": "eyeSystems",
};

const CORRECTION_PROCESS_MAP: Record<string, { tab: 'afferent' | 'efferent'; item: string }> = {
  'Mechanoreceptor (Unconscious)': { tab: 'afferent', item: 'mechanoreceptor' },
  'Nociceptive (Physiological)': { tab: 'afferent', item: 'nociceptive' },
  'Physiological (Physiological)': { tab: 'afferent', item: 'physiological' },
  'Cortical (Efferent)': { tab: 'efferent', item: 'cortical' },
  'Subcortical (Efferent)': { tab: 'efferent', item: 'subcortical' },
  'Emotional (Efferent)': { tab: 'efferent', item: 'emotional' },
  'Heart Wall': { tab: 'efferent', item: 'hw-screen' },
  'Limiting Beliefs': { tab: 'efferent', item: 'lb-process' },
};

export default function SessionReportModal({ open, onClose, appointment, updateMetadata, saveField, onUpdate }: SessionReportModalProps) {
  const { openDock, selectInhibitionPathway, availableInhibitionPathways } = useCorrectionDock();
  const [activeTab, setActiveTab] = useState<'all' | 'findings' | 'pathways'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [correctionTarget, setCorrectionTarget] = useState<CorrectionTarget | null>(null);
  const [sortPriority, setSortPriorityState] = useState(() => getReportSortPriority());

  const pattern = useMemo(() => safeParse(appointment?.priority_pattern, {}) as Record<string, any>, [appointment?.priority_pattern]);
  const metadata = useMemo(() => safeParse(appointment?.metadata, {}) as SessionMetadata, [appointment?.metadata]);
  const correctionRecords = useMemo(() => collectCorrectionRecords({ priority_pattern: appointment?.priority_pattern, metadata: appointment?.metadata }), [appointment?.priority_pattern, appointment?.metadata]);

  useEffect(() => { if (open) setSortPriorityState(getReportSortPriority()); }, [open]);

  const patchPattern = useCallback(async (patchObj: Record<string, unknown>) => {
    const current = safeParse<Record<string, any>>(appointment?.priority_pattern, {});
    await saveField("priority_pattern", JSON.stringify({ ...current, ...patchObj }));
    onUpdate();
  }, [appointment?.priority_pattern, onUpdate, saveField]);

  const getPriorityTier = useCallback((finding: Finding): FindingPriority | null => {
    const priorities = (pattern?.priorities ?? {}) as Record<string, string | undefined>;
    const key = itemPriorityKey(finding.patternCategory, finding.name, finding.side);
    return normalizeFindingPriority(priorities[key]);
  }, [pattern]);

  const setPriorityTier = useCallback(async (finding: Finding, tier: FindingPriority | null) => {
    const priorities = { ...((pattern?.priorities ?? {}) as Record<string, string | undefined>) };
    const key = itemPriorityKey(finding.patternCategory, finding.name, finding.side);
    if (tier === "primary") {
      for (const k of Object.keys(priorities)) if (priorities[k] === "primary") priorities[k] = "priority";
    }
    if (tier) priorities[key] = tier; else delete priorities[key];
    await patchPattern({ priorities });
  }, [patchPattern, pattern]);

  const cyclePriority = useCallback(async (finding: Finding) => {
    const tier = getPriorityTier(finding);
    const next: FindingPriority | null = tier === null ? "priority" : tier === "priority" ? "primary" : null;
    await setPriorityTier(finding, next);
  }, [getPriorityTier, setPriorityTier]);

  const getCorrectionsFor = useCallback((finding: Finding): ItemCorrection[] => {
    const key = itemCorrectionKey(finding.patternCategory, finding.name, finding.side);
    const map = (pattern?.itemCorrections ?? {}) as Record<string, ItemCorrection[]>;
    if (Array.isArray(map[key]) && map[key].length) return map[key];
    // Fallback to normalized records from mirrored stores for legacy/incomplete data.
    return correctionRecords
      .filter((c) => (c.category === finding.patternCategory || !c.category) && (c.finding === finding.key || c.finding === `${finding.name}${finding.side ? ` (${finding.side})` : ""}` || c.name === finding.name))
      .map((c) => ({ id: c.id, pathway: (c.pathway as any) || 'mechanoreceptor', direction: (c.direction as any) || 'afferent', holding: c.status === 'clear' || !!c.holding, note: c.note, details: c.details, createdAt: c.createdAt || c.timestamp || new Date().toISOString(), updatedAt: c.updatedAt || c.timestamp || new Date().toISOString() } as ItemCorrection));
  }, [pattern, correctionRecords]);

  const findings = useMemo(() => {
    const items: Finding[] = [];
    const clearedSet = new Set<string>(metadata.cleared_findings || []);
    const priorities = (pattern?.priorities ?? {}) as Record<string, string | undefined>;

    const mk = (type: string, category: string, patternCategory: string, key: string, val: string) => {
      let name = key;
      let side: "L" | "R" | undefined;
      if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
      else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
      const findingLabel = side ? `${name} (${side})` : name;
      const correctionEntry = correctionRecords.find((c) => c?.finding === findingLabel || c?.finding === key || c?.name === name);
      const priorityTier = normalizeFindingPriority(priorities[itemPriorityKey(patternCategory, name, side)]);
      items.push({ type, key, name, status: val, side, category, correction: correctionEntry ? correctionSummary(correctionEntry) : undefined, cleared: clearedSet.has(`${patternCategory}-${key}`), patternCategory, priorityTier });
    };

    Object.entries(pattern.muscles || {}).forEach(([key, val]) => {
      if (['Inhibited','Inhibition','Hypertonic','Clear','Normotonic'].includes(String(val))) mk('muscle','Muscles','muscles',key,String(val));
    });
    Object.entries(pattern.primitiveReflexes || {}).forEach(([key, val]) => {
      if (['Inhibited','Inhibition'].includes(String(val))) mk('reflex','Reflexes','primitiveReflexes',key,'Inhibited');
    });
    // A checked stim implies its nerve is dysfunctional; split the pattern so
    // only the nerve is a finding and the stim stays as its information.
    Object.entries(splitCranialNervePattern(pattern.cranialNerves).findings).forEach(([key, val]) => {
      if (['Inhibited','Inhibition','Hypertonic'].includes(String(val))) mk('nerve','Cranial Nerves','cranialNerves',key,String(val));
    });
    Object.entries(pattern.brainZones || {}).forEach(([key, val]) => {
      if (['Inhibited','Inhibition','Hypertonic'].includes(String(val))) mk('brain','Brain Zones','brainZones',key,String(val));
    });
    Object.entries(pattern.eyeSystems || {}).forEach(([key, val]) => {
      if (['Inhibited','Inhibition','Hypertonic'].includes(String(val))) mk('eye','Eye Systems','eyeSystems',key,String(val));
    });

    const rank = (t: FindingPriority | null) => t === 'primary' ? 0 : t === 'priority' ? 1 : 2;
    if (sortPriority) items.sort((a,b) => rank(a.priorityTier) - rank(b.priorityTier) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return items;
  }, [pattern, metadata, sortPriority]);

  const stimsForNerveFinding = useCallback((finding: Finding): string[] => {
    if (finding.category !== 'Cranial Nerves') return [];
    const nerve = CRANIAL_NERVES.find(
      n => cranialNerveFullName(n) === finding.name || n.name === finding.name,
    );
    if (!nerve) return [];
    return markedCranialStims({
      nerve,
      patternNerves: (pattern?.cranialNerves ?? {}) as Record<string, unknown>,
      side: finding.side,
    }).map(stim => `${stim.label}${stim.side ? ` (${stim.side})` : ''}`);
  }, [pattern]);

  const pathways = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const c of correctionRecords) {
      const name = String(c.pathway || c.processId || "Correction");
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push({
        ...c,
        summary: correctionSummary(c),
        timestamp: c.timestamp || c.updatedAt || c.createdAt,
        values: c.details ?? {},
      });
    }
    return [...groups.entries()].map(([name, entries]) => ({
      id: name,
      name,
      entries: entries.sort((a,b) => String(a.timestamp||'').localeCompare(String(b.timestamp||''))),
      cleared: (metadata.cleared_findings || []).some((k: string) => k.includes(name)),
    }));
  }, [correctionRecords, metadata]);

  const getStatusColor = (s: string) => {
    if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-500/[0.08] border border-rose-500/25 text-rose-700 dark:text-rose-300';
    if (s === 'Hypertonic') return 'bg-amber-500/[0.08] border border-amber-500/25 text-amber-700 dark:text-amber-300';
    if (s === 'Clear' || s === 'Normotonic') return 'bg-primary/10 border border-primary/30 text-primary-strong dark:text-primary';
    return 'bg-muted text-muted-foreground';
  };

  const applyCorrection = useCallback(async (target: CorrectionTarget, correction: ItemCorrection) => {
    const finding = target.finding;
    const previous = (getCorrectionsFor(finding) as any[]).find((c) => c.id === correction.id);
    const next = upsertQuickCorrectionRecord({
      appointment: { priority_pattern: appointment?.priority_pattern, metadata: appointment?.metadata },
      category: finding.patternCategory,
      name: finding.name,
      side: finding.side,
      correction: { ...correction, updatedAt: new Date().toISOString() },
      previousPathway: previous?.pathway,
    });
    await saveField('priority_pattern', JSON.stringify(next.pattern));
    await saveField('metadata', JSON.stringify(next.metadata));
    onUpdate();
  }, [appointment?.metadata, appointment?.priority_pattern, getCorrectionsFor, onUpdate, saveField]);

  const removeCorrection = useCallback(async (finding: Finding, correctionId: string) => {
    if (!window.confirm("Remove this correction?")) return;
    const removed = (getCorrectionsFor(finding) as any[]).find((c) => c.id === correctionId) || null;
    const next = removeQuickCorrectionRecord({
      appointment: { priority_pattern: appointment?.priority_pattern, metadata: appointment?.metadata },
      category: finding.patternCategory,
      name: finding.name,
      side: finding.side,
      correctionId,
    });
    await saveField('priority_pattern', JSON.stringify(next.pattern));
    await saveField('metadata', JSON.stringify(next.metadata));
    onUpdate();
    if (removed) {
      showUndo("Correction removed.", async () => {
        await applyCorrection({ finding, direction: removed.direction, pathway: removed.pathway, correction: removed }, removed);
      });
    }
  }, [appointment?.metadata, appointment?.priority_pattern, applyCorrection, getCorrectionsFor, onUpdate, saveField]);

  const markPathwayCleared = async (pathwayId: string) => {
    const existing = metadata.cleared_findings || [];
    const key = `pathway-${pathwayId}`;
    const newCleared = existing.includes(key) ? existing.filter((k: string) => k !== key) : [...existing, key];
    await updateMetadata({ ...metadata, cleared_findings: newCleared });
  };

  const markFindingCleared = async (finding: Finding) => {
    const existing = metadata.cleared_findings || [];
    const key = `${finding.patternCategory}-${finding.key}`;
    const newCleared = existing.includes(key) ? existing.filter((k: string) => k !== key) : [...existing, key];
    await updateMetadata({ ...metadata, cleared_findings: newCleared });
  };

  // Map correction pathway name to inhibition pathway state for selectInhibitionPathway
  const getPathwayState = (pathwayName: string) => {
    // Find matching inhibition pathway from availableInhibitionPathways
    const match = availableInhibitionPathways.find(p => p.pathway.notes === pathwayName || p.pathway.processId === pathwayName);
    if (match) {
      return match;
    }
    // Fallback: create a basic pathway state from the process map
    const procMap = CORRECTION_PROCESS_MAP[pathwayName];
    if (procMap) {
      return {
        pathway: {
          processId: procMap.item,
          phase: procMap.tab,
          side: 'midline' as const,
          notes: pathwayName,
        },
        status: 'inhibited' as InhibitionPathwayStatus,
      };
    }
    return null;
  };

  // Map finding category to correction process (dock tab + item)
  const FINDING_CORRECTION_MAP: Record<string, { tab: 'afferent' | 'efferent'; item: string }> = {
    'Muscles': { tab: 'afferent', item: 'mechanoreceptor' },
    'Reflexes': { tab: 'afferent', item: 'nociceptive' },
    'Cranial Nerves': { tab: 'efferent', item: 'cortical' },
    'Brain Zones': { tab: 'efferent', item: 'subcortical' },
    'Eye Systems': { tab: 'efferent', item: 'cortical' },
  };

  const findMatchingPathway = (finding: Finding) => {
    return availableInhibitionPathways.find(p => {
      if (finding.category === 'Muscles') {
        return p.pathway.phase === 'muscle' && 
               p.pathway.notes === finding.name && 
               p.pathway.side === finding.side;
      }
      if (finding.category === 'Reflexes') {
        return p.pathway.phase === 'primitiveReflex' && 
               p.pathway.notes === finding.name &&
               (finding.side ? p.pathway.side === finding.side : p.pathway.side === 'midline');
      }
      if (finding.category === 'Cranial Nerves') {
        return p.pathway.phase === 'cranialNerve' && 
               p.pathway.notes === finding.name &&
               (finding.side ? p.pathway.side === finding.side : p.pathway.side === 'midline');
      }
      // Brain Zones and Eye Systems don't have inhibition pathways in availableInhibitionPathways
      // We'll create a synthetic one
      return false;
    });
  };

  const handleOpenFindingInManual = (finding: Finding) => {
    const procMap = FINDING_CORRECTION_MAP[finding.category];
    if (!procMap) {
      console.warn('[SessionReportModal] Unknown finding category:', finding.category);
      return;
    }

    // Try to find existing inhibition pathway, or create synthetic one
    let pathwayState = findMatchingPathway(finding);
    
    if (!pathwayState) {
      // Create synthetic pathway state for brain zones, eye systems, or unmatched findings
      const pid = `${finding.category.toLowerCase().replace(/\s+/g, '-')}-${finding.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${finding.side || 'midline'}`;
      pathwayState = {
        pathway: {
          processId: pid,
          phase: finding.category.toLowerCase().replace(/\s+/g, ''),
          side: (finding.side || 'midline') as 'R' | 'L' | 'midline',
          notes: finding.name,
        },
        status: finding.status === 'Hypertonic' ? 'hypertonic' : 'inhibited' as InhibitionPathwayStatus,
      };
    }

    // Select the pathway and open the manual
    selectInhibitionPathway(pathwayState);
    
    openDock({
      tab: procMap.tab,
      item: procMap.item,
      view: 'process',
    });

    onClose();
  };

  const handleOpenPathwayInManual = (pathwayName: string) => {
    const procMap = CORRECTION_PROCESS_MAP[pathwayName];
    if (!procMap) {
      console.warn('[SessionReportModal] Unknown correction pathway:', pathwayName);
      return;
    }

    // Get the inhibition pathway state
    const pathwayState = getPathwayState(pathwayName);
    if (pathwayState) {
      selectInhibitionPathway(pathwayState);
    }

    // Open the dock to the correct process
    openDock({
      tab: procMap.tab,
      item: procMap.item,
      view: 'process',
    });

    // Close the report modal
    onClose();
  };

  const filteredFindings = activeTab === 'all' ? findings : findings.filter(f => {
    if (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    return false;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] h-auto overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session Report
            <span className="text-xs text-muted-foreground font-normal ml-2">(Press R to toggle)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b pb-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings & corrections..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <button
            onClick={() => setActiveTab('all')}
            className={cn("px-3 py-1.5 text-sm rounded-lg", activeTab === 'all' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
          >
            All Findings
          </button>
          <button
            onClick={() => setActiveTab('pathways')}
            className={cn("px-3 py-1.5 text-sm rounded-lg", activeTab === 'pathways' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
          >
            Corrections ({pathways.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
          {activeTab === 'all' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Preliminary Findings
                <span className="text-xs text-muted-foreground font-normal">({filteredFindings.length})</span>
              </h3>
              {filteredFindings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No findings recorded</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Category</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Item</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Side</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Priority</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Correction</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Cleared?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredFindings.map((item) => {
                        const corr = getCorrectionsFor(item);
                        const tier = item.priorityTier;
                        const stims = stimsForNerveFinding(item);
                        return (
                          <Fragment key={`${item.patternCategory}:${item.key}`}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <tr className="hover:bg-muted/30 cursor-pointer" onClick={() => handleOpenFindingInManual(item)}>
                                <td className={cn("px-3 py-2 text-xs font-medium", categoryTone(item.patternCategory).text)}>{item.category}</td>
                                <td className="px-3 py-2 text-sm font-medium text-foreground">{item.name}</td>
                                <td className="px-3 py-2 text-sm text-muted-foreground">{item.side || '—'}</td>
                                <td className="px-3 py-2">
                                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(item.status))}>
                                    {item.status === 'Inhibition' ? 'Inhibited' : item.status === 'Normotonic' ? 'Normotonic' : item.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); cyclePriority(item); }}
                                    className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                      tier === 'primary' ? 'border-gold/40 bg-gold/15 text-gold-strong' : tier === 'priority' ? 'border-primary/30 bg-primary/10 text-primary-strong' : 'border-border/60 text-muted-foreground hover:bg-muted/50')}
                                    title={tier === 'primary' ? 'Primary priority (click to clear)' : tier === 'priority' ? 'Priority (click for primary)' : 'Mark as priority'}
                                  >
                                    {tier === 'primary' ? <><Star size={11} fill="currentColor" /> Primary</> : tier === 'priority' ? <><Flag size={11} /> Priority</> : '—'}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground/80">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      {corr.length > 0 ? (
                                        <div className="space-y-1">
                                          <p className="text-[11px] font-medium text-foreground">{corr.length} correction{corr.length !== 1 ? 's' : ''}</p>
                                          <p className="truncate text-[11px] text-muted-foreground/80" title={correctionSummary(corr[corr.length - 1])}>{correctionSummary(corr[corr.length - 1])}</p>
                                        </div>
                                      ) : item.correction || <span className="text-muted-foreground/60">No correction applied</span>}
                                    </div>
                                    {corr.length > 0 && (
                                      <button
                                        type="button"
                                        className="shrink-0 rounded-md border border-border/60 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        onClick={(e) => { e.stopPropagation(); const c = corr[corr.length - 1]; setCorrectionTarget({ finding: item, direction: c.direction, pathway: c.pathway, correction: c }); }}
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                  <div className="mt-1 text-[11px] text-muted-foreground/60">Right-click to add/edit</div>
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markFindingCleared(item); }}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                                      item.cleared ? "bg-primary text-primary-foreground border border-primary/50" : "bg-muted hover:bg-primary/10 border border-border text-muted-foreground hover:text-primary-strong"
                                    )}
                                    title={item.cleared ? "Unmark as cleared" : "Mark as cleared"}
                                  >
                                    {item.cleared ? "Cleared" : "Mark cleared"}
                                  </button>
                                </td>
                              </tr>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-56">
                              {corr.length > 0 && (
                                <>
                                  <ContextMenuLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Corrections</ContextMenuLabel>
                                  {corr.slice(0, 6).map((c) => (
                                    <ContextMenuItem key={c.id} onSelect={() => setCorrectionTarget({ finding: item, direction: c.direction, pathway: c.pathway, correction: c })}>
                                      Edit: {c.pathway}{c.holding ? " (Clear)" : " (Not holding)"}
                                    </ContextMenuItem>
                                  ))}
                                  {corr.slice(0, 6).map((c) => (
                                    <ContextMenuItem key={`rm-${c.id}`} className="text-destructive focus:text-destructive" onSelect={() => void removeCorrection(item, c.id)}>
                                      Remove: {c.pathway}
                                    </ContextMenuItem>
                                  ))}
                                  <ContextMenuSeparator />
                                </>
                              )}
                              <ContextMenuSub>
                                <ContextMenuSubTrigger><PATHWAY_DIRECTION.afferent.Icon size={14} className={cn("mr-2", PATHWAY_DIRECTION.afferent.text)} /> Afferent</ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-48">
                                  {(["mechanoreceptor","nociceptive","physiological"] as const).map((p) => (
                                    <ContextMenuItem key={p} onSelect={() => setCorrectionTarget({ finding: item, direction: 'afferent', pathway: p })}>{p === 'mechanoreceptor' ? 'Mechano' : p === 'nociceptive' ? 'Nociception' : 'Physiology'}</ContextMenuItem>
                                  ))}
                                </ContextMenuSubContent>
                              </ContextMenuSub>
                              <ContextMenuSub>
                                <ContextMenuSubTrigger><PATHWAY_DIRECTION.efferent.Icon size={14} className={cn("mr-2", PATHWAY_DIRECTION.efferent.text)} /> Efferent</ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-48">
                                  {(["cortical","subcortical","emotional"] as const).map((p) => (
                                    <ContextMenuItem key={p} onSelect={() => setCorrectionTarget({ finding: item, direction: 'efferent', pathway: p })}>{p.charAt(0).toUpperCase()+p.slice(1)}</ContextMenuItem>
                                  ))}
                                </ContextMenuSubContent>
                              </ContextMenuSub>
                              <ContextMenuSeparator />
                              <ContextMenuLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Priority</ContextMenuLabel>
                              <ContextMenuItem onSelect={() => setPriorityTier(item, null)} className="gap-2">
                                <span className={cn("flex h-3.5 w-3.5 items-center justify-center", !tier ? "opacity-100" : "opacity-0")}><span className="h-2 w-2 rounded-full bg-current" /></span>
                                None
                              </ContextMenuItem>
                              <ContextMenuItem onSelect={() => setPriorityTier(item, tier === "priority" ? null : "priority")} className="gap-2 text-primary-strong">
                                <span className={cn("flex h-3.5 w-3.5 items-center justify-center", tier === "priority" ? "opacity-100" : "opacity-0")}><span className="h-2 w-2 rounded-full bg-current" /></span>
                                <Target size={12} /> Priority
                              </ContextMenuItem>
                              <ContextMenuItem onSelect={() => setPriorityTier(item, tier === "primary" ? null : "primary")} className="gap-2 text-gold-strong">
                                <span className={cn("flex h-3.5 w-3.5 items-center justify-center", tier === "primary" ? "opacity-100" : "opacity-0")}><span className="h-2 w-2 rounded-full bg-current" /></span>
                                <Star size={12} fill="currentColor" /> Primary priority
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                          {stims.length > 0 && (
                            <tr className="bg-muted/20">
                              <td colSpan={7} className="px-3 py-1.5">
                                <div className="space-y-0.5">
                                  {stims.map((label, idx) => (
                                    <div key={idx} className="flex items-baseline gap-1.5 text-[12px] leading-relaxed">
                                      <span className="font-semibold text-destructive">↓</span>
                                      <span className="min-w-0 break-words text-muted-foreground">{label}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pathways' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Corrections & Pathways
                <span className="text-xs text-muted-foreground font-normal">({pathways.length})</span>
              </h3>
              {pathways.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No corrections applied yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pathways.map((pathway) => {
                    const direction = directionForProcess(pathway.name)
                      ?? directionFromText(pathway.name);
                    const dirStyle = direction ? PATHWAY_DIRECTION[direction] : null;
                    const DirectionIcon = dirStyle?.Icon;
                    return (
                      <div key={pathway.id} className="border rounded-lg overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 cursor-pointer" {...clickableProps(() => handleOpenPathwayInManual(pathway.id))}>
                          <div className="flex flex-wrap items-center gap-2">
                            {dirStyle && DirectionIcon && (
                              <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", dirStyle.soft, dirStyle.strong)}>
                                <DirectionIcon size={10} /> {dirStyle.label}
                              </span>
                            )}
                            <span className="text-sm font-medium">{pathway.name}</span>
                            {pathway.cleared && <CheckCircle2 className="w-3 h-3 text-primary-strong" />}
                            <span title="Open in manual">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground/40" />
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {pathway.entries.length} correction{pathway.entries.length !== 1 ? 's' : ''}
                            </span>
                            {pathway.cleared ? <span className="text-xs text-primary-strong">Cleared</span> : (
                              <Button size="sm" variant="outline" className="text-xs h-6" onClick={(e) => { e.stopPropagation(); markPathwayCleared(pathway.id); }}>Mark cleared</Button>
                            )}
                            {pathway.entries.length > 0 && <ChevronDown className="w-3 h-3" />}
                          </div>
                        </div>
                        {pathway.entries?.length > 0 && (
                          <div className="p-3 space-y-2">
                            {pathway.entries.map((entry: any, idx: number) => {
                              const values = (entry?.values ?? entry?.details ?? {}) as Record<string, any>;
                              const zone1 = values.zone1?.name ? values.zone1 : null;
                              const zone2 = values.zone2?.name ? values.zone2 : null;
                              const summary = String(entry.summary || "");
                              const raw = summary.includes('zone1:') || summary.includes('{');
                              const bits = [!raw ? summary : null, values.method, values.retest, values.emotion, values.organ, values.correctionTimerMinutes ? `${values.correctionTimerMinutes} min${values.correctionTimerCompleted ? " done" : ""}` : null].filter(Boolean) as string[];
                              return (
                                <div key={idx} className={cn("border-l-2 pl-3 space-y-1.5", dirStyle ? dirStyle.border : "border-primary")}>
                                  <p className="text-[11px] text-muted-foreground">{new Date(entry.timestamp || entry.savedAt).toLocaleString()}{entry.id ? ` · ${String(entry.id).slice(0, 8)}` : ""}</p>
                                  {(zone1 || zone2) && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {[{k:'Zone 1',z:zone1},{k:'Zone 2',z:zone2}].filter(x=>x.z).map(({k,z}) => {
                                        const cat = z.category === 'Subcortical' ? 'Subcortical' : 'Cortical';
                                        const tone = cat === 'Cortical' ? 'bg-efferent/10 border-efferent/25 text-efferent-strong' : 'bg-efferent/[0.07] border-efferent/20 text-efferent';
                                        return <span key={k} className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium', tone)}><span className="uppercase tracking-[0.08em] opacity-70">{k}</span><span>{z.name}{z.side ? ` (${z.side})` : ''}</span><span className="opacity-70">· {cat}</span></span>;
                                      })}
                                    </div>
                                  )}
                                  {bits.length > 0 && <p className="text-[13px] leading-relaxed text-foreground/85">{bits.join(' · ')}</p>}
                                  {!bits.length && !zone1 && !zone2 && <p className="text-[13px] leading-relaxed text-foreground/85">{summary || 'Logged correction'}</p>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
      {correctionTarget && (
        <ReflexCorrectionModal
          open={!!correctionTarget}
          onOpenChange={(open) => { if (!open) setCorrectionTarget(null); }}
          itemName={correctionTarget.finding.name}
          side={correctionTarget.finding.side}
          direction={correctionTarget.direction}
          pathway={correctionTarget.pathway}
          isPriority={!!correctionTarget.finding.priorityTier}
          priorityTier={correctionTarget.finding.priorityTier}
          correction={correctionTarget.correction ?? undefined}
          onApply={async (c) => { await applyCorrection(correctionTarget, c); setCorrectionTarget(null); }}
        />
      )}
    </Dialog>
  );
}