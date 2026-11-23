import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCorrectionDock } from "./CorrectionDockContext";

const CorrectionDockButton = () => {
  const { isOpen, toggleDock } = useCorrectionDock();

  return (
    <button
      onClick={toggleDock}
      aria-pressed={isOpen}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:w-auto md:justify-start md:gap-1.5 md:px-2.5 md:text-[12px] md:font-medium",
        isOpen && "bg-primary/10 text-primary-strong hover:bg-primary/15 hover:text-primary-strong"
      )}
      title="Corrections manual — afferent / efferent (M)"
    >
      <BookMarked size={15} />
      <span className="hidden md:inline">Manual</span>
    </button>
  );
};

export default CorrectionDockButton;
