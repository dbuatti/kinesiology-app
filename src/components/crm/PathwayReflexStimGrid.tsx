import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Printer, Eraser, Search, X, Maximize2, Minimize2, ChevronDown, LayoutList, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import PathwayReflexStimGridBoard from "./PathwayReflexStimGridBoard";
import PathwayReflexStimGridSummary from "./PathwayReflexStimGridSummary";
import { StimXMark } from "./StimXMark";
import {
  PRIMITIVE_TRACKS,
  NERVE_GROUPS,
  NUCLEI_COLORS,
  nerveStimLines,
  primitiveStimKey,
  primitiveStimKeyAt,
  primitiveSideKey,
  cranialStimKey,
  cranialSideKey,
  cranialNerveInhibKey,
  isLateralStim,
  primitiveReflexMatches,
  cranialLineMatches,
} from "./pathway-reflex-stim-data";
import { safeParse } from "@/utils/safe-json";

interface PathwayReflexStimGridProps {
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export function PathwayReflexStimGrid({
  appointmentId,
  priorityPattern,
  updatePriorityPattern,
  isFullScreen,
  onToggleFullScreen,
}: PathwayReflexStimGridProps) {
  const { tests: reflexTests, loading: reflexLoading, updateTest: updateReflex } =
    usePrimitiveReflexTests(appointmentId, priorityPattern, updatePriorityPattern);
  const { tests: nerveTests, loading: nerveLoading, updateTest: updateNerve } =
    useCranialNerveTests(appointmentId, priorityPattern, updatePriorityPattern);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState<'board' | 'summary'>('board');
  const [confirmClear, setConfirmClear] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const seeded = useRef(false);
  const confirmTimer = useRef<number | undefined>(undefined);
  const pendingWrites = useRef(0);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (seeded.current || reflexLoading || nerveLoading) return;
    const map: Record<string, boolean> = {};
    PRIMITIVE_TRACKS.forEach((track) =>
      track.reflexes.forEach((reflex) => {
        const test = reflexTests.find((t) => t.reflex_id === reflex.id);
        if (reflex.lateralized) {
          (["L", "R"] as const).forEach((side) => {
            const key = primitiveSideKey(reflex, side);
            if (test?.stim_results?.[key]) map[key] = true;
          });
        } else if (reflex.stims?.length) {
          reflex.stims.forEach((_, i) => {
            const key = primitiveStimKeyAt(reflex, i);
            if (test?.stim_results?.[key]) map[key] = true;
          });
        } else {
          const key = primitiveStimKey(reflex);
          if (test?.stim_results?.[key]) map[key] = true;
        }
      })
    );
    NERVE_GROUPS.forEach((group) =>
      group.items.forEach((nerve) => {
        const test = nerveTests.find((t) => t.nerve_id === nerve.id.toString());
        nerveStimLines(nerve).forEach((_, i) => {
          if (isLateralStim(nerve.id, i)) {
            (["L", "R"] as const).forEach((side) => {
              const key = cranialSideKey(nerve.id, i, side);
              if (test?.stim_results?.[key]) map[key] = true;
            });
          } else {
            const key = cranialStimKey(nerve.id, i);
            if (test?.stim_results?.[key]) map[key] = true;
          }
        });
      })
    );
    // Seed nerve-level inhibition marks from the priority pattern
    const pattern = safeParse(priorityPattern, {});
    const nervePattern = pattern.cranialNerves || {};
    NERVE_GROUPS.forEach((group) =>
      group.items.forEach((nerve) => {
        const nerveName = `${nerve.name}: ${nerve.latinName}`;
        if (nerve.isLateralized) {
          (["L", "R"] as const).forEach((side) => {
            const status = nervePattern[`${nerveName} (${side})`] || "";
            if (status.startsWith("Inhibited")) map[cranialNerveInhibKey(nerve.id, side)] = true;
          });
        } else {
          const status = nervePattern[nerveName] || "";
          if (status.startsWith("Inhibited")) map[cranialNerveInhibKey(nerve.id)] = true;
        }
      })
    );
    setChecked(map);
    seeded.current = true;
  }, [reflexTests, nerveTests, reflexLoading, nerveLoading]);

  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const persistToggle = (key: string, nextValue: boolean) => {
    pendingWrites.current += 1;
    setSaveState('saving');
    const task = async () => {
      try {
        if (key.includes("-INHIB")) {
          const nerveId = key.slice("cn-".length).split("-")[0];
          const nerve = NERVE_GROUPS.flatMap((g) => g.items).find(
            (n) => n.id.toString() === nerveId
          );
          if (!nerve || !updatePriorityPattern) return;
          const nerveName = `${nerve.name}: ${nerve.latinName}`;
          const sideMatch = key.match(/-(L|R)$/);
          const side = (sideMatch ? sideMatch[1] : undefined) as "L" | "R" | undefined;
          await updatePriorityPattern("cranialNerves", nerveName, nextValue ? "Inhibited" : null, side);
          return;
        }
        if (key.startsWith("prim-")) {
          const short = key.slice("prim-".length).split("-")[0];
          const reflex = PRIMITIVE_TRACKS.flatMap((t) => t.reflexes).find(
            (r) => r.short === short
          );
          if (!reflex) return;
          const test = reflexTests.find((t) => t.reflex_id === reflex.id);
          const current = { ...(test?.stim_results || {}) };
          const next = { ...current };
          if (nextValue) next[key] = true;
          else delete next[key];
          const isInhibited = Object.values(next).some(Boolean);
          await updateReflex(reflex.id, { stim_results: next, is_inhibited: isInhibited }, undefined, reflex.name);
        } else if (key.startsWith("cn-")) {
          const nerveId = key.slice("cn-".length).split("-")[0];
          const test = nerveTests.find((t) => t.nerve_id === nerveId);
          const current = { ...(test?.stim_results || {}) };
          const next = { ...current };
          if (nextValue) next[key] = true;
          else delete next[key];
          const isInhibited = Object.values(next).some(Boolean);
          await updateNerve(nerveId, { stim_results: next, is_inhibited: isInhibited });
        }
      } finally {
        pendingWrites.current -= 1;
        if (pendingWrites.current <= 0) {
          pendingWrites.current = 0;
          setSaveState('saved');
          window.clearTimeout(saveTimer.current);
          saveTimer.current = window.setTimeout(() => setSaveState('idle'), 1600);
        }
      }
    };
    writeQueue.current = writeQueue.current.then(task, task);
    void writeQueue.current.catch(() => {
      pendingWrites.current = 0;
      setSaveState('idle');
    });
  };

  const handleToggle = (key: string) => {
    const nextValue = !checked[key];
    setChecked((prev) => ({ ...prev, [key]: nextValue }));
    persistToggle(key, nextValue);
  };

  const clearAll = () => {
    const markedKeys = Object.keys(checked).filter((k) => checked[k]);
    if (markedKeys.length === 0) return;
    setChecked((prev) => {
      const next = { ...prev };
      markedKeys.forEach((k) => {
        next[k] = false;
      });
      return next;
    });
    markedKeys.forEach((key) => persistToggle(key, false));
  };

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      confirmTimer.current = window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    window.clearTimeout(confirmTimer.current);
    setConfirmClear(false);
    clearAll();
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(confirmTimer.current);
      window.clearTimeout(saveTimer.current);
    };
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToFirstMatch = () => {
    if (!firstMatchId) return;
    document.getElementById(firstMatchId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const loading = reflexLoading || nerveLoading;
  const activeCount = Object.values(checked).filter(Boolean).length;
  const primCount = Object.keys(checked).filter((k) => k.startsWith("prim-") && checked[k]).length;
  const cranialCount = activeCount - primCount;

  const q = query.trim();
  const firstMatchId = useMemo(() => {
    if (!q) return undefined;
    for (const track of PRIMITIVE_TRACKS) {
      for (const r of track.reflexes) {
        if (primitiveReflexMatches(r, q)) return `prim-row-${r.short}`;
      }
    }
    for (const group of NERVE_GROUPS) {
      for (const n of group.items) {
        const lines = nerveStimLines(n);
        for (let i = 0; i < lines.length; i++) {
          if (cranialLineMatches(n, lines[i], q)) return `cn-row-${n.id}-${i}`;
        }
      }
    }
    return undefined;
  }, [q]);

  const matchCount = useMemo(() => {
    if (!q) return 0;
    let count = 0;
    PRIMITIVE_TRACKS.forEach((t) =>
      t.reflexes.forEach((r) => {
        if (primitiveReflexMatches(r, q)) count++;
      })
    );
    NERVE_GROUPS.forEach((g) =>
      g.items.forEach((n) =>
        nerveStimLines(n).forEach((line) => {
          if (cranialLineMatches(n, line, q)) count++;
        })
      )
    );
    return count;
  }, [q]);

  const trackCounts = useMemo(
    () =>
      PRIMITIVE_TRACKS.map((track) =>
        track.reflexes.reduce(
          (acc, r) =>
            acc +
            (r.lateralized
              ? [primitiveSideKey(r, "L"), primitiveSideKey(r, "R")]
              : r.stims?.length
                ? r.stims.map((_, i) => primitiveStimKeyAt(r, i))
                : [primitiveStimKey(r)]
            ).filter((k) => checked[k]).length,
          0
        )
      ),
    [checked]
  );

  const nucleiCounts = useMemo(
    () =>
      NERVE_GROUPS.map((group) =>
        group.items.reduce(
          (acc, nerve) =>
            acc +
            nerveStimLines(nerve).reduce(
              (a, _, i) =>
                a +
                (isLateralStim(nerve.id, i)
                  ? [cranialSideKey(nerve.id, i, "L"), cranialSideKey(nerve.id, i, "R")]
                  : [cranialStimKey(nerve.id, i)]
                ).filter((k) => checked[k]).length,
              0
            ),
          0
        )
      ),
    [checked]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-muted/50 p-3 rounded-xl border border-border print:hidden">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground uppercase tracking-wider">
            Pathway / Reflex / Stim Grid
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tap a square to mark showing — saved instantly.
            {activeCount > 0 && (
              <span className="text-foreground font-semibold"> · {activeCount} active</span>
            )}
            {saveState === "saving" && (
              <span className="text-chart-primary font-semibold"> · Saving…</span>
            )}
            {saveState === "saved" && (
              <span className="text-chart-emerald font-semibold"> · Saved ✓</span>
            )}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {PRIMITIVE_TRACKS.map((track, ti) => (
              <span
                key={track.title}
                title={track.title}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground"
              >
                <span className={`w-2 h-2 rounded-full ${track.color}`} />
                T{ti + 1} · {trackCounts[ti]}
              </span>
            ))}
            <span className="w-px h-5 bg-border" />
            {NERVE_GROUPS.map((group, gi) => (
              <span
                key={group.label}
                title={`${group.label} nuclei`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground"
              >
                <span className={`w-2 h-2 rounded-full ${NUCLEI_COLORS[group.label]}`} />
                {group.label} · {nucleiCounts[gi]}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border">
              <StimXMark className="w-4 h-4 text-chart-destructive" />
              showing / inhibited
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-100/70 border border-yellow-300/70 text-yellow-800">
              <span className="w-3.5 h-3.5 rounded-md bg-yellow-200 border-2 border-yellow-400" />
              nerve side active
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  jumpToFirstMatch();
                }
              }}
              placeholder="Search… (⏎ jump)"
              aria-label="Search reflexes and nerves"
              className="h-11 w-52 pl-9 pr-8 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-chart-primary/50 transition-shadow"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {q && (
            <button
              type="button"
              onClick={jumpToFirstMatch}
              className="inline-flex items-center gap-1.5 px-3 h-11 rounded-lg text-xs font-semibold uppercase tracking-wider bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Jump to first match"
            >
              {matchCount} {matchCount === 1 ? "match" : "matches"}
              <ChevronDown size={14} className="opacity-60" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("primitive-reflexes")}
              className="inline-flex items-center gap-1.5 px-3 h-11 rounded-lg text-xs font-semibold uppercase tracking-wider bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Jump to primitive reflexes"
            >
              <span className="w-2 h-2 rounded-full bg-chart-primary" />
              Primitive {primCount}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("cranial-nerves")}
              className="inline-flex items-center gap-1.5 px-3 h-11 rounded-lg text-xs font-semibold uppercase tracking-wider bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Jump to cranial nerves"
            >
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              Cranial {cranialCount}
            </button>
          </div>
          <div className="w-px h-7 bg-border mx-1 hidden sm:block" />
          <Button
            variant={view === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(v => v === 'board' ? 'summary' : 'board')}
            className="h-11 px-3 text-xs font-medium uppercase tracking-wider rounded-lg"
            title={view === 'summary' ? 'Back to the interactive grid' : 'Show a clean summary of everything marked'}
          >
            {view === 'summary'
              ? <LayoutGrid size={15} className="mr-1.5" />
              : <LayoutList size={15} className="mr-1.5" />}
            {view === 'summary' ? 'Grid' : 'Summary'}
          </Button>
          {activeCount > 0 && (
            <Button
              variant={confirmClear ? "destructive" : "ghost"}
              size="sm"
              onClick={handleClearClick}
              className={`h-11 px-3 text-xs font-medium uppercase tracking-wider rounded-lg ${
                confirmClear
                  ? "text-white"
                  : "text-destructive hover:bg-destructive/10"
              }`}
              title="Erase all marked Xs (returns every reflex/nerve to its natural, unmarked state)"
            >
              <Eraser size={15} className="mr-1.5" /> {confirmClear ? "Erase all?" : "Erase"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/resources/pathway-reflex-stim/print", "_blank")}
            className="h-11 px-3 text-xs font-medium uppercase tracking-wider rounded-lg"
            title="Open the printable reference sheet in a new tab"
          >
            <Printer size={15} className="mr-1.5" /> Print
          </Button>
          {onToggleFullScreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullScreen}
              className="h-11 w-11 p-0 rounded-lg"
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin text-chart-primary" size={28} />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading Grid...</p>
        </div>
      ) : view === 'summary' ? (
        <PathwayReflexStimGridSummary checked={checked} />
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl shadow-sm print:overflow-visible print:border-0 print:shadow-none">
          <PathwayReflexStimGridBoard checked={checked} onToggle={handleToggle} query={query} />
        </div>
      )}
    </div>
  );
}

export default PathwayReflexStimGrid;
