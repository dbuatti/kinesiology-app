import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/components/AuthProvider";
import { CALCOM_CONFIG } from "@/config/integrations";
import {
  Loader2, Calendar, Clock, Check, CalendarPlus, Mail, AlertCircle, CheckCircle2
} from "lucide-react";

interface Slot {
  time: string;
  attendees?: number;
  bookingUid?: string | null;
}

interface QuickBookDialogProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefillPrice?: number;
}

// Prices are driven by the actual Cal.com event types so every button maps to a real
// event type (previously [0,50,100] — $50 had no event type and crashed booking).
const PRICES = Array.from(new Set(CALCOM_CONFIG.EVENT_TYPES.map((t) => t.price))).sort((a, b) => a - b);

const QuickBookDialog = ({ clientId, open, onOpenChange, onSuccess, prefillPrice }: QuickBookDialogProps) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [sendOnboarding, setSendOnboarding] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "calcom" | "email">("idle");
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedPrice(0);
      setSendOnboarding(true);
      setSubmitting(false);
      setSyncStatus("idle");
      setConflictError(null);
    } else if (prefillPrice !== undefined) {
      // Pre-select the chosen appointment's price (from the "New Booking" menu).
      setSelectedPrice(prefillPrice);
      setSendOnboarding(prefillPrice > 0);
    }
  }, [open, prefillPrice]);

  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ["quick-book-slots", clientId],
    queryFn: async () => {
      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: {
          start: new Date().toISOString(),
          end: addDays(new Date(), 30).toISOString(),
          eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: open && !!clientId,
    staleTime: 30_000,
  });

  const slotsByDate: Record<string, Slot[]> = slotsData?.data || {};

  const availableDates = useMemo(() => {
    return Object.keys(slotsByDate)
      .filter((key) => slotsByDate[key].length > 0)
      .map((key) => parseISO(key))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [slotsByDate]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  const currentSlots = selectedDate
    ? (slotsByDate[format(selectedDate, "yyyy-MM-dd")] || [])
    : [];

  const priceEventType = CALCOM_CONFIG.EVENT_TYPES.find((t) => t.price === selectedPrice);

  const handleBook = async () => {
    if (!session?.user?.id || !clientId || !selectedSlot || !selectedDate) return;

    setSubmitting(true);
    setConflictError(null);

    try {
      let calcomId: string | null = null;

      if (selectedPrice > 0) {
        setSyncStatus("calcom");
        const { data: calcomData, error: invokeError } = await supabase.functions.invoke("create-calcom-booking", {
          body: {
            clientId,
            startTime: selectedSlot.time,
            eventTypeId: priceEventType!.id,
            title: `Kinesiology Session - ${format(selectedDate, "MMM d, yyyy")}`,
            notes: "",
            is_paid: selectedPrice > 0,
          },
        });

        if (invokeError) throw invokeError;
        calcomId = calcomData?.uid || calcomData?.bookingId || null;
      }

      const { data: newApp, error: dbError } = await supabase
        .from("appointments")
        .upsert({
          user_id: session.user.id,
          client_id: clientId,
          date: selectedSlot.time,
          tag: "Kinesiology",
          status: "Scheduled",
          is_paid: selectedPrice > 0,
          calcom_booking_id: calcomId,
          price_amount: selectedPrice,
          price_currency: "AUD",
          send_onboarding: sendOnboarding,
          name: `Session - ${format(selectedDate, "MMM d, yyyy")}`,
        }, { onConflict: calcomId ? "calcom_booking_id" : "id" })
        .select("id")
        .single();

      if (dbError) throw dbError;

      if (sendOnboarding) {
        setSyncStatus("email");
        // force: true makes this toggle authoritative — it overrides the function's
        // 6-month auto-skip so a checked box always sends the link/intake.
        await supabase.functions.invoke("send-manual-onboarding", {
          body: { clientId, appointmentId: newApp?.id, force: true },
        });
      }

      showSuccess(sendOnboarding ? "Session booked and onboarding email sent!" : "Appointment scheduled.");
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      onSuccess();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Conflict") || msg.includes("available") || msg.includes("booking")) {
        setConflictError(msg);
      } else {
        showError(msg || "Failed to save appointment");
      }
    } finally {
      setSubmitting(false);
      setSyncStatus("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[90vh] bg-background">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <CalendarPlus size={22} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Quick Book Session</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm font-medium">
                  Schedule a new appointment
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {slotsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={28} />
                <p className="text-xs font-bold text-muted-foreground">Loading availability...</p>
              </div>
            </div>
          ) : slotsError ? (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-red-500">Failed to load availability</p>
              <p className="text-xs text-muted-foreground mt-1">Please try again.</p>
            </div>
          ) : availableDates.length > 0 ? (
            <>
              {/* Date chips */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Available Days</p>
                <div className="flex gap-2.5 pb-2 overflow-x-auto">
                  {availableDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); setConflictError(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl border-2 transition-all duration-200 shrink-0",
                        selectedDate?.getTime() === date.getTime()
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105"
                          : "bg-card border-border hover:border-indigo-300 dark:hover:border-indigo-700 text-foreground"
                      )}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{format(date, "EEE")}</span>
                      <span className="text-xl font-black leading-tight">{format(date, "d")}</span>
                      <span className="text-[8px] font-bold opacity-40 uppercase">{format(date, "MMM")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="space-y-3 animate-in fade-in duration-300 mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                      Pick a start time &mdash; sessions run ~60m
                    </p>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full">
                      {currentSlots.length} slot{currentSlots.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {currentSlots.map((slot) => {
                      const time = format(parseISO(slot.time), "h:mm a");
                      const isSelected = selectedSlot?.time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          onClick={() => { setSelectedSlot(slot); setConflictError(null); }}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-black transition-all group shadow-sm",
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-card border-border text-foreground hover:bg-indigo-600 hover:border-indigo-600 hover:text-white"
                          )}
                        >
                          <Clock size={13} className={cn("shrink-0", isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-100 transition-opacity")} />
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conflict error */}
              {conflictError && (
                <div className="mt-4 flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{conflictError}</span>
                </div>
              )}

              {/* Session Price */}
              {selectedSlot && (
                <div className="space-y-3 animate-in fade-in duration-300 mt-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Session Price</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PRICES.map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => { setSelectedPrice(price); setSendOnboarding(price > 0); }}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                          selectedPrice === price
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                            : "bg-card border-border text-foreground hover:border-indigo-300"
                        )}
                      >
                        <span className="text-lg font-black">{price === 0 ? "Free" : `$${price}`}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">
                          {price === 0 ? "No Charge" : "Paid Session"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Onboarding Email */}
              {selectedSlot && (
                <div
                  onClick={() => setSendOnboarding(!sendOnboarding)}
                  className={cn(
                    "flex flex-row items-center justify-between rounded-[1.5rem] border-2 p-5 transition-all cursor-pointer mt-3",
                    sendOnboarding ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-card border-border hover:border-emerald-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", sendOnboarding ? "bg-emerald-600 text-white" : "bg-muted text-emerald-600")}>
                      <Mail size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-black text-foreground">Send Onboarding + Payment Email</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{selectedPrice > 0 ? "Emails intake form + Stripe payment link" : "Emails the intake form"}</p>
                    </div>
                  </div>
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", sendOnboarding ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/30")}>
                    {sendOnboarding && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                </div>
              )}

              {/* Book button */}
              {selectedSlot && (
                <Button
                  onClick={handleBook}
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 mt-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      {syncStatus === "calcom" ? "Syncing Cal.com..." : syncStatus === "email" ? "Sending Onboarding..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Calendar size={18} className="mr-2" />
                      Schedule Appointment
                    </>
                  )}
                </Button>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickBookDialog;
