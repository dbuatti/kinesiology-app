import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientGridData } from "@/hooks/useClientGridData";

export const GridSessionChips = ({ grid }: { grid?: ClientGridData }) => {
  if (!grid || grid.activeCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-0.5">
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-chart-primary">
        <LayoutGrid size={10} /> {grid.activeCount} marks
      </span>
      <span className="h-3 w-px bg-border" />
      {grid.tracks.map(t => (
        <span key={t.title} className="inline-flex items-center gap-1" title={t.title}>
          <span className={cn("h-2 w-2 rounded-full", t.color)} />
          <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{t.count}</span>
        </span>
      ))}
      {grid.tracks.length > 0 && grid.nuclei.length > 0 && <span className="h-3 w-px bg-border" />}
      {grid.nuclei.map(n => (
        <span key={n.label} className="inline-flex items-center gap-1" title={`${n.label} nuclei`}>
          <span className={cn("h-2 w-2 rounded-full", n.color)} />
          <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{n.count}</span>
        </span>
      ))}
      {grid.muscleCount > 0 && (
        <>
          {(grid.tracks.length > 0 || grid.nuclei.length > 0) && <span className="h-3 w-px bg-border" />}
          <span className="inline-flex items-center gap-1" title="Intrinsic muscles with tone findings">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{grid.muscleCount}</span>
          </span>
        </>
      )}
    </div>
  );
};
