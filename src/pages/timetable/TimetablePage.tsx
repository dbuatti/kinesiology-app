import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  Loader2,
  RefreshCw,
  TrendingUp,
  CalendarDays,
  Ban,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Music,
  Check,
  X,
  PenLine,
  ChevronLeft,
  ChevronRight,
  Mail,
  Plane,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useBookingProposals, BookingProposal } from "@/hooks/useBookingProposals";
import { useIcloudCalendar, IcloudCalendarEvent } from "@/hooks/useIcloudCalendar";
import { useTimetableAppointments, EnrichedBooking } from "@/hooks/useTimetableAppointments";
import { useSuggestionEngine, Suggestion } from "@/hooks/useSuggestionEngine";
import AutoDraftPanel, { AutoDraftClient } from "@/components/crm/timetable/AutoDraftPanel";
import { OpenSlot, BusyBlock, Assignment, AvailabilityWindow } from "@/utils/timetable-scheduler";
import { CALCOM_CONFIG } from "@/config/integrations";
import {
  format,
  startOfWeek,
  addWeeks,
  eachDayOfInterval,
  addDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
  isSameDay,
  subDays,
  differenceInDays,
} from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SlotInfo {
  start: string;
  time: string;
}

interface BookingInfo {
  id?: string;
  uid?: string;
  start?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  title?: string;
}

interface SlotsResponse {
  status?: string;
  message?: string;
  data?: Record<string, SlotInfo[]>;
  blockedDates?: string[];
  bookings?: Record<string, BookingInfo[]>;
}

interface VoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
}

interface EnrichedVoiceStudent {
  id: string;
  name: string | null;
  email: string | null;
  session_count: number;
  upcoming_count: number;
  last_session_at: string | null;
  next_session_at: string | null;
  attention_score: number;
}

interface VoiceClientsResponse {
  students?: {
    id: string;
    name: string | null;
    email: string | null;
  }[];
}

interface FnhClient {
  id: string;
  name: string | null;
  email: string | null;
  availability_notes?: string | null;
}

interface EnrichedClient {
  id: string;
  name: string | null;
  email: string | null;
  availability_notes?: string | null;
  session_count: number;
  upcoming_count: number;
  last_session_at: string | null;
  next_session_at: string | null;
  attention_score: number;
}

function fmtSpan(days: number): string {
  if (days < 7) return `${days}d`;
  const w = Math.floor(days / 7);
  const r = days % 7;
  return r === 0 ? `${w}w` : `${w}w${r}d`;
}

enum DayState {
  BLOCKED = "blocked",
  BOOKED = "booked",
  OPEN = "open",
  EMPTY = "empty",
}

type SessionKind = "fnh" | "voice";

const VIEW_RANGE_WEEKS = 12;

const VOICE_EVENT_TYPES = [
  { id: CALCOM_CONFIG.VOICE_EVENT_TYPE_60, label: "60 min" },
  { id: CALCOM_CONFIG.VOICE_EVENT_TYPE_45, label: "45 min" },
  { id: CALCOM_CONFIG.VOICE_EVENT_TYPE_30, label: "30 min" },
];

function zonedDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

const TimetablePage = () => {
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("view");
    if (t === "forecast" || t === "suggestions" || t === "autodraft") return t;
    return "fortnight";
  });
  const [fortnightIndex, setFortnightIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, SlotInfo[]>>({});
  const [bookings, setBookings] = useState<Record<string, BookingInfo[]>>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // ── Phase 2: manual planning state ─────────────────────────────
  const [kind, setKind] = useState<SessionKind>("fnh");
  const [fnhEventType, setFnhEventType] = useState(CALCOM_CONFIG.DEFAULT_EVENT_TYPE_ID);
  const [voiceEventType, setVoiceEventType] = useState(CALCOM_CONFIG.VOICE_EVENT_TYPE_60);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>("");

  const [pickingDay, setPickingDay] = useState<Date | null>(null);
  const [proposalFor, setProposalFor] = useState<BookingProposal | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [appointmentFor, setAppointmentFor] = useState<EnrichedBooking | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [emailOnCancel, setEmailOnCancel] = useState(true);
  const [cancelMessage, setCancelMessage] = useState("");

  const defaultCancelMessage = (name?: string | null) => {
    const first = (name || "there").split(" ")[0];
    return `Hi ${first},\n\nSorry, I've needed to cancel our session — I've had some music director projects come up. I'll be in touch shortly to reschedule.\n\nAll the best,\nDaniele`;
  };

  const openCancelConfirm = () => {
    setCancelMessage(defaultCancelMessage(appointmentFor?.attendeeName || appointmentFor?.title));
    setEmailOnCancel(!!appointmentFor?.attendeeEmail);
    setConfirmCancelOpen(true);
  };
  const [oooOpen, setOooOpen] = useState(false);
  const [oooStart, setOooStart] = useState("");
  const [oooEnd, setOooEnd] = useState("");
  const [oooReason, setOooReason] = useState("");
  const [settingOoo, setSettingOoo] = useState(false);
  const [showAllDay, setShowAllDay] = useState(false);

  const eventTypeId = kind === "fnh" ? fnhEventType : voiceEventType;

  // FNH clients + voice students for the selector.
  const { data: fnhClients = [] } = useQuery<FnhClient[]>({
    queryKey: ["timetable-fnh-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, availability_notes")
        .not("is_practitioner", "eq", true)
        .order("name");
      if (error) throw error;
      return (data || []) as FnhClient[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const now = useMemo(() => new Date(), []);

  const { data: appointmentsData = [] } = useQuery({
    queryKey: ["timetable-client-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("client_id, date, status")
        .gte("date", subDays(now, 180).toISOString())
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as { client_id: string; date: string; status: string | null }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const enrichedClients = useMemo<EnrichedClient[]>(() => {
    const today = startOfDay(now);
    return fnhClients.map((c) => {
      const appts = appointmentsData.filter((a) => a.client_id === c.id && a.status !== "Cancelled");
      const sessionCount = appts.length;
      const upcomingCount = appts.filter(
        (a) => new Date(a.date) >= today
      ).length;
      const lastSession = appts
        .filter((a) => new Date(a.date) < today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const nextSession = appts
        .filter((a) => new Date(a.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      let attentionScore = 0;
      if (upcomingCount > 0 && !lastSession) attentionScore = 100;
      else if (upcomingCount > 0 && lastSession) {
        const daysSince = differenceInDays(today, new Date(lastSession.date));
        attentionScore = daysSince > 60 ? 90 : daysSince > 21 ? 70 : 50;
      } else if (lastSession) {
        const daysSince = differenceInDays(today, new Date(lastSession.date));
        if (daysSince <= 21) attentionScore = 80;
        else if (daysSince <= 60) attentionScore = 60;
        else if (daysSince <= 120) attentionScore = 30;
      }
      if (sessionCount === 0 && upcomingCount === 0) attentionScore = 10;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        availability_notes: c.availability_notes || null,
        session_count: sessionCount,
        upcoming_count: upcomingCount,
        last_session_at: lastSession?.date || null,
        next_session_at: nextSession?.date || null,
        attention_score: attentionScore,
      };
    }).sort((a, b) => b.attention_score - a.attention_score);
  }, [fnhClients, appointmentsData, now]);

  const { data: voiceStudents = [] } = useQuery<VoiceStudent[]>({
    queryKey: ["timetable-voice-students"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<VoiceClientsResponse>("voice-clients");
      if (error) throw error;
      return (data?.students || []).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: voiceBookingsData = [] } = useQuery({
    queryKey: ["timetable-voice-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_bookings")
        .select("student_email, student_name, lesson_date, lesson_time, status")
        .not("status", "eq", "cancelled")
        .order("lesson_date", { ascending: false });
      if (error) throw error;
      return (data || []) as {
        student_email: string | null;
        student_name: string | null;
        lesson_date: string;
        lesson_time: string | null;
        status: string | null;
      }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Past voice/piano lessons live in Notion (not voice_bookings), so load them
  // to give the auto-scheduler real time-of-day history for voice students.
  const { data: voiceLessons = [] } = useQuery({
    queryKey: ["timetable-voice-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        lessons?: { studentEmail: string | null; date: string | null; time: string | null }[];
      }>("voice-lessons");
      if (error) throw error;
      return (data?.lessons || []).filter((l) => l.date && l.studentEmail);
    },
    staleTime: 5 * 60 * 1000,
  });

  const enrichedVoiceStudents = useMemo<EnrichedVoiceStudent[]>(() => {
    const today = startOfDay(now);
    return voiceStudents.map((s) => {
      const emailKey = s.email?.toLowerCase() || "";
      const bookings = voiceBookingsData.filter(
        (b) => b.student_email?.toLowerCase() === emailKey
      );
      const sessionCount = bookings.length;
      const upcomingCount = bookings.filter(
        (b) => new Date(b.lesson_date) >= today
      ).length;
      const lastSession = bookings
        .filter((b) => new Date(b.lesson_date) < today)
        .sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime())[0];
      const nextSession = bookings
        .filter((b) => new Date(b.lesson_date) >= today)
        .sort((a, b) => new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime())[0];

      let attentionScore = 0;
      if (upcomingCount > 0 && !lastSession) attentionScore = 100;
      else if (upcomingCount > 0 && lastSession) {
        const daysSince = differenceInDays(today, new Date(lastSession.lesson_date));
        attentionScore = daysSince > 60 ? 90 : daysSince > 21 ? 70 : 50;
      } else if (lastSession) {
        const daysSince = differenceInDays(today, new Date(lastSession.lesson_date));
        if (daysSince <= 21) attentionScore = 80;
        else if (daysSince <= 60) attentionScore = 60;
        else if (daysSince <= 120) attentionScore = 30;
      }
      if (sessionCount === 0 && upcomingCount === 0) attentionScore = 10;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        session_count: sessionCount,
        upcoming_count: upcomingCount,
        last_session_at: lastSession?.lesson_date || null,
        next_session_at: nextSession?.lesson_date || null,
        attention_score: attentionScore,
      };
    }).sort((a, b) => b.attention_score - a.attention_score);
  }, [voiceStudents, voiceBookingsData, now]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = startOfDay(new Date());
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfDay(addDays(start, VIEW_RANGE_WEEKS * 7 - 1));

      const { data, error: invokeError } = await supabase.functions.invoke<SlotsResponse>(
        "get-calcom-slots",
        {
          body: {
            start: start.toISOString(),
            end: end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }
      );

      if (invokeError) throw invokeError;
      if (!data || data.status === "error") {
        setError(data?.message || "Could not load availability.");
        setSlots({});
        setBookings({});
        setBlockedDates([]);
        return;
      }

      setSlots(data.data || {});
      setBookings(data.bookings || {});
      setBlockedDates(data.blockedDates || []);
    } catch (err) {
      console.error("Failed to load timetable:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dateRange = useMemo(() => {
    const start = startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, VIEW_RANGE_WEEKS * 7 - 1) });
  }, []);

  const { proposals, proposalsInWindow, createProposal, confirmProposal, dropProposal } = useBookingProposals(
    dateRange[0].toISOString(),
    dateRange[dateRange.length - 1].toISOString()
  );

  const {
    events: icloudEvents,
    total: icloudTotal,
    loading: icloudLoading,
    error: icloudError,
  } = useIcloudCalendar(dateRange[0].toISOString(), dateRange[dateRange.length - 1].toISOString());

  const visibleIcloudEvents = useMemo(
    () => icloudEvents.filter((ev) => showAllDay || !ev.allDay),
    [icloudEvents, showAllDay]
  );

  const { bookings: enrichedBookings } = useTimetableAppointments(bookings, proposals);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, EnrichedBooking[]> = {};
    enrichedBookings.forEach((b) => {
      if (!b.start) return;
      const key = format(new Date(b.start), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [enrichedBookings]);

  const { suggestions } = useSuggestionEngine({
    appointmentsData,
    voiceBookingsData,
    enrichedClients,
    enrichedVoiceStudents,
    slots,
    proposals,
    calcomBookings: bookings,
  });

  // ── Auto-draft data plumbing ───────────────────────────────────
  const [draftAssignments, setDraftAssignments] = useState<Assignment[]>([]);
  const [hiddenWeeks, setHiddenWeeks] = useState<Set<string>>(new Set());
  const [workflowFor, setWorkflowFor] = useState<BookingProposal | null>(null);
  const [workflowMsg, setWorkflowMsg] = useState("");
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [workflowEmailOpen, setWorkflowEmailOpen] = useState(false);
  const queryClient = useQueryClient();

  // Clients marked away / off-the-books until a date.
  const { data: awayRows = [] } = useQuery({
    queryKey: ["timetable-away"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_client_away")
        .select("client_key, away_until, reason");
      if (error) throw error;
      return (data || []) as { client_key: string; away_until: string; reason: string | null }[];
    },
    staleTime: 60 * 1000,
  });

  const awayByKey = useMemo(() => {
    const todayKey = format(startOfDay(now), "yyyy-MM-dd");
    const map: Record<string, { until: string; reason: string | null }> = {};
    for (const r of awayRows) {
      if (r.away_until >= todayKey) map[r.client_key] = { until: r.away_until, reason: r.reason };
    }
    return map;
  }, [awayRows, now]);

  const setAway = useCallback(
    async (key: string, untilISO: string | null, reason?: string) => {
      try {
        if (!untilISO) {
          await supabase.from("timetable_client_away").delete().eq("client_key", key);
        } else {
          const { data: userData } = await supabase.auth.getUser();
          await supabase.from("timetable_client_away").upsert(
            { user_id: userData?.user?.id, client_key: key, away_until: untilISO, reason: reason ?? null },
            { onConflict: "user_id,client_key" },
          );
        }
        await queryClient.invalidateQueries({ queryKey: ["timetable-away"] });
      } catch (e: any) {
        showError(e?.message || "Couldn't update away status.");
      }
    },
    [queryClient],
  );

  // Per-client scheduling prefs: availability windows + a cadence override.
  const { data: availabilityRows = [] } = useQuery({
    queryKey: ["timetable-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_client_availability")
        .select("client_key, windows, note, cadence_days, buffer_before_min, session_length_min, event_type_id");
      if (error) throw error;
      return (data || []) as {
        client_key: string;
        windows: AvailabilityWindow[];
        note: string | null;
        cadence_days: number | null;
        buffer_before_min: number | null;
        session_length_min: number | null;
        event_type_id: string | null;
      }[];
    },
    staleTime: 60 * 1000,
  });

  const availabilityByKey = useMemo(() => {
    const map: Record<string, { windows: AvailabilityWindow[]; note: string | null; cadenceDays: number | null; bufferBeforeMin: number | null; sessionLengthMin: number | null; eventTypeId: string | null }> = {};
    for (const r of availabilityRows) {
      map[r.client_key] = {
        windows: Array.isArray(r.windows) ? r.windows : [],
        note: r.note,
        cadenceDays: r.cadence_days ?? null,
        bufferBeforeMin: r.buffer_before_min ?? null,
        sessionLengthMin: r.session_length_min ?? null,
        eventTypeId: r.event_type_id ?? null,
      };
    }
    return map;
  }, [availabilityRows]);

  // Merge-save: only the passed fields change; the rest carry over. Deletes the
  // row when nothing meaningful is left.
  const saveClientPrefs = useCallback(
    async (
      key: string,
      patch: { windows?: AvailabilityWindow[]; note?: string | null; cadenceDays?: number | null; bufferBeforeMin?: number | null; sessionLengthMin?: number | null; eventTypeId?: string | null },
    ) => {
      try {
        const current = availabilityByKey[key] ?? { windows: [], note: null, cadenceDays: null, bufferBeforeMin: null, sessionLengthMin: null, eventTypeId: null };
        const windows = patch.windows ?? current.windows;
        const note = patch.note !== undefined ? patch.note : current.note;
        const cadenceDays = patch.cadenceDays !== undefined ? patch.cadenceDays : current.cadenceDays;
        const bufferBeforeMin = patch.bufferBeforeMin !== undefined ? patch.bufferBeforeMin : current.bufferBeforeMin;
        const sessionLengthMin = patch.sessionLengthMin !== undefined ? patch.sessionLengthMin : current.sessionLengthMin;
        const eventTypeId = patch.eventTypeId !== undefined ? patch.eventTypeId : current.eventTypeId;

        if (!windows.length && !note && cadenceDays == null && bufferBeforeMin == null && sessionLengthMin == null && !eventTypeId) {
          await supabase.from("timetable_client_availability").delete().eq("client_key", key);
        } else {
          const { data: userData } = await supabase.auth.getUser();
          await supabase.from("timetable_client_availability").upsert(
            {
              user_id: userData?.user?.id,
              client_key: key,
              windows,
              note: note ?? null,
              cadence_days: cadenceDays,
              buffer_before_min: bufferBeforeMin,
              session_length_min: sessionLengthMin,
              event_type_id: eventTypeId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,client_key" },
          );
        }
        await queryClient.invalidateQueries({ queryKey: ["timetable-availability"] });
      } catch (e: any) {
        showError(e?.message || "Couldn't update scheduling prefs.");
      }
    },
    [queryClient, availabilityByKey],
  );

  // The live draft, shaped as (unsaved) proposals so it renders on the fortnight
  // mock-up alongside real bookings + iCloud commitments before you pencil it in.
  const draftPreviewProposals = useMemo<BookingProposal[]>(
    () =>
      draftAssignments.map((a) => ({
        id: `draft:${a.clientId}`,
        user_id: "",
        client_id: null,
        student_name: a.name,
        student_email: a.email ?? null,
        kind: a.kind,
        event_type_id: null,
        slot_start: a.slotStart.toISOString(),
        slot_end: a.slotEnd.toISOString(),
        status: "suggested",
        calcom_booking_id: null,
        appointment_id: null,
        reason: a.reason,
        created_at: "",
        updated_at: "",
        confirmed_at: null,
      })),
    [draftAssignments],
  );

  // Pencil in a single draft session by clicking its blue card on the calendar.
  const pencilInDraft = async (p: BookingProposal): Promise<BookingProposal | null> => {
    const clientKey = String(p.id).replace(/^draft:/, "");
    const a = draftAssignments.find((x) => x.clientId === clientKey);
    if (!a) return null;
    const baseKey = clientKey.split("#")[0];
    const original = autoDraftClients.find((c) => c.key === baseKey);
    try {
      const created = await createProposal({
        kind: a.kind,
        clientId: a.kind === "fnh" ? original?.id ?? null : null,
        studentName: a.name,
        studentEmail: a.kind === "voice" ? a.email ?? original?.id ?? null : null,
        eventTypeId: a.kind === "fnh" ? fnhEventType : voiceEventType,
        slotStart: a.slotStart.toISOString(),
        slotEnd: a.slotEnd.toISOString(),
      });
      setDraftAssignments((prev) => prev.filter((x) => x.clientId !== clientKey));
      showSuccess(`Penciled in ${a.name}.`);
      return created ?? null;
    } catch (e: any) {
      showError(e?.message || "Couldn't pencil in.");
      return null;
    }
  };

  // Resolve a proposal's client email (voice carries it; FNH needs a lookup).
  const resolveProposalEmail = (p: BookingProposal): string | null => {
    if (String(p.id).startsWith("draft:")) {
      const key = String(p.id).replace(/^draft:/, "");
      return draftAssignments.find((x) => x.clientId === key)?.email ?? null;
    }
    if (p.student_email) return p.student_email;
    if (p.client_id) return fnhClients.find((c) => c.id === p.client_id)?.email ?? null;
    return null;
  };

  const autoDraftClients = useMemo<AutoDraftClient[]>(() => {
    const today = startOfDay(now);
    const out: AutoDraftClient[] = [];

    // Never draft the practitioner's own records.
    const PRACTITIONER_EMAILS = new Set(
      ["info@danielebuatti.com", "daniele.buatti@gmail.com"].map((e) => e.toLowerCase()),
    );
    const isPractitioner = (email: string | null, name: string | null) =>
      (email && PRACTITIONER_EMAILS.has(email.toLowerCase())) ||
      (name || "").trim().toLowerCase() === "daniele buatti";

    // FNH — full datetimes from the appointments table.
    for (const c of enrichedClients) {
      if (isPractitioner(c.email, c.name)) continue;
      const appts = appointmentsData.filter((a) => a.client_id === c.id && a.status !== "Cancelled");
      const past = appts.map((a) => new Date(a.date)).filter((d) => !isNaN(d.getTime()) && d < today);
      const upcoming = appts.map((a) => new Date(a.date)).filter((d) => !isNaN(d.getTime()) && d >= today);
      const last = past.length ? new Date(Math.max(...past.map((d) => d.getTime()))) : null;
      out.push({ key: `fnh:${c.id}`, kind: "fnh", id: c.id, name: c.name || "Unknown", email: c.email, pastSessions: past, upcomingSessions: upcoming, lastSessionAt: last, timeKnown: true });
    }

    // Voice — merge two history sources per student:
    //   • voice_bookings: has a reliable lesson_time (best time signal)
    //   • Notion lessons: fuller history, but often date-only
    // We prefer TIMED sessions for the time-of-day; only fall back to date-only
    // (weekday, "time flexible") when a student has no timed session at all.
    const parseMins = (time: string | null): number | null => {
      if (!time) return null;
      const first = String(time).split(/[–—-]/)[0].replace(/(UTC|AEST|AEDT|GMT[+-]\d+)/gi, "").trim();
      const m = first.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      const mn = parseInt(m[2], 10);
      const ap = m[3]?.toUpperCase();
      if (ap === "PM" && h !== 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return h * 60 + mn;
    };
    const timed = new Map<string, Date[]>();
    const dateOnly = new Map<string, Date[]>();
    const durations = new Map<string, number[]>();
    const voiceUpcoming = new Map<string, Date[]>();

    // Duration from a "4:00 PM – 4:45 PM" range, snapped to 30/45/60.
    const parseRangeDuration = (time: string | null): number | null => {
      if (!time) return null;
      const parts = String(time).split(/[–—-]/);
      if (parts.length < 2) return null;
      const a = parseMins(parts[0]);
      const b = parseMins(parts[1]);
      if (a == null || b == null) return null;
      let diff = b - a;
      if (diff < 0) diff += 1440;
      if (diff <= 0 || diff > 120) return null;
      return [30, 45, 60].reduce((best, d) => (Math.abs(d - diff) < Math.abs(best - diff) ? d : best), 45);
    };

    // voice_bookings (timed).
    for (const b of voiceBookingsData) {
      const email = (b.student_email || "").toLowerCase();
      if (!email) continue;
      const dur = parseRangeDuration(b.lesson_time);
      if (dur) (durations.get(email) ?? durations.set(email, []).get(email)!).push(dur);
      const mins = parseMins(b.lesson_time);
      const [y, mo, d] = String(b.lesson_date).split("T")[0].split("-").map(Number);
      if (!y || !mo || !d) continue;
      if (mins == null) {
        const dt = new Date(y, mo - 1, d, 12, 0);
        if (dt < today) (dateOnly.get(email) ?? dateOnly.set(email, []).get(email)!).push(dt);
        continue;
      }
      const dt = new Date(y, mo - 1, d, Math.floor(mins / 60), mins % 60);
      if (dt < today) (timed.get(email) ?? timed.set(email, []).get(email)!).push(dt);
      else (voiceUpcoming.get(email) ?? voiceUpcoming.set(email, []).get(email)!).push(dt);
    }
    // Notion lessons (timed if the Date property carries a time, else date-only).
    for (const l of voiceLessons) {
      const email = (l.studentEmail || "").toLowerCase();
      if (!email || !l.date) continue;
      const raw = String(l.date);
      const hasTime = /T\d{2}:\d{2}/.test(raw) && !/T00:00(:00)?/.test(raw);
      const dt = new Date(hasTime ? raw : `${raw.split("T")[0]}T12:00:00`);
      if (isNaN(dt.getTime()) || dt >= today) continue;
      if (hasTime) (timed.get(email) ?? timed.set(email, []).get(email)!).push(dt);
      else (dateOnly.get(email) ?? dateOnly.set(email, []).get(email)!).push(dt);
    }

    for (const s of enrichedVoiceStudents) {
      const email = (s.email || "").toLowerCase();
      if (!email || isPractitioner(s.email, s.name)) continue;
      const timedArr = timed.get(email) ?? [];
      const timeKnown = timedArr.length > 0;
      const past = timeKnown ? timedArr : (dateOnly.get(email) ?? []);
      const last = past.length ? new Date(Math.max(...past.map((d) => d.getTime()))) : null;
      // Their usual lesson length = the most common duration seen.
      const durs = durations.get(email) ?? [];
      let typicalDurationMin: number | null = null;
      if (durs.length) {
        const counts = new Map<number, number>();
        for (const d of durs) counts.set(d, (counts.get(d) ?? 0) + 1);
        typicalDurationMin = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
      out.push({
        key: `voice:${email}`,
        kind: "voice",
        id: email,
        name: s.name || "Unknown",
        email: s.email,
        pastSessions: past,
        upcomingSessions: voiceUpcoming.get(email) ?? [],
        lastSessionAt: last,
        timeKnown,
        typicalDurationMin,
      });
    }
    return out;
  }, [enrichedClients, appointmentsData, enrichedVoiceStudents, voiceLessons, voiceBookingsData, now]);

  // Open Cal.com slots across the window (future only).
  const autoDraftOpenSlots = useMemo<OpenSlot[]>(() => {
    const nowMs = Date.now();
    const out: OpenSlot[] = [];
    for (const list of Object.values(slots)) {
      for (const s of list) {
        const start = new Date(s.start);
        if (isNaN(start.getTime()) || start.getTime() <= nowMs) continue;
        out.push({ start, durationMin: 60 });
      }
    }
    return out;
  }, [slots]);

  // Practitioner busy blocks: iCloud events + whole-day blocked dates.
  const autoDraftBusy = useMemo<BusyBlock[]>(() => {
    const out: BusyBlock[] = [];
    for (const ev of icloudEvents) {
      if (!ev.start) continue;
      if (ev.allDay) {
        const d = new Date(ev.start);
        out.push({ start: startOfDay(d), end: endOfDay(d) });
      } else if (ev.end) {
        out.push({ start: new Date(ev.start), end: new Date(ev.end) });
      }
    }
    for (const key of blockedDates) {
      const [y, mo, d] = key.split("-").map(Number);
      if (y && mo && d) out.push({ start: new Date(y, mo - 1, d, 0, 0), end: new Date(y, mo - 1, d, 23, 59) });
    }
    return out;
  }, [icloudEvents, blockedDates]);

  // Slots already taken by real bookings or existing proposals.
  const autoDraftTaken = useMemo<string[]>(() => {
    const out: string[] = [];
    for (const list of Object.values(bookings)) {
      for (const b of list) if (b.start) out.push(new Date(b.start).toISOString());
    }
    for (const p of proposals) if (p.slot_start) out.push(new Date(p.slot_start).toISOString());
    return out;
  }, [bookings, proposals]);

  const stateFor = (d: Date): DayState => {
    const key = zonedDateKey(d);
    if (blockedDates.includes(key)) return DayState.BLOCKED;
    if ((bookings[key] || []).length > 0) return DayState.BOOKED;
    if ((slots[key] || []).length > 0) return DayState.OPEN;
    return DayState.EMPTY;
  };

  const summary = useMemo(() => {
    let openSlots = 0;
    let booked = 0;
    let blocked = 0;
    dateRange.forEach((d) => {
      const key = zonedDateKey(d);
      openSlots += (slots[key] || []).length;
      booked += (bookings[key] || []).length;
      if (blockedDates.includes(key)) blocked++;
    });
    return { openSlots, booked, blocked, days: dateRange.length };
  }, [dateRange, slots, bookings, blockedDates]);

  // Weekly forecast buckets for the bar chart
  const forecastData = useMemo(() => {
    const weeksArr: { label: string; open: number; booked: number; blocked: number }[] = [];
    for (let w = 0; w < VIEW_RANGE_WEEKS; w++) {
      const weekStart = addWeeks(startOfWeek(startOfDay(new Date()), { weekStartsOn: 1 }), w);
      const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
      let open = 0;
      let booked = 0;
      let blocked = 0;
      days.forEach((d) => {
        const key = zonedDateKey(d);
        open += (slots[key] || []).length;
        booked += (bookings[key] || []).length;
        if (blockedDates.includes(key)) blocked++;
      });
      weeksArr.push({
        label: `W${w + 1} ${format(weekStart, "d MMM")}`,
        open,
        booked,
        blocked,
      });
    }
    return weeksArr;
  }, [slots, bookings, blockedDates]);

  const weekdayLabel = (d: Date) => format(d, "EEE");

  // ── Proposal actions ──────────────────────────────────────────
  const handleCreateProposal = async (slotStart: string, slotEnd: string) => {
    if (kind === "fnh" && !selectedClientId) {
      showError("Pick an FNH client first.");
      return;
    }
    if (kind === "voice" && !selectedStudentEmail) {
      showError("Pick a voice student first.");
      return;
    }
    setWorking(true);
    try {
      const created = await createProposal({
        kind,
        clientId: kind === "fnh" ? selectedClientId : null,
        studentName: kind === "voice" ? selectedStudentName : null,
        studentEmail: kind === "voice" ? selectedStudentEmail : null,
        eventTypeId,
        slotStart,
        slotEnd,
      });
      showSuccess("Pencilled in as Proposed.");
      setCreateOpen(false);
      setPickingDay(null);
      setProposalFor(created);
      setManageOpen(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create proposal.");
    } finally {
      setWorking(false);
    }
  };

  const handleConfirm = async () => {
    if (!proposalFor) return;
    setWorking(true);
    try {
      const updated = await confirmProposal(proposalFor);
      showSuccess("Confirmed — booking created in Cal.com.");
      setProposalFor(updated);
      setManageOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not confirm proposal.");
    } finally {
      setWorking(false);
    }
  };

  const handleDrop = async () => {
    if (!proposalFor) return;
    setWorking(true);
    try {
      await dropProposal(proposalFor.id);
      showSuccess("Proposal dropped.");
      setManageOpen(false);
      setProposalFor(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not drop proposal.");
    } finally {
      setWorking(false);
    }
  };

  const handleSendEmail = async (days: number) => {
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        eventCount?: number;
        dayCount?: number;
        sentTo?: string;
        error?: string;
      }>("gmail-schedule-email", { body: { days } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not send schedule email.");
      showSuccess(`Schedule email sent (${data.eventCount ?? 0} events over ${data.dayCount ?? 0} days).`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not send schedule email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCancelAppointment = async () => {
    const appt = appointmentFor;
    if (!appt) return;
    setCancellingAppt(true);
    try {
      if (appt.source === "voice") {
        const { error: invokeError } = await supabase.functions.invoke("voice-cancel-lesson", {
          body: { calcomBookingId: appt.calcomUid },
        });
        if (invokeError) throw invokeError;
        if (appt.voiceBookingId) {
          await supabase.from("voice_bookings").update({ status: "cancelled" }).eq("id", appt.voiceBookingId);
        }
      } else if (appt.calcomUid) {
        const { error: invokeError } = await supabase.functions.invoke("delete-external-appointment", {
          body: { calcomBookingId: appt.calcomUid },
        });
        if (invokeError) throw invokeError;
        if (appt.appointmentId) {
          await supabase.from("appointments").update({ status: "Cancelled" }).eq("id", appt.appointmentId);
        }
      }
      if (appt.proposalId) {
        await supabase
          .from("booking_proposals")
          .update({ status: "dropped", updated_at: new Date().toISOString() })
          .eq("id", appt.proposalId);
      }
      // Optionally email the client a cancellation note.
      if (emailOnCancel && appt.attendeeEmail && cancelMessage.trim()) {
        const { error: emailErr } = await supabase.functions.invoke("send-cancellation-email", {
          body: { to: appt.attendeeEmail, message: cancelMessage, startISO: appt.start },
        });
        if (emailErr) showError(`Cancelled, but the email failed: ${emailErr.message}`);
        else showSuccess("Booking cancelled and client notified.");
      } else {
        showSuccess("Booking cancelled — slot freed in Cal.com.");
      }
      setAppointmentFor(null);
      setConfirmCancelOpen(false);
      fetchData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not cancel booking.");
    } finally {
      setCancellingAppt(false);
    }
  };

  const openDay = (d: Date) => {
    if (stateFor(d) !== DayState.OPEN) return;
    setPickingDay(d);
    setCreateOpen(true);
  };

  const handleSetOutOfOffice = async () => {
    if (!oooStart || !oooEnd) {
      showError("Please pick a start and end.");
      return;
    }
    const start = new Date(oooStart);
    const end = new Date(oooEnd);
    if (end <= start) {
      showError("End must be after start.");
      return;
    }
    setSettingOoo(true);
    try {
      const { error: invokeError } = await supabase.functions.invoke("calcom-ooo-block", {
        body: {
          action: "set",
          start: start.toISOString(),
          end: end.toISOString(),
          reason: oooReason.trim() || "unspecified",
        },
      });
      if (invokeError) throw invokeError;
      showSuccess("Out-of-office block created — these times are now busy on Cal.com.");
      setOooOpen(false);
      setOooStart("");
      setOooEnd("");
      setOooReason("");
      fetchData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create out-of-office block.");
    } finally {
      setSettingOoo(false);
    }
  };

  const openProposal = (p: BookingProposal) => {
    setProposalFor(p);
    setManageOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-chart-primary/10 flex items-center justify-center">
            <CalendarRange size={20} className="text-chart-primary" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">Timetable Simulator</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Mock-up your fortnight, pencil in proposals, then confirm to Cal.com.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-chart-primary/10 text-chart-primary border-none" variant="outline">
            {summary.openSlots} open
          </Badge>
          <Badge className="bg-rose-600/10 text-rose-600 border-none" variant="outline">
            {summary.booked} booked
          </Badge>
          <Badge className="bg-muted text-muted-foreground border-none" variant="outline">
            {summary.blocked} blocked
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendEmail(14)}
            disabled={sendingEmail}
            className="gap-1.5"
            title="Email the next 14 days' agenda to your inbox"
          >
            <Mail size={14} className={cn(sendingEmail && "animate-pulse")} /> Email schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOooOpen(true)}
            className="gap-1.5"
            title="Block a block of time as out-of-office on Cal.com"
          >
            <Plane size={14} /> Out of office
          </Button>
          <Button
            variant={showAllDay ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllDay((v) => !v)}
            className="gap-1.5"
            title="Show or hide all-day events (retreat, flights, personal) on the grid"
          >
            <CalendarDays size={14} /> All-day
          </Button>
        </div>
      </div>

      {/* Phase 3: iCloud calendar status */}
      <GcalStatusRow
        events={icloudEvents}
        total={icloudTotal}
        loading={icloudLoading}
        error={icloudError}
      />

      {/* Phase 2: planner bar */}
      <PlannerBar
        kind={kind}
        onKindChange={setKind}
        fnhEventType={fnhEventType}
        onFnhEventType={setFnhEventType}
        voiceEventType={voiceEventType}
        onVoiceEventType={setVoiceEventType}
        selectedClientId={selectedClientId}
        onSelectedClientId={setSelectedClientId}
        selectedStudentEmail={selectedStudentEmail}
        onSelectStudent={(name, email) => {
          setSelectedStudentName(name);
          setSelectedStudentEmail(email);
        }}
        fnhClients={enrichedClients}
        voiceStudents={enrichedVoiceStudents}
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-0 z-10 bg-background border-b border-border -mx-4 px-4 md:-mx-6 md:px-6 py-2">
          <TabsList className="w-full sm:w-auto flex-wrap gap-1 bg-muted/60 rounded-xl p-1">
            <TabsTrigger value="fortnight" className="gap-2">
              <CalendarDays size={14} /> Fortnightly Mock-up
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <TrendingUp size={14} /> Forward Forecast
            </TabsTrigger>
            <TabsTrigger value="autodraft" className="gap-2">
              <Sparkles size={14} /> Auto-draft
            </TabsTrigger>
            {suggestions.length > 0 && (
              <TabsTrigger value="suggestions" className="gap-2">
                <Sparkles size={14} /> Suggestions
                <span className="ml-1 h-5 w-5 rounded-full bg-chart-primary text-[10px] font-black text-primary-foreground flex items-center justify-center leading-none">
                  {suggestions.length}
                </span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="fortnight" className="m-0 mt-4">
          <FortnightMockup
            dateRange={dateRange.slice(fortnightIndex * 14, fortnightIndex * 14 + 14)}
            totalFortnights={Math.ceil(dateRange.length / 14)}
            fortnightIndex={fortnightIndex}
            onPrev={() => setFortnightIndex((i) => Math.max(0, i - 1))}
            onNext={() =>
              setFortnightIndex((i) =>
                Math.min(Math.ceil(dateRange.length / 14) - 1, i + 1)
              )
            }
            slots={slots}
            bookings={bookingsByDate}
            blockedDates={blockedDates}
            icloudEvents={visibleIcloudEvents}
            stateFor={stateFor}
            proposals={proposalsInWindow}
            loading={loading}
            error={error}
            onOpenDay={openDay}
            onOpenProposal={openProposal}
            onOpenBooking={setAppointmentFor}
          />
        </TabsContent>

        <TabsContent value="forecast" className="m-0 mt-4">
          <ForecastPlot
            data={forecastData}
            proposals={proposalsInWindow}
            loading={loading}
            error={error}
          />
        </TabsContent>

        <TabsContent value="autodraft" className="m-0 mt-4">
          <AutoDraftPanel
            clients={autoDraftClients}
            openSlots={autoDraftOpenSlots}
            busyBlocks={autoDraftBusy}
            takenSlotStarts={autoDraftTaken}
            fnhDurationMin={60}
            voiceDurationMin={45}
            onAccept={(input) =>
              createProposal({
                ...input,
                // Per-client service/rate chosen in the panel; fall back to the
                // page default event type for that kind.
                eventTypeId: input.eventTypeId ?? (input.kind === "fnh" ? fnhEventType : voiceEventType),
              })
            }
            onDraftChange={setDraftAssignments}
            awayByKey={awayByKey}
            onSetAway={setAway}
            availabilityByKey={availabilityByKey}
            onSavePrefs={saveClientPrefs}
            onEmailTimes={async (a, message) => {
              const { error } = await supabase.functions.invoke("send-proposed-times", {
                body: { to: a.email, name: a.name, startISO: a.slotStart.toISOString(), kind: a.kind, message },
              });
              if (error) {
                showError(error.message || "Couldn't send email.");
                throw error;
              }
              showSuccess(`Emailed ${a.name} their proposed time.`);
            }}
            calendarPreview={
              <div className="space-y-8">
                {[0, 1, 2, 3, 4, 5].map((fi) => {
                  const slice = dateRange.slice(fi * 14, fi * 14 + 14);
                  if (slice.length === 0) return null;
                  return (
                    <FortnightMockup
                      key={fi}
                      dateRange={slice}
                      totalFortnights={Math.ceil(dateRange.length / 14)}
                      fortnightIndex={fi}
                      onPrev={() => {}}
                      onNext={() => {}}
                      hideNav
                      title={`Fortnight ${fi + 1} · ${format(slice[0], "d MMM")} – ${format(slice[slice.length - 1], "d MMM")}`}
                      hiddenWeeks={hiddenWeeks}
                      onToggleWeek={(key) =>
                        setHiddenWeeks((prev) => {
                          const next = new Set(prev);
                          next.has(key) ? next.delete(key) : next.add(key);
                          return next;
                        })
                      }
                      slots={slots}
                      bookings={bookingsByDate}
                      blockedDates={blockedDates}
                      icloudEvents={visibleIcloudEvents}
                      stateFor={stateFor}
                      proposals={[...proposalsInWindow, ...draftPreviewProposals]}
                      loading={loading}
                      error={error}
                      onOpenDay={openDay}
                      onOpenProposal={(p) => { setWorkflowFor(p); setWorkflowEmailOpen(false); }}
                      onOpenBooking={setAppointmentFor}
                    />
                  );
                })}
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="suggestions" className="m-0 mt-4">
          <SuggestionsPanel
            suggestions={suggestions}
            onAccept={async (s) => {
              setWorking(true);
              try {
                const slot = s.availableSlots[0];
                if (!slot) return;
                const endIso = new Date(new Date(slot.start).getTime() + 60 * 60 * 1000).toISOString();
                const isVoice = s.source === "voice-pattern";
                await createProposal({
                  kind: isVoice ? "voice" : "fnh",
                  clientId: isVoice ? null : s.clientId,
                  studentName: isVoice ? s.clientName : null,
                  studentEmail: isVoice ? enrichedVoiceStudents.find((vs) => vs.id === s.clientId)?.email || null : null,
                  eventTypeId: isVoice ? voiceEventType : fnhEventType,
                  slotStart: slot.start,
                  slotEnd: endIso,
                });
                showSuccess(`Proposal created for ${s.clientName} — confirm to book.`);
              } catch (err) {
                showError(err instanceof Error ? err.message : "Failed to create proposal.");
              } finally {
                setWorking(false);
              }
            }}
            working={working}
          />
        </TabsContent>
      </Tabs>

      <LegendRow />

      {/* Create proposal dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pencil in a proposal</DialogTitle>
            <DialogDescription>
              {pickingDay ? format(pickingDay, "EEEE d MMM yyyy") : ""} — choose a slot time to
              propose for {kind === "fnh" ? "an FNH session" : "a voice lesson"}.
            </DialogDescription>
          </DialogHeader>
          {pickingDay && (
            <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
              {(slots[zonedDateKey(pickingDay)] || []).map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start font-medium"
                  disabled={working}
                  onClick={() => {
                    const startIso = new Date(s.start).toISOString();
                    const endIso = new Date(
                      new Date(s.start).getTime() + 60 * 60 * 1000
                    ).toISOString();
                    handleCreateProposal(startIso, endIso);
                  }}
                >
                  <PenLine size={14} className="mr-2 text-chart-primary" />
                  {format(new Date(s.start), "h:mm a")} — 60 min
                </Button>
              ))}
              {!slots[zonedDateKey(pickingDay)]?.length && (
                <p className="text-sm text-muted-foreground">No times on this day.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={working}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage proposal dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposal</DialogTitle>
            <DialogDescription>
              {proposalFor
                ? `${format(new Date(proposalFor.slot_start), "EEEE d MMM yyyy, h:mm a")}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {proposalFor && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Who</span>
                <span className="text-sm font-bold text-foreground">
                  {proposalFor.kind === "fnh"
                    ? fnhClients.find((c) => c.id === proposalFor.client_id)?.name ||
                      "FNH client"
                    : proposalFor.student_name || "Voice student"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">
                  {proposalFor.kind}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <StatusBadge status={proposalFor.status} />
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleDrop}
              disabled={working || proposalFor?.status === "confirmed"}
            >
              <X size={14} /> Drop
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setManageOpen(false)} disabled={working}>
                Close
              </Button>
              <Button
                className="gap-1.5"
                onClick={handleConfirm}
                disabled={working || proposalFor?.status === "confirmed"}
              >
                {working ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                Confirm booking
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment detail modal (clickable cal.com booking) */}
      <Dialog open={appointmentFor !== null} onOpenChange={(o) => { if (!o) setAppointmentFor(null); }}>
        <DialogContent>
          {appointmentFor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black text-white"
                    style={{
                      background: appointmentFor.source === "voice"
                        ? "hsl(var(--chart-emerald))"
                        : "hsl(var(--chart-primary))",
                    }}
                  >
                    {(appointmentFor.attendeeName || appointmentFor.title || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="truncate">
                      {appointmentFor.attendeeName || appointmentFor.title || "Appointment"}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 capitalize">
                      {appointmentFor.source === "voice" ? "Voice Lesson" : "FNH Clinical Session"}
                      {appointmentFor.proposalStatus && appointmentFor.proposalStatus !== "dropped" ? (
                        <span className="ml-2 align-middle">
                          <StatusBadge status={appointmentFor.proposalStatus as BookingProposal["status"]} />
                        </span>
                      ) : null}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-2.5">
                <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {appointmentFor.source === "voice" ? "Student" : "Client"}
                  </div>
                  <div className="mt-0.5 text-[15px] font-bold text-foreground">
                    {appointmentFor.attendeeName || appointmentFor.title || "—"}
                  </div>
                </div>
                {appointmentFor.attendeeEmail && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{appointmentFor.attendeeEmail}</div>
                  </div>
                )}
                <div className="flex gap-2.5">
                  <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground">
                      {appointmentFor.start
                        ? format(new Date(appointmentFor.start), "EEE d MMM yyyy")
                        : "—"}
                    </div>
                  </div>
                  <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time</div>
                    <div className="mt-0.5 text-sm font-semibold text-foreground">
                      {appointmentFor.start
                        ? format(new Date(appointmentFor.start), "h:mm a")
                        : "—"}
                    </div>
                  </div>
                </div>
                {appointmentFor.title && appointmentFor.title !== appointmentFor.attendeeName && (
                  <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{appointmentFor.title}</div>
                  </div>
                )}
                {appointmentFor.source === "fnh" && appointmentFor.appointmentId && (
                  <a
                    href={`/appointments/${appointmentFor.appointmentId}`}
                    className="block w-full text-center rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Open session page
                  </a>
                )}
              </div>
            </>
          )}
          <DialogFooter className="flex sm:justify-between pt-1">
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={openCancelConfirm}
              disabled={cancellingAppt}
            >
              {cancellingAppt ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />}
              Cancel booking
            </Button>
            <Button variant="ghost" onClick={() => setAppointmentFor(null)} disabled={cancellingAppt}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm cancellation */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              This cancels the Cal.com booking for{" "}
              <strong>{appointmentFor?.attendeeName || appointmentFor?.title || "this appointment"}</strong>{" "}
              and frees the slot. This can't be undone.
            </DialogDescription>
          </DialogHeader>

          {appointmentFor?.attendeeEmail && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                <input type="checkbox" checked={emailOnCancel} onChange={(e) => setEmailOnCancel(e.target.checked)} />
                Email {appointmentFor.attendeeName?.split(" ")[0] || "the client"} a cancellation note
              </label>
              {emailOnCancel && (
                <textarea
                  value={cancelMessage}
                  onChange={(e) => setCancelMessage(e.target.value)}
                  rows={6}
                  className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          )}

          <DialogFooter className="flex sm:justify-between">
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)} disabled={cancellingAppt}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={handleCancelAppointment}
              disabled={cancellingAppt}
            >
              {cancellingAppt ? <Loader2 className="animate-spin" size={14} /> : <Ban size={14} />}
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session workflow: Draft → Pencilled → Locked in */}
      <Dialog open={workflowFor !== null} onOpenChange={(o) => { if (!o) { setWorkflowFor(null); setWorkflowEmailOpen(false); } }}>
        <DialogContent>
          {workflowFor && (() => {
            const p = workflowFor;
            const isDraft = String(p.id).startsWith("draft:");
            const stage = p.status === "confirmed" ? 2 : p.status === "proposed" ? 1 : 0;
            const email = resolveProposalEmail(p);
            const steps = ["Draft", "Pencilled", "Locked in"];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif">
                    {p.student_name || (p.kind === "fnh" ? "FNH session" : "Voice lesson")}
                  </DialogTitle>
                  <DialogDescription>
                    {format(new Date(p.slot_start), "EEEE d MMMM yyyy · h:mm a")} · {p.kind === "fnh" ? "FNH" : "Voice"}
                  </DialogDescription>
                </DialogHeader>

                {/* Stepper */}
                <div className="flex items-center gap-1.5 my-1">
                  {steps.map((label, i) => (
                    <div key={label} className="flex items-center gap-1.5 flex-1">
                      <div className={cn(
                        "flex-1 rounded-full text-center text-[11px] font-bold py-1.5 border",
                        i < stage && "bg-chart-emerald/15 text-chart-emerald border-chart-emerald/30",
                        i === stage && "bg-foreground text-background border-foreground",
                        i > stage && "text-muted-foreground border-border",
                      )}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email panel */}
                {workflowEmailOpen && email && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">To {email}</div>
                    <textarea
                      value={workflowMsg}
                      onChange={(e) => setWorkflowMsg(e.target.value)}
                      rows={7}
                      className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setWorkflowEmailOpen(false)}>Cancel</Button>
                      <Button
                        size="sm"
                        disabled={workflowBusy}
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                        onClick={async () => {
                          setWorkflowBusy(true);
                          try {
                            const { error } = await supabase.functions.invoke("send-proposed-times", {
                              body: { to: email, name: p.student_name, startISO: p.slot_start, kind: p.kind, message: workflowMsg },
                            });
                            if (error) throw error;
                            showSuccess(`Emailed ${p.student_name || "the client"}.`);
                            setWorkflowEmailOpen(false);
                          } catch (e: any) {
                            showError(e?.message || "Couldn't send email.");
                          } finally {
                            setWorkflowBusy(false);
                          }
                        }}
                      >
                        {workflowBusy ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Mail size={14} className="mr-1.5" />} Send
                      </Button>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
                  <div className="flex gap-2">
                    {email && !workflowEmailOpen && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          const first = (p.student_name || "there").split(" ")[0];
                          setWorkflowMsg(`Hi ${first},\n\nI've got a time in mind for you — ${format(new Date(p.slot_start), "EEEE d MMMM 'at' h:mm a")}. What do you think? If it works I'll lock it in; if not, tell me what suits.\n\nAll the best,\nDaniele`);
                          setWorkflowEmailOpen(true);
                        }}
                      >
                        <Mail size={14} /> Email client
                      </Button>
                    )}
                    {stage >= 1 && !isDraft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={workflowBusy}
                        onClick={async () => {
                          setWorkflowBusy(true);
                          try { await dropProposal(p.id); showSuccess("Dropped."); setWorkflowFor(null); }
                          catch (e: any) { showError(e?.message || "Couldn't drop."); }
                          finally { setWorkflowBusy(false); }
                        }}
                      >
                        Drop
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {stage === 0 && (
                      <Button
                        size="sm"
                        disabled={workflowBusy || !isDraft}
                        className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={async () => {
                          setWorkflowBusy(true);
                          const created = await pencilInDraft(p);
                          setWorkflowBusy(false);
                          if (created) setWorkflowFor(created);
                        }}
                      >
                        {workflowBusy ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />} Pencil in
                      </Button>
                    )}
                    {stage === 1 && (
                      <Button
                        size="sm"
                        disabled={workflowBusy}
                        className="gap-1.5 bg-chart-emerald hover:bg-emerald-700 text-white"
                        onClick={async () => {
                          setWorkflowBusy(true);
                          try { await confirmProposal(p.id); showSuccess("Locked in to Cal.com."); setWorkflowFor({ ...p, status: "confirmed" }); }
                          catch (e: any) { showError(e?.message || "Couldn't lock in."); }
                          finally { setWorkflowBusy(false); }
                        }}
                      >
                        {workflowBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Lock in
                      </Button>
                    )}
                    {stage === 2 && (
                      <span className="text-sm font-semibold text-chart-emerald flex items-center gap-1.5"><Check size={16} /> Locked in</span>
                    )}
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Out-of-office block */}
      <Dialog open={oooOpen} onOpenChange={setOooOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane size={18} className="text-chart-primary" /> Block out-of-office
            </DialogTitle>
            <DialogDescription>
              Hold a block of time as busy on Cal.com so no one can book it. This is a hard
              out-of-office block across all event types.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Start
                </Label>
                <Input
                  type="datetime-local"
                  value={oooStart}
                  onChange={(e) => setOooStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  End
                </Label>
                <Input
                  type="datetime-local"
                  value={oooEnd}
                  onChange={(e) => setOooEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Reason (optional)
              </Label>
              <Input
                placeholder="e.g. Holiday, conference, personal time"
                value={oooReason}
                onChange={(e) => setOooReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button variant="ghost" onClick={() => setOooOpen(false)} disabled={settingOoo}>
              Close
            </Button>
            <Button className="gap-1.5" onClick={handleSetOutOfOffice} disabled={settingOoo}>
              {settingOoo ? <Loader2 className="animate-spin" size={14} /> : <Plane size={14} />}
              Set out-of-office
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function GcalStatusRow({
  events,
  total,
  loading,
  error,
}: {
  events: IcloudCalendarEvent[];
  total: number;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-2">
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 size={14} className="text-muted-foreground animate-spin" />
        ) : (
          <CalendarDays size={14} className="text-chart-primary" />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Calendar
        </span>
      </div>
      {error ? (
        <p className="text-[10px] font-medium text-rose-600">{error}</p>
      ) : (
        <p className="text-[10px] font-medium text-muted-foreground">
          {loading
            ? "Loading…"
            : total > events.length
              ? `${events.length} of ${total} busy events shown (${total - events.length} all-day)`
              : `${events.length} busy events in range`}
        </p>
      )}
    </div>
  );
}

function PlannerBar({
  kind,
  onKindChange,
  fnhEventType,  onFnhEventType,
  voiceEventType,
  onVoiceEventType,
  selectedClientId,
  onSelectedClientId,
  selectedStudentEmail,
  onSelectStudent,
  fnhClients,
  voiceStudents,
}: {
  kind: SessionKind;
  onKindChange: (k: SessionKind) => void;
  fnhEventType: string;
  onFnhEventType: (v: string) => void;
  voiceEventType: string;
  onVoiceEventType: (v: string) => void;
  selectedClientId: string;
  onSelectedClientId: (v: string) => void;
  selectedStudentEmail: string;
  onSelectStudent: (name: string, email: string) => void;
  fnhClients: EnrichedClient[];
  voiceStudents: EnrichedVoiceStudent[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col lg:flex-row gap-3 lg:items-end">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Session type
        </label>
        <Select value={kind} onValueChange={(v) => onKindChange(v as SessionKind)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fnh" className="gap-2">
              <User size={14} /> FNH clinical
            </SelectItem>
            <SelectItem value="voice">
              <Music size={14} /> Voice / piano
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {kind === "fnh" ? "Event type" : "Lesson length"}
        </label>
        <Select
          value={kind === "fnh" ? fnhEventType : voiceEventType}
          onValueChange={kind === "fnh" ? onFnhEventType : onVoiceEventType}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kind === "fnh"
              ? CALCOM_CONFIG.EVENT_TYPES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))
              : VOICE_EVENT_TYPES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 flex-[1.5] min-w-0">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {kind === "fnh" ? "Client" : "Student"}
        </label>
        {kind === "fnh" ? (
          <Select value={selectedClientId} onValueChange={onSelectedClientId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a client" />
            </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {fnhClients.map((c) => {
                  const needsAttention =
                    (c.upcoming_count > 0 && !c.last_session_at) ||
                    (c.upcoming_count === 0 && c.session_count === 0);
                  return (
                    <SelectItem key={c.id} value={c.id} className="py-2">
                      <div className="flex flex-col w-full gap-0.5">
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="flex items-center gap-2 truncate">
                            <span className="shrink-0 h-2 w-2 rounded-full"
                              style={{
                                background: needsAttention
                                  ? "hsl(var(--chart-destructive))"
                                  : c.attention_score >= 60
                                    ? "hsl(var(--chart-primary))"
                                    : "hsl(var(--muted-foreground))",
                              }}
                            />
                            <span className="truncate">{c.name || "Unnamed client"}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0 ml-2">
                            {c.last_session_at === null && (
                              <span className="rounded bg-muted px-1 py-[1px] text-[8px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                                Never seen
                              </span>
                            )}
                            {c.last_session_at && (
                              <span className="rounded bg-muted px-1 py-[1px] text-[8px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                                Last {format(new Date(c.last_session_at), "d MMM")}
                                <span className="opacity-70">·&nbsp;{fmtSpan(differenceInDays(new Date(), new Date(c.last_session_at)))} ago</span>
                              </span>
                            )}
                            {c.next_session_at ? (
                              <span className="rounded bg-chart-primary/10 px-1 py-[1px] text-[8px] font-bold uppercase tracking-wide text-chart-primary leading-none">
                                Next {format(new Date(c.next_session_at), "d MMM")}
                                {c.last_session_at && (
                                  <span className="opacity-70">
                                    {" · "}
                                    {fmtSpan(differenceInDays(new Date(c.next_session_at), new Date(c.last_session_at)))}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-500/10 px-1 py-[1px] text-[8px] font-bold uppercase tracking-wide text-amber-600 leading-none">
                                No next
                              </span>
                            )}
                          </span>
                        </div>
                        {c.availability_notes && (
                          <span className="truncate pl-4 text-[9px] italic text-muted-foreground/70 leading-none">
                            {c.availability_notes}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
        ) : (
          <Select
            value={selectedStudentEmail}
            onValueChange={(email) => {
              const s = voiceStudents.find((st) => st.email === email);
              onSelectStudent(s?.name || email, email);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {voiceStudents.map((s) => {
                if (!s.email) return null;
                const needsAttention =
                  (s.upcoming_count > 0 && !s.last_session_at) ||
                  (s.upcoming_count === 0 && s.session_count === 0);
                return (
                  <SelectItem key={s.email} value={s.email} className="py-2">
                    <div className="flex flex-col w-full gap-0.5">
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="flex items-center gap-2 truncate">
                          <span className="shrink-0 h-2 w-2 rounded-full"
                            style={{
                              background: needsAttention
                                ? "hsl(var(--chart-destructive))"
                                : s.attention_score >= 60
                                  ? "hsl(var(--chart-primary))"
                                  : "hsl(var(--muted-foreground))",
                            }}
                          />
                          <span className="truncate">{s.name || s.email}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0 ml-2">
                          {s.last_session_at === null && (
                            <span className="rounded bg-muted px-1 py-[1px] text-[8px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                              Never seen
                            </span>
                          )}
                          {s.last_session_at && (
                            <span className="rounded bg-muted px-1 py-[1px] text-[8px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                              Last {format(new Date(s.last_session_at), "d MMM")}
                              <span className="opacity-70">·&nbsp;{fmtSpan(differenceInDays(new Date(), new Date(s.last_session_at)))} ago</span>
                            </span>
                          )}
                          {s.next_session_at ? (
                            <span className="rounded bg-chart-primary/10 px-1 py-[1px] text-[8px] font-bold uppercase tracking-wide text-chart-primary leading-none">
                              Next {format(new Date(s.next_session_at), "d MMM")}
                              {s.last_session_at && (
                                <span className="opacity-70">
                                  {" · "}
                                  {fmtSpan(differenceInDays(new Date(s.next_session_at), new Date(s.last_session_at)))}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="rounded bg-amber-500/10 px-1 py-[1px] text-[8px] font-bold uppercase tracking-wide text-amber-600 leading-none">
                              No next
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingProposal["status"] }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-600/10 text-emerald-600 border-none" variant="outline">
        Confirmed
      </Badge>
    );
  if (status === "suggested")
    return (
      <Badge className="bg-sky-600/10 text-sky-600 border-none" variant="outline">
        Suggested
      </Badge>
    );
  return (
    <Badge className="bg-amber-600/10 text-amber-600 border-none" variant="outline">
      Proposed
    </Badge>
  );
}

function FortnightMockup({
  dateRange,
  totalFortnights,
  fortnightIndex,
  onPrev,
  onNext,
  slots,
  bookings,
  blockedDates,
  icloudEvents,
  stateFor,
  proposals,
  loading,
  error,
  onOpenDay,
  onOpenProposal,
  onOpenBooking,
  hideNav = false,
  title,
  hiddenWeeks,
  onToggleWeek,
}: {
  dateRange: Date[];
  totalFortnights: number;
  fortnightIndex: number;
  onPrev: () => void;
  onNext: () => void;
  hideNav?: boolean;
  title?: string;
  hiddenWeeks?: Set<string>;
  onToggleWeek?: (weekKey: string) => void;
  slots: Record<string, SlotInfo[]>;
  bookings: Record<string, EnrichedBooking[]>;
  blockedDates: string[];
  icloudEvents: IcloudCalendarEvent[];
  stateFor: (d: Date) => DayState;
  proposals: BookingProposal[];
  loading: boolean;
  error: string | null;
  onOpenDay: (d: Date) => void;
  onOpenProposal: (p: BookingProposal) => void;
  onOpenBooking: (b: EnrichedBooking) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading timetable…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
      </div>
    );
  }

  const weeks = dateRange.length
    ? [dateRange.slice(0, 7), dateRange.slice(7, 14)]
    : [];
  const weekdayLabel = (d: Date) => format(d, "EEE");

  return (
    <div className="space-y-5">
      {hideNav ? (
        title ? (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        ) : null
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={fortnightIndex <= 0}
            className="gap-1.5"
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Fortnight {fortnightIndex + 1} of {totalFortnights}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={fortnightIndex >= totalFortnights - 1}
            className="gap-1.5"
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
      {weeks.map((week, wi) => {
        const weekKey = format(week[0], "yyyy-MM-dd");
        const isHidden = hiddenWeeks?.has(weekKey);
        return (
        <div key={wi} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
              Week {wi + 1} — {format(week[0], "d MMM")} to {format(week[6], "d MMM yyyy")}
            </p>
            {onToggleWeek && (
              <button
                onClick={() => onToggleWeek(weekKey)}
                className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70 hover:text-foreground"
              >
                {isHidden ? <><Eye size={11} /> Show</> : <><EyeOff size={11} /> Hide</>}
              </button>
            )}
          </div>
          {!isHidden && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {week.map((d) => (
              <DayCell
                key={d.toISOString()}
                date={d}
                state={stateFor(d)}
                slots={slots[zonedDateKey(d)] || []}
                bookings={bookings[zonedDateKey(d)] || []}
                proposals={proposals.filter((p) => isSameDay(new Date(p.slot_start), d))}
                icloudEvents={icloudEvents.filter((ev) => {
                  if (!ev.start || ev.transparent) return false;
                  const s = new Date(ev.start);
                  const e = ev.end ? new Date(ev.end) : s;
                  const dayBookings = bookings[zonedDateKey(d)] || [];
                  const overlapsBooked = dayBookings.some((b) => {
                    if (!b.start) return false;
                    const bs = new Date(b.start).getTime();
                    const sameTime = Math.abs(bs - s.getTime()) < 60 * 60 * 1000;
                    const nameMatch =
                      b.attendeeName &&
                      ev.summary &&
                      ev.summary.toLowerCase().includes(b.attendeeName.toLowerCase());
                    return sameTime || nameMatch;
                  });
                  if (overlapsBooked) return false;
                  return (
                    isSameDay(s, d) ||
                    isSameDay(e, d) ||
                    (s < endOfDay(d) && e > startOfDay(d))
                  );
                })}
                blocked={blockedDates.includes(zonedDateKey(d))}
                weekdayLabel={weekdayLabel}
                onOpenDay={onOpenDay}
                onOpenProposal={onOpenProposal}
                onOpenBooking={onOpenBooking}
              />
            ))}
          </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

function DayCell({
  date,
  state,
  slots,
  bookings,
  proposals,
  icloudEvents,
  blocked,
  weekdayLabel,
  onOpenDay,
  onOpenProposal,
  onOpenBooking,
}: {
  date: Date;
  state: DayState;
  slots: SlotInfo[];
  bookings: EnrichedBooking[];
  proposals: BookingProposal[];
  icloudEvents: IcloudCalendarEvent[];
  blocked: boolean;
  weekdayLabel: (d: Date) => string;
  onOpenDay: (d: Date) => void;
  onOpenProposal: (p: BookingProposal) => void;
  onOpenBooking: (b: EnrichedBooking) => void;
}) {
  const isPast = differenceInMinutes(date, new Date()) < -1;
  const isOpen = state === DayState.OPEN;

  return (
    <div
      onClick={() => onOpenDay(date)}
      className={cn(
        "rounded-xl border p-2.5 min-h-[140px] flex flex-col transition-all",
        state === DayState.BLOCKED && "bg-muted/40 border-border/60 opacity-70 cursor-default",
        state === DayState.OPEN && "bg-card border-border hover:border-chart-primary/50 cursor-pointer",
        state === DayState.BOOKED && "bg-rose-50/50 border-rose-200/70 cursor-default",
        state === DayState.EMPTY && "bg-muted/20 border-border/40 cursor-default",
        isPast && "opacity-45"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {weekdayLabel(date)}
          </p>
          <p className="text-sm font-bold text-foreground leading-tight">{format(date, "d")}</p>
        </div>
        <StateDot state={state} />
      </div>

      <div className="flex-1 space-y-1">
        {blocked && (
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            <Ban size={9} /> Blocked
          </div>
        )}

        {(() => {
          const fmtT = (iso: string | undefined | null) =>
            iso ? format(new Date(iso), "h:mma").toLowerCase() + " · " : "";
          const items = [
            ...bookings.map((b, i) => ({
              t: b.start ? new Date(b.start).getTime() : 0,
              node: (
                <button
                  key={`b-${b.uid || b.id || i}`}
                  onClick={(e) => { e.stopPropagation(); onOpenBooking(b); }}
                  title={b.title || b.attendeeName || "Appointment"}
                  className="w-full text-left text-[9px] font-semibold bg-rose-600 text-primary-foreground rounded-md px-1.5 py-0.5 truncate hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  {fmtT(b.start)}{b.attendeeName || b.title || "Booked"}
                </button>
              ),
            })),
            ...proposals.map((p) => ({
              t: new Date(p.slot_start).getTime(),
              node: (
                <button
                  key={`p-${p.id}`}
                  onClick={(e) => { e.stopPropagation(); onOpenProposal(p); }}
                  className={cn(
                    "w-full text-left text-[9px] font-semibold rounded-md px-1.5 py-0.5 truncate border",
                    p.status === "confirmed" && "bg-emerald-600 text-primary-foreground border-emerald-700",
                    p.status === "suggested" && "bg-sky-600 text-primary-foreground border-sky-700",
                    p.status === "proposed" && "bg-amber-500 text-primary-foreground border-amber-600",
                  )}
                >
                  {fmtT(p.slot_start)}{p.student_name || (p.kind === "fnh" ? "FNH" : "student")}
                </button>
              ),
            })),
          ].sort((a, b) => a.t - b.t);
          return <>{items.map((x) => x.node)}</>;
        })()}

        {icloudEvents.slice(0, 2).map((ev) => (
          <div
            key={ev.id}
            title={ev.summary || "Busy"}
            className="text-[9px] font-medium bg-violet-500/10 text-violet-700 border border-violet-200/60 rounded-md px-1.5 py-0.5 truncate"
          >
            {ev.summary || "Busy"}
          </div>
        ))}
        {icloudEvents.length > 2 && (
          <div className="text-[9px] font-bold text-violet-600 pl-0.5">
            +{icloudEvents.length - 2} more
          </div>
        )}

        {!blocked && isOpen && (
          <div className="text-[9px] font-semibold text-chart-primary">
            {slots.length} open slots
          </div>
        )}
        {!isOpen && state === DayState.EMPTY && (
          <div className="text-[9px] text-muted-foreground/50 font-medium">No availability</div>
        )}
      </div>
    </div>
  );
}

function StateDot({ state }: { state: DayState }) {
  if (state === DayState.BLOCKED)
    return <Ban size={11} className="text-muted-foreground" />;
  if (state === DayState.BOOKED) return <CheckCircle2 size={11} className="text-rose-500" />;
  if (state === DayState.OPEN) return <Circle size={11} className="text-chart-primary" />;
  return <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />;
}

function ForecastPlot({
  data,
  proposals,
  loading,
  error,
}: {
  data: { label: string; open: number; booked: number; blocked: number }[];
  proposals: BookingProposal[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} /> Building forecast…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
      </div>
    );
  }

  const proposed = proposals.filter((p) => p.status === "proposed").length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold text-foreground">Potential load over the next {data.length} weeks</p>
          <Badge className="bg-amber-500/10 text-amber-600 border-none" variant="outline">
            {proposed} proposed
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium mb-4">
          Open slots per week vs. confirmed bookings and blocked days from your availability.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="open" name="Open" stackId="a" fill="hsl(var(--chart-primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="booked" name="Booked" stackId="a" fill="hsl(var(--chart-destructive))" />
              <Bar dataKey="blocked" name="Blocked" stackId="b" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-bold text-foreground mb-3">Weekly breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {data.map((w) => (
            <div key={w.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{w.label}</span>
              <span className="text-[10px] font-semibold text-chart-primary">{w.open} open</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendRow() {
  return (
    <div className="flex flex-wrap items-center gap-4 px-1 text-[10px] font-semibold text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Circle size={11} className="text-chart-primary" /> Open
      </span>
      <span className="flex items-center gap-1.5">
        <CheckCircle2 size={11} className="text-rose-500" /> Booked
      </span>
      <span className="flex items-center gap-1.5">
        <Ban size={11} className="text-muted-foreground" /> Blocked
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" /> No availability
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Proposed
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Confirmed
      </span>
    </div>
  );
}

function SuggestionsPanel({
  suggestions,
  onAccept,
  working,
}: {
  suggestions: Suggestion[];
  onAccept: (s: Suggestion) => void;
  working: boolean;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold">No suggestions yet</p>
        <p className="text-xs mt-1 max-w-sm mx-auto leading-relaxed">
          Suggestions appear when: a client has 2+ past sessions with a detectable rhythm,
          a client is overdue past their usual interval, or they have availability notes with matching open slots.
        </p>
      </div>
    );
  }

  const sourceBadge = (source: Suggestion["source"]) => {
    if (source === "pattern")
      return <Badge className="bg-chart-primary/10 text-chart-primary border-none text-[8px]" variant="outline">FNH pattern</Badge>;
    if (source === "voice-pattern")
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px]" variant="outline">Voice pattern</Badge>;
    if (source === "overdue")
      return <Badge className="bg-rose-500/10 text-rose-600 border-none text-[8px]" variant="outline">FNH overdue</Badge>;
    if (source === "voice-overdue")
      return <Badge className="bg-rose-500/10 text-rose-600 border-none text-[8px]" variant="outline">Voice overdue</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px]" variant="outline">Availability</Badge>;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} — patterns, overdue clients, and availability.
      </p>
      {suggestions.map((s, i) => (
        <div
          key={`${s.clientId}-${i}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground truncate">{s.clientName}</p>
              {sourceBadge(s.source)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {s.reason} · {format(s.predictedDate, "EEE d MMM yyyy")}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {s.availableSlots.slice(0, 4).map((sl, j) => (
                <span key={j} className="rounded bg-chart-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-chart-primary">
                  {sl.time}
                </span>
              ))}
              {s.availableSlots.length > 4 && (
                <span className="text-[9px] text-muted-foreground">+{s.availableSlots.length - 4} more</span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 rounded-xl"
            onClick={() => onAccept(s)}
            disabled={working}
          >
            {working ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
            Propose
          </Button>
        </div>
      ))}
    </div>
  );
}

export default TimetablePage;
