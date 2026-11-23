import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardCopy, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import {
  CLAUDE_PROJECT_INSTRUCTIONS,
  SESSION_DRAFT_FIELDS,
  buildSessionContext,
  parseSessionDraft,
  type DraftFieldId,
  type ParsedSessionDraft,
} from "@/lib/session-draft";
import type { Appointment, AppointmentWithClient } from "@/types/crm";

interface SessionDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithClient;
  history: Appointment[];
  saveField: (field: string, value: unknown) => Promise<void>;
}

interface ReviewRow {
  id: DraftFieldId;
  label: string;
  field: string;
  kind: "text" | "bolt";
  draft: string;
  current: string | null;
  apply: boolean;
}

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Import the SESSION DRAFT block from the Claude Project back into the
 * appointment record. The record wins: fields that already hold a value are
 * unchecked by default and applying replaces the value only when the
 * practitioner opts in.
 */
const SessionDraftDialog = ({ open, onOpenChange, appointment, history, saveField }: SessionDraftDialogProps) => {
  const [pasted, setPasted] = useState("");
  const [parsed, setParsed] = useState<ParsedSessionDraft | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [applying, setApplying] = useState(false);

  const currentOf = (field: string, kind: "text" | "bolt"): string | null => {
    const value = (appointment as unknown as Record<string, unknown>)[field];
    if (value === null || value === undefined || String(value).trim() === "") return null;
    return kind === "bolt" ? `${value}s` : String(value);
  };

  const handleParse = () => {
    const result = parseSessionDraft(pasted);
    if (!result) {
      showError("Couldn't find the draft headings — paste the whole SESSION DRAFT block.");
      return;
    }
    const nextRows: ReviewRow[] = [];
    for (const def of SESSION_DRAFT_FIELDS) {
      const draft = result.values[def.id];
      if (draft === undefined || draft.trim() === "") continue;
      const current = currentOf(def.field, def.kind);
      nextRows.push({
        id: def.id,
        label: def.label,
        field: def.field,
        kind: def.kind,
        draft: def.kind === "bolt" && result.bolt !== null ? String(result.bolt) : draft.trim(),
        current,
        // The merge rule made visible: gaps fill by default, set values are
        // only replaced when the practitioner opts in.
        apply: current === null,
      });
    }
    if (nextRows.length === 0 && result.actionItems.length === 0) {
      showError("The draft parsed but carried nothing to save.");
      return;
    }
    setParsed(result);
    setRows(nextRows);
  };

  const reset = () => {
    setPasted("");
    setParsed(null);
    setRows([]);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      let applied = 0;
      for (const row of rows) {
        if (!row.apply) continue;
        const value = row.kind === "bolt" ? Number(row.draft) : row.draft.trim();
        if (row.kind === "bolt" && !Number.isFinite(value)) continue;
        await saveField(row.field, value);
        applied++;
      }
      showSuccess(
        applied > 0
          ? `Applied ${applied} field${applied === 1 ? "" : "s"} — Notion will mirror the update.`
          : "Nothing applied — all fields were unchecked.",
      );
      reset();
      onOpenChange(false);
    } catch {
      showError("Failed to save the draft — try applying again.");
    } finally {
      setApplying(false);
    }
  };

  const applyCount = useMemo(() => rows.filter((r) => r.apply).length, [rows]);

  const copyContext = async () => {
    if (await copyText(buildSessionContext(appointment, history))) {
      showSuccess("Session context copied — paste it into Claude with the transcript.");
    } else {
      showError("Couldn't copy — your browser blocked clipboard access.");
    }
  };

  const copyInstructions = async () => {
    if (await copyText(CLAUDE_PROJECT_INSTRUCTIONS)) {
      showSuccess("Claude instructions copied — paste them into your Project's custom instructions.");
    } else {
      showError("Couldn't copy — your browser blocked clipboard access.");
    }
  };

  const copyActionItems = async () => {
    if (parsed && (await copyText(parsed.actionItems.map((item) => `- ${item}`).join("\n")))) {
      showSuccess("Action items copied.");
    } else {
      showError("Couldn't copy the action items.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[640px] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            Session draft
          </DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed">
            {parsed
              ? "Review before saving — existing values are only replaced when you tick them."
              : "Paste the SESSION DRAFT block Claude returned to fill the session record."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {!parsed ? (
            <>
              <div className="rounded-xl bg-muted/50 border border-border p-3.5 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  How this works
                </p>
                <ol className="text-[12px] leading-relaxed text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copy the session context and paste it into Claude with the transcript.</li>
                  <li>Claude replies with a SESSION DRAFT block.</li>
                  <li>Paste that block here — the record wins, gaps get filled.</li>
                </ol>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <Button variant="outline" size="sm" onClick={copyContext} className="h-7 rounded-lg gap-1.5 text-[11px] font-medium">
                    <ClipboardCopy size={12} /> Copy session context
                  </Button>
                  <Button variant="ghost" size="sm" onClick={copyInstructions} className="h-7 rounded-lg gap-1.5 text-[11px] font-medium text-muted-foreground">
                    Copy Claude instructions
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="session-draft-paste" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  Paste the draft
                </label>
                <Textarea
                  id="session-draft-paste"
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder={"SESSION DRAFT\n\nGOAL: …\nKEY FINDINGS: …\nNOTES: …"}
                  className="min-h-[180px] rounded-lg border-border bg-background text-[13px] leading-relaxed font-mono text-[12px]"
                />
              </div>

              <Button
                onClick={handleParse}
                disabled={!pasted.trim()}
                className="w-full h-9 rounded-lg bg-primary hover:bg-[hsl(var(--primary-hover))] text-[12px] font-medium"
              >
                Parse draft
              </Button>
            </>
          ) : (
            <>
              {rows.length > 0 && (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div key={row.id} className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={row.apply}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, apply: e.target.checked } : r)),
                              )
                            }
                            className="h-4 w-4 rounded-md accent-[hsl(var(--primary))] shrink-0"
                            aria-label={`Apply ${row.label}`}
                          />
                          <span className="text-[13px] font-semibold text-foreground truncate">{row.label}</span>
                          <span
                            className={cn(
                              "text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0",
                              row.current === null
                                ? "bg-primary/10 text-primary-strong dark:text-primary"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                            )}
                          >
                            {row.current === null ? "fills a gap" : "already set"}
                          </span>
                        </div>
                        {row.current !== null && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[45%]" title={row.current}>
                            Current: {row.current}
                          </span>
                        )}
                      </div>
                      <Textarea
                        value={row.draft}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, draft: e.target.value } : r)),
                          )
                        }
                        className="min-h-[64px] rounded-lg border-border bg-muted/30 text-[12px] leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              )}

              {parsed.actionItems.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                      Action items
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyActionItems}
                      className="h-6 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Copy
                    </Button>
                  </div>
                  <ul className="space-y-1">
                    {parsed.actionItems.map((item, i) => (
                      <li key={i} className="text-[12px] leading-relaxed text-foreground/90 flex gap-2">
                        <span className="text-muted-foreground/60 shrink-0">·</span>
                        <span className="break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={applying}
                  className="h-9 rounded-lg gap-1 text-[12px] font-medium text-muted-foreground"
                >
                  <ArrowLeft size={13} /> Back
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={applying || applyCount === 0}
                  className="flex-1 h-9 rounded-lg bg-primary hover:bg-[hsl(var(--primary-hover))] text-[12px] font-medium"
                >
                  {applying ? (
                    <>
                      <Loader2 size={13} className="mr-1.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    `Apply ${applyCount} field${applyCount === 1 ? "" : "s"}`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDraftDialog;
