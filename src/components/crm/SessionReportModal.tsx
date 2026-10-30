import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, CheckCircle2, ChevronDown, ChevronUp, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { Button } from "@/components/ui/button";
import { useCorrectionDock, type InhibitionPathwayStatus } from "@/components/crm/corrections/CorrectionDockContext";

interface Finding {
  type: string;
  key: string;
  name: string;
  status: string;
  side?: string;
  category: string;
  correction?: string;
  cleared?: boolean;
}

interface SessionReportModalProps {
  open: boolean;
  onClose: () => void;
  appointment: any;
  updateMetadata: (metadata: any) => Promise<void>;
}

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

export default function SessionReportModal({ open, onClose, appointment, updateMetadata }: SessionReportModalProps) {
  const { openDock, selectInhibitionPathway, availableInhibitionPathways } = useCorrectionDock();
  const [activeTab, setActiveTab] = useState<'all' | 'findings' | 'pathways'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const pattern = useMemo(() => safeParse(appointment?.priority_pattern, {}), [appointment?.priority_pattern]);
  const metadata = useMemo(() => safeParse(appointment?.metadata, {}), [appointment?.metadata]);

  // Build corrections lookup
  const correctionsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (metadata.corrections || []).forEach((c: any) => {
      if (c.pathway) {
        map[c.pathway] = c;
      }
    });
    (metadata.cleared_findings || []).forEach((k: string) => {
      map[k] = { ...map[k], cleared: true };
    });
    return map;
  }, [metadata]);

  const findings = useMemo(() => {
    const items: Finding[] = [];
    const clearedSet = new Set<string>(metadata.cleared_findings || []);
    const corrections = metadata.corrections || [];

    Object.entries(pattern.muscles || {}).forEach(([key, val]) => {
      if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic' || val === 'Clear' || val === 'Normotonic') {
        let name = key;
        let side: string | undefined;
        if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
        else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
        const correctionEntry = corrections.find((c: any) => c.summary?.toLowerCase().includes(name.toLowerCase().split(' (')[0]) || c.pathway?.toLowerCase().includes(name.toLowerCase().split(' (')[0]));
        items.push({ type: 'muscle', key, name, status: val as string, side, category: 'Muscles', correction: correctionEntry?.summary, cleared: clearedSet.has(`muscles-${key}`) });
      }
    });

    Object.entries(pattern.primitiveReflexes || {}).forEach(([key, val]) => {
      if (val === 'Inhibited' || val === 'Inhibition') {
        let name = key;
        let side: string | undefined;
        if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
        else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
        items.push({ type: 'reflex', key, name, status: 'Inhibited', side, category: 'Reflexes' });
      }
    });

    Object.entries(pattern.cranialNerves || {}).forEach(([key, val]) => {
      if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic') {
        let name = key;
        let side: string | undefined;
        if (key.includes(' (L)')) { name = key.replace(' (L)', ''); side = 'L'; }
        else if (key.includes(' (R)')) { name = key.replace(' (R)', ''); side = 'R'; }
        items.push({ type: 'nerve', key, name, status: val as string, side, category: 'Cranial Nerves' });
      }
    });

    Object.entries(pattern.brainZones || {}).forEach(([key, val]) => {
      if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic') {
        items.push({ type: 'brain', key, name: key, status: val as string, category: 'Brain Zones' });
      }
    });

    Object.entries(pattern.eyeSystems || {}).forEach(([key, val]) => {
      if (val === 'Inhibited' || val === 'Inhibition' || val === 'Hypertonic') {
        items.push({ type: 'eye', key, name: key, status: val as string, category: 'Eye Systems' });
      }
    });

    return items;
  }, [pattern, metadata]);

  const pathways = useMemo(() => {
    const corrections = metadata.corrections || [];
    const pathwayNames = [...new Set(corrections.map((c: any) => c.pathway))];
    return pathwayNames.map(name => {
      const entries = corrections.filter((c: any) => c.pathway === name);
      const cleared = metadata.cleared_findings?.some((k: string) => k.includes(name)) || false;
      return { id: name, name, entries, cleared, clearedAt: metadata.cleared_findings?.find((k: string) => k.includes(name)) ? metadata.cleared_findings : null };
    });
  }, [metadata]);

  const getStatusColor = (s: string) => {
    if (s === 'Inhibited' || s === 'Inhibition') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
    if (s === 'Hypertonic') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
    if (s === 'Clear' || s === 'Normotonic') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
    return 'bg-muted text-muted-foreground';
  };

  const markPathwayCleared = async (pathwayId: string) => {
    const existing = metadata.cleared_findings || [];
    const newCleared = existing.includes(`pathway-${pathwayId}`) ? existing.filter(k => k !== `pathway-${pathwayId}`) : [...existing, `pathway-${pathwayId}`];
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
          side: finding.side || 'midline',
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
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Correction</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Cleared?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredFindings.map((item) => (
                        <tr key={item.key} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleOpenFindingInManual(item)}>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{item.category}</td>
                          <td className="px-3 py-2 text-sm font-medium text-foreground">{item.name}</td>
                          <td className="px-3 py-2 text-sm text-muted-foreground">{item.side || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(item.status))}>
                              {item.status === 'Inhibition' ? 'Inhibited' : item.status === 'Normotonic' ? 'Normotonic' : item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground/80">
                            {item.correction || <span className="text-muted-400">No correction applied</span>}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); markPathwayCleared(item.key); }}
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                                item.cleared ? "bg-emerald-500 text-white border border-emerald-500" : "bg-muted hover:bg-emerald-50 border border-border text-muted-foreground hover:text-emerald-700"
                              )}
                              title={item.cleared ? "Unmark as cleared" : "Mark as cleared"}
                            >
                              {item.cleared ? "✓ Cleared" : "Clear"}
                            </button>
                          </td>
                        </tr>
                      ))}
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
                  {pathways.map((pathway) => (
                    <div key={pathway.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer" onClick={() => handleOpenPathwayInManual(pathway.id)}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{pathway.name}</span>
                          {pathway.cleared && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground/40" title="Open in manual" />
                        </div>
                        {pathway.entries.length} correction{pathway.entries.length !== 1 ? 's' : ''}
                        {pathway.cleared ? <span className="text-xs text-emerald-600">Cleared</span> : (
                          <Button size="sm" variant="outline" className="text-xs h-6" onClick={(e) => { e.stopPropagation(); markPathwayCleared(pathway.id); }}>Mark Cleared</Button>
                        )}
                        {pathway.entries.length > 0 && <ChevronDown className="w-3 h-3" />}
                      </div>
                      {pathway.entries?.length > 0 && (
                        <div className="p-3 space-y-2">
                          {pathway.entries.map((entry: any, idx: number) => (
                            <div key={idx} className="border-l-2 border-primary pl-3">
                              <p className="text-xs text-muted-foreground mb-1">{new Date(entry.timestamp || entry.savedAt).toLocaleString()}</p>
                              <p className="text-sm">{entry.summary}</p>
                              {entry.values && <div className="grid grid-cols-2 gap-1 mt-1 text-xs">{Object.entries(entry.values).map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}:</span><span>{String(v)}</span></div>)}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}