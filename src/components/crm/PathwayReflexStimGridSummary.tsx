import { useMemo } from "react";
import { StimXMark } from "./StimXMark";
import { cn } from "@/lib/utils";
import { gridSummarySections, type GridSummaryChip } from "./grid-summary";
import { muscleSummaryItems, type MuscleGridState, type MuscleGridChip } from "./muscle-grid-data";

const Chip = ({ chip }: { chip: GridSummaryChip }) => (
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

const MUSCLE_CHIP_STYLES: Record<MuscleGridState, string> = {
  Hypotonic: "bg-sky-500/15 text-sky-700 border-sky-500/25",
  Inhibited: "bg-chart-destructive/15 text-chart-destructive border-chart-destructive/25",
  Hypertonic: "bg-amber-500/15 text-amber-700 border-amber-500/25",
};

const MUSCLE_CHIP_LABEL: Record<MuscleGridState, string> = {
  Hypotonic: "Hypo",
  Inhibited: "Inhib",
  Hypertonic: "Hyper",
};

const MuscleChip = ({ chip }: { chip: MuscleGridChip }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
      MUSCLE_CHIP_STYLES[chip.status]
    )}
  >
    {chip.status === "Inhibited" && <StimXMark className="w-3 h-3" />}
    {chip.side && <span className="font-black">{chip.side}</span>}
    <span className="max-w-[260px] truncate leading-snug">{chip.label}</span>
    <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{MUSCLE_CHIP_LABEL[chip.status]}</span>
  </span>
);

export function PathwayReflexStimGridSummary({
  checked,
  muscleState,
}: {
  checked: Record<string, boolean>;
  muscleState?: Record<string, MuscleGridState>;
}) {
  const activeCount = Object.values(checked).filter(Boolean).length + Object.values(muscleState ?? {}).length;
  const { tracks, nuclei } = gridSummarySections(checked);

  const muscleSections = useMemo(() => {
    if (!muscleState) return [];
    const items = muscleSummaryItems(muscleState);
    const byGroup: { group: string; items: typeof items }[] = [];
    items.forEach((x) => {
      let g = byGroup.find((y) => y.group === x.muscle.group);
      if (!g) {
        g = { group: x.muscle.group, items: [] };
        byGroup.push(g);
      }
      g.items.push(x);
    });
    return byGroup.map((g) => ({
      group: g.group,
      items: g.items,
      total: g.items.reduce((acc, x) => acc + x.chips.length, 0),
    }));
  }, [muscleState]);

  const hasAny = tracks.length > 0 || nuclei.length > 0 || muscleSections.length > 0;

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
          {tracks.map((section) => (
            <section key={section.title}>
              <header className="flex items-center gap-2 bg-muted/30 px-4 py-2.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", section.color)} />
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/80">{section.title}</p>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">{section.total}</span>
              </header>
              <div className="divide-y divide-border/40">
                {section.items.map(({ reflex, chips }) => (
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

          {nuclei.map((section) => (
            <section key={section.label}>
              <header className="flex items-center gap-2 bg-muted/30 px-4 py-2.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", section.color)} />
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/80">{section.label} Nuclei</p>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">{section.total}</span>
              </header>
              <div className="divide-y divide-border/40">
                {section.items.map(({ nerve, chips }) => (
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

          {muscleSections.map((section) => (
            <section key={section.group}>
              <header className="flex items-center gap-2 bg-muted/30 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <p className="text-[10px] font-black uppercase tracking-wider text-foreground/80">{section.group}</p>
                <span className="ml-auto text-[10px] font-bold tabular-nums text-muted-foreground">{section.total}</span>
              </header>
              <div className="divide-y divide-border/40">
                {section.items.map(({ muscle, chips }) => (
                  <div
                    key={muscle.name}
                    className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="shrink-0 text-sm font-semibold text-foreground">{muscle.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((chip, i) => <MuscleChip key={i} chip={chip} />)}
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
