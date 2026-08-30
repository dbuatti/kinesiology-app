import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Mic, User, MoreHorizontal, CalendarClock, X, CreditCard, Loader2, ExternalLink, Plus, CheckCircle2, Circle, Gift, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TIMEZONE } from "@/config/integrations";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { nameHash, nameInitials, avatarColor } from "@/utils/avatar";
import { parseAmPmToMinutes } from "@/utils/availability";
import { convertVoiceToAppointment } from "@/utils/voiceToFnh";
import { useAuth } from "@/components/AuthProvider";

export interface BookingListItem {
  id: string;
  source: "voice" | "kinesiology";
  date: string;
  datetime?: string;
  time?: string | null;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  status?: string | null;
  cancelled?: boolean;
  paid?: boolean;
  isFree?: boolean;
  amount?: number | null;
  calcomUid?: string | null;
  notionLessonId1?: string | null;
  notionLessonId2?: string | null;
  lessonId?: string | null;
  studentEmail?: string | null;
  studentName?: string | null;
  clientId?: string | null;
  appointmentId?: string | null;
  eventTypeId?: string | null;
  notionLink?: string | null;
  discipline?: string | null;
}

type Tab = "upcoming" | "past" | "cancelled";
type SourceFilter = "all" | "voice" | "kinesiology";

const itemTime = (i: BookingListItem) => {
  const dt = i.datetime;
  if (dt && dt.includes("T")) return new Date(dt).getTime();
  // datetime is date-only (e.g. "2026-07-28") — midnight UTC = 10 AM AEST,
  // which is always "past" after morning.  Combine date + start time instead.
  const dateStr = dt || i.date;
  if (i.time) {
    const m = i.time.match(/^(\d+):(\d+)\s*(AM|PM)/i);
    if (m) {
      let h = parseInt(m[1]);
      const min = parseInt(m[2]);
      if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
      return new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`).getTime();
    }
  }
  return new Date(dateStr).getTime();
};

interface BookingsListProps {
  items: BookingListItem[];
  onChanged: () => void;
  onNewBooking?: (service: string) => void;
  onRebook?: (item: BookingListItem) => void;
}

const NEW_BOOKING_SERVICES = [
  { group: "Voice", key: "voice60", label: "Voice & Piano — 60 min" },
  { group: "Voice", key: "voice45", label: "Voice & Piano — 45 min" },
  { group: "Voice", key: "voice30", label: "Voice & Piano — 30 min" },
  { group: "FNH", key: "fnhStandard", label: "FNH Neuro-Health Assessment" },
  { group: "FNH", key: "fnhFull", label: "FNH — Full Price" },
  { group: "FNH", key: "fnhFree", label: "FNH — Community (Free)" },
];

const BookingsList = ({ items, onChanged, onNewBooking, onRebook }: BookingsListProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<BookingListItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingListItem | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingListItem | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [slotOptions, setSlotOptions] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Load real open slots (next 21 days) for the booking being rescheduled.
  const loadSlots = async (item: BookingListItem) => {
    if (!item.eventTypeId) { setSlotOptions([]); return; }
    setSlotsLoading(true);
    setSlotOptions([]);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 21);
      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: { start: start.toISOString(), end: end.toISOString(), eventTypeId: item.eventTypeId, timeZone: TIMEZONE, bookingUidToReschedule: item.calcomUid || undefined },
      });
      const byDate = (res.data?.data || {}) as Record<string, any[]>;
      const all: string[] = [];
      for (const k of Object.keys(byDate).sort()) {
        for (const s of byDate[k] || []) all.push(s.start || s.time);
      }
      setSlotOptions(all.filter(Boolean).slice(0, 200));
    } catch {
      setSlotOptions([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const now = Date.now();
  const GRACE_MS = 30 * 60 * 1000;
  const buckets = useMemo(() => {
    const upcoming: BookingListItem[] = [];
    const past: BookingListItem[] = [];
    const cancelled: BookingListItem[] = [];
    for (const i of items) {
      if (sourceFilter !== "all" && i.source !== sourceFilter) continue;
      if (statusFilter === "paid" && !i.paid) continue;
      if (statusFilter === "unpaid" && (i.paid || i.isFree)) continue;
      if (statusFilter === "free" && !i.isFree) continue;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (i.source === "voice" ? i.subtitle || i.studentName || "" : i.title).toLowerCase();
        const label = (i.source === "voice" ? i.title : "FNH Neuro-Health Assessment").toLowerCase();
        if (!name.includes(q) && !label.includes(q) && !i.date.includes(q)) continue;
      }
      if (i.cancelled) cancelled.push(i);
      else if (itemTime(i) >= now - GRACE_MS) upcoming.push(i);
      else past.push(i);
    }
    upcoming.sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : (parseAmPmToMinutes(a.time || "") ?? 0) - (parseAmPmToMinutes(b.time || "") ?? 0);
    });
    past.sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      return dc !== 0 ? dc : (parseAmPmToMinutes(b.time || "") ?? 0) - (parseAmPmToMinutes(a.time || "") ?? 0);
    });
    cancelled.sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      return dc !== 0 ? dc : (parseAmPmToMinutes(b.time || "") ?? 0) - (parseAmPmToMinutes(a.time || "") ?? 0);
    });
    return { upcoming, past, cancelled };
  }, [items, now, sourceFilter, statusFilter, searchQuery]);

  const rows = buckets[tab];

  const summary = useMemo(() => {
    let outstanding = 0, collected = 0, unpaid = 0, free = 0;
    for (const r of rows) {
      if (r.isFree) { free++; continue; }
      if (r.paid) collected += r.amount ?? 0;
      else { outstanding += r.amount ?? 0; unpaid++; }
    }
    return { outstanding, collected, unpaid, free };
  }, [rows]);

  // ---- actions ----
  const sendPaymentLink = async (item: BookingListItem) => {
    setBusyId(item.id);
    try {
      if (item.source === "voice") {
        const res = await supabase.functions.invoke("voice-payment-link", {
          body: {
            amount: (item.amount ?? 95) * 100, // voice-payment-link expects cents
            lessonTitle: item.title,
            lessonId: item.lessonId,
            email: item.studentEmail || undefined,
            studentName: item.studentName || undefined,
          },
        });
        if (res.error) throw res.error;
        if (res.data?.url) {
          await navigator.clipboard.writeText(res.data.url).catch(() => {});
          showSuccess("Payment link created & copied to clipboard.");
        } else {
          showSuccess("Payment link created.");
        }
      } else {
        if (!item.clientId || !item.appointmentId) throw new Error("Missing client/appointment link.");
        const res = await supabase.functions.invoke("send-manual-onboarding", {
          body: { clientId: item.clientId, appointmentId: item.appointmentId, force: true },
        });
        if (res.error) throw res.error;
        showSuccess("Payment email sent to client.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to send payment link");
    } finally {
      setBusyId(null);
    }
  };

  // Manually record/clear payment — for external payments not captured by Stripe.
  const togglePaid = async (item: BookingListItem, paid: boolean) => {
    setBusyId(item.id);
    try {
      if (item.source === "voice") {
        // Writes Notion Payment + voice_bookings.status, so it works even when
        // the lesson has no linked booking row.
        const { error } = await supabase.functions.invoke("voice-mark-paid", {
          body: {
            lessonId: item.lessonId,
            notionLessonId2: item.notionLessonId2,
            calcomBookingId: item.calcomUid,
            paid,
          },
        });
        if (error) throw error;
      } else {
        if (!item.appointmentId) throw new Error("No appointment to mark.");
        const { error } = await supabase
          .from("appointments")
          .update({ payment_received: paid, payment_method: paid ? "External" : null })
          .eq("id", item.appointmentId);
        if (error) throw error;
      }
      showSuccess(paid ? "Marked as paid." : "Marked as unpaid.");
      onChanged();
    } catch (err: any) {
      showError(err.message || "Failed to update payment status");
    } finally {
      setBusyId(null);
    }
  };

  // Set/clear an FNH session as free ($0). Free is an explicit, persisted state.
  const setFree = async (item: BookingListItem, free: boolean) => {
    if (item.source !== "kinesiology" || !item.appointmentId) return;
    setBusyId(item.id);
    try {
      const { error } = await supabase
        .from("appointments")
        .update(free
          ? { price_amount: 0, is_paid: false, payment_received: false }
          : { price_amount: null, is_paid: true })
        .eq("id", item.appointmentId);
      if (error) throw error;
      showSuccess(free ? "Marked as free." : "Free removed.");
      onChanged();
    } catch (err: any) {
      showError(err.message || "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  // Spin up an FNH appointment from a voice lesson (reuses/creates a client by
  // email and carries the voice payment state over).
  const convertToFnh = async (item: BookingListItem) => {
    if (!session?.user?.id) return;
    setBusyId(item.id);
    try {
      await convertVoiceToAppointment(
        {
          studentEmail: item.studentEmail,
          studentName: item.studentName || item.subtitle || null,
          title: item.title,
          datetime: item.datetime,
          date: item.date,
          amount: item.amount,
          paid: item.paid,
        },
        session.user.id
      );
      showSuccess("Converted to an FNH appointment.");
      onChanged();
    } catch (err: any) {
      showError(err.message || "Failed to convert");
    } finally {
      setBusyId(null);
    }
  };

  const doCancel = async () => {
    const item = cancelTarget;
    if (!item) return;
    setBusyId(item.id);
    try {
      if (item.source === "voice") {
        const res = await supabase.functions.invoke("voice-cancel-lesson", {
          body: {
            calcomBookingId: item.calcomUid,
            notionLessonId: item.lessonId,
            notionLessonId1: item.notionLessonId1,
            notionLessonId2: item.notionLessonId2,
          },
        });
        if (res.error) throw res.error;
      } else if (item.calcomUid) {
        const res = await supabase.functions.invoke("delete-external-appointment", {
          body: { calcomBookingId: item.calcomUid },
        });
        if (res.error) throw res.error;
        if (item.appointmentId) {
          await supabase.from("appointments").update({ status: "Cancelled" }).eq("id", item.appointmentId);
        }
      } else {
        // Local-only appointment (e.g. free/community) — just update status.
        if (item.appointmentId) {
          await supabase.from("appointments").update({ status: "Cancelled" }).eq("id", item.appointmentId);
        }
      }
      showSuccess("Booking cancelled.");
      setCancelTarget(null);
      onChanged();
    } catch (err: any) {
      showError(err.message || "Failed to cancel");
    } finally {
      setBusyId(null);
    }
  };

  const doReschedule = async () => {
    const item = rescheduleTarget;
    if (!item || !rescheduleAt) return;
    setBusyId(item.id);
    try {
      const startTime = new Date(rescheduleAt).toISOString();
      let newUid: string | undefined;
      if (item.source === "voice") {
        const res = await supabase.functions.invoke("voice-create-booking", {
          body: {
            bookingUid: item.calcomUid,
            startTime,
            studentName: item.studentName,
            studentEmail: item.studentEmail,
            notionLessonId1: item.notionLessonId1,
            notionLessonId2: item.notionLessonId2,
          },
        });
        if (res.error) throw res.error;
        newUid = res.data?.uid;
      } else {
        const res = await supabase.functions.invoke("create-calcom-booking", {
          body: {
            clientId: item.clientId,
            bookingUid: item.calcomUid,
            startTime,
            eventTypeId: item.eventTypeId,
          },
        });
        if (res.error) throw res.error;
        newUid = res.data?.uid;
      }
      // Persist the new Cal.com UID so future reschedules use the right booking
      if (newUid && newUid !== item.calcomUid && item.appointmentId) {
        await supabase.from("appointments").update({
          calcom_booking_id: newUid,
          date: new Date(rescheduleAt).toISOString(),
          time: format(new Date(rescheduleAt), "h:mm a"),
        }).eq("id", item.appointmentId);
      }
      showSuccess("Booking rescheduled.");
      setRescheduleTarget(null);
      setRescheduleAt("");
      onChanged();
    } catch (err: any) {
      showError(err.message || "Failed to reschedule (slot may be unavailable)");
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyAll = async () => {
    const visibleRows = rows;
    if (visibleRows.length === 0) { showError("No appointments to copy."); return; }

    const lines: string[] = [];
    lines.push("Date\tTime\tClient\tType\tStatus\tAmount\tPaid\tSource");

    for (const item of visibleRows) {
      const dt = item.datetime || item.date;
      const dateStr = (() => {
        try { return format(new Date(dt), "EEE, d MMM yyyy"); } catch { return item.date; }
      })();
      const timeStr = item.time || "";
      const client = item.source === "voice" ? (item.subtitle || item.studentName || item.title) : item.title;
      const typeLabel = item.source === "voice" ? (item.title || "Voice Lesson") : "FNH Neuro-Health Assessment";
      const status = item.cancelled ? "Cancelled" : (item.status || "Scheduled");
      const amount = item.isFree ? "Free" : (item.amount != null ? `$${item.amount}` : "");
      const paid = item.isFree ? "Free" : (item.paid ? "Yes" : "No");
      lines.push([dateStr, timeStr, client, typeLabel, status, amount, paid, item.source].join("\t"));
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showSuccess(`${visibleRows.length} appointment${visibleRows.length !== 1 ? "s" : ""} copied to clipboard.`);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      showError("Couldn't access clipboard.");
    }
  };

  const TabButton = ({ id, label, count }: { id: Tab; label: string; count: number }) => (
    <button
      onClick={() => setTab(id)}
      className={cn(
        "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all flex items-center gap-1.5",
        tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span className={cn("text-[10px] px-1.5 rounded-full", tab === id ? "bg-muted text-foreground" : "bg-muted/60 text-muted-foreground")}>{count}</span>
    </button>
  );

  const FilterButton = ({ id, label }: { id: SourceFilter; label: string }) => (
    <button
      onClick={() => setSourceFilter(id)}
      className={cn(
        "px-3 py-2 rounded-[10px] text-xs font-semibold transition-all",
        sourceFilter === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  // Group rows by date for sticky headers
  const grouped = useMemo(() => {
    const map = new Map<string, BookingListItem[]>();
    for (const r of rows) {
      const g = map.get(r.date);
      if (g) g.push(r);
      else map.set(r.date, [r]);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Consolidated filter bar: search, time-state pills, source toggle, new booking */}
      <div className="bg-gradient-to-br from-amber-50/40 to-card dark:from-amber-950/10 border border-border/60 rounded-[1.5rem] p-3.5 mb-4 space-y-3 shadow-[0_2px_20px_-10px_rgba(120,90,40,0.15)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Input
              placeholder="Search name, event, date…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg text-xs pl-7 pr-7"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex bg-muted rounded-lg p-0.5 border border-border w-fit">
            <TabButton id="upcoming" label="Upcoming" count={buckets.upcoming.length} />
            <TabButton id="past" label="Past" count={buckets.past.length} />
            <TabButton id="cancelled" label="Cancelled" count={buckets.cancelled.length} />
          </div>
          <div className="flex bg-muted rounded-lg p-0.5 border border-border w-fit">
            <FilterButton id="all" label="All" />
            <FilterButton id="voice" label="Voice" />
            <FilterButton id="kinesiology" label="FNH" />
          </div>
          {rows.length > 0 && (
            <Button
              onClick={handleCopyAll}
              variant="outline"
              className="rounded-lg font-semibold text-xs h-8 px-3 border-border hover:bg-muted active:scale-95 transition-transform"
              title="Copy all visible appointments to clipboard (paste into a spreadsheet)"
            >
              {copiedAll ? (
                <CheckCircle2 size={14} className="mr-1 text-chart-emerald" />
              ) : (
                <Copy size={14} className="mr-1" />
              )}
              {copiedAll ? "Copied!" : "Copy all"}
            </Button>
          )}
          {onNewBooking && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-lg font-semibold text-xs h-8 px-3 bg-gradient-to-br from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-primary-foreground border-none active:scale-95 transition-transform">
                  <Plus size={14} className="mr-1" /> New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {NEW_BOOKING_SERVICES.map((s, i) => {
                  const prev = NEW_BOOKING_SERVICES[i - 1];
                  const isVoice = s.group === "Voice";
                  return (
                    <div key={s.key}>
                      {(!prev || prev.group !== s.group) && (
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.group}</div>
                      )}
                      <DropdownMenuItem onClick={() => onNewBooking(s.key)}>
                        {isVoice ? <Mic size={14} className="mr-2 text-chart-destructive" /> : <User size={14} className="mr-2 text-chart-primary" />}
                        {s.label}
                      </DropdownMenuItem>
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {summary.outstanding > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === "unpaid" ? "all" : "unpaid")}
                className={cn(
                  "tabular-nums transition-all rounded-full px-3 py-1 border font-semibold",
                    statusFilter === "unpaid"
                      ? "bg-chart-destructive text-primary-foreground border-chart-destructive shadow-sm"
                      : "bg-chart-destructive/10 text-chart-destructive border-chart-destructive/20 hover:bg-chart-destructive/15"
                )}
              >
                ${summary.outstanding} outstanding
              </button>
            )}
            {summary.unpaid > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === "unpaid" ? "all" : "unpaid")}
                className={cn(
                  "transition-all rounded-full px-3 py-1 border font-semibold",
                  statusFilter === "unpaid" ? "bg-foreground text-background border-foreground" : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
                )}
              >
                {summary.unpaid} unpaid
              </button>
            )}
            {summary.collected > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}
                className={cn(
                  "tabular-nums transition-all rounded-full px-3 py-1 border font-semibold",
                  statusFilter === "paid"
                    ? "bg-chart-emerald text-primary-foreground border-chart-emerald shadow-sm"
                    : "bg-chart-emerald/10 text-chart-emerald border-chart-emerald/20 hover:bg-chart-emerald/15"
                )}
              >
                ${summary.collected} collected
              </button>
            )}
            {summary.free > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === "free" ? "all" : "free")}
                className={cn(
                  "transition-all rounded-full px-3 py-1 border font-semibold",
                  statusFilter === "free" ? "bg-foreground text-background border-foreground" : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
                )}
              >
                {summary.free} free
              </button>
            )}
          </div>
        )}
      </div>

      {/* Batch actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-xs font-medium text-foreground">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            {rows.some((r) => selectedIds.has(r.id) && !r.paid && !r.isFree && !r.cancelled) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={async () => {
                  const toMark = rows.filter((r) => selectedIds.has(r.id) && !r.paid && !r.isFree && !r.cancelled);
                  for (const item of toMark) await togglePaid(item, true);
                  setSelectedIds(new Set());
                }}
              >
                <CheckCircle2 size={13} className="mr-1.5" /> Mark paid
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Date-grouped list with sticky headers */}
      <div className="bg-card rounded-[1.75rem] border border-border/60 shadow-[0_4px_30px_-12px_rgba(120,90,40,0.18)] overflow-hidden">
        {grouped.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="inline-flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                {tab === "upcoming" ? <CalendarClock size={22} className="opacity-60" /> : <X size={22} className="opacity-60" />}
              </div>
              <div className="text-sm font-serif italic">
                {rows.length === 0
                  ? "No bookings match your filters."
                  : `No ${tab} bookings.`}
              </div>
              {(statusFilter !== "all" || sourceFilter !== "all" || searchQuery.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold h-8"
                  onClick={() => { setStatusFilter("all"); setSourceFilter("all"); setSearchQuery(""); }}
                >
                  <X size={12} className="mr-1" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        )}
        {grouped.map(([dateLabel, dateItems]) => (
          <div key={dateLabel}>
            <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-50/70 via-card to-card dark:from-amber-950/15 border-b border-border/50 px-5 py-3 flex items-center gap-3">
              <Checkbox
                checked={dateItems.length > 0 && dateItems.every((i) => selectedIds.has(i.id))}
                onCheckedChange={(checked) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    for (const i of dateItems) {
                      if (checked) next.add(i.id);
                      else next.delete(i.id);
                    }
                    return next;
                  });
                }}
              />
              <span className="font-serif text-sm font-semibold text-foreground/85 tracking-tight">{format(new Date(dateLabel + "T12:00:00"), "EEEE, MMMM d")}</span>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{dateItems.length}</span>
            </div>
            {dateItems.map((item) => {
          const isVoice = item.source === "voice";
          const person = isVoice ? item.subtitle || item.studentName || "—" : item.title;
          const isPiano = isVoice && (item.discipline || "voice") === "piano";
          // Keep the secondary line short — the person's name is already shown above,
          // and the coloured pill carries the voice/piano distinction.
          const eventLabel = isVoice ? "Lesson" : "FNH Neuro-Health Assessment";
          const discipline = isVoice ? (isPiano ? "piano" : "voice") : null;
          const busy = busyId === item.id;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`${person}, ${eventLabel}${item.time ? ` at ${item.time}` : ""}`}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 last:border-b-0 border-l-2 border-l-transparent hover:border-l-primary/30 hover:bg-muted/40 hover:pl-6 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              onClick={() => {
                if (item.source === "kinesiology" && item.url) {
                  navigate(item.url);
                } else if (item.source === "voice" && item.url) {
                  window.open(item.url, "_blank");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (item.source === "kinesiology" && item.url) {
                    navigate(item.url);
                  } else if (item.source === "voice" && item.url) {
                    window.open(item.url, "_blank");
                  }
                }
              }}
            >
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={(checked) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(item.id);
                    else next.delete(item.id);
                    return next;
                  });
                }}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
              <div
                className={`${avatarColor(person)} w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-primary-foreground shadow-sm ring-2 ring-background`}
              >
                {nameInitials(person)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    title={person}
                    aria-label={`View ${person} profile`}
                    className="font-semibold text-sm text-foreground truncate cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.source === "kinesiology" && item.clientId) {
                        navigate(`/clients/${item.clientId}`);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.source === "kinesiology" && item.clientId) {
                          navigate(`/clients/${item.clientId}`);
                        }
                      }
                    }}
                  >
                    {person}
                  </span>
                  {item.cancelled ? (
                    <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-semibold rounded-full px-2.5 py-0.5">Cancelled</Badge>
                  ) : item.isFree ? (
                    <Badge className="bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground border-none text-[10px] font-semibold rounded-full px-2.5 py-0.5">Free</Badge>
                  ) : !item.paid ? (
                    <Badge className="bg-chart-destructive/10 text-chart-destructive border-none text-[10px] font-semibold rounded-full px-2.5 py-0.5">Unpaid</Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  {discipline && (
                    <Badge className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider border-none px-1.5 py-0",
                      discipline === "piano"
                        ? "bg-chart-primary/10 text-chart-primary"
                        : "bg-chart-destructive/10 text-chart-destructive"
                    )}>
                      {discipline === "piano" ? "Piano" : "Voice"}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground truncate" title={eventLabel}>{eventLabel}</span>
                </div>
              </div>

              {/* Charge — at-a-glance pricing */}
              <div className="shrink-0 text-right w-14">
                {item.isFree ? (
                  <span className="text-xs font-bold text-muted-foreground">Free</span>
                ) : item.amount != null ? (
                  <span className={cn("text-sm font-bold tabular-nums", item.paid ? "text-chart-emerald" : "text-chart-destructive")}>${item.amount}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              <div className="text-right shrink-0 hidden sm:block w-24">
                <div className="text-xs font-medium text-foreground">{format(new Date(item.datetime || item.date), "EEE, d MMM")}</div>
                {item.time && <div className="text-[11px] text-muted-foreground">{item.time}</div>}
              </div>

              {tab === "past" && onRebook && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg text-[10px] font-semibold shrink-0 px-2.5"
                  onClick={(e) => { e.stopPropagation(); onRebook(item); }}
                >
                  <Plus size={11} className="mr-1" /> Book again
                </Button>
              )}

              {item.notionLink && (
                <a
                  href={item.notionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground">
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none">
                      <rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor"/>
                      <path d="M8 6v12l8-12v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                </a>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled={busy} onClick={(e) => e.stopPropagation()}>
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={16} />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {!item.isFree && (
                    item.paid ? (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePaid(item, false); }}>
                        <Circle size={14} className="mr-2" /> Mark as unpaid
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePaid(item, true); }}>
                        <CheckCircle2 size={14} className="mr-2 text-chart-emerald" /> Mark as paid
                      </DropdownMenuItem>
                    )
                  )}
                  {!item.isFree && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPayTarget(item); }}>
                      <CreditCard size={14} className="mr-2" />
                      {item.paid ? "Resend payment link" : "Send payment link"}
                    </DropdownMenuItem>
                  )}
                  {/* Free is FNH-only (voice lessons are always charged) */}
                  {item.source === "kinesiology" && (
                    item.isFree ? (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setFree(item, false); }}>
                        <CreditCard size={14} className="mr-2" /> This is a paid session
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setFree(item, true); }}>
                        <Gift size={14} className="mr-2 text-muted-foreground" /> Mark as free
                      </DropdownMenuItem>
                    )
                  )}
                  {!item.cancelled && item.calcomUid && (
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setRescheduleTarget(item); setRescheduleAt(""); loadSlots(item); }}
                    >
                      <CalendarClock size={14} className="mr-2" /> Reschedule
                    </DropdownMenuItem>
                  )}
                  {item.source === "voice" && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); convertToFnh(item); }}>
                      <User size={14} className="mr-2" /> Convert to FNH appointment
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRebook?.(item);
                    }}
                    disabled={!onRebook}
                  >
                    <Plus size={14} className="mr-2" /> Book another
                  </DropdownMenuItem>
                  {item.url && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (item.source === "voice") window.open(item.url!, "_blank");
                        else navigate(item.url!);
                      }}
                    >
                      <ExternalLink size={14} className="mr-2" /> Open record
                    </DropdownMenuItem>
                  )}
                  {!item.cancelled && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setCancelTarget(item); }}
                    >
                      <X size={14} className="mr-2" /> Cancel booking
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        </div>
      ))}
    </div>

      {/* Send payment link — confirm the rate first */}
      <Dialog open={!!payTarget} onOpenChange={(o) => { if (!o) setPayTarget(null); }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send payment link</DialogTitle>
            <DialogDescription>
              {payTarget && (
                <>Charge <strong>{payTarget.source === "voice" ? (payTarget.subtitle || payTarget.studentName) : payTarget.title}</strong>{payTarget.source === "kinesiology" ? " their current rate" : ""}:</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-center">
            <div className="text-5xl font-serif font-bold tabular-nums bg-gradient-to-br from-amber-500 to-rose-500 bg-clip-text text-transparent">${payTarget?.amount ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {payTarget?.source === "voice"
                ? "Generates a Stripe checkout link and copies it to your clipboard."
                : "Emails the client a Stripe checkout link for this amount."}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => { const t = payTarget; setPayTarget(null); if (t) sendPaymentLink(t); }}
              disabled={!!busyId}
              className="rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-primary-foreground border-none"
            >
              <CreditCard size={15} className="mr-2" /> Send for ${payTarget?.amount ?? ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>{cancelTarget.calcomUid
                  ? <>This cancels the Cal.com booking for <strong>{cancelTarget.source === "voice" ? cancelTarget.subtitle : cancelTarget.title}</strong> and frees the slot. This can’t be undone.</>
                  : <>Cancel the appointment for <strong>{cancelTarget.source === "voice" ? cancelTarget.subtitle : cancelTarget.title}</strong>? This can’t be undone.</>
                }</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)} className="rounded-xl">Keep it</Button>
            <Button variant="destructive" onClick={doCancel} disabled={!!busyId} className="rounded-xl">
              {busyId ? <Loader2 size={15} className="mr-2 animate-spin" /> : <X size={15} className="mr-2" />} Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(o) => { if (!o) { setRescheduleTarget(null); setRescheduleAt(""); } }}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>
              Pick from your real open times, or enter a custom time below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {slotsLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading open times…
              </div>
            ) : slotOptions.length > 0 ? (
              <div className="max-h-52 overflow-y-auto grid grid-cols-2 gap-1.5">
                {slotOptions.map((iso) => {
                  const selected = rescheduleAt === iso;
                  return (
                    <button
                      key={iso}
                      onClick={() => setRescheduleAt(iso)}
                      className={cn(
                        "text-left text-xs rounded-lg border px-2.5 py-2 transition-all",
                        selected ? "border-chart-primary/30 bg-chart-primary/5 text-chart-primary font-semibold" : "border-border hover:border-chart-primary/20"
                      )}
                    >
                      {format(new Date(iso), "EEE d MMM · h:mma").toLowerCase()}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No open times found in the next 3 weeks — use a custom time below.</p>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Custom time</p>
              <Input
                type="datetime-local"
                value={rescheduleAt && rescheduleAt.includes("T") && !rescheduleAt.endsWith("Z") ? rescheduleAt : ""}
                onChange={(e) => setRescheduleAt(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRescheduleTarget(null); setRescheduleAt(""); }} className="rounded-xl">Cancel</Button>
            <Button onClick={doReschedule} disabled={!rescheduleAt || !!busyId} className="rounded-xl">
              {busyId ? <Loader2 size={15} className="mr-2 animate-spin" /> : <CalendarClock size={15} className="mr-2" />} Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsList;
