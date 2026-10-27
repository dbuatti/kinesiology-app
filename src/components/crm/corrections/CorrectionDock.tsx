import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, BookMarked, ChevronDown, ChevronRight, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";
import { useCorrectionDock } from "./CorrectionDockContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Persistent correction reference that sits beside the session instead of on
 * top of it. Stays mounted across PEACE / Grid / Doc so a pathway reference
 * opened mid-muscle-test survives every phase change.
 *
 * Collapsed it's a 48px rail. Open, it is ONE fixed-width column at every
 * depth — folder list, group, process, all the same width. Drilling in shows a
 * breadcrumb instead of resizing the panel, so the session behind it never
 * jumps around. Below `lg` it becomes a drawer over a scrim.
 */
const CorrectionDock = () => {
  const { isOpen, target, selection, openDock, closeDock, rememberSelection, protocolLogs, logProtocol, inhibitionPathway, inhibitionPathwayState, setInhibitionStatus, clearInhibitionStatus, selectInhibitionPathway, availableInhibitionPathways } =
    useCorrectionDock();
  /** 0 = the two top-level folders; >0 = somewhere inside them. */
  const [depth, setDepth] = useState(0);
  /** Bumped on Esc so the manual steps one folder up. */
  const [backSignal, setBackSignal] = useState(0);

  // Esc walks back out the way you came in, then closes the dock at the top.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Esc walks out of a folder, then closes. Backspace is the file-browser
      // habit for "up", but only while there is somewhere to go up to.
      const isEsc = e.key === "Escape";
      if (!isEsc && !(e.key === "Backspace" && depth > 0)) return;
      const t = e.target as HTMLElement | null;
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
        <button
          onClick={() => openDock({ tab: "afferent", view: "folder" })}
          title="Afferent corrections (A)"
          aria-label="Open afferent corrections"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-strong transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-11 coarse:w-11"
        >
          <ArrowDownCircle size={17} className="coarse:h-5 coarse:w-5" />
        </button>
        <button
          onClick={() => openDock({ tab: "efferent", view: "folder" })}
          title="Efferent corrections (E)"
          aria-label="Open efferent corrections"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-purple-600 transition-colors hover:bg-purple-500/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 dark:text-purple-300 coarse:h-11 coarse:w-11"
        >
          <ArrowUpCircle size={17} className="coarse:h-5 coarse:w-5" />
        </button>
        <button
          onClick={() => openDock({ tab: "efferent", item: "emotional" })}
          title="Emotional protocol"
          aria-label="Open the emotional protocol"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-11 coarse:w-11"
        >
          <Heart size={17} className="coarse:h-5 coarse:w-5" />
        </button>
        <div className="my-1.5 h-px w-5 bg-border" />
        <button
          onClick={() => openDock()}
          title="Open corrections (M)"
          aria-label="Open the corrections manual"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-11 coarse:w-11"
        >
          <BookMarked size={17} className="coarse:h-5 coarse:w-5" />
        </button>
      </aside>
    );
  }

  return (
    <>
      {/* Phone / tablet portrait: the panel covers the page, so give it a way out. */}
      <div
        className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] lg:hidden"
        onClick={closeDock}
        aria-hidden
      />
      <aside
        aria-label="Corrections manual"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[30rem] flex-col border-l border-border bg-card shadow-2xl",
          // Tablets in portrait get a roomier drawer; phones stay edge-to-edge.
          "sm:max-w-[34rem]",
          // Never let the last row sit under the home indicator.
          "pb-[env(safe-area-inset-bottom)] lg:pb-0",
          "lg:sticky lg:inset-auto lg:top-[59px] lg:z-20 lg:h-[calc(100dvh-59px)] lg:max-h-[calc(100dvh-59px)] lg:max-w-none lg:self-start lg:shadow-none",
          // One width at every depth. 480px on a 1024–1279 laptop, 520px from
          // 1280 up (fewer wrapped lines in the body copy), and never more than
          // ~42–46% of the viewport so the session keeps the larger half.
          "lg:w-[480px] lg:max-w-[46vw] xl:w-[520px] xl:max-w-[42vw]",
          "motion-safe:animate-in motion-safe:slide-in-from-right-4 motion-safe:fade-in motion-safe:duration-200",
          "motion-safe:lg:animate-none"
        )}
      >
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-2.5 coarse:h-14 coarse:px-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-strong coarse:h-8 coarse:w-8">
            <BookMarked size={13} />
          </span>
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-tight text-foreground">
            Corrections
          </p>
          {/* Inhibition pathway selector — one per correction session. */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground coarse:px-2.5 coarse:py-1.5 coarse:text-[12px]">
            <DropdownMenu>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-md bg-muted/50",
                  inhibitionPathway?.pathway?.processId === target?.item && "border-primary/50 text-primary-strong",
                  inhibitionPathway?.status === "clear" && "bg-success/10 text-success-strong border-none",
                  !inhibitionPathway && "opacity-50"
                )}
              >
                {inhibitionPathway?.pathway?.processId && inhibitionPathway?.pathway?.side !== "midline" && (
                  <span className="font-medium">{inhibitionPathway?.pathway?.side === "L" ? "L" : "R"}</span>
                )}
                {inhibitionPathway?.pathway?.processId && inhibitionPathway?.pathway?.side === "midline" && (
                  <span className="font-medium text-muted-foreground">Midline</span>
                )}
                {inhibitionPathway?.pathway?.processId && (
                  <span className="text-[10px] font-semibold text-muted-foreground">·</span>
                )}
                <span className="text-[10px] font-semibold text-muted-foreground">{inhibitionPathway?.pathway?.processId}</span>
              </span>
              <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 z-10">
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-20 rounded-md border border-border bg-card p-2 text-sm shadow-xl">
                <DropdownMenuSeparator />
                {availableInhibitionPathways.map((pathway, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onSelect={() => selectInhibitionPathway(pathway)}
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      inhibitionPathway?.pathway?.processId === pathway.pathway?.processId && "bg-primary/10 text-primary-strong"
                    )}
                  >
                    <span className={cn("font-medium", pathway.pathway?.side && pathway.pathway?.side !== "midline" && "text-primary-strong")}>
                      {pathway.pathway?.side === "L" ? "L" : pathway.pathway?.side === "R" ? "R" : "Midline"}
                    </span>
                    <span className="text-[10px] opacity-60">{pathway.pathway?.processId}</span>
                    <span className="text-[10px] opacity-60">{pathway.pathway?.notes || ""}</span>
                  </DropdownMenuItem>
                ))}
                {availableInhibitionPathways.length === 0 && (
                  <span className="text-xs text-muted-foreground/50 no-inhibited-pathways">
                    No inhibited pathways found
                  </span>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => selectInhibitionPathway(null)}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  <ChevronDown className="h-3 w-3 opacity-60" /> Clear selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <kbd
            title="Back one folder, then close"
            className="hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:fine:inline"
          >
            Esc
          </kbd>
          <button
            onClick={closeDock}
            title="Close corrections"
            aria-label="Close corrections"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 coarse:h-10 coarse:w-10"
          >
            <X size={15} className="lg:hidden" />
            <ChevronRight size={16} className="hidden lg:block" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <CorrectionsManualContent
            compact
            fill
            target={target}
            initialSelection={selection}
            onSelectionChange={rememberSelection}
            onDepthChange={setDepth}
            backSignal={backSignal}
            protocolLogs={protocolLogs}
            onProtocolLogChange={logProtocol}
          />
        </div>
      </aside>
    </>
  );
};

export default CorrectionDock;
