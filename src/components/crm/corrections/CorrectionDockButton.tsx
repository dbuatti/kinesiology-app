import { BookMarked } from "lucide-react";
import { useCorrectionDock } from "./CorrectionDockContext";

const CorrectionDockButton = () => {
  const { isOpen, toggleDock } = useCorrectionDock();

  return (
    <button
      onClick={toggleDock}
      aria-pressed={isOpen}
      className="flex items-center gap-1.5 px-2.5 h-7 text-[10.5px] font-medium tracking-tight border border-border bg-card hover:bg-muted/60 rounded-lg shrink-0 whitespace-nowrap"
      title="Corrections manual — afferent / efferent (M)"
    >
      <BookMarked size={13} />
      <span className="hidden md:inline">Manual</span>
    </button>
  );
};

export default CorrectionDockButton;
