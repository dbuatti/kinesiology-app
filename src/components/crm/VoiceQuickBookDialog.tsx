import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfDay, isSameDay, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Loader2, Calendar, Clock, Check, ChevronLeft, ChevronRight,
  Music, ArrowLeft, ExternalLink
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

const DAYS_TO_SHOW = 14;

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
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("slots");
      setSelectedSlot(null);
      setSelectedDate(null);
      setWeekOffset(0);
      setAutoAdvanced(false);
    }
  }, [open]);

  const eventType = EVENT_TYPES.find((e) => e.key === duration)!;

  const startDate = startOfWeek(addDays(new Date(), weekOffset * 7 + 1), { weekStartsOn: 1 });
  const endDate = endOfDay(addDays(startDate, DAYS_TO_SHOW - 1));

  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ["voice-available-slots", duration, weekOffset, student?.id],
    queryFn: async () => {
      const res = await supabase.functions.invoke("get-calcom-slots", {
        body: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
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

  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i));

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

      const { error: lessonError } = await supabase.functions.invoke("voice-schedule-lesson", {
        body: {
          studentId: student.id,
          date: dateStr,
          time: timeStr,
          cost: parseInt(eventType.price.replace("$", "")),
        },
      });
      if (lessonError) throw lessonError;

      return bookingData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["voice-students"] });
    },
  });

  const isSlotBooked = (time: string) => {
    const dateKey = format(parseISO(time), "yyyy-MM-dd");
    return Object.values(bookings).flat().some((b) => b.start === time);
  };

  const slotsForDate = (date: Date): Slot[] => {
    const key = format(date, "yyyy-MM-dd");
    return (slotsByDate[key] || []).filter((s) => !isSlotBooked(s.time));
  };

  // Auto-advance to next period if current has no slots
  useEffect(() => {
    if (slotsData && weekOffset === 0 && !autoAdvanced) {
      const hasSlots = dates.some((d) => slotsForDate(d).length > 0);
      if (!hasSlots) {
        setAutoAdvanced(true);
        setWeekOffset(1);
      }
    }
  }, [slotsData, weekOffset, autoAdvanced]);

  const handleSelectSlot = (slot: Slot, date: Date) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
    setStep("confirm");
  };

  const handleConfirm = () => {
    createBooking.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 bg-white dark:bg-gray-950">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              {step === "confirm" && (
                <button
                  onClick={() => setStep("slots")}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <DialogTitle className="text-2xl font-black">
                  {step === "slots" ? "Quick Book Session" : "Confirm Booking"}
                </DialogTitle>
                <DialogDescription className="font-medium">
                  {student?.name ? `Schedule for ${student.name}` : "Schedule a voice lesson"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Duration toggle */}
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl mb-6 w-fit">
            {EVENT_TYPES.map((et) => (
              <button
                key={et.key}
                onClick={() => { setDuration(et.key); setSelectedSlot(null); setStep("slots"); }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all",
                  duration === et.key
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Music size={14} />
                {et.label}
                <span className="font-black">{et.price}</span>
              </button>
            ))}
          </div>

          {step === "slots" && (
            <>
              {/* Week nav */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className="h-8 px-2 rounded-lg"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {format(startDate, "MMM d")} — {format(endDate, "MMM d, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="h-8 px-2 rounded-lg"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-rose-500" size={32} />
                </div>
              ) : slotsError ? (
                <div className="text-center py-16">
                  <p className="text-sm font-bold text-red-500">Failed to load availability</p>
                  <p className="text-xs text-muted-foreground mt-1">Try refreshing or selecting a different duration.</p>
                </div>
              ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {dates.map((date) => {
                      const slots = slotsForDate(date);
                      if (slots.length === 0) return null;

                      return (
                        <div key={date.toString()}>
                          <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card pt-1 pb-1 z-10">
                            <Calendar size={13} className="text-rose-500" />
                            <span className="font-black text-xs">{format(date, "EEEE, MMM d")}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-5 pb-2">
                            {slots.map((slot) => {
                              const time = format(parseISO(slot.time), "h:mm a");
                              return (
                                <button
                                  key={slot.time}
                                  onClick={() => handleSelectSlot(slot, date)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                    "hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20",
                                    selectedSlot?.time === slot.time
                                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600"
                                      : "border-border text-foreground"
                                  )}
                                >
                                  <Clock size={10} className="inline mr-1" />
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                      </div>
                    );
                  })}
                  {autoAdvanced && dates.every((d) => slotsForDate(d).length === 0) && <p className="text-center text-xs text-muted-foreground py-8">No availability in the coming weeks.</p>}
                </div>
              )}
            </>
          )}

          {step === "confirm" && selectedSlot && selectedDate && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                    <Calendar size={18} className="text-rose-600" />
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

              {createBooking.isSuccess && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl">
                  <Check size={18} />
                  <div>
                    <p className="font-bold text-sm">Booked!</p>
                    <p className="text-xs">Lesson created in Cal.com and Notion.</p>
                  </div>
                </div>
              )}

              {createBooking.isError && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-bold">
                  {(createBooking.error as any)?.message || "Booking failed. Please try again."}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs"
              disabled={createBooking.isPending}
            >
              {createBooking.isSuccess ? "Done" : "Cancel"}
            </Button>
            {step === "confirm" && !createBooking.isSuccess && (
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
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceQuickBookDialog;
