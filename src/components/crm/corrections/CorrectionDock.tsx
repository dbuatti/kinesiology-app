import { ArrowDownCircle, ArrowUpCircle, BookMarked, ChevronRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";
import { useCorrectionDock } from "./CorrectionDockContext";

/**
 * Persistent correction reference that sits beside the session instead of on
 * top of it. Stays mounted across PEACE / Grid / Doc so a pathway reference
 * opened mid-muscle-test survives every phase change.
 */
const CorrectionDock = () => {
  const { isOpen, target, openDock, closeDock, rememberSelection } = useCorrectionDock();

  if (!isOpen) {
    return (
      <aside className="sticky top-0 flex h-[calc(100dvh-3.5rem)] w-12 shrink-0 self-start flex-col items-center gap-1 border-l border-border bg-card py-3">
        <button
          onClick={() => openDock({ tab: "afferent" })}
          title="Afferent corrections (A)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
        >
          <ArrowDownCircle size={16} />
        </button>
        <button
          onClick={() => openDock({ tab: "efferent" })}
          title="Efferent corrections (E)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-purple-600 transition-colors hover:bg-purple-500/10 dark:text-purple-300"
        >
          <ArrowUpCircle size={16} />
        </button>
        <button
          onClick={() => openDock({ tab: "efferent", item: "emotional" })}
          title="Emotional protocol"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-500/10"
        >
          <Heart size={16} />
        </button>
        <div className="my-1 h-px w-6 bg-border" />
        <button
          onClick={() => openDock()}
          title="Open corrections (M)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <BookMarked size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-[calc(100dvh-3.5rem)] w-[400px] max-w-[70vw] shrink-0 self-start flex-col",
        "border-l border-border bg-card"
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <BookMarked size={13} className="shrink-0 text-muted-foreground" />
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Corrections
          </span>
        </div>
        <button
          onClick={closeDock}
          title="Close corrections (Esc)"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <CorrectionsManualContent compact fill target={target} onSelectionChange={rememberSelection} />
      </div>
    </aside>
  );
};

export default CorrectionDock;
