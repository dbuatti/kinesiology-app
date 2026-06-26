import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
 ArrowLeft, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, ExternalLink, Mic, User, RotateCcw, Plus
} from "lucide-react";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  eachDayOfInterval, isToday, parseISO, setHours, setMinutes
} from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import WeeklyTimeGrid, {
  CalendarEvent,
  calcSummary,
  EarningsPanel,
} from "@/components/crm/WeeklyTimeGrid";
import WeekByWeekOverview from "@/components/crm/WeekByWeekOverview";
import BookingsList from "@/components/crm/BookingsList";
import SimpleBookDialog from "@/components/crm/SimpleBookDialog";
import QuickBookDialog from "@/components/crm/QuickBookDialog";
import ShareAvailabilityButton from "@/components/crm/ShareAvailabilityButton";
import { useEventPricing } from "@/hooks/useEventPricing";
import { supabase } from "@/integrations/supabase/client";
import { CALCOM_CONFIG } from "@/config/integrations";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/components/AuthProvider";
import { formatVoiceTime } from "@/utils/availability";

interface VoiceLesson {
 id: string;
 notionUrl: string | null;
 name: string | null;
 date: string | null;
 time: string | null;
 studentName: string | null;
 studentEmail: string | null;
 paymentStatus: string | null;
}

interface VoiceBookingRow {
 calcom_booking_id: string;
 student_email: string;
 lesson_date: string;
 status: string;
 notion_lesson_id_1: string | null;
 notion_lesson_id_2: string | null;
}

interface KinesiologyAppt {
 id: string;
 date: string;
 clientName: string | null;
 clientId: string | null;
 status: string | null;
 tag: string | null;
 time: string | null;
 priceAmount: number | null;
 standardRate: number | null;
 paymentReceived: boolean;
 isPaid: boolean;
 calcomUid: string | null;
 calcomEventTypeId: number | null;
}

interface CalendarItem {
 id: string;
 source: "kinesiology" | "voice";
 date: string;
 time: string | null;
 title: string;
 subtitle: string | null;
 url: string | null;
 tag: string | null;
 priceAmount?: number | null;
 standardRate?: number | null;
 // payment + action payload (used by the compact Bookings list)
 datetime?: string;
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

function parseTimeToEvent(item: CalendarItem): CalendarEvent | null {
  const timeStr = item.time || "";
  const startMatch = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!startMatch) return null;
  let startH = parseInt(startMatch[1]);
  const startM = parseInt(startMatch[2]);
  if (startMatch[3].toUpperCase() === "PM" && startH !== 12) startH += 12;
  if (startMatch[3].toUpperCase() === "AM" && startH === 12) startH = 0;

  let endH: number;
  let endM: number;
  const endMatch = timeStr.match(/–\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (endMatch) {
    endH = parseInt(endMatch[1]);
    endM = parseInt(endMatch[2]);
    if (endMatch[3].toUpperCase() === "PM" && endH !== 12) endH += 12;
    if (endMatch[3].toUpperCase() === "AM" && endH === 12) endH = 0;
  } else {
    const nameLower = (item.title || "").toLowerCase();
    const is45 = /45\s*min|45min|45m/.test(nameLower) || /\b45\b/.test(nameLower);
    const durMin = is45 ? 45 : 60;
    endH = startH + Math.floor((startM + durMin) / 60);
    endM = (startM + durMin) % 60;
  }

  const itemDate = new Date(item.date);

  return {
    id: item.id,
    dayIndex: itemDate.getDay(),
    startMin: startH * 60 + startM,
    endMin: endH * 60 + endM,
    title: item.subtitle || item.title,
    subtitle: item.time,
    url: item.url,
    variant: item.source === "voice" ? "voice" as const : "kinesiology" as const,
    priceAmount: item.priceAmount ?? null,
    standardRate: item.standardRate ?? null,
    clientId: item.clientId ?? null,
  };
}

// Bookable services for the slot-click flow (Week/Overview calendars).
const SLOT_SERVICES = [
  { key: "voice60", group: "Voice", label: "Voice & Piano — 60 min", kind: "voice", duration: "60" },
  { key: "voice45", group: "Voice", label: "Voice & Piano — 45 min", kind: "voice", duration: "45" },
  { key: "fnhCurrent", group: "FNH", label: "Current rate", kind: "fnh", eventTypeId: "4279898" as const, price: undefined as number | undefined },
  { key: "fnhNew", group: "FNH", label: "New client · $70", kind: "fnh", eventTypeId: "4279898" as const, price: 70 },
  { key: "fnhFree", group: "FNH", label: "FNH Community · Free", kind: "fnh", eventTypeId: "5927215" as const, price: 0 },
] as const;

const UnifiedCalendarPage = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "month" | "week" | "overview">("list");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [bookSlot, setBookSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [bookClient, setBookClient] = useState<string | null>(null);
  // One-stop "New Booking" entry points
  const [voiceBookOpen, setVoiceBookOpen] = useState(false);
  const [voicePrefillDuration, setVoicePrefillDuration] = useState<string>("60");
  const [voicePrefillDate, setVoicePrefillDate] = useState<string | undefined>(undefined);
  const [voicePrefillTime, setVoicePrefillTime] = useState<string | undefined>(undefined);
  const [fnhPickOpen, setFnhPickOpen] = useState(false);
  const [fnhClientId, setFnhClientId] = useState<string | null>(null);
  const [fnhPrefillPrice, setFnhPrefillPrice] = useState<number>(70);
  // Slot-click flow (Week/Overview): chosen service for the clicked slot
  const [bookSvc, setBookSvc] = useState<string | null>(null);

  const openVoiceBooking = (duration: string, date?: string, time?: string) => {
    setVoicePrefillDuration(duration);
    setVoicePrefillDate(date);
    setVoicePrefillTime(time);
    setVoiceBookOpen(true);
  };

  const handleNewBooking = (service: string) => {
    if (service === "voice60") openVoiceBooking("60");
    else if (service === "voice45") openVoiceBooking("45");
    else if (service === "fnhCurrent") { setFnhPrefillPrice(70); setFnhPickOpen(true); }
    else if (service === "fnhNew") { setFnhPrefillPrice(70); setFnhPickOpen(true); }
    else if (service === "fnhFree") { setFnhPrefillPrice(0); setFnhPickOpen(true); }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const prevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setWeekStart(startOfWeek(new Date()));
  };

 const monthStart = startOfMonth(currentMonth);
 const monthEnd = endOfMonth(monthStart);
 const startDate = startOfWeek(monthStart);
 const endDate = endOfWeek(monthEnd);

 const fetchStart = subMonths(startDate, 1).toISOString();
 const fetchEnd = addMonths(endDate, 1).toISOString();

 const { data: voiceLessons, isLoading: voiceLoading, isError: voiceError, refetch: refetchVoice } = useQuery({
 queryKey: ["unified-voice-lessons", currentMonth.toISOString()],
 queryFn: async () => {
 const res = await supabase.functions.invoke("voice-lessons");
 if (res.error) throw res.error;
 return (res.data?.lessons || []) as VoiceLesson[];
 },
 staleTime: 60_000,
 });

 const { data: kinesiologyAppts, isLoading: kinesiologyLoading, isError: kinesiologyError, refetch: refetchKinesiology } = useQuery({
 queryKey: ["unified-kinesiology-appts", currentMonth.toISOString()],
 queryFn: async () => {
 const { data } = await supabase
 .from("appointments")
 .select("id, date, status, tag, price_amount, is_paid, payment_received, calcom_booking_id, calcom_event_type_id, client_id, clients (name, is_practitioner, standard_rate)")
 .gte("date", fetchStart)
 .lte("date", fetchEnd)
 .order("date", { ascending: true });
 return (data || [])
   .filter((a: any) => !(a.clients?.is_practitioner))
   .map((a: any) => ({
 id: a.id,
 date: a.date,
 clientName: a.clients?.name || "Unknown",
 clientId: a.client_id ?? null,
 status: a.status,
 tag: a.tag,
 time: null,
 priceAmount: a.price_amount ?? null,
 standardRate: a.clients?.standard_rate ?? null,
 paymentReceived: a.payment_received === true,
 isPaid: a.is_paid === true,
 calcomUid: a.calcom_booking_id ?? null,
 calcomEventTypeId: a.calcom_event_type_id ?? null,
})) as KinesiologyAppt[];
 },
  staleTime: 60_000,
  });

  // Voice bookings carry the Cal.com uid + Notion ids needed for cancel/reschedule.
  const { data: voiceBookings, refetch: refetchVoiceBookings } = useQuery({
    queryKey: ["unified-voice-bookings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("voice_bookings")
        .select("calcom_booking_id, student_email, lesson_date, status, notion_lesson_id_1, notion_lesson_id_2");
      return (data || []) as VoiceBookingRow[];
    },
    staleTime: 60_000,
  });

  // Voice prices come from the editable event_pricing table (Settings → Pricing),
  // kept separate from the client rate ladder used for FNH.
  const { priceFor, pricing } = useEventPricing();

  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["overview-clients"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name, is_practitioner, standard_rate")
        .eq("is_practitioner", false)
        .order("name", { ascending: true });
      return data || [];
    },
    staleTime: 300_000,
  });

  const bookMutation = useMutation({
    mutationFn: async ({ clientId, date, eventTypeId, price }: { clientId: string; date: Date; eventTypeId?: string; price?: number }) => {
      const isoTime = date.toISOString();
      // Use the price/event type chosen in the slot dialog; fall back to the
      // client's standing rate (then $50) when not specified.
      const client = (clients || []).find((c: any) => c.id === clientId);
      const rate = price !== undefined ? price : (client?.standard_rate ?? 50);
      const isPaidSession = rate > 0;
      const { data: calcomData, error: invokeError } = await supabase.functions.invoke(
        "create-calcom-booking",
        {
          body: {
            clientId,
            startTime: isoTime,
            eventTypeId: eventTypeId || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
            title: `FNH Session — ${format(date, "MMM d, yyyy")}`,
            notes: "",
            is_paid: isPaidSession,
          },
        }
      );
      if (invokeError) throw invokeError;
      const calcomId = calcomData?.uid || calcomData?.bookingId || null;
      const { data: newApp, error: dbError } = await supabase
        .from("appointments")
        .upsert({
          user_id: session?.user?.id,
          client_id: clientId,
          date: isoTime,
          tag: "Kinesiology",
          status: "Scheduled",
          is_paid: isPaidSession,
          calcom_booking_id: calcomId,
          calcom_event_type_id: eventTypeId ? parseInt(eventTypeId, 10) : (CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID ? parseInt(CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID, 10) : null),
          price_amount: rate,
          price_currency: "AUD",
          name: `Session — ${format(date, "MMM d, yyyy")}`,
        }, { onConflict: calcomId ? "calcom_booking_id" : "id" })
        .select("id")
        .single();
      if (dbError) throw dbError;
      // Send payment link for paid sessions. Only include intake CTA if client
      // hasn't already submitted it (the edge function checks isIntakeFormFilled).
      if (isPaidSession && newApp?.id) {
        try {
          await supabase.functions.invoke("send-manual-onboarding", {
            body: { clientId, appointmentId: newApp.id, force: true },
          });
        } catch (err) {
          console.error("Failed to send payment email:", err);
        }
      }
      return newApp;
    },
    onSuccess: () => {
      showSuccess("Session booked & payment link sent.");
      queryClient.invalidateQueries({ queryKey: ["unified-kinesiology-appts"] });
      refetchKinesiology();
      setBookSlot(null);
      setBookClient(null);
      setBookSvc(null);
    },
    onError: (err: any) => {
      showError(err.message || "Failed to book session");
    },
  });

  const calendarItems: CalendarItem[] = useMemo(() => {
 const items: CalendarItem[] = [];

  (voiceLessons || []).forEach((l) => {
  if (!l.date) return;
  const booking = (voiceBookings || []).find(
    (b) => b.lesson_date === l.date && b.student_email === l.studentEmail
  );
  const is45 = /45/.test((l.name || "").toLowerCase());
  // Voice paid signal comes from Notion's Payment property OR a voice_bookings row
  // marked paid (covers Stripe + manually-recorded external payments).
  // NB: must exclude "Unpaid" — a naive /paid/ test matches it.
  const ps = (l.paymentStatus || "").toLowerCase();
  const voicePaid = (ps.includes("paid") && !ps.includes("unpaid")) || booking?.status === "paid";
  items.push({
  id: `v-${l.id}`,
  source: "voice",
  date: l.date,
  datetime: l.date,
  time: l.date && l.time ? formatVoiceTime(l.date, l.time) : null,
  title: l.name || "Voice Lesson",
  subtitle: l.studentName || null,
  url: l.notionUrl || null,
  tag: "voice",
  status: booking?.status ?? null,
  cancelled: booking?.status === "cancelled",
  paid: voicePaid,
  isFree: false,
  // Read voice price from event_pricing (Voice 45 = 5925021, Voice 60 = 1945081),
  // falling back to the prior defaults if the table has no row.
  amount: priceFor(is45 ? "5925021" : "1945081") ?? (is45 ? 75 : 95),
  calcomUid: booking?.calcom_booking_id ?? null,
  notionLessonId1: booking?.notion_lesson_id_1 ?? null,
  notionLessonId2: booking?.notion_lesson_id_2 ?? null,
  eventTypeId: is45 ? "5925021" : "1945081",
  lessonId: l.id,
  studentEmail: l.studentEmail,
  studentName: l.studentName,
  });
  });

  (kinesiologyAppts || []).forEach((a) => {
  const appDate = new Date(a.date);
  // Charge the client's CURRENT rate (from Client Audit / standard_rate) — this is
  // what "Send payment link" bills. Falls back to any per-appointment price.
  const currentRate = (a.standardRate && a.standardRate > 0) ? a.standardRate : (a.priceAmount && a.priceAmount > 0 ? a.priceAmount : 0);
  // Free only when the effective rate is $0 — a client's standard_rate always
  // takes precedence over the Cal.com event type used at booking time.
  const isFree = currentRate === 0;
  items.push({
  id: `k-${a.id}`,
  source: "kinesiology",
  date: format(appDate, 'yyyy-MM-dd'),
  datetime: a.date,
  time: format(appDate, 'h:mm a'),
  title: a.clientName || "Appointment",
 subtitle: null,
 url: `/appointments/${a.id}`,
 tag: a.tag || a.status || "Kinesiology",
 priceAmount: a.priceAmount,
 standardRate: a.standardRate,
 status: a.status,
 cancelled: (a.status || "").toLowerCase() === "cancelled",
 paid: a.paymentReceived,
 isFree,
 amount: isFree ? null : (currentRate || null),
 calcomUid: a.calcomUid,
 clientId: a.clientId,
 appointmentId: a.id,
 eventTypeId: CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
 });
 });

  items.sort((a, b) => {
  const dateCmp = a.date.localeCompare(b.date);
  if (dateCmp !== 0) return dateCmp;
  const parseStart = (t: string) => {
  const m = t.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + min;
  };
  return parseStart(a.time || "") - parseStart(b.time || "");
  });
  return items;
  }, [voiceLessons, kinesiologyAppts, voiceBookings, pricing]);

  const weeklyEvents: CalendarEvent[] = useMemo(() => {
  const ws = startOfWeek(weekStart);
  const we = endOfWeek(weekStart);
  return calendarItems
    .filter((item) => item.time && new Date(item.date) >= ws && new Date(item.date) <= we)
    .map(parseTimeToEvent)
    .filter((e): e is CalendarEvent => e !== null);
  }, [calendarItems, weekStart]);

  const monthlyEvents: CalendarEvent[] = useMemo(() => {
    return calendarItems
      .filter((item) => item.time && new Date(item.date) >= monthStart && new Date(item.date) <= monthEnd)
      .map(parseTimeToEvent)
      .filter((e): e is CalendarEvent => e !== null);
  }, [calendarItems, monthStart, monthEnd]);

  const monthlySummary = useMemo(
    () => calcSummary(monthlyEvents, 95, 50),
    [monthlyEvents]
  );

  const getItemsForDay = (day: Date) =>
  calendarItems.filter((item) => isSameDay(new Date(item.date), day));

 const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
 const isLoading = voiceLoading || kinesiologyLoading;
 const hasError = voiceError || kinesiologyError;

 if (hasError) {
 return (
<AppLayout variant="workspace">
 <div className="space-y-8 max-w-7xl mx-auto">
 <PageHeader
 title="Calendar"
 subtitle="Kinesiology appointments and voice lessons at a glance."
           icon={CalendarIcon}
           />
 <div className="p-24 flex flex-col items-center justify-center gap-6 bg-destructive/10 rounded-xl">
 <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
 <span className="text-2xl font-semibold text-destructive">!</span>
 </div>
 <p className="text-destructive font-semibold text-xs uppercase tracking-wider text-center">Failed to load calendar data</p>
 <Button
 onClick={() => { refetchVoice(); refetchKinesiology(); }}
 className="bg-destructive hover:bg-destructive/80 rounded-xl font-medium text-xs"
 >
 <RotateCcw size={14} className="mr-2" /> Retry
 </Button>
 </div>
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout variant="workspace">
 <div className="space-y-8 max-w-7xl mx-auto">
 <PageHeader
 title="Calendar"
 subtitle="Kinesiology appointments and voice lessons at a glance."
  icon={CalendarIcon}
  iconClassName="bg-primary text-white "
  actions={
 <div className="flex gap-2 items-center">
 <ShareAvailabilityButton />
 <Button
 variant="outline"
 size="sm"
 onClick={() => navigate(-1)}
 className="h-10 px-4 rounded-xl border-border font-medium text-[10px] uppercase tracking-wider gap-2"
 >
 <ArrowLeft size={14} />
 Back
 </Button>
 </div>
 }
 />

 {isLoading ? (
 <div className="p-24 flex flex-col items-center justify-center gap-6">
 <Loader2 className="animate-spin text-primary" size={48} />
 <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
 Loading calendar...
 </p>
 </div>
 ) : (

 <div className="flex gap-4 items-start">

   <div className="flex-1 min-w-0">

   {/* Shared view toggle */}
   <div className="flex items-center justify-between mb-4">
     <div className="flex bg-muted rounded-xl p-0.5 border border-border">
       <button
         onClick={() => setViewMode("list")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "list"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         List
       </button>
       <button
         onClick={() => setViewMode("month")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "month"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         Month
       </button>
       <button
         onClick={() => setViewMode("week")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "week"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         Week
       </button>
       <button
         onClick={() => setViewMode("overview")}
         className={cn(
           "px-4 py-2 rounded-[10px] text-xs font-semibold transition-all",
           viewMode === "overview"
           ? "bg-card text-foreground shadow-sm"
           : "text-muted-foreground hover:text-foreground"
         )}
       >
         Overview
       </button>
     </div>
   </div>

   {viewMode === "list" ? (

   <BookingsList
     items={calendarItems}
     onChanged={() => { refetchVoice(); refetchKinesiology(); refetchVoiceBookings(); }}
     onNewBooking={handleNewBooking}
   />

   ) : viewMode === "month" ? (

   <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-500">
   {/* Legend */}
   <div className="px-8 pt-6 pb-0 flex flex-wrap items-center gap-x-6 gap-y-2">
   <div className="flex items-center gap-2">
   <div className="w-3 h-3 rounded-full bg-primary" />
   <span className="text-[10px] font-medium text-muted-foreground">Kinesiology</span>
   </div>
   <div className="flex items-center gap-2">
   <div className="w-3 h-3 rounded-full bg-destructive" />
   <span className="text-[10px] font-medium text-muted-foreground">Voice Studio</span>
   </div>
   <div className="w-px h-3 bg-border" />
   <div className="flex items-center gap-1.5">
   <span className="w-2 h-2 rounded-full bg-chart-emerald" />
   <span className="text-[10px] font-medium text-muted-foreground">Paid</span>
   </div>
   <div className="flex items-center gap-1.5">
   <span className="w-2 h-2 rounded-full bg-amber-500" />
   <span className="text-[10px] font-medium text-muted-foreground">Unpaid</span>
   </div>
   <div className="flex items-center gap-1.5">
   <span className="w-2 h-2 rounded-full bg-slate-400" />
   <span className="text-[10px] font-medium text-muted-foreground">Free</span>
   </div>
   </div>

   {/* Calendar Header */}
   <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
   <div>
   <h2 className="text-3xl font-semibold text-foreground tracking-tight">
   {format(currentMonth, "MMMM yyyy")}
   </h2>
   <p className="text-muted-foreground font-medium text-sm mt-1">
   {calendarItems.length} item{calendarItems.length !== 1 ? "s" : ""} scheduled
   </p>
   </div>
   <div className="flex gap-2 items-center">
   <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl h-12 w-12">
   <ChevronLeft size={24} />
   </Button>
   <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl h-12 w-12">
   <ChevronRight size={24} />
   </Button>
   </div>
   </div>

   {/* Days of Week */}
   <div className="grid grid-cols-7 border-b border-border">
   {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
   <div
   key={day}
   className="py-4 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
   >
   {day}
   </div>
   ))}
   </div>

   {/* Calendar Grid */}
   <div className="grid grid-cols-7">
   {calendarDays.map((day) => {
   const dayItems = getItemsForDay(day);
   const isCurrent = isSameMonth(day, monthStart);
   const isCurrentDay = isToday(day);
   const voiceCount = dayItems.filter((i) => i.source === "voice").length;
   const kinesiologyCount = dayItems.filter((i) => i.source === "kinesiology").length;

   const dayIncome = dayItems.reduce((sum, item) => {
     if (item.source === "kinesiology") {
       return sum + (item.standardRate ?? item.priceAmount ?? 50);
     }
     const timeStr = item.time || "";
     const hasEnd = /–/.test(timeStr);
     const nameLower = (item.title || "").toLowerCase();
     const is45 = /45/.test(nameLower);
     return sum + (hasEnd ? (is45 ? 75 : 95) : 95);
   }, 0);

   return (
   <div
   key={day.toString()}
   className={cn(
   "min-h-[130px] p-3 border-r border-b border-border/50 transition-colors",
   !isCurrent && "bg-muted/20 opacity-40",
   isCurrentDay && "bg-chart-primary/5 ring-1 ring-inset ring-primary/20"
   )}
   >
   <div className="flex justify-between items-start mb-2">
   <span
   className={cn(
   "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
   isCurrentDay
   ? "bg-primary text-white shadow-sm "
   : "text-muted-foreground"
   )}
   >
   {format(day, "d")}
   </span>
   {dayItems.length > 0 && (
   <div className="flex gap-1">
   {kinesiologyCount > 0 && (
   <Badge className="bg-chart-primary/10 text-chart-primary border-none text-[10px] font-semibold">
   {kinesiologyCount}
   </Badge>
   )}
   {voiceCount > 0 && (
   <Badge className="bg-chart-destructive/10 text-chart-destructive border-none text-[10px] font-semibold">
   {voiceCount}
   </Badge>
   )}
   </div>
   )}
   </div>

   {dayItems.length > 0 && (
   <div className="text-[9px] font-bold text-chart-emerald mb-1">
     ${dayIncome}
   </div>
   )}

    <div className="space-y-1">
    {dayItems.map((item) => (
    <Tooltip key={item.id}>
    <TooltipTrigger asChild>
     {item.url ? (
     <a
     href={item.url}
     target={item.source === "voice" ? "_blank" : undefined}
     rel={item.source === "voice" ? "noopener noreferrer" : undefined}
     onClick={!item.source || item.source === "kinesiology" ? (e) => { e.preventDefault(); navigate(item.url!); } : undefined}
     className={cn(
    "block p-1.5 rounded-lg text-[10px] font-medium truncate transition-all hover:scale-[1.02] border",
    item.source === "voice"
    ? "bg-chart-destructive/10 text-chart-destructive border-border "
    : "bg-chart-primary/10 text-chart-primary border-border "
    )}
    >
    <div className="flex items-center gap-1">
    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.isFree ? "bg-slate-400" : item.paid ? "bg-chart-emerald" : "bg-amber-500")} />
    {item.source === "voice" ? (
    <Mic size={9} className="shrink-0 opacity-60" />
    ) : (
    <User size={9} className="shrink-0 opacity-60" />
    )}
    {item.source === "kinesiology" && item.clientId ? (
    <span
      className="truncate cursor-pointer hover:underline"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/clients/${item.clientId}`); }}
    >
      {item.title}
    </span>
    ) : (
    <span className="truncate">{item.title}</span>
    )}
    {item.time && <span className="text-[9px] opacity-60 shrink-0 ml-0.5">{item.time}</span>}
    </div>
    </a>
    ) : (
    <div
    className={cn(
    "block p-1.5 rounded-lg text-[10px] font-medium truncate border",
    item.source === "voice"
    ? "bg-chart-destructive/10 text-chart-destructive border-border "
    : "bg-chart-primary/10 text-chart-primary border-border "
    )}
    >
    <div className="flex items-center gap-1">
    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.isFree ? "bg-slate-400" : item.paid ? "bg-chart-emerald" : "bg-amber-500")} />
    {item.source === "voice" ? (
    <Mic size={9} className="shrink-0 opacity-60" />
    ) : (
    <User size={9} className="shrink-0 opacity-60" />
    )}
    <span className="truncate">{item.title}</span>
    {item.time && <span className="text-[9px] opacity-60 shrink-0 ml-0.5">{item.time}</span>}
    </div>
    </div>
    )}
    </TooltipTrigger>
   <TooltipContent className="rounded-xl p-3 shadow-sm border-none w-64 bg-popover">
   <div className="space-y-2">
   <p className="font-semibold text-foreground text-sm">{item.title}</p>
   <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
   <CalendarIcon size={10} />
   {format(new Date(item.date), "EEE, MMM d, yyyy")}
   {item.time && (
   <>
   <span className="opacity-40">·</span>
   <Clock size={10} />
   {item.time}
   </>
   )}
   </div>
   {item.subtitle && (
   <div className="text-[10px] text-muted-foreground font-medium">
   {item.source === "voice" ? "Student" : "Client"}: {item.subtitle}
   </div>
   )}
   <div className="flex items-center gap-1.5 flex-wrap">
   <Badge
   className={cn(
   "text-[10px] font-semibold border-none",
   item.source === "voice"
   ? "bg-chart-destructive/10 text-chart-destructive "
   : "bg-chart-primary/10 text-chart-primary "
   )}
   >
   {item.source === "voice" ? "Voice" : item.tag || "Kinesiology"}
   </Badge>
   <Badge className={cn("text-[10px] font-semibold border-none",
     item.isFree ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
     : item.paid ? "bg-chart-emerald/10 text-chart-emerald"
     : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")}>
   {item.isFree ? "Free" : item.paid ? `Paid · $${item.amount ?? ""}` : `Unpaid · $${item.amount ?? ""}`}
   </Badge>
   </div>
   {item.url && item.source === "voice" && (
   <div className="flex items-center gap-1 text-[10px] text-destructive">
   <ExternalLink size={10} /> Open in Notion
   </div>
   )}
   </div>
   </TooltipContent>
   </Tooltip>
   ))}

   </div>
   </div>
   );
   })}
   </div>
   </div>

    ) : viewMode === "week" ? (

    <WeeklyTimeGrid
      events={weeklyEvents}
      weekStart={weekStart}
      onPrevWeek={prevWeek}
      onNextWeek={nextWeek}
      onToday={() => { goToToday(); }}
      minHour={9}
      maxHour={17}
      fnhRatePerHour={50}
      onSlotClick={(date, hour) => setBookSlot({ date, hour })}
    />

    ) : (

    <WeekByWeekOverview
      weekStart={weekStart}
      voiceLessons={voiceLessons || []}
      kinesiologyAppts={kinesiologyAppts || []}
      onPrevWeek={prevWeek}
      onNextWeek={nextWeek}
      onToday={() => { goToToday(); }}
    />

    )}

   </div>

    {viewMode !== "overview" && viewMode !== "list" && (
    <div className="w-24 shrink-0 flex flex-col items-center gap-6 pt-2">
      <EarningsPanel
        summary={monthlySummary}
        voiceRate={95}
        fnhRate={50}
        label="This Month"
      />
    </div>
  )}

  </div>

  )}

  {/* One-stop New Booking: Voice */}
  <SimpleBookDialog
    open={voiceBookOpen}
    onOpenChange={(o) => { setVoiceBookOpen(o); if (!o) { setVoicePrefillDate(undefined); setVoicePrefillTime(undefined); } }}
    prefillDuration={voicePrefillDuration}
    prefillDate={voicePrefillDate}
    prefillTime={voicePrefillTime}
  />

  {/* One-stop New Booking: FNH — pick a client, then the booking dialog */}
  <Dialog open={fnhPickOpen} onOpenChange={(open) => { if (!open) setFnhPickOpen(false); }}>
    <DialogContent className="sm:max-w-[440px] rounded-2xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col bg-background">
      <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-chart-primary text-white flex items-center justify-center shadow-sm">
            <User size={20} />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">New FNH Booking</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">Choose a client to book a session for.</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="px-6 py-5">
        <div className="max-h-72 overflow-y-auto space-y-1.5">
          {(clients || []).map((c: any) => (
            <button
              key={c.id}
              onClick={() => { setFnhClientId(c.id); setFnhPickOpen(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-chart-primary/40 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-chart-primary/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-chart-primary" />
              </div>
              <span className="text-sm font-medium truncate">{c.name}</span>
            </button>
          ))}
          {(clients || []).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <QuickBookDialog
    clientId={fnhClientId}
    open={!!fnhClientId}
    prefillPrice={fnhPrefillPrice}
    onOpenChange={(open) => { if (!open) setFnhClientId(null); }}
    onSuccess={() => { setFnhClientId(null); refetchKinesiology(); }}
  />

  {bookSlot && (
    <Dialog open onOpenChange={(open) => { if (!open) { setBookSlot(null); setBookClient(null); setBookSvc(null); } }}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col bg-background">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <Plus size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {bookSvc ? "Select Client" : "New Booking"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                {format(setMinutes(setHours(bookSlot.date, bookSlot.hour), 0), "EEE, MMM d 'at' h:mm a")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1 — choose what to book */}
        {!bookSvc ? (
          <div className="px-6 py-5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Choose appointment</p>
            {SLOT_SERVICES.map((s) => {
              const isVoice = s.kind === "voice";
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    if (isVoice) {
                      const dateStr = format(bookSlot.date, "yyyy-MM-dd");
                      const timeStr = `${String(bookSlot.hour).padStart(2, "0")}:00`;
                      setBookSlot(null);
                      openVoiceBooking((s as any).duration, dateStr, timeStr);
                    } else {
                      setBookSvc(s.key);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border transition-all text-left",
                    isVoice ? "hover:border-chart-destructive/40" : "hover:border-chart-primary/40"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isVoice ? "bg-chart-destructive/10 text-chart-destructive" : "bg-chart-primary/10 text-chart-primary")}>
                    {isVoice ? <Mic size={15} /> : <User size={15} />}
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Select Client</p>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {(clients || []).map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setBookClient(c.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                        bookClient === c.id ? "border-chart-primary bg-chart-primary/5" : "border-border hover:border-chart-primary/30"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User size={14} className="text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </button>
                  ))}
                  {(clients || []).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2 border-t border-border flex gap-2">
              <Button variant="outline" onClick={() => { setBookSvc(null); setBookClient(null); }} className="h-12 rounded-xl font-semibold text-sm">
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!bookSlot || !bookClient) return;
                  const svc = SLOT_SERVICES.find((s) => s.key === bookSvc) as any;
                  const date = setMinutes(setHours(bookSlot.date, bookSlot.hour), 0);
                  bookMutation.mutate({ clientId: bookClient, date, eventTypeId: svc?.eventTypeId, price: svc?.price });
                }}
                disabled={!bookClient || bookMutation.isPending}
                className="flex-1 h-12 rounded-xl font-semibold text-sm"
              >
                {bookMutation.isPending ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Booking…</>
                ) : (
                  <><Plus size={16} className="mr-2" /> Book Session</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )}

  </div>
  </AppLayout>
  );
};

export default UnifiedCalendarPage;
