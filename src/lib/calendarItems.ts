// The one merged list of kinesiology appointments and voice/piano lessons,
// shared by the Calendar and Today. Moved verbatim out of
// UnifiedCalendarPage.tsx — see CLAUDE.md "Voice Calendar Fallback": Notion
// lessons are primary, voice_bookings rows without a Notion lesson are the
// fallback, and every dedup layer below is additive. Never replace a layer.
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { CALCOM_CONFIG } from "@/config/integrations";
import { formatVoiceTime, voiceTimeDuration, voiceDateISO } from "@/utils/availability";

export interface VoiceLesson {
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

export interface VoiceBookingRow {
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

export interface KinesiologyAppt {
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

export interface CalendarItem {
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

export function parseStartTime(t: string): number {
  const m = t.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export interface CalendarInputs {
  voiceLessons: VoiceLesson[] | undefined;
  voiceBookings: VoiceBookingRow[] | undefined;
  kinesiologyAppts: KinesiologyAppt[] | undefined;
  priceFor: (eventTypeId: string | number) => number | undefined;
  practitionerEmail: string | null | undefined;
}

export function buildCalendarItems(inputs: CalendarInputs): CalendarItem[] {
  const { voiceLessons, voiceBookings, kinesiologyAppts, priceFor } = inputs;
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
    const practitionerEmail = inputs.practitionerEmail || "";
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
  // An explicit price_amount of 0 is the persisted "free" state (set from the
  // Bookings list / session doc) and always wins. Otherwise charge the client's
  // CURRENT rate (from Client Audit / standard_rate) — this is what "Send payment
  // link" bills — falling back to any per-appointment price.
  const isFree = a.priceAmount === 0;
  const currentRate = isFree ? 0 : ((a.standardRate && a.standardRate > 0) ? a.standardRate : (a.priceAmount && a.priceAmount > 0 ? a.priceAmount : 0));
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
}

// ── Fetchers (shared query keys, so a Calendar mutation's invalidation of
//    ["unified-kinesiology-appts"] refreshes Today too) ───────────────────

export async function fetchVoiceLessons(): Promise<VoiceLesson[]> {
  const res = await supabase.functions.invoke("voice-lessons");
  if (res.error) throw res.error;
  return (res.data?.lessons || []) as VoiceLesson[];
}

export async function fetchKinesiologyAppts(fetchStart: string, fetchEnd: string): Promise<KinesiologyAppt[]> {
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
}

const VOICE_BOOKING_BASE = "calcom_booking_id, student_email, student_name, lesson_date, lesson_time, cost, status, notion_lesson_id_1, notion_lesson_id_2";

// The merge reads discipline (voice/piano) and recurring-series fields, but the
// query never selected them, so piano fallback lessons showed as voice and series
// info never appeared. Selected now — with a retry without them, because
// PostgREST rejects a whole query that names a missing column.
export async function fetchVoiceBookings(): Promise<VoiceBookingRow[]> {
  const full = await supabase
    .from("voice_bookings")
    .select(`${VOICE_BOOKING_BASE}, discipline, series_id, series_frequency, series_occurrence, series_total`);
  if (!full.error) return (full.data || []) as VoiceBookingRow[];
  const { data } = await supabase.from("voice_bookings").select(VOICE_BOOKING_BASE);
  return (data || []) as VoiceBookingRow[];
}

// ── Money rules — the one definition of paid / unpaid, used by Today, the
//    Calendar and the Assistant's metrics ─────────────────────────────────
// Paid: kinesiology = payment_received (NOT is_paid, which only means
// "chargeable" and is set at booking); voice = Notion Payment or a
// voice_bookings row marked paid. Unpaid: happened already, not cancelled,
// not free, has a price, not paid.

export const UNPAID_LOOKBACK_DAYS = 60;

export const itemStart = (i: CalendarItem): Date => new Date(i.datetime || i.date);

export function isUnpaid(i: CalendarItem, now = new Date()): boolean {
  return !i.cancelled && !i.paid && !i.isFree && (i.amount ?? 0) > 0 && itemStart(i) < now;
}

export function unpaidItems(items: CalendarItem[], now = new Date()): CalendarItem[] {
  const from = now.getTime() - UNPAID_LOOKBACK_DAYS * 86400000;
  return items.filter((i) => isUnpaid(i, now) && itemStart(i).getTime() >= from);
}

export const sumAmount = (items: CalendarItem[]) => items.reduce((s, i) => s + (i.amount ?? 0), 0);

/** Fetch and merge everything between two dates (ISO), outside React. */
export async function loadCalendarItems(fromISO: string, toISO: string, practitionerEmail?: string | null): Promise<CalendarItem[]> {
  // The merge skips the practitioner's own self-bookings by email.
  const email = practitionerEmail ?? (await supabase.auth.getSession()).data.session?.user?.email ?? null;
  const [voiceLessons, voiceBookings, kinesiologyAppts, pricing] = await Promise.all([
    fetchVoiceLessons().catch(() => [] as VoiceLesson[]),
    fetchVoiceBookings(),
    fetchKinesiologyAppts(fromISO, toISO),
    supabase.from("event_pricing").select("calcom_event_type_id, price").then(({ data }) => data || []),
  ]);
  const priceFor = (id: string | number) =>
    (pricing as { calcom_event_type_id: number | string; price: number }[]).find((r) => Number(r.calcom_event_type_id) === Number(id))?.price;
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  return buildCalendarItems({ voiceLessons, voiceBookings, kinesiologyAppts, priceFor, practitionerEmail: email })
    .filter((i) => { const t = itemStart(i).getTime(); return t >= from && t <= to; });
}

/** Raw appointments row → paid? (payment actually received, and not a cancelled session). */
export const appointmentRowIsPaid = (a: { payment_received?: boolean | null; status?: string | null }) =>
  a.payment_received === true && (a.status || "").toLowerCase() !== "cancelled";
