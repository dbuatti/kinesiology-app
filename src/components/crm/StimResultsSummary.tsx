import { CranialNerve } from "@/data/cranial-nerve-data";
import { cn } from "@/lib/utils";
import {
  describeNerveStims,
  describePrimitiveStims,
  MarkedStim,
} from "./pathway-reflex-stim-data";

interface StimResultsSummaryProps {
  kind: "nerve" | "reflex";
  nerve?: CranialNerve;
  reflexId?: string;
  reflexName?: string;
  stimResults?: Record<string, boolean> | null;
  filterSide?: "L" | "R";
  className?: string;
}

const StimResultsSummary = ({ kind, nerve, reflexId, reflexName, stimResults, filterSide, className }: StimResultsSummaryProps) => {
  const entries: MarkedStim[] =
    kind === "nerve" && nerve
      ? describeNerveStims(nerve, stimResults)
      : describePrimitiveStims(reflexId || "", reflexName || "", stimResults);

  const visible = filterSide ? entries.filter((e) => e.side === filterSide) : entries;
  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-chart-destructive shrink-0" />
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Marked Stims ({visible.length})
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((entry, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-chart-destructive/10 text-chart-destructive border border-chart-destructive/20"
          >
            {entry.side && (
              <span className="font-black">{entry.side}</span>
            )}
            <span className="max-w-[240px] truncate leading-snug">{entry.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default StimResultsSummary;
