import * as React from "react";
import { Flag, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PATHWAY_DIRECTION } from "@/lib/pathway-direction";
import type { FindingPriority } from "@/components/crm/v2/v2-utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatZone, isZoneValue } from "@/data/protocol-log";
import { PATHWAY_SHORT_LABEL, type ReflexCorrection } from "./types";

interface Props {
  corrections: ReflexCorrection[];
  isPriority: boolean;
  priorityTier?: FindingPriority | null;
  onToggleHolding: (id: string) => void;
  onRemove: (id: string) => void;
}

const pill = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none";
const tone = {
  priority: "bg-primary/10 border-primary/25 text-primary-strong dark:text-primary",
  primaryPriority: "bg-gold/15 border-gold/40 text-gold-strong dark:text-gold",
  overflow: "bg-muted/60 border-border/60 text-muted-foreground hover:bg-muted",
};

const CorrectionPill = React.forwardRef<HTMLButtonElement, { correction: ReflexCorrection; onClick?: React.MouseEventHandler<HTMLButtonElement> }>(
  ({ correction, onClick, ...props }, ref) => {
    const direction = PATHWAY_DIRECTION[correction.direction];
    const Icon = direction.Icon;
    return (
      <button
        ref={ref}
        type="button"
        {...props}
        onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
        className={cn(pill, direction.tint, "max-w-[140px]")}
        title={`${PATHWAY_SHORT_LABEL[correction.pathway]} ${correction.holding ? "holding" : "not holding"}`}
      >
        <Icon size={10} className="shrink-0" />
        <span className="truncate">
          {PATHWAY_SHORT_LABEL[correction.pathway]}
          {correction.holding ? " · Holding" : ""}
        </span>
      </button>
    );
  }
);
CorrectionPill.displayName = "CorrectionPill";

function detailSummary(correction: ReflexCorrection): string[] {
  const d = correction.details ?? {};
  const out: string[] = [];
  const z1 = isZoneValue(d.zone1) ? formatZone(d.zone1) : null;
  const z2 = isZoneValue(d.zone2) ? formatZone(d.zone2) : null;
  if (z1 || z2) out.push([z1 ?? "—", z2 ?? "—"].join(" → "));
  if (typeof d.method === "string" && d.method) out.push(d.method);
  if (typeof d.emotion === "string" && d.emotion) out.push(d.emotion);
  if (typeof d.organ === "string" && d.organ) out.push(d.organ);
  if (typeof d.retest === "string" && d.retest) out.push(`Retest: ${d.retest}`);
  return out;
}

function CorrectionDetail({ correction, onToggleHolding, onRemove }: { correction: ReflexCorrection; onToggleHolding: () => void; onRemove: () => void }) {
  const summary = detailSummary(correction);
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-foreground">
            {PATHWAY_SHORT_LABEL[correction.pathway]}
            <span className="ml-1 text-muted-foreground">· {correction.direction}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{correction.holding ? "Holding" : "Not holding"}</p>
        </div>
        <span className={cn(pill, PATHWAY_DIRECTION[correction.direction].tint)}>
          {correction.holding ? "Holding" : "Saved"}
        </span>
      </div>
      {summary.length > 0 && (
        <div className="space-y-0.5">
          {summary.map((line, i) => <p key={i} className="text-[11px] leading-relaxed text-muted-foreground">{line}</p>)}
        </div>
      )}
      {correction.note && <p className="text-[11px] leading-relaxed text-muted-foreground">{correction.note}</p>}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[11px]" onClick={onToggleHolding}>
          {correction.holding ? "Mark not holding" : "Mark holding"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-destructive" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

export function ReflexCorrectionPills({ corrections, isPriority, priorityTier = isPriority ? "priority" : null, onToggleHolding, onRemove }: Props) {
  const sorted = [...corrections].sort((a, b) => {
    if (a.holding !== b.holding) return a.holding ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const visible: Array<{ kind: "priority" } | { kind: "correction"; correction: ReflexCorrection }> = [];
  if (isPriority) visible.push({ kind: "priority" });
  for (const c of sorted) {
    if (visible.length >= 2) break;
    visible.push({ kind: "correction", correction: c });
  }
  const visibleIds = new Set(visible.flatMap(v => v.kind === "correction" ? [v.correction.id] : []));
  const overflow = sorted.filter(c => !visibleIds.has(c.id));
  if (visible.length === 0 && overflow.length === 0) return null;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {visible.map((item) =>
        item.kind === "priority" ? (
          <span
            key="priority"
            className={cn(pill, priorityTier === "primary" ? tone.primaryPriority : tone.priority, "px-1.5")}
            title={priorityTier === "primary" ? "Primary priority" : "Priority"}
          >
            {priorityTier === "primary" ? <Star size={10} fill="currentColor" /> : <Flag size={10} />}
          </span>
        ) : (
          <Popover key={item.correction.id}>
            <PopoverTrigger asChild>
              <CorrectionPill correction={item.correction} />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-2">
              <CorrectionDetail correction={item.correction} onToggleHolding={() => onToggleHolding(item.correction.id)} onRemove={() => onRemove(item.correction.id)} />
            </PopoverContent>
          </Popover>
        ),
      )}
      {overflow.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn(pill, tone.overflow)}>+{overflow.length}</button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-2 p-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Active corrections</p>
            {overflow.map((c) => (
              <CorrectionDetail key={c.id} correction={c} onToggleHolding={() => onToggleHolding(c.id)} onRemove={() => onRemove(c.id)} />
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
