import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

interface QuickNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string | null | undefined;
  onSave: (field: string, value: string | null) => Promise<void>;
  field?: string;
  title?: string;
  subtitle?: string;
}

const QuickNotesDialog = ({
  open,
  onOpenChange,
  initialValue,
  onSave,
  field = "notes",
  title = "Quick Notes",
  subtitle,
}: QuickNotesDialogProps) => {
  const [draft, setDraft] = useState(initialValue || "");
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimer = useRef<number | undefined>(undefined);
  const lastCommittedRef = useRef(initialValue || "");
  const { isPrivate } = usePrivacyMode();

  useEffect(() => {
    if (open) {
      setDraft(initialValue || "");
      lastCommittedRef.current = initialValue || "";
      setSaveState("idle");
      setIsFocused(true);
      requestAnimationFrame(() => {
        taRef.current?.focus();
      });
    }
  }, [open, initialValue]);

  useEffect(() => {
    return () => {
      window.clearTimeout(debounceTimer.current);
    };
  }, []);

  const flush = useCallback(async () => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = undefined;
    }
    const trimmed = draft.trim();
    if (trimmed === lastCommittedRef.current) return;
    setIsSaving(true);
    setSaveState("idle");
    try {
      await onSave(field, trimmed === "" ? null : trimmed);
      lastCommittedRef.current = trimmed;
      setIsSaving(false);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setIsSaving(false);
      setSaveState("error");
    }
  }, [draft, field, onSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);
    setSaveState("idle");
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => flush(), 1200);
  };

  const handleBlur = () => {
    setIsFocused(false);
    flush();
  };

  const handleClose = (next: boolean) => {
    if (!next) flush();
    onOpenChange(next);
  };

  const handleDone = async () => {
    await flush();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleDone();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl rounded-xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-chart-primary/10 flex items-center justify-center text-chart-primary shrink-0">
              <StickyNote size={16} />
            </span>
            {title}
          </DialogTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 ml-[42px]">{subtitle}</p>
          )}
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 px-6 py-4">
          <textarea
            ref={taRef}
            value={draft}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Jot down anything the client shares — observations, tangents, key phrases, to-dos. This saves to the session's notes and appears in the client's history."
            className={cn(
              "flex-1 min-h-[220px] w-full resize-none rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-chart-primary/50 transition-shadow",
              isPrivate && !isFocused && "blur-sensitive"
            )}
          />
          <div className="flex items-center justify-between gap-3 pt-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-chart-primary animate-pulse">
                  <Loader2 size={10} className="animate-spin" /> Saving…
                </span>
              ) : saveState === "saved" ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-chart-emerald animate-in fade-in">
                  <CheckCircle2 size={10} /> Saved ✓
                </span>
              ) : saveState === "error" ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-destructive animate-in fade-in">
                  <AlertCircle size={10} /> Save failed — try again
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">
                  Autosaves as you type · shows in client history
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
                ⌘/Ctrl + Enter
              </span>
              <Button
                size="sm"
                onClick={handleDone}
                disabled={isSaving}
                className="rounded-lg h-9 px-4 text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickNotesDialog;
