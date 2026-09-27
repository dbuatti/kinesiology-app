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
  /** A student addressed by "voice:<email>" (no record yet). */
  isVoice: boolean;
  /** The person's email and practices (Phase 5) — someone who does kinesiology
   *  and lessons shows both histories together. */
  email?: string | null;
  practices?: string[];
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

export default function ClientSnapshotPanel({ clientId, clientName, isVoice, email, practices, onDraftRateEmail, variant = "strip" }: Props) {
  // Lessons-only people have no kinesiology sessions or per-client rate.
  const lessonsOnly = isVoice || (!!practices && !practices.includes("kinesiology"));
  const lessonEmail = isVoice ? emailFromVoiceStudentId(clientId) : practices?.some((p) => p !== "kinesiology") ? email || null : null;
  const practiceLabel = isVoice ? "Voice student"
    : !practices ? "Kinesiology client"
    : practices.map((p) => (p === "kinesiology" ? "Kinesiology" : p === "piano" ? "Piano" : "Voice")).join(" · ");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSnapshot(null);

    // One history per person: kinesiology sessions (by client id) and
    // voice/piano lessons (by email, normalized — backfills a missing
    // student_email from another row with the same name, the Nicole
    // Rotenstein bug a raw query missed) merged into one status.
    async function load() {
      type Row = { date: string; status: string; upcoming: boolean };
      const now = new Date();
      const [clientRes, apptRes, bookings] = await Promise.all([
        lessonsOnly ? Promise.resolve({ data: null }) : supabase.from("clients").select("standard_rate, target_rate, lifecycle_status, lifecycle_status_manual").eq("id", clientId).maybeSingle(),
        lessonsOnly ? Promise.resolve({ data: [] }) : supabase.from("appointments").select("date, status").eq("client_id", clientId).order("date", { ascending: false }),
        lessonEmail ? fetchNormalizedVoiceBookings() : Promise.resolve([]),
      ]);
      if (cancelled) return;
      const client = clientRes.data as { standard_rate: number | null; target_rate: number | null; lifecycle_status: LifecycleStatus | null; lifecycle_status_manual: boolean | null } | null;
      const rows: Row[] = [
        ...((apptRes.data || []) as { date: string; status: string }[]).map((a) => ({
          date: a.date,
          status: a.status,
          upcoming: a.status === "Scheduled" && new Date(a.date) > now,
        })),
        ...bookings
          .filter((b) => b.studentEmail.toLowerCase() === (lessonEmail || "").toLowerCase())
          .map((b) => ({
            date: b.lessonDate,
            status: b.status === "cancelled" ? "Cancelled" : "Completed",
            upcoming: b.status !== "cancelled" && new Date(b.lessonDate) > now,
          })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const past = rows.filter((r) => new Date(r.date) <= now);
      const next = rows.filter((r) => r.upcoming).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      const { status, reason } = computeClientLifecycleStatus({
        appointments: past.map((r) => ({ date: r.date, status: r.status })),
        hasFutureBooking: !!next,
        manualOverride: client?.lifecycle_status_manual ? client.lifecycle_status : null,
      });
      const completed = past.filter((r) => r.status !== "Cancelled");
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

    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, lessonsOnly, lessonEmail]);

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
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", lessonsOnly ? "bg-gradient-to-br from-rose-400 to-rose-600" : "bg-gradient-to-br from-indigo-400 to-indigo-700")}>
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-xl font-medium tracking-[-0.02em] text-foreground blur-sensitive">{clientName}</p>
            <p className="text-xs text-muted-foreground">{practiceLabel}</p>
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
            ["Rate", lessonsOnly ? "Flat" : snapshot.standardRate === 0 ? "Free" : snapshot.standardRate != null ? `$${snapshot.standardRate}` : "Not set"],
          ].map(([k, v], i) => (
            <div key={k} className={cn("px-3 py-2.5", i % 2 === 1 && "border-l border-border", i >= 2 && "border-t border-border")}>
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {!lessonsOnly && snapshot.targetRate != null && snapshot.targetRate !== snapshot.standardRate && (
          <p className="-mt-2 text-xs text-muted-foreground">Target rate ${snapshot.targetRate}</p>
        )}
        <div className="flex flex-col gap-2">
          {!lessonsOnly && renderRateDialog()}
          {!lessonsOnly && (
            <Button asChild variant="outline" size="sm" className="justify-between">
              <Link to={`/clients/${clientId}`}>Full profile <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
          {!lessonsOnly && (
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

      {!lessonsOnly && (
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

      {!lessonsOnly && (
        <Link to={`/clients/${clientId}`} className="flex items-center gap-1 text-primary hover:underline ml-auto">
          Full profile <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
