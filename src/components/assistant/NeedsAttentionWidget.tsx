import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { voiceStudentIdFor, isVoiceStudentId } from "@/lib/voice-student-id";
import { AlertCircle, ChevronDown, ChevronUp, Mail, MessageCircle, Loader2, Mic, Brain } from "lucide-react";

const ACTIVE_WINDOW_DAYS = 90;

type Category = "active" | "cancelled-no-rebook" | "one-and-done" | "overdue";
// Priority order for sorting — warm/actionable first, cold/lapsed last.
const CATEGORY_RANK: Record<Category, number> = { active: 0, "cancelled-no-rebook": 1, "one-and-done": 2, overdue: 3 };

interface AttentionClient {
  id: string; // client uuid, or voiceStudentIdFor(email) pseudo-id
  kind: "kinesiology" | "voice";
  name: string;
  email: string | null;
  daysSince: number;
  completedCount: number;
  cancelledCount: number;
  category: Category;
}

function categoryFor(completedCount: number, cancelledCount: number, daysSince: number): Category {
  if (completedCount === 0 && cancelledCount > 0) return "cancelled-no-rebook";
  if (completedCount === 1 && cancelledCount === 0) return "one-and-done";
  if (daysSince <= ACTIVE_WINDOW_DAYS) return "active";
  return "overdue";
}

async function fetchKinesiologyAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, date, status, clients(id, name, email)")
    .order("date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { client: { name: string | null; email: string | null }; lastDate: string; completedCount: number; cancelledCount: number }>();

  type AppointmentRow = { client_id: string | null; date: string; status: string; clients: { name: string | null; email: string | null } | null };
  for (const a of data as unknown as AppointmentRow[]) {
    if (!a.client_id || !a.clients) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) {
      hasFuture.add(a.client_id);
      continue;
    }
    if (d > now) continue; // future-but-not-"Scheduled" (rare) — not a past session either way
    const existing = agg.get(a.client_id) || { client: a.clients, lastDate: a.date, completedCount: 0, cancelledCount: 0 };
    if (!agg.has(a.client_id) || new Date(a.date) > new Date(existing.lastDate)) existing.lastDate = a.date;
    if (a.status === "Cancelled") existing.cancelledCount += 1;
    else existing.completedCount += 1;
    agg.set(a.client_id, existing);
  }

  const results: AttentionClient[] = [];
  for (const [clientId, { client, lastDate, completedCount, cancelledCount }] of agg.entries()) {
    if (hasFuture.has(clientId)) continue;
    const daysSince = differenceInDays(now, new Date(lastDate));
    results.push({
      id: clientId,
      kind: "kinesiology",
      name: client.name || "Unknown",
      email: client.email || null,
      daysSince,
      completedCount,
      cancelledCount,
      category: categoryFor(completedCount, cancelledCount, daysSince),
    });
  }
  return results;
}

async function fetchVoiceAttention(): Promise<AttentionClient[]> {
  const { data, error } = await supabase
    .from("voice_bookings")
    .select("student_name, student_email, lesson_date, status")
    .not("student_email", "is", null)
    .order("lesson_date", { ascending: false });
  if (error || !data) return [];

  const now = new Date();
  const hasFuture = new Set<string>();
  const agg = new Map<string, { name: string; email: string; lastDate: string; completedCount: number; cancelledCount: number }>();

  type VoiceBookingRow = { student_name: string | null; student_email: string | null; lesson_date: string; status: string | null };
  for (const b of data as VoiceBookingRow[]) {
    const email = String(b.student_email || "").toLowerCase().trim();
    if (!email) continue;
    const d = new Date(b.lesson_date);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) {
      hasFuture.add(email);
      continue;
    }
    if (d > now) continue;
    const existing = agg.get(email) || { name: b.student_name || "Unknown", email, lastDate: b.lesson_date, completedCount: 0, cancelledCount: 0 };
    if (new Date(b.lesson_date) > new Date(existing.lastDate)) existing.lastDate = b.lesson_date;
    if (isCancelled) existing.cancelledCount += 1;
    else existing.completedCount += 1;
    agg.set(email, existing);
  }

  const results: AttentionClient[] = [];
  for (const [email, { name, lastDate, completedCount, cancelledCount }] of agg.entries()) {
    if (hasFuture.has(email)) continue;
    const daysSince = differenceInDays(now, new Date(lastDate));
    results.push({
      id: voiceStudentIdFor(email),
      kind: "voice",
      name,
      email,
      daysSince,
      completedCount,
      cancelledCount,
      category: categoryFor(completedCount, cancelledCount, daysSince),
    });
  }
  return results;
}

async function fetchNeedsAttention(): Promise<AttentionClient[]> {
  const [kinesiology, voice] = await Promise.all([fetchKinesiologyAttention(), fetchVoiceAttention()]);
  return [...kinesiology, ...voice].sort((a, b) => {
    const rankDiff = CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category];
    if (rankDiff !== 0) return rankDiff;
    // Within "active", most-recently-seen first (warmest). Everywhere else, longest-overdue first.
    return a.category === "active" ? a.daysSince - b.daysSince : b.daysSince - a.daysSince;
  });
}

const CATEGORY_META: Record<Category, { label: string; className: string }> = {
  active: { label: "Active", className: "border-chart-emerald/30 bg-chart-emerald/5 text-chart-emerald" },
  "cancelled-no-rebook": { label: "Cancelled, no rebook", className: "border-chart-destructive/30 bg-chart-destructive/5 text-chart-destructive" },
  "one-and-done": { label: "1 lesson only", className: "border-amber-500/30 bg-amber-500/5 text-amber-600" },
  overdue: { label: "Overdue", className: "border-muted-foreground/20 bg-muted/40 text-muted-foreground" },
};

function assistantPrompt(c: AttentionClient) {
  const firstName = c.name.split(" ")[0];
  switch (c.category) {
    case "active":
      return `Find a good slot and book ${firstName}'s next session — check their availability notes and usual pattern first.`;
    case "cancelled-no-rebook":
      return `${firstName} cancelled their last booking and hasn't rebooked. Help me draft a friendly follow-up checking if they'd like to find a new time.`;
    case "one-and-done":
      return `${firstName} only ever had one session and hasn't been back. Help me draft a warm check-in — see how they're doing and if they'd like to continue.`;
    default:
      return `Help me draft a message to ${firstName} to book their next session — it's been ${c.daysSince} days.`;
  }
}

export default function NeedsAttentionWidget() {
  const [clients, setClients] = useState<AttentionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setClients(await fetchNeedsAttention());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking who needs follow-up...
      </div>
    );
  }

  if (clients.length === 0) return null;

  const shown = clients.slice(0, 12);
  const counts = clients.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<Category, number>);

  return (
    <div className="rounded-2xl border border-border bg-card mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertCircle className="h-4 w-4 text-chart-destructive" />
          Needs attention
          <span className="text-[10px] font-black uppercase tracking-wider text-chart-destructive bg-chart-destructive/10 px-1.5 py-0.5 rounded-full">
            {clients.length}
          </span>
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-[11px] text-muted-foreground mb-3">
            {(["active", "cancelled-no-rebook", "one-and-done", "overdue"] as Category[])
              .filter((cat) => counts[cat])
              .map((cat) => `${counts[cat]} ${CATEGORY_META[cat].label.toLowerCase()}`)
              .join(" · ")}
            — kinesiology and voice, sorted by who's most worth reaching out to first.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {shown.map((c) => (
              <div
                key={c.id}
                className={cn("flex flex-col gap-2 rounded-xl border p-3 shrink-0 w-[200px]", CATEGORY_META[c.category].className)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {c.kind === "voice"
                      ? <Mic className="h-3 w-3 text-chart-destructive shrink-0" />
                      : <Brain className="h-3 w-3 text-chart-purple shrink-0" />}
                    {isVoiceStudentId(c.id) ? (
                      <span className="text-sm font-semibold text-foreground truncate">{c.name}</span>
                    ) : (
                      <Link to={`/clients/${c.id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate no-underline">
                        {c.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] font-black uppercase tracking-wider bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                      {CATEGORY_META[c.category].label}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-80 mt-1">
                    {c.daysSince <= 0 ? "Last session today" : `${c.daysSince}d since last session`}
                    {c.cancelledCount > 0 && c.completedCount === 0 ? "" : c.cancelledCount > 0 ? ` · ${c.cancelledCount} cancelled` : ""}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild size="sm" variant="secondary" className="h-7 flex-1 text-[10px] gap-1 px-2">
                    <Link to={`/assistant?client=${encodeURIComponent(c.id)}&prompt=${encodeURIComponent(assistantPrompt(c))}`}>
                      <MessageCircle className="h-3 w-3" /> {c.category === "active" ? "Book" : "Assistant"}
                    </Link>
                  </Button>
                  {c.email && (
                    <Button asChild size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0">
                      <Link to={`/assistant?client=${encodeURIComponent(c.id)}&view=email`} title={`Email ${c.name} (in-app, threaded)`}><Mail className="h-3 w-3" /></Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {clients.length > shown.length && (
            <Link to="/business?tool=follow-up" className="text-[11px] text-primary hover:underline mt-2 inline-block">
              View all {clients.length} in Client Follow-Up →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
