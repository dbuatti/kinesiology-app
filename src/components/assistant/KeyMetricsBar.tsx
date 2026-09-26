import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { computeClientLifecycleStatus, LifecycleStatus } from "@/lib/clientStatus";
import { fetchNormalizedVoiceBookings } from "@/lib/voiceBookings";
import { loadCalendarItems, unpaidItems, sumAmount, itemStart, UNPAID_LOOKBACK_DAYS } from "@/lib/calendarItems";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Users, CalendarDays, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  onOpenFollowUp: () => void;
}

interface Metrics {
  revenue: { thisMonth: number; lastMonth: number; outstanding: number };
  pipeline: Record<LifecycleStatus, number>;
  booking: { thisWeek: number; lastWeek: number };
  urgency: { atRisk: number; lapsed: number };
}

function monthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}

function weekRange(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

// Revenue and outstanding use the shared merged session/lesson list and money
// rules (src/lib/calendarItems.ts) — the same ones Today and the Calendar use.
// Previously this counted is_paid ("chargeable", set at booking) as paid, so
// every booked session read as revenue, cancelled items counted as owed, and
// Notion-only lessons were invisible.
async function computeRevenuePulse(): Promise<Metrics["revenue"]> {
  const thisMonth = monthRange(0);
  const lastMonth = monthRange(-1);
  const now = new Date();
  const from = new Date(Math.min(lastMonth.start.getTime(), now.getTime() - UNPAID_LOOKBACK_DAYS * 86400000));
  const items = await loadCalendarItems(from.toISOString(), thisMonth.end.toISOString());
  const paidIn = (r: { start: Date; end: Date }) =>
    sumAmount(items.filter((i) => i.paid && !i.cancelled && itemStart(i) >= r.start && itemStart(i) < r.end));
  return { thisMonth: paidIn(thisMonth), lastMonth: paidIn(lastMonth), outstanding: sumAmount(unpaidItems(items, now)) };
}

async function computePipeline(): Promise<Record<LifecycleStatus, number>> {
  const counts: Record<LifecycleStatus, number> = { lead: 0, active: 0, at_risk: 0, lapsed: 0 };
  const now = new Date();

  const [{ data: clients }, { data: appts }, voiceRows] = await Promise.all([
    supabase.from("clients").select("id").or("is_practitioner.eq.false,is_practitioner.is.null"),
    supabase.from("appointments").select("client_id, date, status"),
    fetchNormalizedVoiceBookings(),
  ]);

  const apptsByClient = new Map<string, { date: string; status: string }[]>();
  const futureByClient = new Set<string>();
  for (const a of (appts || []) as any[]) {
    if (!a.client_id) continue;
    const d = new Date(a.date);
    if (a.status === "Scheduled" && d > now) { futureByClient.add(a.client_id); continue; }
    if (d > now) continue;
    (apptsByClient.get(a.client_id) || apptsByClient.set(a.client_id, []).get(a.client_id)!).push({ date: a.date, status: a.status });
  }
  for (const c of (clients || []) as any[]) {
    const { status } = computeClientLifecycleStatus({ appointments: apptsByClient.get(c.id) || [], hasFutureBooking: futureByClient.has(c.id) });
    counts[status] += 1;
  }

  const voiceByEmail = new Map<string, { date: string; status: string }[]>();
  const voiceFuture = new Set<string>();
  for (const b of voiceRows) {
    const email = b.studentEmail;
    const d = new Date(b.lessonDate);
    if (isNaN(d.getTime())) continue;
    const isCancelled = b.status === "cancelled";
    if (!isCancelled && d > now) { voiceFuture.add(email); continue; }
    if (d > now) continue;
    (voiceByEmail.get(email) || voiceByEmail.set(email, []).get(email)!).push({ date: b.lessonDate, status: isCancelled ? "Cancelled" : "Completed" });
  }
  for (const [email, appointments] of voiceByEmail.entries()) {
    const { status } = computeClientLifecycleStatus({ appointments, hasFutureBooking: voiceFuture.has(email) });
    counts[status] += 1;
  }

  return counts;
}

async function computeBookingLoad(): Promise<Metrics["booking"]> {
  const thisWeek = weekRange(0);
  const lastWeek = weekRange(-1);

  const count = async (start: Date, end: Date) => {
    const [appts, voice] = await Promise.all([
      supabase.from("appointments").select("id", { count: "exact", head: true }).neq("status", "Cancelled").gte("date", start.toISOString()).lt("date", end.toISOString()),
      supabase.from("voice_bookings").select("id", { count: "exact", head: true }).neq("status", "cancelled").gte("lesson_date", start.toISOString()).lt("lesson_date", end.toISOString()),
    ]);
    return (appts.count || 0) + (voice.count || 0);
  };

  const [thisWeekCount, lastWeekCount] = await Promise.all([count(thisWeek.start, thisWeek.end), count(lastWeek.start, lastWeek.end)]);
  return { thisWeek: thisWeekCount, lastWeek: lastWeekCount };
}

function formatCurrency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function Tile({ icon: Icon, label, children, onClick }: { icon: any; label: string; children: React.ReactNode; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left",
        onClick && "hover:border-primary/40 transition-colors cursor-pointer"
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      {children}
    </Comp>
  );
}

export default function KeyMetricsBar({ onOpenFollowUp }: Props) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([computeRevenuePulse(), computePipeline(), computeBookingLoad()]).then(([revenue, pipeline, booking]) => {
      if (cancelled) return;
      setMetrics({ revenue, pipeline, booking, urgency: { atRisk: pipeline.at_risk, lapsed: pipeline.lapsed } });
    });
    return () => { cancelled = true; };
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 mb-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading metrics…
      </div>
    );
  }

  const revenueDelta = metrics.revenue.thisMonth - metrics.revenue.lastMonth;
  const bookingDelta = metrics.booking.thisWeek - metrics.booking.lastWeek;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <Tile icon={DollarSign} label="Revenue this month">
        <div className="text-xl font-semibold text-foreground">{formatCurrency(metrics.revenue.thisMonth)}</div>
        <div className={cn("flex items-center gap-1 text-[11px]", revenueDelta >= 0 ? "text-chart-emerald" : "text-chart-destructive")}>
          {revenueDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatCurrency(Math.abs(revenueDelta))} vs last month
        </div>
        {metrics.revenue.outstanding > 0 && <div className="text-[11px] text-amber-600">{formatCurrency(metrics.revenue.outstanding)} outstanding</div>}
      </Tile>

      <Tile icon={Users} label="Pipeline">
        <div className="flex items-end gap-3.5">
          {(["lead", "active", "at_risk", "lapsed"] as LifecycleStatus[]).map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); navigate(`/clients?status=${s}`); }}
              className="flex flex-col items-center hover:opacity-70 transition-opacity"
              title={s === "at_risk" ? "At Risk" : s.charAt(0).toUpperCase() + s.slice(1)}
            >
              <span className="text-lg font-semibold tabular-nums text-foreground">{metrics.pipeline[s]}</span>
              <span className="text-[11px] font-medium text-muted-foreground">{s === "at_risk" ? "At risk" : s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </button>
          ))}
        </div>
      </Tile>

      <Tile icon={CalendarDays} label="Booking load this week">
        <div className="text-xl font-semibold text-foreground">{metrics.booking.thisWeek} sessions</div>
        <div className={cn("flex items-center gap-1 text-[11px]", bookingDelta >= 0 ? "text-chart-emerald" : "text-muted-foreground")}>
          {bookingDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(bookingDelta)} vs last week ({metrics.booking.lastWeek})
        </div>
      </Tile>

      <Tile icon={AlertCircle} label="Follow-up urgency" onClick={onOpenFollowUp}>
        <div className="text-xl font-semibold text-foreground">{metrics.urgency.atRisk}</div>
        <div className="text-[11px] text-muted-foreground">at risk · {metrics.urgency.lapsed} lapsed</div>
      </Tile>
    </div>
  );
}
