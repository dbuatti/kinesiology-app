import { useEffect, useMemo, useState } from "react";
import { Loader2, Copy, Sparkles, RefreshCw, Mail, Send as SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { generateSessionSummaryEmail, buildClaudeReviewBlock, isMissingValue } from "@/utils/session-summary-email";
import { renderSessionSummaryEmailHtml } from "@/utils/session-summary-email-html";
import { scanForbiddenTerms } from "@/lib/session-summary-forbidden";
import { explainTechniqueDetection } from "@/lib/session-summary-techniques";
import type { AppointmentWithClient } from "@/types/crm";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment: AppointmentWithClient;
  refresh: () => void;
}

export function SessionSummaryEmailDialog({ open, onOpenChange, appointment, refresh }: Props) {
  const [personalNote, setPersonalNote] = useState<string>(isMissingValue(appointment.personal_note) ? "" : (appointment.personal_note || ""));
  const [draft, setDraft] = useState<string>(appointment.session_summary_email || "");
  const [boltHistory, setBoltHistory] = useState<number[]>([]);
  const [nextApptDate, setNextApptDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<"draft" | "send" | null>(null);
  const [forbidden, setForbidden] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [scopeError, setScopeError] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [width, setWidth] = useState<600 | 375>(600);
  const [subject, setSubject] = useState<string>(`Your session today – ${new Date(appointment.date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}`);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewHeaders, setPreviewHeaders] = useState<{ from: string; to: string; subject: string; date: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setUnmapped(explainTechniqueDetection(appointment).unmapped);
  }, [appointment]);
  const homeworkEmpty = isMissingValue(appointment.homework_given) && isMissingValue(appointment.session_north_star);

  // Load supporting data once.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // BOLT history for this client (oldest → newest).
        if (appointment.client_id) {
          const { data } = await supabase
            .from("appointments")
            .select("date, bolt_score")
            .eq("client_id", appointment.client_id)
            .not("bolt_score", "is", null)
            .order("date", { ascending: true });
          if (!cancelled) setBoltHistory((data || []).map((r: any) => r.bolt_score).filter((n: any) => typeof n === "number"));
        }
        // Next booked appointment.
        const { data: next } = await supabase
          .from("appointments")
          .select("date")
          .eq("client_id", appointment.client_id)
          .eq("status", "Scheduled")
          .gt("date", appointment.date instanceof Date ? appointment.date.toISOString() : appointment.date)
          .order("date", { ascending: true })
          .limit(1);
        if (!cancelled && next && next.length) setNextApptDate(new Date(next[0].date));
      } catch (e: any) {
        if (!cancelled) showError(e?.message || "Couldn't load session data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, appointment]);

  // Sync personal note when appointment changes.
  useEffect(() => {
    setPersonalNote(isMissingValue(appointment.personal_note) ? "" : (appointment.personal_note || ""));
  }, [appointment.personal_note]);

  const input = useMemo(() => ({
    appointment,
    boltHistory,
    nextAppointmentDate: nextApptDate,
    personalNote,
  }), [appointment, boltHistory, nextApptDate, personalNote]);

  const regenerate = () => {
    const g = generateSessionSummaryEmail(input);
    setDraft(g);
  };

  // Fetch the authoritative rendered HTML from the server when entering preview.
  useEffect(() => {
    if (!open || view !== "preview") return;
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("gmail-session-summary", {
          body: { appointmentId: appointment.id, subject, body: draft, mode: "draft", action: "preview" },
        });
        if (cancelled) return;
        if (error || data?.error) throw new Error(data?.error || error?.message);
        setPreviewHtml(data.html || "");
        setPreviewHeaders({ from: data.from, to: data.to, subject: data.subject, date: data.date });
        setScopeError(false);
      } catch (e: any) {
        if (!cancelled) {
          // Fall back to local render so preview still works offline.
          setPreviewHtml(renderSessionSummaryEmailHtml({
            from: "Daniele Buatti <info@danielebuatti.com>",
            to: appointment.clients?.email || "",
            subject,
            body: draft,
            date: new Date(appointment.date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }),
          }));
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, view, subject, draft, appointment]);

  // Auto-generate on first open if empty.
  useEffect(() => {
    if (!open) return;
    if (!draft) regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading]);

  // When supporting data (BOLT history / next appointment) finishes loading,
  // regenerate once if the practitioner hasn't started editing.
  useEffect(() => {
    if (!open || loading || dirty) return;
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    setForbidden(scanForbiddenTerms(draft));
  }, [draft]);

  const copyClaude = async () => {
    const block = buildClaudeReviewBlock(input, draft);
    try {
      await navigator.clipboard.writeText(block);
      showSuccess("Copied draft + structured data to clipboard.");
    } catch {
      showError("Couldn't copy to clipboard.");
    }
  };

  const handleAction = async (mode: "draft" | "send") => {
    setSending(mode);
    try {
      // Persist personal note (if changed) alongside the summary.
    await supabase.from("appointments").update({ personal_note: isMissingValue(personalNote) ? null : (personalNote || null) }).eq("id", appointment.id);
    const { data, error } = await supabase.functions.invoke("gmail-session-summary", {
        body: { appointmentId: appointment.id, subject, body: draft, mode },
      });
      if (error || data?.error) {
        if (data?.scopeError) setScopeError(true);
        throw new Error(data?.error || error?.message);
      }
      setScopeError(false);
      // Persist final text + timestamp locally too.
      const now = new Date().toISOString();
      await supabase.from("appointments").update(
        mode === "draft"
          ? { session_summary_email: draft, session_summary_drafted_at: now }
          : { session_summary_email: draft, session_summary_sent_at: now }
      ).eq("id", appointment.id);
      showSuccess(mode === "draft" ? "Gmail draft created." : "Email sent.");
      refresh();
      if (mode === "send") onOpenChange(false);
    } catch (e: any) {
      showError(e?.message || "Couldn't create draft.");
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session summary email</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="personal-note">Personal note (optional)</Label>
              <Input
                id="personal-note"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="A warm, session-specific reflection for this client"
              />
            </div>

            {unmapped.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Unmapped PEACE protocols detected ({unmapped.join(", ")}). Add them to PROTOCOL_CATEGORY_MAP in session-summary-techniques.ts so they aren't silently dropped.
              </p>
            )}
            {homeworkEmpty && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No homework recorded for this session — add it (Homework given / Session north star) before sending, or the "Your homework" section will be omitted.
              </p>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === "edit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("edit")}
                    className="gap-1.5"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={view === "preview" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("preview")}
                    className="gap-1.5"
                  >
                    Preview
                  </Button>
                </div>
                {view === "preview" && (
                  <div className="flex items-center gap-2">
                    <Button variant={width === 600 ? "default" : "outline"} size="sm" onClick={() => setWidth(600)}>Desktop</Button>
                    <Button variant={width === 375 ? "default" : "outline"} size="sm" onClick={() => setWidth(375)}>Mobile</Button>
                  </div>
                )}
              </div>

              {view === "edit" ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="draft">Draft (editable)</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={regenerate} className="gap-1.5">
                        <RefreshCw size={12} /> Regenerate
                      </Button>
                      <Button variant="outline" size="sm" onClick={copyClaude} className="gap-1.5">
                        <Copy size={12} /> Copy for Claude review
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="draft"
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
                    rows={14}
                    className="font-mono text-sm"
                  />
                </>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="mx-auto bg-white shadow-sm rounded-2xl overflow-hidden" style={{ width, maxWidth: "100%" }}>
                      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground space-y-0.5">
                        <div><span className="font-semibold">From:</span> {previewHeaders?.from || "Daniele Buatti <info@danielebuatti.com>"}</div>
                        <div><span className="font-semibold">To:</span> {previewHeaders?.to || appointment.clients?.email || ""}</div>
                        <div><span className="font-semibold">Bcc:</span> info@danielebuatti.com</div>
                        <div><span className="font-semibold">Subject:</span> {previewHeaders?.subject || subject}</div>
                        <div><span className="font-semibold">Date:</span> {previewHeaders?.date || ""}</div>
                      </div>
                      <iframe
                        title="Email preview"
                        srcDoc={previewHtml || renderSessionSummaryEmailHtml({
                          from: "Daniele Buatti <info@danielebuatti.com>",
                          to: appointment.clients?.email || "",
                          subject,
                          body: draft,
                          date: new Date(appointment.date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }),
                        })}
                        style={{ width: "100%", height: 500, border: "none" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {scopeError && (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <p>Gmail drafts need the <code>gmail.compose</code> scope, which the current refresh token doesn't have. "Send" still works. To enable drafts, re-authorize Gmail with the compose scope, or open a pre-filled compose window in Gmail:</p>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(appointment.clients?.email || "")}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-amber-900 underline dark:text-amber-200"
                  >
                    Open in Gmail (pre-filled)
                  </a>
                </div>
              )}
              {forbidden.length > 0 && (
                <p className="text-xs text-destructive">
                  Warning — possible clinical terms in draft: {forbidden.join(", ")}.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Recipient is the client email on file only. Nothing is sent until you click Send.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={() => handleAction("draft")} disabled={!!sending || !draft} className="gap-1.5">
            {sending === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Create Gmail draft
          </Button>
          <Button onClick={() => handleAction("send")} disabled={!!sending || !draft} className="gap-1.5">
            {sending === "send" ? <Loader2 size={14} className="animate-spin" /> : <SendIcon size={14} />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionSummaryEmailDialog;
