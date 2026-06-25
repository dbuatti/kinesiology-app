import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Mic, User, MoreHorizontal, CalendarClock, X, CreditCard, Loader2, ExternalLink, Plus, CheckCircle2, Circle, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
}

type Tab = "upcoming" | "past" | "cancelled";
type SourceFilter = "all" | "voice" | "kinesiology";

const itemTime = (i: BookingListItem) => new Date(i.datetime || i.date).getTime();

interface BookingsListProps {
  items: BookingListItem[];
  onChanged: () => void;
  onNewBooking?: (service: string) => void;
}

const NEW_BOOKING_SERVICES = [
  { group: "Voice", key: "voice60", label: "Voice & Piano — 60 min" },
  { group: "Voice", key: "voice45", label: "Voice & Piano — 45 min" },
  { group: "FNH", key: "fnhStandard", label: "FNH Neuro-Health Assessment" },
  { group: "FNH", key: "fnhFull", label: "FNH — Full Price" },
  { group: "FNH", key: "fnhFree", label: "FNH — Community (Free)" },
];

const BookingsList = ({ items, onChanged, onNewBooking }: BookingsListProps) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<BookingListItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingListItem | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingListItem | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");

  const now = Date.now();
  const buckets = useMemo(() => {
    const upcoming: BookingListItem[] = [];
    const past: BookingListItem[] = [];
    const cancelled: BookingListItem[] = [];
    for (const i of items) {
      if (sourceFilter !== "all" && i.source !== sourceFilter) continue;
      if (i.cancelled) cancelled.push(i);
      else if (itemTime(i) >= now) upcoming.push(i);
      else past.push(i);
    }
    upcoming.sort((a, b) => itemTime(a) - itemTime(b));
    past.sort((a, b) => itemTime(b) - itemTime(a));
    cancelled.sort((a, b) => itemTime(b) - itemTime(a));
    return { upcoming, past, cancelled };
  }, [items, now, sourceFilter]);

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

  const doCancel = async () => {
    const item = cancelTarget;
    if (!item) return;
    setBusyId(item.id);
    try {
      if (item.source === "voice") {
        const res = await supabase.functions.invoke("voice-cancel-lesson", {
          body: {
            calcomBookingId: item.calcomUid,
            notionLessonId1: item.notionLessonId1,
            notionLessonId2: item.notionLessonId2,
          },
        });
        if (res.error) throw res.error;
      } else {
        const res = await supabase.functions.invoke("delete-external-appointment", {
          body: { calcomBookingId: item.calcomUid },
        });
        if (res.error) throw res.error;
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
      if (item.source === "voice") {
        const res = await supabase.functions.invoke("voice-create-booking", {
          body: {
            bookingUid: item.calcomUid,
            startTime,
            studentName: item.studentName,
            studentEmail: item.studentEmail,
          },
        });
        if (res.error) throw res.error;
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

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex bg-muted rounded-xl p-0.5 border border-border w-fit">
          <TabButton id="upcoming" label="Upcoming" count={buckets.upcoming.length} />
          <TabButton id="past" label="Past" count={buckets.past.length} />
          <TabButton id="cancelled" label="Cancelled" count={buckets.cancelled.length} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-xl p-0.5 border border-border w-fit">
            <FilterButton id="all" label="All" />
            <FilterButton id="voice" label="Voice" />
            <FilterButton id="kinesiology" label="FNH" />
          </div>

          {onNewBooking && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-xl font-semibold text-xs h-9">
                  <Plus size={15} className="mr-1.5" /> New Booking
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
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-3 px-1 text-xs">
          <span className="font-semibold text-foreground">{rows.length} {tab}</span>
          {summary.outstanding > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">${summary.outstanding} outstanding</span>
          )}
          {summary.unpaid > 0 && <span className="text-muted-foreground">{summary.unpaid} unpaid</span>}
          {summary.collected > 0 && (
            <span className="text-chart-emerald font-semibold tabular-nums">${summary.collected} collected</span>
          )}
          {summary.free > 0 && <span className="text-muted-foreground">{summary.free} free</span>}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border overflow-hidden">
        {rows.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">No {tab} bookings.</div>
        )}
        {rows.map((item) => {
          const isVoice = item.source === "voice";
          const person = isVoice ? item.subtitle || item.studentName || "—" : item.title;
          const eventLabel = isVoice ? item.title : "FNH Neuro-Health Assessment";
          const busy = busyId === item.id;
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isVoice ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-primary/10 text-chart-primary"
                )}
              >
                {isVoice ? <Mic size={15} /> : <User size={15} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{person}</span>
                  {item.cancelled ? (
                    <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-semibold">Cancelled</Badge>
                  ) : item.isFree ? (
                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-none text-[10px] font-semibold">Free</Badge>
                  ) : item.paid ? (
                    <Badge className="bg-chart-emerald/10 text-chart-emerald border-none text-[10px] font-semibold">Paid</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none text-[10px] font-semibold">Unpaid</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{eventLabel}</div>
              </div>

              {/* Charge — at-a-glance pricing */}
              <div className="shrink-0 text-right w-14">
                {item.isFree ? (
                  <span className="text-xs font-bold text-slate-400">Free</span>
                ) : item.amount != null ? (
                  <span className={cn("text-sm font-bold tabular-nums", item.paid ? "text-chart-emerald" : "text-foreground")}>${item.amount}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              <div className="text-right shrink-0 hidden sm:block w-24">
                <div className="text-xs font-medium text-foreground">{format(new Date(item.datetime || item.date), "EEE, d MMM")}</div>
                {item.time && <div className="text-[11px] text-muted-foreground">{item.time}</div>}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled={busy}>
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={16} />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {!item.isFree && (
                    item.paid ? (
                      <DropdownMenuItem onClick={() => togglePaid(item, false)}>
                        <Circle size={14} className="mr-2" /> Mark as unpaid
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => togglePaid(item, true)}>
                        <CheckCircle2 size={14} className="mr-2 text-chart-emerald" /> Mark as paid
                      </DropdownMenuItem>
                    )
                  )}
                  {!item.isFree && (
                    <DropdownMenuItem onClick={() => setPayTarget(item)}>
                      <CreditCard size={14} className="mr-2" />
                      {item.paid ? "Resend payment link" : "Send payment link"}
                    </DropdownMenuItem>
                  )}
                  {/* Free is FNH-only (voice lessons are always charged) */}
                  {item.source === "kinesiology" && (
                    item.isFree ? (
                      <DropdownMenuItem onClick={() => setFree(item, false)}>
                        <CreditCard size={14} className="mr-2" /> This is a paid session
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setFree(item, true)}>
                        <Gift size={14} className="mr-2 text-slate-500" /> Mark as free
                      </DropdownMenuItem>
                    )
                  )}
                  {!item.cancelled && (
                    <DropdownMenuItem
                      disabled={!item.calcomUid}
                      onClick={() => { setRescheduleTarget(item); setRescheduleAt(""); }}
                    >
                      <CalendarClock size={14} className="mr-2" /> Reschedule
                    </DropdownMenuItem>
                  )}
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
                      disabled={!item.calcomUid}
                      className="text-destructive focus:text-destructive"
                      onClick={() => setCancelTarget(item)}
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
            <div className="text-4xl font-black text-foreground tabular-nums">${payTarget?.amount ?? "—"}</div>
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
              className="rounded-xl"
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
                <>This cancels the Cal.com booking for <strong>{cancelTarget.source === "voice" ? cancelTarget.subtitle : cancelTarget.title}</strong> and frees the slot. This can’t be undone.</>
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
              Pick a new date and time. Cal.com will reject the change if the slot isn’t available.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="datetime-local"
              value={rescheduleAt}
              onChange={(e) => setRescheduleAt(e.target.value)}
              className="rounded-xl"
            />
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
