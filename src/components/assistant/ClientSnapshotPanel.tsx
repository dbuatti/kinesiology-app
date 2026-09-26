import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { computeClientLifecycleStatus, LifecycleStatus } from "@/lib/clientStatus";
import { emailFromVoiceStudentId } from "@/lib/voice-student-id";
import { fetchNormalizedVoiceBookings } from "@/lib/voiceBookings";
import ClientLifecycleBadge from "@/components/crm/ClientLifecycleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpRight, DollarSign, Loader2, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
  clientName: string;
  isVoice: boolean;
  // Fires a synthesized chat message through the normal assistant pipeline so the
  // rate-change email goes through the existing draft-then-review flow — never
  // sends anything itself.
  onDraftRateEmail: (prompt: string) => void;
  /** "strip" = compact row above the chat; "card" = the right-hand context column. */
  variant?: "strip" | "card";
}

interface Snapshot {
  status: LifecycleStatus;
  reason: string;
  standardRate: number | null;
  targetRate: number | null;
  completedCount: number;
  lastSessionDate: string | null;
  nextSessionDate: string | null;
}

export default function ClientSnapshotPanel({ clientId, clientName, isVoice, onDraftRateEmail, variant = "strip" }: Props) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSnapshot(null);

    async function loadKinesiology() {
      const [{ data: client }, { data: appointments }] = await Promise.all([
        supabase.from("clients").select("standard_rate, target_rate").eq("id", clientId).maybeSingle(),
        supabase.from("appointments").select("date, status").eq("client_id", clientId).order("date", { ascending: false }),
      ]);
      if (cancelled) return;
      const now = new Date();
      const hasFutureBooking = (appointments || []).some((a: any) => a.status === "Scheduled" && new Date(a.date) > now);
      const pastAppointments = (appointments || []).filter((a: any) => new Date(a.date) <= now);
      const { status, reason } = computeClientLifecycleStatus({
        appointments: pastAppointments.map((a: any) => ({ date: a.date, status: a.status })),
        hasFutureBooking,
      });
      const completed = pastAppointments.filter((a: any) => a.status !== "Cancelled");
      const next = (appointments || []).find((a: any) => a.status === "Scheduled" && new Date(a.date) > now);
      setSnapshot({
        status, reason,
        standardRate: client?.standard_rate ?? null,
        targetRate: client?.target_rate ?? null,
        completedCount: completed.length,
        lastSessionDate: completed[0]?.date || null,
        nextSessionDate: next?.date || null,
      });
      setLoading(false);
    }

    async function loadVoice() {
      // Uses the normalized fetch (backfills a missing student_email from
      // another row with the same name) — the same real bug found live with
      // Nicole Rotenstein (2 real completed lessons had student_email NULL)
      // was also silently affecting this panel's "completed" count via a raw
      // .ilike() query that would miss those rows entirely.
      const email = emailFromVoiceStudentId(clientId);
      const allBookings = await fetchNormalizedVoiceBookings();
      const bookings = allBookings.filter((b) => b.studentEmail === email);
      if (cancelled) return;
      const now = new Date();
      const past = bookings.filter((b) => new Date(b.lessonDate) <= now);
      const future = bookings.find((b) => b.status !== "cancelled" && new Date(b.lessonDate) > now);
      const { status, reason } = computeClientLifecycleStatus({
        appointments: past.map((b) => ({ date: b.lessonDate, status: b.status === "cancelled" ? "Cancelled" : "Completed" })),
        hasFutureBooking: !!future,
      });
      const completed = past.filter((b) => b.status !== "cancelled");
      setSnapshot({
        status, reason,
        standardRate: null, targetRate: null,
        completedCount: completed.length,
        lastSessionDate: completed[0]?.lessonDate || null,
        nextSessionDate: future?.lessonDate || null,
      });
      setLoading(false);
    }

    (isVoice ? loadVoice() : loadKinesiology()).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, isVoice]);

  const openRateDialog = () => {
    setNewRate(String(snapshot?.targetRate ?? snapshot?.standardRate ?? ""));
    setDialogOpen(true);
  };

  const handleUpdateRate = async () => {
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum < 0) { showError("Enter a valid rate."); return; }
    const oldRate = snapshot?.standardRate ?? 0;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ standard_rate: rateNum, rate_updated_at: new Date().toISOString() })
        .eq("id", clientId);
      if (error) throw error;
      setSnapshot((s) => (s ? { ...s, standardRate: rateNum } : s));
      setDialogOpen(false);
      showSuccess(`Rate updated to $${rateNum}.`);
      const firstName = clientName.split(" ")[0];
      onDraftRateEmail(
        `I just updated ${firstName}'s rate from $${oldRate} to $${rateNum}, effective next month. Draft a warm email letting them know.`
      );
    } catch (err: any) {
      showError(err.message || "Failed to update rate.");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—");
  const initials = clientName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

  const renderRateDialog = () => (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant === "card" ? "default" : "outline"} className={variant === "card" ? "w-full" : "h-6 text-[11px] px-2 ml-1"} onClick={openRateDialog}>
          Update rate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update {clientName}'s rate</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="text-xs text-muted-foreground">Current: {snapshot.standardRate != null ? `$${snapshot.standardRate}${snapshot.standardRate === 0 ? " (Free)" : ""}` : "No rate set"}</p>
          <Input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} placeholder="New rate" disabled={saving} />
          <p className="text-[11px] text-muted-foreground">
            Saves the new rate, then drafts a warm email for you to review — it won't send automatically.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleUpdateRate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Save & draft email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading && variant === "card") {
    return (
      <div className="space-y-3 p-5">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted/70" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 mb-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading client snapshot…
      </div>
    );
  }
  if (!snapshot) return null;

  if (variant === "card") {
    return (
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", isVoice ? "bg-gradient-to-br from-rose-400 to-rose-600" : "bg-gradient-to-br from-indigo-400 to-indigo-700")}>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-xl font-medium tracking-[-0.02em] text-foreground blur-sensitive">{clientName}</p>
            <p className="text-xs text-muted-foreground">{isVoice ? "Voice student" : "Kinesiology client"}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <ClientLifecycleBadge status={snapshot.status} />
          <p className="text-[13px] leading-relaxed text-muted-foreground">{snapshot.reason}</p>
        </div>
        <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-border">
          {[
            ["Completed", String(snapshot.completedCount)],
            ["Last session", fmtDate(snapshot.lastSessionDate)],
            ["Next session", fmtDate(snapshot.nextSessionDate)],
            ["Rate", isVoice ? "Flat" : snapshot.standardRate === 0 ? "Free" : snapshot.standardRate != null ? `$${snapshot.standardRate}` : "Not set"],
          ].map(([k, v], i) => (
            <div key={k} className={cn("px-3 py-2.5", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border")}>
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {!isVoice && snapshot.targetRate != null && snapshot.targetRate !== snapshot.standardRate && (
          <p className="-mt-2 text-xs text-muted-foreground">Target rate ${snapshot.targetRate}</p>
        )}
        <div className="flex flex-col gap-2">
          {!isVoice && renderRateDialog()}
          {!isVoice && (
            <Button asChild variant="outline" size="sm" className="justify-between">
              <Link to={`/clients/${clientId}`}>Full profile <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
          {!isVoice && (
            <Button asChild variant="ghost" size="sm" className="justify-between text-muted-foreground">
              <Link to={`/clients/${clientId}/hub`}>Hub · all conversations & email <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <div className="flex items-center gap-2">
        <ClientLifecycleBadge status={snapshot.status} />
        <span className="text-muted-foreground">{snapshot.reason}</span>
      </div>

      {!isVoice && (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {snapshot.standardRate === 0 ? (
            <span className="font-semibold text-chart-emerald">$0 · Free</span>
          ) : (
            <span className="font-semibold text-foreground">{snapshot.standardRate != null ? `$${snapshot.standardRate}` : "No rate set"}</span>
          )}
          {snapshot.targetRate != null && snapshot.targetRate !== snapshot.standardRate && (
            <span className="text-muted-foreground">→ target ${snapshot.targetRate}</span>
          )}
          {renderRateDialog()}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        {snapshot.completedCount} completed
        {snapshot.lastSessionDate && ` · last ${new Date(snapshot.lastSessionDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`}
        {snapshot.nextSessionDate && ` · next ${new Date(snapshot.nextSessionDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`}
      </div>

      {!isVoice && (
        <Link to={`/clients/${clientId}`} className="flex items-center gap-1 text-primary hover:underline ml-auto">
          Full profile <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
