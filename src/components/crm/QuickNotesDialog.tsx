import { useState, useEffect, useRef, useCallback } from "react";
import { StickyNote, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditableField from "@/components/shared/EditableField";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";

interface QuickNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string | null | undefined;
  onSave: (field: string, value: string | null) => Promise<void>;
  field?: string;
  title?: string;
  subtitle?: string;
  goal?: string | null;
  issue?: string | null;
  /** Called when the user picks one of the goal/issue cards to edit it inline. */
  onEditField?: (field: "goal" | "issue", initialValue: string | null) => void;
}

const QuickNotesDialog = ({
  open,
  onOpenChange,
  initialValue,
  onSave,
  field = "notes",
  title = "Quick Notes",
  subtitle,
  goal,
  issue,
  onEditField,
}: QuickNotesDialogProps) => {
  const [draft, setDraft] = useState(initialValue || "");
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [editingField, setEditingField] = useState<"goal" | "issue" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [fieldSaving, setFieldSaving] = useState(false);
  const [localGoal, setLocalGoal] = useState(goal);
  const [localIssue, setLocalIssue] = useState(issue);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimer = useRef<number | undefined>(undefined);
  const lastCommittedRef = useRef(initialValue || "");
  const { isPrivate } = usePrivacyMode();

  useEffect(() => {
    setLocalGoal(goal);
    setLocalIssue(issue);
  }, [goal, issue]);

  useEffect(() => {
    if (open) {
      setDraft(initialValue || "");
      lastCommittedRef.current = initialValue || "";
      setSaveState("idle");
      setIsFocused(true);
      setEditingField(null);
      setEditValue("");
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

  const handleEditField = (field: "goal" | "issue", value: string | null) => {
    setEditingField(field);
    setEditValue(value || "");
    requestAnimationFrame(() => editRef.current?.focus());
  };

  const handleSaveFieldInline = async () => {
    if (!editingField) return;
    setFieldSaving(true);
    try {
      await onSave(editingField, editValue.trim() === "" ? null : editValue.trim());
      if (editingField === "goal") setLocalGoal(editValue.trim() || null);
      else setLocalIssue(editValue.trim() || null);
      setEditingField(null);
    } catch {
      // leave open so user can retry
    } finally {
      setFieldSaving(false);
    }
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
      <DialogContent className="sm:max-w-2xl rounded-2xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[85vh]">
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

        <div className="flex flex-col flex-1 min-h-0 px-6 py-4 overflow-y-auto">
          {/* Session context — editable goal & concern */}
          <section className="mb-3">
            <div className="grid grid-cols-2 gap-2">
              {editingField === "goal" ? (
                <div className="rounded-xl border border-chart-primary/40 bg-card p-3 shadow-sm space-y-2">
                  <p className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wide">Session goal</p>
                  <textarea
                    ref={editRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-muted/30 p-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-chart-primary/50"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingField(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
                    <button type="button" onClick={handleSaveFieldInline} disabled={fieldSaving} className="text-[10px] font-semibold text-chart-primary hover:underline disabled:opacity-50">
                      {fieldSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEditField("goal", goal)}
                  className="text-left rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted transition-colors"
                >
                  <p className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wide mb-1">Session goal</p>
                  <p className="text-xs font-medium text-foreground leading-snug truncate">{localGoal || "—"}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">Tap to edit</p>
                </button>
              )}
              {editingField === "issue" ? (
                <div className="rounded-xl border border-chart-primary/40 bg-card p-3 shadow-sm space-y-2">
                  <p className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wide">Primary concern</p>
                  <textarea
                    ref={editRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-muted/30 p-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-chart-primary/50"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingField(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
                    <button type="button" onClick={handleSaveFieldInline} disabled={fieldSaving} className="text-[10px] font-semibold text-chart-primary hover:underline disabled:opacity-50">
                      {fieldSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEditField("issue", issue)}
                  className="text-left rounded-xl border border-border bg-card p-3 shadow-sm hover:bg-muted transition-colors"
                >
                  <p className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wide mb-1">Primary concern</p>
                  <p className="text-xs font-medium text-foreground leading-snug truncate">{localIssue || "—"}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">Tap to edit</p>
                </button>
              )}
            </div>
          </section>

          {/* Session notes */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Session notes
              </p>
              {copied && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-chart-emerald/10 text-chart-emerald text-[10px] font-semibold animate-in fade-in">
                  Copied
                </span>
              )}
            </div>
            <textarea
              ref={taRef}
              value={draft}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Jot down anything the client shares — observations, tangents, key phrases, to-dos. This saves to the session's notes and appears in the client's history."
              className={cn(
                "flex-1 min-h-[240px] w-full resize-none rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-chart-primary/50 transition-shadow",
                isPrivate && !isFocused && "blur-sensitive"
              )}
            />
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-3 shrink-0 border-t border-border/60">
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
            <button
              type="button"
              onClick={async () => {
                const parts = [localGoal ? `Session Goal: ${localGoal}` : "", localIssue ? `Primary Concern: ${localIssue}` : "", draft].filter(Boolean);
                try {
                  await navigator.clipboard.writeText(parts.join("\\n\\n"));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  // Clipboard access can be blocked (insecure context, denied
                  // permission) — the notes stay on screen either way.
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Copy goal, concern and notes"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy all"}
            </button>
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground/40">
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
      </DialogContent>
    </Dialog>
  );
};

export default QuickNotesDialog;
