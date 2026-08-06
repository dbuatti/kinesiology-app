import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Printer, Eraser, Search, X, Maximize2, Minimize2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import PathwayReflexStimSheet from "./PathwayReflexStimSheet";
import {
  PRIMITIVE_TRACKS,
  NERVE_GROUPS,
  NUCLEI_COLORS,
  nerveStimLines,
  primitiveStimKey,
  primitiveSideKey,
  cranialStimKey,
  cranialSideKey,
  isLateralStim,
  primitiveReflexMatches,
  cranialLineMatches,
} from "./pathway-reflex-stim-data";

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
    setChecked(map);
    seeded.current = true;
  }, [reflexTests, nerveTests, reflexLoading, nerveLoading]);

  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const persistToggle = (key: string, nextValue: boolean) => {
    pendingWrites.current += 1;
    setSaveState('saving');
    const task = async () => {
      try {
        if (key.startsWith("prim-")) {
          const short = key.slice("prim-".length).split("-")[0];
          const reflex = PRIMITIVE_TRACKS.flatMap((t) => t.reflexes).find(
            (r) => r.short === short
          );
          if (!reflex) return;
          const test = reflexTests.find((t) => t.reflex_id === reflex.id);
          const current = { ...(test?.stim_results || {}) };
          const next = { ...current, [key]: nextValue };
          const isInhibited = Object.values(next).some(Boolean);
          await updateReflex(reflex.id, { stim_results: next, is_inhibited: isInhibited }, undefined, reflex.name);
        } else if (key.startsWith("cn-")) {
          const nerveId = key.slice("cn-".length).split("-")[0];
          const test = nerveTests.find((t) => t.nerve_id === nerveId);
          const current = { ...(test?.stim_results || {}) };
          const next = { ...current, [key]: nextValue };
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
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Pathway / Reflex / Stim Grid
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Tap a square to mark showing — saved instantly. L / R squares record a single side.
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRIMITIVE_TRACKS.map((track, ti) => (
              <span
                key={track.title}
                title={track.title}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${track.color}`} />
                T{ti + 1} · {trackCounts[ti]}
              </span>
            ))}
            <span className="w-px h-4 bg-border" />
            {NERVE_GROUPS.map((group, gi) => (
              <span
                key={group.label}
                title={`${group.label} nuclei`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${NUCLEI_COLORS[group.label]}`} />
                {group.label} · {nucleiCounts[gi]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
              className="h-8 w-44 pl-8 pr-7 rounded-lg border border-border bg-background text-[11px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-chart-primary/50 transition-shadow"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {q && (
            <button
              type="button"
              onClick={jumpToFirstMatch}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Jump to first match"
            >
              {matchCount} {matchCount === 1 ? "match" : "matches"}
              <ChevronDown size={12} className="opacity-60" />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollToSection("primitive-reflexes")}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Jump to primitive reflexes"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-chart-primary" />
              Primitive {primCount}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("cranial-nerves")}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Jump to cranial nerves"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Cranial {cranialCount}
            </button>
          </div>
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          {activeCount > 0 && (
            <Button
              variant={confirmClear ? "destructive" : "ghost"}
              size="sm"
              onClick={handleClearClick}
              className={`h-8 px-3 text-[10px] font-medium uppercase tracking-wider rounded-lg ${
                confirmClear
                  ? "text-white"
                  : "text-destructive hover:bg-destructive/10"
              }`}
            >
              <Eraser size={13} className="mr-1.5" /> {confirmClear ? "Confirm?" : "Clear"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 px-3 text-[10px] font-medium uppercase tracking-wider rounded-lg"
          >
            <Printer size={13} className="mr-1.5" /> Print
          </Button>
          {onToggleFullScreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullScreen}
              className="h-8 px-3 rounded-lg"
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin text-chart-primary" size={28} />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading Grid...</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl shadow-sm print:overflow-visible print:border-0 print:shadow-none">
          <PathwayReflexStimSheet checked={checked} onToggle={handleToggle} query={query} />
        </div>
      )}
    </div>
  );
}

export default PathwayReflexStimGrid;
