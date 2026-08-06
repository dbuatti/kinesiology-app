import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, ExternalLink, Mic, User, RotateCcw, Plus, BookOpen, Search, CheckCircle2, CreditCard, Circle, Gift
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
import BookingsList, { type BookingListItem } from "@/components/crm/BookingsList";
import SimpleBookDialog from "@/components/crm/SimpleBookDialog";
import QuickBookDialog from "@/components/crm/QuickBookDialog";
import ShareAvailabilityButton from "@/components/crm/ShareAvailabilityButton";
import { useEventPricing } from "@/hooks/useEventPricing";
import { supabase } from "@/integrations/supabase/client";
import { CALCOM_CONFIG } from "@/config/integrations";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/components/AuthProvider";
import { formatVoiceTime, voiceTimeDuration, voiceDateISO } from "@/utils/availability";
import { convertVoiceToAppointment } from "@/utils/voiceToFnh";

interface VoiceLesson {
  id: string;
  notionUrl: string | null;
  name: string | null;
  date: string | null;
  time: string | null;
  studentName: string | null;
  studentEmail: string | null;
  paymentStatus: string | null;
  cost: number | null;
  priceAmount: number | null;
  discipline?: string | null;
}

interface VoiceBookingRow {
  calcom_booking_id: string;
  student_email: string;
  student_name: string | null;
  lesson_date: string;
  lesson_time: string | null;
  cost: number | null;
  status: string;
  discipline?: string | null;
  notion_lesson_id_1: string | null;
  notion_lesson_id_2: string | null;
  series_id?: string | null;
  series_frequency?: string | null;
  series_occurrence?: number | null;
  series_total?: number | null;
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
  notionLink: string | null;
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
  discipline?: string | null;
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
  notionLink?: string | null;
  seriesId?: string | null;
  seriesFrequency?: string | null;
  seriesOccurrence?: number | null;
  seriesTotal?: number | null;
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
  { key: "voice30", group: "Voice", label: "Voice & Piano — 30 min", kind: "voice", duration: "30" },
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
  const [fnhClientSearch, setFnhClientSearch] = useState("");
  const [rebookFrom, setRebookFrom] = useState<string | null>(null);
  // Slot-click flow (Week/Overview): chosen service for the clicked slot
  const [bookSvc, setBookSvc] = useState<string | null>(null);
  const [bookClientSearch, setBookClientSearch] = useState("");

  const openVoiceBooking = (duration: string, date?: string, time?: string) => {
    setVoicePrefillDuration(duration);
    setVoicePrefillDate(date);
    setVoicePrefillTime(time);
    setVoiceBookOpen(true);
  };

  const handleNewBooking = (service: string) => {
    if (service === "voice60") openVoiceBooking("60");
    else if (service === "voice45") openVoiceBooking("45");
    else if (service === "voice30") openVoiceBooking("30");
    else if (service === "fnhStandard" || service === "fnhFull") { setFnhPrefillPrice(70); setFnhPickOpen(true); }
    else if (service === "fnhFree") { setFnhPrefillPrice(0); setFnhPickOpen(true); }
  };

  const handleRebook = (item: BookingListItem) => {
    if (item.source === "voice") {
      openVoiceBooking("60");
    } else if (item.clientId) {
      setFnhPrefillPrice(70);
      setFnhClientId(item.clientId);
      setRebookFrom(item.datetime || null);
    }
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
  .select("id, date, status, tag, price_amount, is_paid, payment_received, calcom_booking_id, calcom_event_type_id, client_id, clients (name, is_practitioner, standard_rate, notion_link)")
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
  notionLink: a.clients?.notion_link ?? null,
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
        .select("calcom_booking_id, student_email, student_name, lesson_date, lesson_time, cost, status, notion_lesson_id_1, notion_lesson_id_2");
      return (data || []) as VoiceBookingRow[];
    },
    staleTime: 60_000,
  });

  // Merge cost into voice lessons for the Week Overview price display.
  // Preference: Notion Cost property > voice_bookings.cost > null
  const voiceLessonsWithPrice = useMemo(() => {
    if (!voiceLessons) return [];
    const costByNotionId = new Map<string, number>();
    for (const vb of voiceBookings || []) {
      const nid = vb.notion_lesson_id_1?.replace(/-/g, "").toLowerCase();
      if (nid && vb.cost != null) costByNotionId.set(nid, vb.cost);
    }
    return voiceLessons.map((l) => {
      const notionCost = l.cost;
      const bookingCost = costByNotionId.get(l.id?.replace(/-/g, "").toLowerCase()) ?? null;
      return {
        ...l,
        priceAmount: notionCost ?? bookingCost ?? null,
      };
    });
  }, [voiceLessons, voiceBookings]);

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
      const clientName = client?.name || "Unknown Client";
      const rate = price !== undefined ? price : (client?.standard_rate ?? 50);
      const isPaidSession = rate > 0;
      const sessionLabel = `${clientName} — Kinesiology (${format(date, "MMM d, yyyy")})`;
      const { data: calcomData, error: invokeError } = await supabase.functions.invoke(
        "create-calcom-booking",
        {
          body: {
            clientId,
            startTime: isoTime,
            eventTypeId: eventTypeId || CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID,
            title: sessionLabel,
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
          name: sessionLabel,
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

  const [voiceBusyId, setVoiceBusyId] = useState<string | null>(null);

  const refreshVoiceData = () => {
    refetchVoice();
    refetchVoiceBookings();
    queryClient.invalidateQueries({ queryKey: ["unified-kinesiology-appts"] });
    refetchKinesiology();
  };

  // Manually record/clear a voice lesson payment (writes Notion Payment +
  // voice_bookings.status, so it works even without a linked booking row).
  const handleVoiceMarkPaid = async (item: CalendarItem, paid: boolean) => {
    setVoiceBusyId(item.id);
    try {
      const { error } = await supabase.functions.invoke("voice-mark-paid", {
        body: {
          lessonId: item.lessonId,
          notionLessonId2: item.notionLessonId2,
          calcomBookingId: item.calcomUid,
          paid,
        },
      });
      if (error) throw error;
      showSuccess(paid ? "Marked as paid." : "Marked as unpaid.");
      refreshVoiceData();
    } catch (err: any) {
      showError(err.message || "Failed to update payment status");
    } finally {
      setVoiceBusyId(null);
    }
  };

  const handleVoicePaymentLink = async (item: CalendarItem) => {
    setVoiceBusyId(item.id);
    try {
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
    } catch (err: any) {
      showError(err.message || "Failed to create payment link");
    } finally {
      setVoiceBusyId(null);
    }
  };

  const handleVoiceConvert = async (item: CalendarItem) => {
    if (!session?.user?.id) return;
    setVoiceBusyId(item.id);
    try {
      await convertVoiceToAppointment(
        {
          studentEmail: item.studentEmail,
          studentName: item.studentName,
          title: item.title,
          datetime: item.datetime,
          date: item.date,
          amount: item.amount,
          paid: item.paid,
        },
        session.user.id
      );
      showSuccess("Converted to an FNH appointment.");
      queryClient.invalidateQueries({ queryKey: ["unified-kinesiology-appts"] });
      refetchKinesiology();
    } catch (err: any) {
      showError(err.message || "Failed to convert");
    } finally {
      setVoiceBusyId(null);
    }
  };

  const calendarItems: CalendarItem[] = useMemo(() => {
 const items: CalendarItem[] = [];

    // Only dedup against lessons that actually RENDER (have a date). A lesson that
    // was fetched but skipped below for a missing date must NOT suppress its
    // voice_bookings fallback, or the booking vanishes from the calendar entirely.
    const notionLessonIds = new Set((voiceLessons || []).filter((l) => l.date).map((l) => l.id));
    // Dedup keys include the start time so a same-day second lesson (series
    // occurrence or double booking) is never suppressed by the first.
    const startKey = (date: string | null, time: string | null | undefined) => {
      const m = (time || "").match(/^(\d+):(\d+)\s*(AM|PM)/i);
      let hm = "00:00";
      if (m) {
        let h = parseInt(m[1]);
        if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
        if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
        hm = `${String(h).padStart(2, "0")}:${m[2]}`;
      }
      return `${date}|${hm}`;
    };
    // Matches recorded by email OR by name (covers students who changed email).
    const matchedEmail = new Set<string>();
    const matchedName = new Set<string>();

    (voiceLessons || []).forEach((l) => {
    if (!l.date) return;
    const booking = (voiceBookings || []).find(
      (b) => b.lesson_date === l.date && startKey(b.lesson_date, b.lesson_time) === startKey(l.date, l.time) &&
        (b.student_email === l.studentEmail ||
         (b.student_name && l.studentName &&
          b.student_name.trim().toLowerCase() === l.studentName.trim().toLowerCase()))
    );
    if (booking) {
    matchedEmail.add(`${startKey(booking.lesson_date, booking.lesson_time)}|${booking.student_email}`);
    if (booking.student_name) matchedName.add(`${startKey(booking.lesson_date, booking.lesson_time)}|${booking.student_name.trim().toLowerCase()}`);
    }
    const is30 = /30/.test((l.name || "").toLowerCase());
    const is45 = /45/.test((l.name || "").toLowerCase());
    // Price priority: Notion Cost property > voice_bookings.cost > event_pricing table > defaults
    const notionCost = l.cost ?? null;
    const bookingCost = booking?.cost ?? null;
    const resolvedCost = notionCost ?? bookingCost;
    const resolvedIs30 = resolvedCost != null ? resolvedCost <= 50 : is30;
    const resolvedIs45 = !resolvedIs30 && (resolvedCost != null ? resolvedCost <= 75 : is45);
    const resolvedEventTypeId = resolvedIs30 ? "6488157" : resolvedIs45 ? "5925021" : "1945081";
    // Voice paid signal comes from Notion's Payment property OR a voice_bookings row
    // marked paid (covers Stripe + manually-recorded external payments).
    // NB: must exclude "Unpaid" — a naive /paid/ test matches it.
    const ps = (l.paymentStatus || "").toLowerCase();
    const voicePaid = (ps.includes("paid") && !ps.includes("unpaid")) || booking?.status === "paid";
    items.push({
    id: `v-${l.id}`,
    source: "voice",
    date: l.date,
    datetime: l.date && l.time ? voiceDateISO(l.date, l.time) : l.date,
    time: l.date && l.time ? formatVoiceTime(l.date, l.time) : null,
    title: l.name || "Voice Lesson",
    subtitle: l.studentName || null,
    url: l.notionUrl || null,
    tag: l.discipline || "voice",
    discipline: l.discipline || "voice",
    status: booking?.status ?? null,
    cancelled: booking?.status === "cancelled",
    paid: voicePaid,
    isFree: false,
    // Read voice price: Notion Cost > voice_bookings.cost > event_pricing table > defaults
    amount: resolvedCost ?? priceFor(resolvedEventTypeId) ?? (resolvedIs30 ? 50 : resolvedIs45 ? 75 : 95),
    calcomUid: booking?.calcom_booking_id ?? null,
    notionLessonId1: booking?.notion_lesson_id_1 ?? null,
    notionLessonId2: booking?.notion_lesson_id_2 ?? null,
    eventTypeId: resolvedEventTypeId,
    lessonId: l.id,
    studentEmail: l.studentEmail,
    studentName: l.studentName,
    notionLink: l.notionUrl,
    });
    });

    // Fallback: include voice_bookings that don't have a matching Notion lesson
    const practitionerEmail = session?.user?.email || "";
    const notionNamesOnDate = new Set<string>();
    (voiceLessons || []).forEach((l) => {
      if (l.date && l.studentName) {
        notionNamesOnDate.add(`${startKey(l.date, l.time)}|${l.studentName.trim().toLowerCase()}`);
      }
    });
    (voiceBookings || []).forEach((vb) => {
    if (!vb.lesson_date) return;
    // Skip practitioner self-bookings
    if (vb.student_email === practitionerEmail) return;
    // Skip entries without a real student name (system/test records)
    if (!vb.student_name || vb.student_name.trim() === "" || vb.student_name === "—") return;
    // Skip if already linked to a Notion lesson that exists
    if (vb.notion_lesson_id_1 && notionLessonIds.has(vb.notion_lesson_id_1)) return;
    if (vb.notion_lesson_id_2 && notionLessonIds.has(vb.notion_lesson_id_2)) return;
    // Skip if already matched by email+time or name+time
    const vKey = startKey(vb.lesson_date, vb.lesson_time);
    if (matchedEmail.has(`${vKey}|${vb.student_email}`)) return;
    if (matchedName.has(`${vKey}|${vb.student_name.trim().toLowerCase()}`)) return;
    // Skip if a Notion lesson already exists for this student at this time
    if (notionNamesOnDate.has(`${vKey}|${vb.student_name.trim().toLowerCase()}`)) return;
    // Skip cancelled
    if (vb.status === "cancelled") return;
    const dur = vb.lesson_time ? voiceTimeDuration(vb.lesson_time) : null;
    const is30 = dur === 30;
    const is45 = dur === 45;
    const eventTypeId = is30 ? "6488157" : is45 ? "5925021" : "1945081";
    items.push({
    id: `vb-${vb.calcom_booking_id}`,
    source: "voice",
    date: vb.lesson_date,
    datetime: vb.lesson_time ? voiceDateISO(vb.lesson_date, vb.lesson_time) : vb.lesson_date,
    time: vb.lesson_time ? formatVoiceTime(vb.lesson_date, vb.lesson_time) : null,
    title: vb.student_name,
    subtitle: null,
    url: null,
    tag: vb.discipline || "voice",
    discipline: vb.discipline || "voice",
    status: vb.status ?? null,
    cancelled: false,
    paid: vb.status === "paid",
    isFree: vb.cost === 0,
    amount: priceFor(eventTypeId) ?? (vb.cost ?? null),
    calcomUid: vb.calcom_booking_id ?? null,
    notionLessonId1: vb.notion_lesson_id_1 ?? null,
    notionLessonId2: vb.notion_lesson_id_2 ?? null,
    eventTypeId,
    seriesId: vb.series_id || null,
    seriesFrequency: vb.series_frequency || null,
    seriesOccurrence: vb.series_occurrence ?? null,
    seriesTotal: vb.series_total ?? null,
    lessonId: null,
    studentEmail: vb.student_email,
    studentName: vb.student_name,
    notionLink: null,
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
  time: `${format(appDate, 'h:mm a')} – ${format(new Date(appDate.getTime() + 60 * 60 * 1000), 'h:mm a')}`,
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
  notionLink: a.notionLink,
  });
 });

   // Final dedup: same student+date+similar start time = keep the one with richer time
   const seen = new Map<string, CalendarItem>();
   for (const item of items) {
     const name = item.subtitle || item.title;
     const startMin = parseStartTime(item.time || "");
     const dedupKey = `${item.date}|${name?.toLowerCase().trim()}|${startMin}`;
     if (seen.has(dedupKey)) {
       const existing = seen.get(dedupKey)!;
       const existingHasEnd = (existing.time || "").includes("–");
       const itemHasEnd = (item.time || "").includes("–");
       const itemHasId = !!item.lessonId || !!item.appointmentId;
       const existingHasId = !!existing.lessonId || !!existing.appointmentId;
       if (itemHasEnd && !existingHasEnd) {
         seen.set(dedupKey, item);
       } else if (itemHasId && !existingHasId) {
         seen.set(dedupKey, item);
       }
     } else {
       seen.set(dedupKey, item);
     }
   }
   const deduped = Array.from(seen.values());

   deduped.sort((a, b) => {
   const dateCmp = a.date.localeCompare(b.date);
   if (dateCmp !== 0) return dateCmp;
   return parseStartTime(a.time || "") - parseStartTime(b.time || "");
   });
   return deduped;
   }, [voiceLessons, kinesiologyAppts, voiceBookings, pricing, session]);

   // Income/payment summary for the visible month (used in the Month header).
   const monthSummary = useMemo(() => {
     let voiceIncome = 0, fnhIncome = 0, collected = 0, outstanding = 0, free = 0;
     const ms = startOfMonth(currentMonth);
     const me = endOfMonth(currentMonth);
     for (const i of calendarItems) {
       if (i.cancelled) continue;
       const d = parseISO(i.date);
       if (d < ms || d > me) continue;
       const amt = i.isFree ? 0 : (i.amount ?? 0);
       if (i.source === "voice") voiceIncome += amt; else fnhIncome += amt;
       if (i.isFree) free++;
       else if (i.paid) collected += amt;
       else outstanding += amt;
     }
     return { voiceIncome, fnhIncome, collected, outstanding, free, total: voiceIncome + fnhIncome };
   }, [calendarItems, currentMonth]);

   function parseStartTime(t: string): number {
     const m = t.match(/^(\d+):(\d+)\s*(AM|PM)/i);
     if (!m) return 0;
     let h = parseInt(m[1]);
     const min = parseInt(m[2]);
     if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
     if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
     return h * 60 + min;
   }

  const weeklyEvents: CalendarEvent[] = useMemo(() => {
  const ws = startOfWeek(weekStart);
  const we = endOfWeek(weekStart);
  return calendarItems
    .filter((item) => !item.cancelled && item.time && new Date(item.date) >= ws && new Date(item.date) <= we)
    .map(parseTimeToEvent)
    .filter((e): e is CalendarEvent => e !== null);
  }, [calendarItems, weekStart]);

  const monthlyEvents: CalendarEvent[] = useMemo(() => {
    return calendarItems
      .filter((item) => !item.cancelled && item.time && new Date(item.date) >= monthStart && new Date(item.date) <= monthEnd)
      .map(parseTimeToEvent)
      .filter((e): e is CalendarEvent => e !== null);
  }, [calendarItems, monthStart, monthEnd]);

  const monthlySummary = useMemo(
    () => calcSummary(monthlyEvents, 95, 50),
    [monthlyEvents]
  );

  const getItemsForDay = (day: Date) =>
  calendarItems.filter((item) => !item.cancelled && isSameDay(new Date(item.date), day));

 const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
 const isLoading = voiceLoading || kinesiologyLoading;
 const hasError = voiceError || kinesiologyError;

 if (hasError) {
 return (
 <AppLayout variant="workspace">
 <div className="space-y-6 max-w-7xl mx-auto">
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
 <div className="space-y-6 max-w-7xl mx-auto">
 <PageHeader
 title="Calendar"
 subtitle="Kinesiology appointments and voice lessons at a glance."
  icon={CalendarIcon}
  iconClassName="bg-gradient-to-br from-amber-500 to-rose-500 text-primary-foreground shadow-lg shadow-amber-500/20"
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
            ? "bg-card text-chart-primary shadow-sm ring-1 ring-chart-primary/20"
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
            ? "bg-card text-chart-primary shadow-sm ring-1 ring-chart-primary/20"
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
            ? "bg-card text-chart-primary shadow-sm ring-1 ring-chart-primary/20"
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
            ? "bg-card text-chart-primary shadow-sm ring-1 ring-chart-primary/20"
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
     onRebook={handleRebook}
   />

   ) : viewMode === "month" ? (

   <div className="bg-card rounded-[1.75rem] border border-border/60 shadow-[0_4px_30px_-12px_rgba(120,90,40,0.18)] overflow-hidden animate-in fade-in duration-500">
   {/* Legend */}
   <div className="px-8 pt-6 pb-0 flex flex-wrap items-center gap-x-6 gap-y-2">
   <div className="flex items-center gap-2">
   <div className="w-3 h-3 rounded-full bg-primary" />
   <span className="text-[10px] font-medium text-muted-foreground">Kinesiology</span>
   </div>
    <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-destructive" />
    <span className="text-[10px] font-medium text-muted-foreground">Voice</span>
    </div>
    <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-full bg-chart-primary" />
    <span className="text-[10px] font-medium text-muted-foreground">Piano</span>
    </div>
   <div className="w-px h-3 bg-border" />
   <div className="flex items-center gap-1.5">
   <span className="w-2 h-2 rounded-full bg-chart-emerald" />
   <span className="text-[10px] font-medium text-muted-foreground">Paid</span>
   </div>
   <div className="flex items-center gap-1.5">
   <span className="w-2 h-2 rounded-full bg-chart-destructive" />
   <span className="text-[10px] font-medium text-muted-foreground">Unpaid</span>
   </div>
   <div className="flex items-center gap-1.5">
   <span className="w-2 h-2 rounded-full bg-muted" />
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
   <div className="flex flex-wrap items-center gap-2 mt-3">
   <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 bg-card border border-border">
   <CreditCard size={10} className="text-muted-foreground" /> ${monthSummary.total.toLocaleString()} expected
   </span>
   <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-chart-destructive/10 text-chart-destructive border border-chart-destructive/20">
   <Mic size={10} /> Voice ${monthSummary.voiceIncome.toLocaleString()}
   </span>
   <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-chart-primary/10 text-chart-primary border border-chart-primary/20">
   <User size={10} /> FNH ${monthSummary.fnhIncome.toLocaleString()}
   </span>
   <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-chart-emerald/10 text-chart-emerald border border-chart-emerald/20">
   <CheckCircle2 size={10} /> ${monthSummary.collected.toLocaleString()} collected
   </span>
   {monthSummary.outstanding > 0 && (
   <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
   <Circle size={10} /> ${monthSummary.outstanding.toLocaleString()} outstanding
   </span>
   )}
   {monthSummary.free > 0 && (
   <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-muted text-muted-foreground border border-border">
   <Gift size={10} /> {monthSummary.free} free
   </span>
   )}
   </div>
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
     return sum + (item.isFree ? 0 : (item.amount ?? 0));
   }, 0);

   return (
   <div
   key={day.toString()}
   className={cn(
   "min-h-[130px] p-3 border-r border-b border-border/50 transition-colors",
   !isCurrent && "bg-muted/20 opacity-40",
    isCurrentDay && "bg-chart-primary/5 ring-1 ring-inset ring-chart-primary/20"
   )}
   >
   <div className="flex justify-between items-start mb-2">
   <span
   className={cn(
   "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
   isCurrentDay
   ? "bg-gradient-to-br from-amber-500 to-rose-500 text-primary-foreground shadow-sm "
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
   item.source === "voice" && item.discipline === "piano"
   ? "bg-chart-primary/10 text-chart-primary border-border "
   : item.source === "voice"
   ? "bg-chart-destructive/10 text-chart-destructive border-border "
   : "bg-chart-primary/10 text-chart-primary border-border "
   )}
   >
   <div className="flex items-center gap-1">
    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.isFree ? "bg-muted" : item.paid ? "bg-chart-emerald" : "bg-amber-500")} />
    {item.source === "voice" && item.discipline === "piano" ? (
    <BookOpen size={9} className="shrink-0 opacity-60" />
      ) : item.source === "voice" ? (
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
     item.source === "voice" && item.discipline === "piano"
     ? "bg-chart-primary/10 text-chart-primary border-border "
     : item.source === "voice"
     ? "bg-chart-destructive/10 text-chart-destructive border-border "
     : "bg-chart-primary/10 text-chart-primary border-border "
     )}
     >
     <div className="flex items-center gap-1">
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.isFree ? "bg-muted" : item.paid ? "bg-chart-emerald" : "bg-amber-500")} />
      {item.source === "voice" && item.discipline === "piano" ? (
      <BookOpen size={9} className="shrink-0 opacity-60" />
      ) : item.source === "voice" ? (
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
   {item.seriesId && (
   <div className="text-[10px] font-semibold text-muted-foreground">
   Series · {item.seriesOccurrence && item.seriesTotal ? `${item.seriesOccurrence} of ${item.seriesTotal}` : "recurring"}{item.seriesFrequency ? ` · ${item.seriesFrequency}` : ""}
   </div>
   )}
    <div className="flex items-center gap-1.5 flex-wrap">
    <Badge
    className={cn(
    "text-[10px] font-semibold border-none capitalize",
    item.source === "voice" && item.discipline === "piano"
    ? "bg-chart-primary/10 text-chart-primary "
    : item.source === "voice"
    ? "bg-chart-destructive/10 text-chart-destructive "
    : "bg-chart-primary/10 text-chart-primary "
    )}
    >
    {item.source === "voice" ? (item.discipline || "Voice") : item.tag || "Kinesiology"}
    </Badge>
   <Badge className={cn("text-[10px] font-semibold border-none",
      item.isFree ? "bg-muted text-muted-foreground dark:bg-card dark:text-foreground"
     : item.paid ? "bg-chart-emerald/10 text-chart-emerald"
     : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")}>
   {item.isFree ? "Free" : item.paid ? `Paid · $${item.amount ?? ""}` : `Unpaid · $${item.amount ?? ""}`}
   </Badge>
   </div>
    {item.source === "voice" && (
    <div className="border-t border-border/60 pt-2 mt-1 space-y-1.5">
    {item.url && (
    <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-[10px] font-semibold text-chart-primary hover:underline"
    >
    <ExternalLink size={10} /> Open in Notion
    </a>
    )}
    <div className="flex flex-wrap items-center gap-1.5">
    {!item.isFree && (
    <button
    onClick={(e) => { e.stopPropagation(); handleVoiceMarkPaid(item, !item.paid); }}
    disabled={voiceBusyId === item.id}
    className={cn(
    "inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 border transition-colors",
    item.paid
    ? "border-border text-muted-foreground hover:text-foreground"
    : "border-chart-emerald/30 bg-chart-emerald/10 text-chart-emerald hover:bg-chart-emerald/15"
    )}
    >
    <CheckCircle2 size={10} /> {item.paid ? "Mark unpaid" : "Mark paid"}
    </button>
    )}
    {!item.isFree && (
    <button
    onClick={(e) => { e.stopPropagation(); handleVoicePaymentLink(item); }}
    disabled={voiceBusyId === item.id}
    className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 border border-border text-muted-foreground hover:text-foreground transition-colors"
    >
    <CreditCard size={10} /> Payment link
    </button>
    )}
    <button
    onClick={(e) => { e.stopPropagation(); handleVoiceConvert(item); }}
    disabled={voiceBusyId === item.id}
    className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-2 py-1 border border-border text-muted-foreground hover:text-foreground transition-colors"
    >
    <Plus size={10} /> Convert to FNH
    </button>
    </div>
    {voiceBusyId === item.id && (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
    <Loader2 size={10} className="animate-spin" /> Working…
    </div>
    )}
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
      maxHour={21}
      fnhRatePerHour={50}
      onSlotClick={(date, hour) => setBookSlot({ date, hour })}
    />

    ) : (

    <WeekByWeekOverview
      weekStart={weekStart}
      voiceLessons={voiceLessonsWithPrice}
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-primary-foreground flex items-center justify-center shadow-sm">
            <User size={20} />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">New FNH Booking</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">Choose a client to book a session for.</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="px-6 py-5 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={fnhClientSearch}
            onChange={(e) => setFnhClientSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border-2 border-border bg-card text-sm font-medium focus:outline-none focus:border-chart-primary transition-all"
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {(clients || [])
            .filter((c: any) => {
              if (!fnhClientSearch.trim()) return true;
              const q = fnhClientSearch.toLowerCase();
              return c.name?.toLowerCase().includes(q);
            })
            .map((c: any) => (
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
          {(clients || []).filter((c: any) => !fnhClientSearch.trim() || c.name?.toLowerCase().includes(fnhClientSearch.toLowerCase())).length === 0 && (
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
    rebookFrom={rebookFrom}
    onOpenChange={(open) => { if (!open) { setFnhClientId(null); setRebookFrom(null); } }}
    onSuccess={() => { setFnhClientId(null); setRebookFrom(null); refetchKinesiology(); }}
  />

  {bookSlot && (
    <Dialog open onOpenChange={(open) => { if (!open) { setBookSlot(null); setBookClient(null); setBookSvc(null); } }}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 mx-4 w-[calc(100%-2rem)] flex flex-col bg-background">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-primary-foreground flex items-center justify-center shadow-sm">
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
                 <div className="relative mb-2">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                   <input
                     type="text"
                     placeholder="Search clients..."
                     value={bookClientSearch}
                     onChange={(e) => setBookClientSearch(e.target.value)}
                     className="w-full h-10 pl-9 pr-3 rounded-xl border-2 border-border bg-card text-sm font-medium focus:outline-none focus:border-chart-primary transition-all"
                   />
                 </div>
                 <div className="max-h-56 overflow-y-auto space-y-1.5">
                   {(clients || [])
                     .filter((c: any) => {
                       if (!bookClientSearch.trim()) return true;
                       return c.name?.toLowerCase().includes(bookClientSearch.toLowerCase());
                     })
                     .map((c: any) => (
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
                   {(clients || []).filter((c: any) => !bookClientSearch.trim() || c.name?.toLowerCase().includes(bookClientSearch.toLowerCase())).length === 0 && (
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
