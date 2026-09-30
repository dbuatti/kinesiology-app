// A person's upcoming bookings, so an email like "I can't make the 26th, is
// Tuesday the 3rd ok?" is read as a MOVE of that booking rather than a new
// one. Cal.com is the source of truth for uids and times (it holds both
// kinesiology sessions and voice/piano lessons); the CRM rows only add what
// kind of booking it is. If Cal.com can't be reached, kinesiology falls back
// to the appointments table.

export interface UpcomingBooking {
  uid: string;
  start: string;
  eventTypeId: string | null;
  title: string;
  kind: "kinesiology" | "voice" | "piano" | null;
  appointmentId: string | null;
}

const FNH_EVENT_TYPES = new Set(["5302336", "4279898", "5927215"]);

function kindFrom(title: string, eventTypeId: string | null): UpcomingBooking["kind"] {
  if (eventTypeId && FNH_EVENT_TYPES.has(eventTypeId)) return "kinesiology";
  if (/piano/i.test(title)) return "piano";
  if (/voice|lesson|singing/i.test(title)) return "voice";
  if (/kinesiology|fnh|neuro/i.test(title)) return "kinesiology";
  return null;
}

async function fromCalcom(email: string): Promise<UpcomingBooking[] | null> {
  const key = Deno.env.get("CALCOM_API_KEY");
  if (!key) return null;
  const url = new URL("https://api.cal.com/v2/bookings");
  url.searchParams.set("attendeeEmail", email);
  url.searchParams.set("status", "upcoming");
  url.searchParams.set("take", "20");
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}`, "cal-api-version": "2024-08-13" },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    const rows: any[] = Array.isArray(data?.data) ? data.data : [];
    const now = Date.now();
    return rows
      // The filter is checked here too, not trusted: a wrong match here would
      // move someone else's booking.
      .filter((b) => (b.attendees || []).some((a: any) => String(a?.email || "").toLowerCase() === email))
      .filter((b) => !/cancel|reject/i.test(String(b.status || "")) && new Date(b.start).getTime() > now)
      .map((b): UpcomingBooking => {
        const eventTypeId = b.eventTypeId ?? b.eventType?.id ?? null;
        const title = String(b.title || b.eventType?.slug || "");
        return {
          uid: String(b.uid),
          start: new Date(b.start).toISOString(),
          eventTypeId: eventTypeId != null ? String(eventTypeId) : null,
          title,
          kind: kindFrom(title, eventTypeId != null ? String(eventTypeId) : null),
          appointmentId: null,
        };
      });
  } catch {
    return null;
  }
}

export async function findUpcomingBookings(supabase: any, email: string | null, clientId: string | null): Promise<UpcomingBooking[]> {
  const e = String(email || "").trim().toLowerCase();
  let list = e ? await fromCalcom(e) : null;

  if (list) {
    const uids = list.map((b) => b.uid);
    if (uids.length) {
      const [{ data: appts }, { data: lessons }] = await Promise.all([
        supabase.from("appointments").select("id, calcom_booking_id").in("calcom_booking_id", uids),
        supabase.from("voice_bookings").select("calcom_booking_id, discipline").in("calcom_booking_id", uids),
      ]);
      const apptBy = new Map((appts || []).map((a: any) => [String(a.calcom_booking_id), a.id]));
      const lessonBy = new Map((lessons || []).map((l: any) => [String(l.calcom_booking_id), l.discipline]));
      list = list.map((b): UpcomingBooking => {
        if (apptBy.has(b.uid)) return { ...b, kind: "kinesiology", appointmentId: String(apptBy.get(b.uid)) };
        if (lessonBy.has(b.uid)) return { ...b, kind: String(lessonBy.get(b.uid) || "").toLowerCase() === "piano" ? "piano" : "voice" };
        return b;
      });
    }
  } else if (clientId) {
    const { data } = await supabase.from("appointments")
      .select("id, date, calcom_booking_id, status")
      .eq("client_id", clientId)
      .gte("date", new Date().toISOString())
      .not("calcom_booking_id", "is", null)
      .order("date", { ascending: true })
      .limit(10);
    list = (data || [])
      .filter((a: any) => String(a.status || "").toLowerCase() !== "cancelled")
      .map((a: any): UpcomingBooking => ({
        uid: String(a.calcom_booking_id), start: new Date(a.date).toISOString(), eventTypeId: null,
        title: "Kinesiology", kind: "kinesiology", appointmentId: a.id,
      }));
  }

  return (list || []).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function fmtBookingWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne",
  });
}
