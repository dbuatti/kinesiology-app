
import { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Baby, Zap, Brain, Dumbbell } from "lucide-react";
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { BRAIN_REFLEX_POINTS } from '@/data/brain-reflex-data';
import { safeParse } from '@/utils/safe-json';
import { categoryTone } from '@/components/crm/v2/categoryConstants';
import { collectCorrectionRecords, correctionSummary } from '@/lib/corrections';
import { isCranialStimFinding, splitCranialNervePattern } from '@/lib/cranial-stim-findings';

interface PathwayFindingsListProps {
  priorityPattern: string | null | undefined;
  className?: string;
  showOnlyInhibited?: boolean;
  metadata?: Record<string, any> | string | null;
}

const getCanonicalName = (name: string): string => {
  const cleanName = name.replace(/ \([LR]\)$/, '').trim();
  const lowerClean = cleanName.toLowerCase();
  const reflex = PRIMITIVE_REFLEXES.find(r => 
    r.id.toLowerCase() === lowerClean || 
    r.name.toLowerCase() === lowerClean ||
    r.name.toLowerCase().includes(lowerClean)
  );
  if (reflex) return reflex.name;
  const point = BRAIN_REFLEX_POINTS.find(p => 
    p.id.toLowerCase() === lowerClean || 
    p.name.toLowerCase() === lowerClean ||
    p.name.toLowerCase().split(':')[0].trim() === lowerClean
  );
  if (point) return point.name.split(':')[0].trim();
  return cleanName;
};

const correctionLabel = (c: any) => {
  if (!c) return null;
  return correctionSummary(c);
};

const PathwayFindingsList = ({ priorityPattern, className, showOnlyInhibited = true, metadata }: PathwayFindingsListProps) => {
  const findings = useMemo(() => {
    const parsed = safeParse(priorityPattern, {} as Record<string, Record<string, any>>);
    const meta = typeof metadata === 'string' ? safeParse<Record<string, any>>(metadata, {}) : ((metadata ?? {}) as Record<string, any>);
    const clearedFindings: string[] = Array.isArray(meta?.cleared_findings) ? meta.cleared_findings : [];
    const records = collectCorrectionRecords({
      priority_pattern: priorityPattern,
      metadata: typeof metadata === "string" ? metadata : JSON.stringify(meta ?? {}),
    });
    const items: { name: string; status: string; category: string; correction?: string }[] = [];

    const findCorrection = (catKey: string, displayName: string, base: string) => {
      const candidates = records.filter((c) =>
        (!c.category || c.category === catKey) &&
        (c.finding === displayName || c.finding === base || c.name === base || c.finding === `${base} (L)` || c.finding === `${base} (R)`)
      );
      const corr = candidates[candidates.length - 1];
      return correctionLabel(corr);
    };
    
    Object.entries(parsed).forEach(([category, values]) => {
      // The `priorities`/item correction maps are bookkeeping, not findings.
      if (category === 'priorities' || category === 'itemCorrections' || category === 'reflexCorrections') return;
      if (!values || typeof values !== 'object' || Array.isArray(values)) return;
      // 1. Normalize all items in this category first
      const sessionItems: { base: string, side: string, status: string }[] = [];
      // Stims are information on the nerve, never their own pathway/finding.
      const entries = category === 'cranialNerves'
        ? Object.entries(splitCranialNervePattern(values as Record<string, unknown>).findings)
        : Object.entries(values as Record<string, unknown>);
      entries.forEach(([key, status]) => {
        if (typeof status !== 'string') return;
        const strStatus = status;
        const isCleared = strStatus.endsWith('_Cleared');
        const baseStatus = strStatus.replace('_Cleared', '');

        if (showOnlyInhibited && isCleared) return;
        if (showOnlyInhibited && baseStatus !== 'Inhibited' && baseStatus !== 'Hypertonic') return;
        
        // Filter out non-dysfunctional 'Clear' or 'Normotonic' items
        if (showOnlyInhibited && (baseStatus === 'Clear' || baseStatus === 'Normotonic')) return;
        
        const sideMatch = key.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] : "";
        const base = getCanonicalName(key);
        sessionItems.push({ base, side, status: strStatus });
      });

      // 2. Filter out base items if lateralized ones exist
      const filteredSessionItems = sessionItems.filter(item => {
        if (item.side === "") {
          const hasLateral = sessionItems.some(other => other.base === item.base && other.side !== "");
          if (hasLateral) return false;
        }
        return true;
      });

      // 3. Add to final list
      filteredSessionItems.forEach(item => {
        const displayName = item.side ? `${item.base} (${item.side})` : item.base;
        items.push({ 
          name: displayName, 
          status: item.status, 
          category: category.replace(/([A-Z])/g, ' $1').trim(),
          correction: findCorrection(category, displayName, item.base) || undefined,
        });
      });
    });

    if (!showOnlyInhibited) {
      const seen = new Set(items.map((i) => `${i.category}::${i.name}`.toLowerCase()));
      const catNorm: Record<string, string> = {
        reflexes: "primitiveReflexes",
        primitiveReflex: "primitiveReflexes",
        cranial: "cranialNerves",
        cranialNerve: "cranialNerves",
        brainZone: "brainZones",
        muscle: "muscles",
      };
      for (const id of clearedFindings) {
        const raw = String(id);
        const [catRaw, ...rest] = raw.split("-");
        const cat = catNorm[catRaw] || catRaw;
        if (!cat || ["priorities", "itemCorrections", "reflexCorrections"].includes(cat)) continue;
        const rawName = rest.join("-").trim();
        if (!rawName) continue;
        if (cat === "cranialNerves" && isCranialStimFinding(rawName)) continue;
        const sideMatch = rawName.match(/\(([LR])\)$/);
        const side = sideMatch ? sideMatch[1] : "";
        const base = getCanonicalName(rawName);
        const displayName = side ? `${base} (${side})` : base;
        const displayCat = cat.replace(/([A-Z])/g, " $1").trim();
        const k = `${displayCat}::${displayName}`.toLowerCase();
        if (seen.has(k)) continue;
        items.push({
          name: displayName,
          status: "Clear_Cleared",
          category: displayCat,
          correction: findCorrection(cat, displayName, base) || undefined,
        });
        seen.add(k);
      }
    }

    return items;
  }, [priorityPattern, showOnlyInhibited, metadata]);

  if (findings.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No active priorities recorded.</p>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {findings.map((finding, idx) => {
        const isCleared = finding.status.endsWith('_Cleared') || finding.status === 'Normotonic' || finding.status === 'Clear';
        const displayStatus = isCleared ? 'Cleared' : finding.status.replace('_Cleared', ' (Cleared)');
        const tone = isCleared ? "cleared" : /primary|priority/i.test(finding.status) ? "primary" : "warning";
        const categoryIconTone = categoryTone(finding.category);

        return (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between gap-2 rounded-xl border p-2 text-[13px] font-semibold",
              isCleared ? "border-cleared/30 bg-cleared/10" : "border-border/60 bg-card"
            )}
          >
            <div className="mr-2 min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span className={cn("inline-flex shrink-0", categoryIconTone.text)}>
                  {finding.category.toLowerCase().includes('primitive') ? <Baby size={12} /> :
                   finding.category.toLowerCase().includes('cranial') ? <Zap size={12} /> :
                   finding.category.toLowerCase().includes('muscle') ? <Dumbbell size={12} /> :
                   <Brain size={12} />}
                </span>
                <span className={cn("leading-snug", isCleared ? "text-muted-foreground" : "text-foreground")}>{finding.name}</span>
              </div>
              {isCleared && finding.correction && (
                <p className="mt-1 pl-5 text-[11px] font-medium text-muted-foreground">Cleared by {finding.correction}</p>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                tone === "cleared" && "bg-cleared/10 text-cleared",
                tone === "primary" && "bg-primary/10 text-primary-strong",
                tone === "warning" && "bg-warning/10 text-warning-strong"
              )}
            >
              {displayStatus}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PathwayFindingsList;