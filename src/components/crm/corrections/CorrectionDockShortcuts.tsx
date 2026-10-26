import { useEffect } from "react";
import { useCorrectionDock } from "./CorrectionDockContext";

/**
 * At-the-table shortcuts. Single keys (no modifier) so they work one-handed
 * while the client is on the table — matches the existing "N" for notes.
 */
const CorrectionDockShortcuts = () => {
  const { isOpen, openDock, closeDock, toggleDock } = useCorrectionDock();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;

      // In session ⌘K opens corrections (the global search stands down there).
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !e.altKey) {
        e.preventDefault();
        toggleDock();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          openDock({ tab: "afferent" });
          break;
        case "e":
          e.preventDefault();
          openDock({ tab: "efferent" });
          break;
        case "m":
          e.preventDefault();
          toggleDock();
          break;
        case "escape":
          if (isOpen) closeDock();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, openDock, closeDock, toggleDock]);

  return null;
};

export default CorrectionDockShortcuts;
