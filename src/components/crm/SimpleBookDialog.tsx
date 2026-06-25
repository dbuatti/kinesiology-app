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
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Loader2, Calendar, Clock, Check, Music, Search, Mail, CalendarPlus, CheckCircle2
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface VoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface SimpleBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillDate?: string;
  prefillTime?: string;
  prefillStudentId?: string;
}

const EVENT_TYPES = [
  { key: "60", label: "60 min", eventTypeId: "1945081", price: "$95" },
  { key: "45", label: "45 min", eventTypeId: "5925021", price: "$75" },
];

const SimpleBookDialog = ({ open, onOpenChange, prefillDate, prefillTime, prefillStudentId }: SimpleBookDialogProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"details" | "confirm">("details");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<VoiceStudent | null>(null);
  const [date, setDate] = useState(prefillDate || format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState(prefillTime || "10:00");
  const [duration, setDuration] = useState("60");
  const [sendOnboarding, setSendOnboarding] = useState(true);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("details");
      setSelectedStudent(null);
      setStudentSearch("");
      setShowStudentPicker(false);
      setDate(prefillDate || format(addDays(new Date(), 1), "yyyy-MM-dd"));
      setTime(prefillTime || "10:00");
      setDuration("60");
      setSendOnboarding(true);
      setSendingEmail(false);
      setEmailSent(false);
    }
  }, [open, prefillDate, prefillTime]);

  useEffect(() => {
    if (prefillStudentId && students.length > 0 && !selectedStudent) {
      const match = students.find(s => s.id === prefillStudentId);
      if (match) setSelectedStudent(match);
    }
  }, [prefillStudentId, open, students, selectedStudent]);

  const { data: students = [] } = useQuery<VoiceStudent[]>({
    queryKey: ["voice-students"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("voice-clients");
      if (error) throw error;
      return data?.students || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      s => (s.name || "").toLowerCase().includes(q) ||
           (s.email || "").toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const eventType = EVENT_TYPES.find(e => e.key === duration)!;

  const handleSendOnboarding = async () => {
    if (!selectedStudent || !date || !time) return;
    setSendingEmail(true);
    try {
      const dateObj = new Date(date + "T" + time);
      const dateStr = format(dateObj, "MMM d, yyyy");
      const timeStr = format(dateObj, "h:mm a");
      const costVal = parseInt(eventType.price.replace("$", ""));
      const { error } = await supabase.functions.invoke("voice-send-onboarding", {
        body: {
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
          date: dateStr,
          time: timeStr,
          duration,
          cost: costVal,
        },
      });
      if (error) throw error;
      setEmailSent(true);
    } catch (err) {
      console.error("Failed to send onboarding:", err);
    }
    setSendingEmail(false);
  };

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !date || !time) throw new Error("Missing booking details");

      const startTimeIso = new Date(date + "T" + time).toISOString();
      const dateStr = format(new Date(date + "T" + time), "yyyy-MM-dd");
      const timeStr = format(new Date(date + "T" + time), "h:mm a");

      const { data: bookingData, error: bookingError } = await supabase.functions.invoke("voice-create-booking", {
        body: {
          studentName: selectedStudent.name || "Voice Student",
          studentEmail: selectedStudent.email || "",
          startTime: startTimeIso,
          eventTypeId: eventType.eventTypeId,
          title: `Voice Lesson — ${dateStr}`,
          notes: `Booked via Simple Book (${duration} min)`,
        },
      });
      if (bookingError) throw bookingError;

      const costVal = parseInt(eventType.price.replace("$", ""));
      const { data: lessonData, error: lessonError } = await supabase.functions.invoke("voice-schedule-lesson", {
        body: {
          studentId: selectedStudent.id,
          date: dateStr,
          time: timeStr,
          cost: costVal,
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
          calcomBookingUid: bookingData?.uid,
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
      <DialogContent className="sm:max-w-[520px] rounded-[2.5rem] p-0 mx-4 w-[calc(100%-2rem)] flex flex-col max-h-[90vh] bg-background">
        <div className="px-8 pt-8 pb-5 border-b border-border shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <Music size={22} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">
                  {step === "details" ? "Book a Lesson" : "Confirm Booking"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm font-medium">
                  {step === "details" ? "Pick a student, date, and time" : "Review and confirm"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          {/* Student */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Student</p>
            {selectedStudent ? (
              <div className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
                <div>
                  <p className="font-bold text-sm">{selectedStudent.name || "Unnamed"}</p>
                  {selectedStudent.email && (
                    <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedStudent(null); setShowStudentPicker(true); }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStudent(s); setShowStudentPicker(false); setStudentSearch(""); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                    >
                      <p className="font-semibold text-sm">{s.name || "Unnamed"}</p>
                      {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                    </button>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No students found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Duration</p>
            <div className="flex gap-2">
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Time</p>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Confirm step extras */}
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
            </div>
          )}

          {createBooking.isError && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-bold">
              {(createBooking.error as any)?.message || "Booking failed. The slot may already be taken."}
            </div>
          )}

          {/* Onboarding toggle (only before booking) */}
          {!createBooking.isSuccess && selectedStudent && (
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

          {/* Confirmation summary */}
          {!createBooking.isSuccess && selectedStudent && (
            <div className="bg-muted/50 rounded-xl p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Summary</p>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Calendar size={14} className="text-rose-500" />
                {format(new Date(date + "T" + time), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Clock size={14} className="text-rose-500" />
                {format(new Date(date + "T" + time), "h:mm a")} · {eventType.label} · {eventType.price}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border shrink-0 flex justify-between items-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Voice Studio</p>
          <div className="flex gap-2">
            {!createBooking.isSuccess ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl font-bold text-xs text-muted-foreground"
                  disabled={createBooking.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={createBooking.isPending || !selectedStudent || !date || !time}
                  className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-xs gap-2"
                >
                  {createBooking.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CalendarPlus size={14} />
                  )}
                  {createBooking.isPending ? "Booking..." : "Confirm & Book"}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl font-bold text-xs"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleBookDialog;
