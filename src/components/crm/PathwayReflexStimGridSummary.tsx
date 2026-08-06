import { StimXMark } from "./StimXMark";
import { cn } from "@/lib/utils";
import { CranialNerve } from "@/data/cranial-nerve-data";
import {
  NERVE_GROUPS,
  NUCLEI_COLORS,
  PRIMITIVE_TRACKS,
  cranialNerveInhibKey,
  cranialSideKey,
  cranialStimKey,
  isLateralStim,
  nerveStimLines,
  primitiveSideKey,
  primitiveStimKey,
  primitiveStimKeyAt,
} from "./pathway-reflex-stim-data";
import type { PrimitiveGridReflex } from "./pathway-reflex-stim-data";

interface SummaryChip {
  label: string;
  side?: "L" | "R";
  inhib?: boolean;
}

interface PathwayReflexStimGridSummaryProps {
  checked: Record<string, boolean>;
}

const Chip = ({ chip }: { chip: SummaryChip }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
      chip.inhib
        ? "bg-chart-destructive/15 text-chart-destructive border-chart-destructive/25"
        : "bg-chart-destructive/10 text-chart-destructive border-chart-destructive/20"
    )}
  >
    {chip.inhib && <StimXMark className="w-3 h-3" />}
    {chip.side && <span className="font-black">{chip.side}</span>}
    <span className="max-w-[260px] truncate leading-snug">{chip.label}</span>
  </span>
);

export function PathwayReflexStimGridSummary({ checked }: PathwayReflexStimGridSummaryProps) {
  const activeCount = Object.values(checked).filter(Boolean).length;

  const reflexChips = (reflex: PrimitiveGridReflex): SummaryChip[] => {
    const chips: SummaryChip[] = [];
    if (reflex.lateralized) {
      (["L", "R"] as const).forEach((s) => {
        if (checked[primitiveSideKey(reflex, s)])
          chips.push({ label: reflex.stimulus, side: s });
      });
    } else if (reflex.stims?.length) {
      reflex.stims.forEach((label, i) => {
        if (checked[primitiveStimKeyAt(reflex, i)]) chips.push({ label });
      });
    } else if (checked[primitiveStimKey(reflex)]) {
      chips.push({ label: reflex.stimulus });
    }
    return chips;
  };

  const nerveInhibChips = (nerve: CranialNerve): SummaryChip[] => {
    if (nerve.isLateralized) {
      const chips: SummaryChip[] = [];
      (["L", "R"] as const).forEach((s) => {
        if (checked[cranialNerveInhibKey(nerve.id, s)])
          chips.push({ label: "Nerve inhibited", side: s, inhib: true });
      });
      return chips;
    }
    return checked[cranialNerveInhibKey(nerve.id)]
      ? [{ label: "Nerve inhibited", inhib: true }]
      : [];
  };

  const nerveStimChips = (nerve: CranialNerve): SummaryChip[] => {
    const chips: SummaryChip[] = [];
    nerveStimLines(nerve).forEach((line, i) => {
      if (isLateralStim(nerve.id, i)) {
        (["L", "R"] as const).forEach((s) => {
          if (checked[cranialSideKey(nerve.id, i, s)])
            chips.push({ label: line, side: s });
        });
      } else if (checked[cranialStimKey(nerve.id, i)]) {
        chips.push({ label: line });
      }
    });
    return chips;
  };

  const primSections = PRIMITIVE_TRACKS.map((track) => {
    const items = track.reflexes
      .map((reflex) => ({ reflex, chips: reflexChips(reflex) }))
      .filter((x) => x.chips.length > 0);
    const total = items.reduce((acc, x) => acc + x.chips.length, 0);
    return { track, items, total };
  }).filter((s) => s.total > 0);

  const nerveSections = NERVE_GROUPS.map((group) => {
    const items = group.items
      .map((nerve) => {
        const inhib = nerveInhibChips(nerve);
        const stims = nerveStimChips(nerve);
        return { nerve, chips: [...inhib, ...stims], total: inhib.length + stims.length };
      })
      .filter((x) => x.total > 0);
    const total = items.reduce((acc, x) => acc + x.total, 0);
    return { group, items, total };
  }).filter((s) => s.total > 0);

  const hasAny = primSections.length > 0 || nerveSections.length > 0;

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">Grid Summary</h3>
          <p className="text-[11px] text-muted-foreground">Everything marked for this session</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-chart-primary tabular-nums leading-none">{activeCount}</p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">active</p>
        </div>
      </div>

      {!hasAny ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">Nothing marked yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Tap squares in the grid to record reflexes, stims, and nerve-level inhibition marks.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {primSections.map(({ track, items, total }) => (
            <section key={track.title}>
              <header className="flex items-center gap-2 bg-muted/30 px-4 py-2.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", track.color)} />
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/80">{track.title}</p>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">{total}</span>
              </header>
              <div className="divide-y divide-border/40">
                {items.map(({ reflex, chips }) => (
                  <div
                    key={reflex.id}
                    className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="shrink-0 text-sm font-semibold text-foreground">{reflex.short} — {reflex.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((chip, i) => <Chip key={i} chip={chip} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {nerveSections.map(({ group, items, total }) => (
            <section key={group.label}>
              <header className="flex items-center gap-2 bg-muted/30 px-4 py-2.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", NUCLEI_COLORS[group.label])} />
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/80">{group.label} Nuclei</p>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">{total}</span>
              </header>
              <div className="divide-y divide-border/40">
                {items.map(({ nerve, chips }) => (
                  <div
                    key={nerve.id}
                    className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="shrink-0 text-sm font-semibold text-foreground">{nerve.name} — {nerve.latinName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((chip, i) => <Chip key={i} chip={chip} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default PathwayReflexStimGridSummary;
