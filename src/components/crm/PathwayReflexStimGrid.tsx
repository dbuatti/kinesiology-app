import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Printer, Eraser, Search, X, Maximize2, Minimize2, ChevronDown, LayoutList, LayoutGrid, Baby, Zap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { safeParse } from "@/utils/safe-json";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import PathwayReflexStimGridBoard from "./PathwayReflexStimGridBoard";
import PathwayReflexStimGridSummary from "./PathwayReflexStimGridSummary";
import { buildCheckedMap } from "./grid-checked";
import { StimXMark } from "./StimXMark";
import {
  INTRINSIC_GRID_MUSCLES,
  seedMuscleState,
  nextMuscleState,
  parseMuscleKey,
  muscleMatches,
  muscleMidlineKey,
  muscleSideKey,
  type MuscleGridState,
} from "./muscle-grid-data";
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

type GridTab = "reflexes" | "nerves" | "muscles";

const GRID_TABS: { id: GridTab; label: string; icon: any }[] = [
  { id: "reflexes", label: "Primitive Reflexes", icon: Baby },
  { id: "nerves", label: "Cranial Nerves", icon: Zap },
  { id: "muscles", label: "Intrinsic Muscles", icon: ShieldAlert },
];

interface PathwayReflexStimGridProps {
  appointmentId: string;
  priorityPattern?: string | null;
  updatePriorityPattern?: (category: string, itemName: string, status: string | null, side?: 'L' | 'R') => Promise<void>;
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
  const [muscleState, setMuscleState] = useState<Record<string, MuscleGridState>>({});
  const [activeTab, setActiveTab] = useState<GridTab>("reflexes");
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
    setChecked(buildCheckedMap({ reflexTests, nerveTests, priorityPattern }));
    setMuscleState(seedMuscleState(safeParse(priorityPattern, {})));
    seeded.current = true;
  }, [reflexTests, nerveTests, reflexLoading, nerveLoading]);

  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  const enqueueWrite = (task: () => Promise<void>) => {
    pendingWrites.current += 1;
    setSaveState('saving');
    const run = async () => {
      try {
        await task();
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
    writeQueue.current = writeQueue.current.then(run, run);
    void writeQueue.current.catch(() => {
      pendingWrites.current = 0;
      setSaveState('idle');
    });
  };

  const persistToggle = (key: string, nextValue: boolean) => {
    const task = async () => {
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
        const side = reflex.lateralized
          ? (key.slice(key.lastIndexOf("-") + 1) as "L" | "R")
          : undefined;
        await updateReflex(reflex.id, { stim_results: next, is_inhibited: isInhibited }, side, reflex.name);
      } else if (key.startsWith("cn-")) {
        const nerveId = key.slice("cn-".length).split("-")[0];
        const test = nerveTests.find((t) => t.nerve_id === nerveId);
        const current = { ...(test?.stim_results || {}) };
        const next = { ...current };
        if (nextValue) next[key] = true;
        else delete next[key];
        const isInhibited = Object.values(next).some(Boolean);
        const sideMatch = key.match(/-(L|R)$/);
        const side = (sideMatch ? sideMatch[1] : undefined) as "L" | "R" | undefined;
        await updateNerve(nerveId, { stim_results: next, is_inhibited: isInhibited }, side);
      }
    };
    enqueueWrite(task);
  };

  const handleToggle = (key: string) => {
    const nextValue = !checked[key];
    setChecked((prev) => ({ ...prev, [key]: nextValue }));
    persistToggle(key, nextValue);
  };

  const handleMuscleToggle = (key: string) => {
    const current = muscleState[key];
    const next = nextMuscleState(current);
    setMuscleState((prev) => {
      const p = { ...prev };
      if (next) p[key] = next;
      else delete p[key];
      return p;
    });
    const { name, side } = parseMuscleKey(key);
    const writeStatus = next ?? null;
    enqueueWrite(async () => {
      await updatePriorityPattern?.("muscles", name, writeStatus, side);
    });
  };

  const clearAll = () => {
    const markedKeys = Object.keys(checked).filter((k) => checked[k]);
    if (markedKeys.length > 0) {
      setChecked((prev) => {
        const next = { ...prev };
        markedKeys.forEach((k) => {
          next[k] = false;
        });
        return next;
      });
      markedKeys.forEach((key) => persistToggle(key, false));
    }
    const activeMuscleKeys = Object.keys(muscleState);
    if (activeMuscleKeys.length > 0) {
      setMuscleState({});
      activeMuscleKeys.forEach((key) => {
        const { name, side } = parseMuscleKey(key);
        enqueueWrite(async () => {
          await updatePriorityPattern?.("muscles", name, null, side);
        });
      });
    }
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

  const jumpToFirstMatch = () => {
    if (!firstMatchId) return;
    document.getElementById(firstMatchId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const loading = reflexLoading || nerveLoading;
  const primCount = Object.keys(checked).filter((k) => k.startsWith("prim-") && checked[k]).length;
  const cranialCount = Object.keys(checked).filter((k) => k.startsWith("cn-") && checked[k]).length;
  const muscleCount = Object.values(muscleState).length;
  const activeCount = primCount + cranialCount + muscleCount;

  const q = query.trim();
  const searchPlaceholder =
    activeTab === "reflexes"
      ? "Search reflexes…"
      : activeTab === "nerves"
        ? "Search cranial nerves…"
        : "Search intrinsic muscles…";
  const firstMatchId = useMemo(() => {
    if (!q) return undefined;
    if (activeTab === "reflexes") {
      for (const track of PRIMITIVE_TRACKS) {
        for (const r of track.reflexes) {
          if (primitiveReflexMatches(r, q)) return `prim-row-${r.short}`;
        }
      }
    } else if (activeTab === "nerves") {
      for (const group of NERVE_GROUPS) {
        for (const n of group.items) {
          const lines = nerveStimLines(n);
          for (let i = 0; i < lines.length; i++) {
            if (cranialLineMatches(n, lines[i], q)) return `cn-row-${n.id}-${i}`;
          }
        }
      }
    } else {
      for (const m of INTRINSIC_GRID_MUSCLES) {
        if (muscleMatches(m, q)) return `mus-row-${m.name}`;
      }
    }
    return undefined;
  }, [q, activeTab]);

  const matchCount = useMemo(() => {
    if (!q) return 0;
    let count = 0;
    if (activeTab === "reflexes") {
      PRIMITIVE_TRACKS.forEach((t) =>
        t.reflexes.forEach((r) => {
          if (primitiveReflexMatches(r, q)) count++;
        })
      );
    } else if (activeTab === "nerves") {
      NERVE_GROUPS.forEach((g) =>
        g.items.forEach((n) =>
          nerveStimLines(n).forEach((line) => {
            if (cranialLineMatches(n, line, q)) count++;
          })
        )
      );
    } else {
      INTRINSIC_GRID_MUSCLES.forEach((m) => {
        if (muscleMatches(m, q)) count++;
      });
    }
    return count;
  }, [q, activeTab]);

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
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Pathway / Reflex / Stim Grid
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap a square to mark showing, or cycle muscle tone — saved instantly.
              {saveState === "saving" && (
                <span className="text-chart-primary font-semibold"> · Saving…</span>
              )}
              {saveState === "saved" && (
                <span className="text-chart-emerald font-semibold"> · Saved ✓</span>
              )}
            </p>
          </div>
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums bg-chart-destructive/10 text-chart-destructive border border-chart-destructive/20 shrink-0">
              <StimXMark className="w-3.5 h-3.5" /> {activeCount} active
            </span>
          )}
        </div>

        {/* Category tabs */}
        <div className="px-5 pb-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-muted/30">
            {GRID_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = tab.id === "reflexes" ? primCount : tab.id === "nerves" ? cranialCount : muscleCount;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={tab.id === "muscles" ? "Intrinsic Stabilisation — tap to cycle Normotonic → Hypotonic → Inhibited" : undefined}
                >
                  <Icon size={13} />
                  {tab.label}
                  <span className={cn(
                    "tabular-nums",
                    activeTab === tab.id ? "text-primary-foreground/80" : "text-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          <div className="relative flex-1 min-w-[220px] max-w-md">
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
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 w-full pl-9 pr-8 rounded-lg border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-chart-primary/50 transition-shadow"
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
          <div className="flex items-center gap-1.5">
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
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-background">
              <button
                type="button"
                onClick={() => setView('board')}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
                  view === 'board' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Show the interactive reflex and nerve grid"
              >
                <LayoutGrid size={14} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setView('summary')}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
                  view === 'summary' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Show a clean summary of everything marked"
              >
                <LayoutList size={14} /> Summary
              </button>
            </div>
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
              onClick={() => window.open(`/appointments/${appointmentId}/grid-sheet`, "_blank")}
              className="h-11 px-3 text-xs font-medium uppercase tracking-wider rounded-lg"
              title="Open a printable sheet of this appointment's marks in a new tab"
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

        {/* Distribution + legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 bg-muted/30 border-t border-border/50">
          {PRIMITIVE_TRACKS.map((track, ti) => (
            <span
              key={track.title}
              title={track.title}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              <span className={`w-2 h-2 rounded-full ${track.color}`} />
              T{ti + 1} <span className="text-foreground tabular-nums">{trackCounts[ti]}</span>
            </span>
          ))}
          <span className="w-px h-4 bg-border" />
          {NERVE_GROUPS.map((group, gi) => (
            <span
              key={group.label}
              title={`${group.label} nuclei`}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              <span className={`w-2 h-2 rounded-full ${NUCLEI_COLORS[group.label]}`} />
              {group.label} <span className="text-foreground tabular-nums">{nucleiCounts[gi]}</span>
            </span>
          ))}
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Muscles <span className="text-foreground tabular-nums">{muscleCount}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <StimXMark className="w-3.5 h-3.5 text-chart-destructive" />
            showing / inhibited
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700">
            <span className="w-3 h-3 rounded-md bg-sky-200 border border-sky-400" />
            hypotonic
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-yellow-800">
            <span className="w-3 h-3 rounded-md bg-yellow-200 border border-yellow-400" />
            nerve side active
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin text-chart-primary" size={28} />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading Grid...</p>
        </div>
      ) : view === 'summary' ? (
        <PathwayReflexStimGridSummary checked={checked} muscleState={muscleState} />
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl shadow-sm print:overflow-visible print:border-0 print:shadow-none">
          <PathwayReflexStimGridBoard
            checked={checked}
            onToggle={handleToggle}
            query={query}
            activeTab={activeTab}
            muscleState={muscleState}
            onMuscleToggle={handleMuscleToggle}
          />
        </div>
      )}
    </div>
  );
}

export default PathwayReflexStimGrid;
