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
import {
  Loader2, Calendar, Clock, Check, Music, ArrowLeft, CalendarPlus, Mail, CheckCircle2
} from "lucide-react";

interface VoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
}

const EVENT_TYPES = [
  { key: "60", label: "60 min", eventTypeId: "1945081", price: "$95" },
  { key: "45", label: "45 min", eventTypeId: "5925021", price: "$75" },
];

interface VoiceQuickBookDialogProps {
  student: VoiceStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Slot {
  time: string;
  attendees?: number;
  bookingUid?: string | null;
}

const VoiceQuickBookDialog = ({ student, open, onOpenChange }: VoiceQuickBookDialogProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"slots" | "confirm">("slots");
  const [duration, setDuration] = useState("60");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [sendOnboarding, setSendOnboarding] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("slots");
      setSelectedSlot(null);
      setSelectedDate(null);
      setDuration("60");
      setSendOnboarding(true);
      setSendingEmail(false);
      setEmailSent(false);
    }
  }, [open]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep("slots");
  }, [duration]);

  const eventType = EVENT_TYPES.find((e) => e.key === duration)!;

  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ["voice-available-slots", duration, student?.id],
    queryFn: async () => {
      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: {
          start: new Date().toISOString(),
          end: addDays(new Date(), 30).toISOString(),
          eventTypeId: eventType.eventTypeId,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: open && !!student,
    staleTime: 30_000,
  });

  const slotsByDate: Record<string, Slot[]> = slotsData?.data || {};
  const bookings: Record<string, any[]> = slotsData?.bookings || {};

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

  const handleSendOnboarding = async () => {
    if (!student || !selectedSlot || !selectedDate) return;
    setSendingEmail(true);
    try {
      const dateStr = format(selectedDate, "MMM d, yyyy");
      const timeStr = format(parseISO(selectedSlot.time), "h:mm a");
      const costVal = parseInt(eventType.price.replace("$", ""));
      const { error } = await supabase.functions.invoke("voice-send-onboarding", {
        body: {
          studentName: student.name,
          studentEmail: student.email,
          date: dateStr,
          time: timeStr,
          duration,
          cost: costVal,
        },
      });
      if (error) throw error;
      setEmailSent(true);
      setSendingEmail(false);
    } catch (err) {
      setSendingEmail(false);
    }
  };

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!student || !selectedSlot || !selectedDate) throw new Error("Missing booking details");

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const startTime = parseISO(selectedSlot.time);
      const timeStr = format(startTime, "h:mm a");

      const { data: bookingData, error: bookingError } = await supabase.functions.invoke("voice-create-booking", {
        body: {
          studentName: student.name || "Voice Student",
          studentEmail: student.email || "unknown@email.com",
          startTime: selectedSlot.time,
          eventTypeId: eventType.eventTypeId,
          title: `Voice Lesson — ${dateStr}`,
          notes: `Booked via Voice Studio CRM (${duration} min)`,
        },
      });
      if (bookingError) throw bookingError;

      const costVal = parseInt(eventType.price.replace("$", ""));
      const uid = bookingData?.uid;
      const { data: lessonData, error: lessonError } = await supabase.functions.invoke("voice-schedule-lesson", {
        body: {
          studentId: student.id,
          date: dateStr,
          time: timeStr,
          cost: costVal,
          studentName: student.name,
          studentEmail: student.email,
          calcomBookingUid: uid,
        },
      });
      if (lessonError) throw lessonError;

      return bookingData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["voice-students"] });
      queryClient.invalidateQueries({ queryKey: ["voice-bookings"] });
      if (sendOnboarding) {
        handleSendOnboarding();
      }
    },
  });

  const handleConfirm = () => {
    createBooking.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[90vh] bg-background">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4">
              {step === "confirm" && (
                <button
                  onClick={() => { setStep("slots"); setSelectedSlot(null); }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors -ml-1.5"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className={cn("w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shrink-0", step === "confirm" && "hidden")}>
                <Music size={22} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">
                  {step === "slots" ? "Quick Book Session" : "Confirm Booking"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm font-medium">
                  {student?.name ? `Schedule for ${student.name}` : "Schedule a voice lesson"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Duration Toggle */}
          <div className="flex gap-2 mt-4">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.key}
                onClick={() => setDuration(et.key)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-black transition-all border-2",
                  duration === et.key
                    ? "bg-rose-600 border-rose-600 text-white shadow-lg"
                    : "bg-card border-border text-foreground hover:border-rose-300 dark:hover:border-rose-700"
                )}
              >
                {et.label} · {et.price}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {step === "slots" && (
          <div className="overflow-y-auto flex-1 px-8 py-6">
            {slotsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-rose-500" size={28} />
                  <p className="text-xs font-bold text-muted-foreground">Loading availability...</p>
                </div>
              </div>
            ) : slotsError ? (
              <div className="text-center py-12">
                <p className="text-sm font-bold text-red-500">Failed to load availability</p>
                <p className="text-xs text-muted-foreground mt-1">Try selecting a different duration.</p>
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
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl border-2 transition-all duration-200 shrink-0",
                          selectedDate?.getTime() === date.getTime()
                            ? "bg-rose-600 border-rose-600 text-white shadow-lg scale-105"
                            : "bg-card border-border hover:border-rose-300 dark:hover:border-rose-700 text-foreground"
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
                        Times for {format(selectedDate, "EEEE, MMMM do")}
                      </p>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                        {currentSlots.length} slot{currentSlots.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {currentSlots.map((slot) => {
                        const time = format(parseISO(slot.time), "h:mm a");
                        return (
                          <button
                            key={slot.time}
                            onClick={() => { setSelectedSlot(slot); setStep("confirm"); }}
                            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-card border border-border text-sm font-black text-foreground hover:bg-rose-600 hover:border-rose-600 hover:text-white transition-all group shadow-sm"
                          >
                            <Clock size={13} className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Confirm step */}
        {step === "confirm" && selectedSlot && selectedDate && (
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
            <div className="bg-muted/50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                  <CalendarPlus size={18} className="text-rose-600" />
                </div>
                <div>
                  <p className="font-black text-sm">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {format(parseISO(selectedSlot.time), "h:mm a")} · {eventType.label} · {eventType.price}
                  </p>
                </div>
              </div>
            </div>

            {student && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student</p>
                <p className="font-bold text-sm">{student.name}</p>
                {student.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
              </div>
            )}

            {/* Send Onboarding toggle */}
            {!createBooking.isSuccess && (
              <div
                onClick={() => setSendOnboarding(!sendOnboarding)}
                className={cn(
                  "flex items-center justify-between rounded-xl border-2 p-4 transition-all cursor-pointer",
                  sendOnboarding ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : "bg-card border-border hover:border-emerald-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-colors", sendOnboarding ? "bg-emerald-600 text-white" : "bg-muted text-emerald-600")}>
                    <Mail size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-foreground">Send Onboarding Email</p>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Booking confirmation + welcome email</p>
                  </div>
                </div>
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", sendOnboarding ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/30")}>
                  {sendOnboarding && <Check size={12} className="text-white" />}
                </div>
              </div>
            )}

            {createBooking.isSuccess && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl">
                  <Check size={18} />
                  <div>
                    <p className="font-bold text-sm">Booked!</p>
                    <p className="text-xs">Lesson created in Cal.com and Notion.</p>
                  </div>
                </div>
                {sendOnboarding && sendingEmail && (
                  <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 p-4 rounded-xl">
                    <Loader2 size={16} className="animate-spin" />
                    <p className="text-xs font-bold">Sending onboarding email...</p>
                  </div>
                )}
                {sendOnboarding && emailSent && (
                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl">
                    <CheckCircle2 size={18} />
                    <div>
                      <p className="font-bold text-sm">Onboarding Email Sent</p>
                      <p className="text-xs">Welcome message with booking details delivered.</p>
                    </div>
                  </div>
                )}
                {sendOnboarding && !sendingEmail && !emailSent && (
                  <div className="flex items-center gap-3 bg-muted p-4 rounded-xl">
                    <Mail size={16} className="text-muted-foreground" />
                    <p className="text-xs font-bold text-muted-foreground">Preparing onboarding email...</p>
                  </div>
                )}
              </div>
            )}

            {createBooking.isError && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-bold">
                {(createBooking.error as any)?.message || "Booking failed. Please try again."}
              </div>
            )}

            {!createBooking.isSuccess && (
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setStep("slots"); setSelectedSlot(null); }}
                  className="rounded-xl font-bold text-xs"
                  disabled={createBooking.isPending}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={createBooking.isPending}
                  className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-xs gap-2"
                >
                  {createBooking.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Calendar size={14} />
                  )}
                  {createBooking.isPending ? "Booking..." : "Confirm & Book"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {step === "slots" && (
          <div className="px-8 py-4 border-t border-border shrink-0 flex justify-between items-center">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Voice Studio
            </p>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs text-muted-foreground"
            >
              {createBooking.isSuccess ? "Done" : "Cancel"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceQuickBookDialog;
