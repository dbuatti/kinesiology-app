import { useEffect, useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, BookMarked, Check, ChevronDown, ChevronRight, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";
import { processLabel } from "@/data/correction-process-list";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";
import { useCorrectionDock } from "./CorrectionDockContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusLabel = (status) => {
  switch (status) {
    case "inhibited": return "Inhibited";
    case "hypertonic": return "Hypertonic";
    case "clear": return "Clear";
    case "priority": return "Priority";
    case "primary_priority": return "Primary";
    default: return "—";
  }
};

const CorrectionDock = () => {
  const { isOpen, target, selection, openDock, closeDock, rememberSelection, protocolLogs, logProtocol, inhibitionPathway, inhibitionPathwayState, setInhibitionStatus, clearInhibitionStatus, selectInhibitionPathway, availableInhibitionPathways } =
    useCorrectionDock();
  const [depth, setDepth] = useState(0);
  const [backSignal, setBackSignal] = useState(0);
  const [dockWidth, setDockWidth] = useState(() => {
    const saved = localStorage.getItem('rk_dock_width');
    return saved ? parseInt(saved, 10) : null;
  });

  const DOCK_MIN = 360;
  const DOCK_MAX = 760;
  const dockWidthPx = dockWidth ?? 560;

  const handleRef = useRef(null);
  const asideRef = useRef(null);
  const widthRef = useRef(dockWidthPx);

  useEffect(() => {
    if (dockWidth != null) localStorage.setItem('rk_dock_width', String(dockWidth));
  }, [dockWidth]);

  useEffect(() => {
    widthRef.current = dockWidthPx;
  }, [dockWidthPx]);

  useEffect(() => {
    if (!isOpen) return;
    let startX = 0;
    let startWidth = widthRef.current;
    let rafId = 0;
    const onMove = (e) => {
      const dx = e.clientX - startX;
      const next = Math.min(DOCK_MAX, Math.max(DOCK_MIN, startWidth - dx));
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setDockWidth(next));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    const onDown = (e) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = widthRef.current;
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    const handle = handleRef.current;
    if (!handle) return;
    handle.addEventListener('mousedown', onDown);
    return () => {
      handle.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Clear inhibition pathway with C key
      if (e.key === "c") {
        e.preventDefault();
        selectInhibitionPathway(null);
        return;
      }
      const isEsc = e.key === "Escape";
      if (!isEsc && !(e.key === "Backspace" && depth > 0)) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable))
        return;
      e.preventDefault();
      if (depth > 0) setBackSignal((n) => n + 1);
      else closeDock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, depth, closeDock]);

  if (!isOpen) {
    return (
      <aside className="sticky top-[59px] flex h-[calc(100dvh-59px)] w-12 shrink-0 self-start flex-col items-center gap-0.5 border-l border-border bg-card py-2.5 coarse:w-14 coarse:gap-1">
        <button onClick={() => openDock({ tab: "afferent", view: "folder" })} title="Afferent corrections (A)" aria-label="Open afferent corrections" className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-strong transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-11 coarse:w-11">
          <ArrowDownCircle size={17} className="coarse:h-5 coarse:w-5" />
        </button>
        <button onClick={() => openDock({ tab: "efferent", view: "folder" })} title="Efferent corrections (E)" aria-label="Open efferent corrections" className="flex h-9 w-9 items-center justify-center rounded-xl text-purple-600 transition-colors hover:bg-purple-500/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 dark:text-purple-300 coarse:h-11 coarse:w-11">
          <ArrowUpCircle size={17} className="coarse:h-5 coarse:w-5" />
        </button>
        <button onClick={() => openDock({ tab: "efferent", item: "emotional" })} title="Emotional protocol" aria-label="Open the emotional protocol" className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-11 coarse:w-11">
          <Heart size={17} className="coarse:h-5 coarse:w-5" />
        </button>
        <div className="my-1.5 h-px w-5 bg-border" />
        <button onClick={() => openDock()} title="Open corrections (M)" aria-label="Open the corrections manual" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-11 coarse:w-11">
          <BookMarked size={17} className="coarse:h-5 coarse:w-5" />
        </button>
      </aside>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] lg:hidden" onClick={closeDock} aria-hidden />
      <aside aria-label="Corrections manual" className={cn("fixed inset-y-0 right-0 z-50 flex flex-col border-l border-border bg-card shadow-2xl overflow-hidden", "sm:max-w-[38rem]", "lg:sticky lg:inset-auto lg:top-[59px] lg:z-20 lg:h-[calc(100dvh-59px)] lg:max-h-[calc(100dvh-59px)] lg:self-start lg:shadow-none", "lg:max-w-[52vw] xl:max-w-[48vw]")} style={{ width: dockWidthPx + "px" }}>
        <div ref={handleRef} className="absolute left-[-4px] top-0 h-full w-8 shrink-0 cursor-ew-resize z-10 hover:bg-muted/30" title="Drag to resize the corrections manual" aria-label="Resize corrections manual width">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-0.5 rounded-full bg-border/60" />
        </div>
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-strong">
            <BookMarked size={12} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-tight text-foreground">
              {target?.item ? processLabel(target.item) : "Corrections Manual"}
            </p>
            {target && target.view !== "folder" && (
              <p className="truncate text-[9px] text-muted-foreground/50 tracking-tight">
                {target.tab === "afferent" ? "Afferent" : "Efferent"}
                {target.group ? " · " + target.group : ""}
                {target.item ? " · " + processLabel(target.item) : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className={cn("flex h-8 items-center gap-2 rounded-lg border px-3 text-[11px] font-medium transition-all", !inhibitionPathway ? "border-border/60 bg-card text-muted-foreground hover:border-foreground/20 hover:bg-muted/40" : inhibitionPathway?.status === "clear" ? "border-success/30 bg-success/5 text-success-strong hover:bg-success/10" : inhibitionPathway?.status === "hypertonic" ? "border-amber/30 bg-amber/5 text-amber-700 hover:bg-amber/10" : inhibitionPathway?.status === "priority" || inhibitionPathway?.status === "primary_priority" ? "border-amber/30 bg-amber/5 text-amber-700 hover:bg-amber/10" : "border-rose/30 bg-rose/5 text-rose-700 hover:bg-rose/10")}>
                  {inhibitionPathway ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate max-w-[140px] tracking-tight">
                        {inhibitionPathway.pathway?.notes}
                      </span>
                      {(inhibitionPathway.pathway?.side === "L" || inhibitionPathway.pathway?.side === "R") && (
                        <span className="text-[9px] text-muted-foreground/60">
                          {inhibitionPathway.pathway.side} · {statusLabel(inhibitionPathway.status).toLowerCase()}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">Select pathway</span>
                  )}
                  <ChevronDown className="shrink-0 h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="z-20 w-[360px] rounded-2xl border border-border/80 bg-card p-0 text-sm shadow-2xl ring-1 ring-border/20">
                <div className="px-5 py-3 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-foreground">Inhibition Pathway</p>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground/50">
                      <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-black shadow-sm">↓</span> Inhibited</span>
                      <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-black shadow-sm">↑</span> Hypertonic</span>
                    </div>
                  </div>
                </div>
                {availableInhibitionPathways.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto py-2">
                    {(() => {
                      // Group pathways by phase category
                      const groups: Record<string, typeof availableInhibitionPathways> = {};
                      const groupOrder: string[] = [];
                      const groupLabels: Record<string, string> = {
                        muscle: "Muscles",
                        primitiveReflex: "Primitive Reflexes",
                        cranialNerve: "Cranial Nerves",
                      };
                      for (const pw of availableInhibitionPathways) {
                        const phase = pw.pathway.phase || "other";
                        if (!groups[phase]) {
                          groups[phase] = [];
                          groupOrder.push(phase);
                        }
                        groups[phase].push(pw);
                      }
                      // Sort within each group by clinical priority
                      for (const phase of groupOrder) {
                        if (phase === "primitiveReflex") {
                          // Track 1 → Track 2 → Track 3, then alphabetical within track
                          groups[phase].sort((a, b) => {
                            const trackA = PRIMITIVE_REFLEXES.find(r => r.name === a.pathway.notes)?.track ?? 99;
                            const trackB = PRIMITIVE_REFLEXES.find(r => r.name === b.pathway.notes)?.track ?? 99;
                            if (trackA !== trackB) return trackA - trackB;
                            return (a.pathway.notes || "").localeCompare(b.pathway.notes || "");
                          });
                        } else if (phase === "cranialNerve") {
                          // Numerical order: CN I, CN II, CN III, ...
                          groups[phase].sort((a, b) => {
                            const numA = parseInt((a.pathway.notes || "").replace(/[^0-9]/g, "")) || 99;
                            const numB = parseInt((b.pathway.notes || "").replace(/[^0-9]/g, "")) || 99;
                            if (numA !== numB) return numA - numB;
                            return (a.pathway.notes || "").localeCompare(b.pathway.notes || "");
                          });
                        } else {
                          // Muscles: alphabetical
                          groups[phase].sort((a, b) => (a.pathway.notes || "").localeCompare(b.pathway.notes || ""));
                        }
                      }
                      return groupOrder.map((phase) => (
                        <div key={phase} className="mb-1">
                          {groupOrder.length > 1 && (
                            <p className="px-5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
                              {groupLabels[phase] || phase}
                            </p>
                          )}
                          <div className="space-y-0.5">
                            {groups[phase].map((pathway, idx) => {
                              const isSelected = inhibitionPathway?.pathway?.processId === pathway.pathway?.processId && inhibitionPathway?.pathway?.side === pathway.pathway?.side;
                              const side = pathway.pathway?.side;
                              const isR = side === "R";
                              const isL = side === "L";
                              const pid = pathway.pathway.processId;
                              // Display status: check override from inhibitionPathwayState first
                              const overrideStatus = inhibitionPathwayState?.[pid]?.status;
                              const displayStatus = overrideStatus ?? pathway.status;
                              const isPriority = displayStatus === "priority" || displayStatus === "primary_priority";
                              const isPrimary = displayStatus === "primary_priority";
                              const baseStatus = pathway.status; // original from priority_pattern
                              return (
                                <DropdownMenuItem key={idx} onSelect={(e) => { e.preventDefault(); selectInhibitionPathway({ ...pathway, status: displayStatus }); }} className={cn("flex items-center gap-3.5 px-5 py-3 mx-2 rounded-xl cursor-pointer border-l-[3px]", isSelected ? "bg-primary/8 border-l-primary" : "border-l-transparent hover:bg-muted/40")}>
                                  {/* Side indicator pill */}
                                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold", isR ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : isL ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "bg-muted text-muted-foreground")}>
                                    {isR ? "R" : isL ? "L" : "–"}
                                  </span>
                                  {/* Pathway name */}
                                  <span className="min-w-0 flex-1">
                                    <p className={cn("text-[13px] font-medium truncate tracking-tight leading-snug", isSelected ? "text-primary-strong" : "text-foreground")}>
                                      {pathway.pathway?.notes}
                                    </p>
                                  </span>
                                  {/* Status arrow indicator */}
                                  <span className={cn("shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-black shadow-sm", displayStatus === "clear" ? "bg-success text-white" : displayStatus === "hypertonic" ? "bg-amber-500 text-white" : displayStatus === "inhibited" ? "bg-rose-500 text-white" : displayStatus === "priority" ? "bg-amber-500 text-white" : displayStatus === "primary_priority" ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground")}>
                                    {displayStatus === "hypertonic" ? "↑" : displayStatus === "inhibited" ? "↓" : displayStatus === "clear" ? "✓" : displayStatus === "priority" || displayStatus === "primary_priority" ? "↓" : "–"}
                                  </span>
                                  {/* Priority toggle buttons */}
                                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (isPriority || isPrimary) {
                                          // Toggle off: revert to base status
                                          const revertStatus = isPrimary ? "priority" : baseStatus;
                                          const updated = { ...pathway, status: revertStatus };
                                          selectInhibitionPathway(updated);
                                          setInhibitionStatus(pid, pathway.pathway, revertStatus);
                                        } else {
                                          // Toggle on: set to priority
                                          const updated = { ...pathway, status: "priority" as const };
                                          selectInhibitionPathway(updated);
                                          setInhibitionStatus(pid, pathway.pathway, "priority");
                                        }
                                      }}
                                      className={cn(
                                        "w-6 h-5 flex items-center justify-center rounded text-[8px] font-bold border",
                                        isPriority
                                          ? "bg-amber-500 text-white border-amber-500"
                                          : "border-amber-300/50 text-amber-600/70 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-400/70"
                                      )}
                                      title="Toggle Priority"
                                    >
                                      P
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (isPrimary) {
                                          // Toggle off: revert to priority
                                          const updated = { ...pathway, status: "priority" as const };
                                          selectInhibitionPathway(updated);
                                          setInhibitionStatus(pid, pathway.pathway, "priority");
                                        } else {
                                          // Toggle on: set to primary_priority (implies priority)
                                          const updated = { ...pathway, status: "primary_priority" as const };
                                          selectInhibitionPathway(updated);
                                          setInhibitionStatus(pid, pathway.pathway, "primary_priority");
                                        }
                                      }}
                                      className={cn(
                                        "w-6 h-5 flex items-center justify-center rounded text-[8px] font-bold border",
                                        isPrimary
                                          ? "bg-amber-700 text-white border-amber-700"
                                          : "border-amber-300/50 text-amber-600/70 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-400/70"
                                      )}
                                      title="Toggle Primary Priority"
                                    >
                                      PP
                                    </button>
                                  </div>
                                  {/* Selection indicated by left border accent + background, no checkmark needed */}
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <div className="flex flex-col items-center gap-2.5">
                      <span className="text-4xl text-muted-foreground/15">∅</span>
                      <p className="text-[12px] text-muted-foreground/50 italic">No inhibited pathways found</p>
                      <p className="text-[10px] text-muted-foreground/40">Run an assessment first</p>
                    </div>
                  </div>
                )}
                {/* Priority marking moved to each row */}
                {availableInhibitionPathways.length > 0 && (
                  <div className="border-t border-border/60 p-2.5 bg-muted/10">
                    <DropdownMenuItem onSelect={() => selectInhibitionPathway(null)} className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-[11px] font-medium text-muted-foreground/50 hover:bg-muted/40 hover:text-foreground transition-colors">
                      <X className="h-4 w-4 shrink-0" />
                      <span>Clear selection</span>
                    </DropdownMenuItem>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button onClick={closeDock} title="Close corrections" aria-label="Close corrections" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 lg:px-2 lg:w-auto lg:gap-1.5">
            <X size={13} className="lg:hidden" />
            <ChevronRight size={14} className="hidden lg:block" />
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60">
              <kbd className="rounded border border-border/60 bg-muted/40 px-1 text-[8px] font-semibold mr-1">Esc</kbd>
              Close
            </span>
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <CorrectionsManualContent compact fill target={target} initialSelection={selection} onSelectionChange={rememberSelection} onDepthChange={setDepth} backSignal={backSignal} protocolLogs={protocolLogs} onProtocolLogChange={logProtocol} />
        </div>
      </aside>
    </>
  );
};

export default CorrectionDock;
