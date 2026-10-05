// @ts-nocheck
// One place that says which Cal.com event types exist and who handles them.
//
// Both Cal.com webhooks receive EVERY booking (they're registered at the
// account level), so each one must agree on ownership or a booking falls
// through both — that's how "15 Min Meeting" / "30 Min Meeting" / "2 hour
// meeting" bookings were silently dropped:
//   • fnh   → calcom-webhook (appointments row + send-manual-onboarding)
//   • voice → calcom-voice-webhook (Notion lessons + voice-send-onboarding)
//   • other → calcom-webhook sends a generic confirmation (send-booking-confirmation)
//
// Known ids come first; a NEW event type is classified from its title/slug so
// adding e.g. a 90-min coaching type on Cal.com works without a code change.

export const FNH_EVENT_TYPES: Record<number, { label: string; price: number; durationMin: number }> = {
  4279898: { label: "FNH Neuro-Health Assessment", price: 70, durationMin: 60 },
  5302336: { label: "FNH Neuro-Health Session", price: 100, durationMin: 60 },
  5927215: { label: "FNH Community Session", price: 0, durationMin: 60 },
};

export const VOICE_EVENT_TYPES: Record<number, { label: string; price: number; durationMin: number }> = {
  1945081: { label: "Voice and Piano Coaching (60 min)", price: 95, durationMin: 60 },
  5925021: { label: "Voice and Piano Coaching (45 min)", price: 75, durationMin: 45 },
  6488157: { label: "Voice and Piano Coaching (30 min)", price: 50, durationMin: 30 },
};

export type EventKind = "fnh" | "voice" | "other";

function eventTypeIdOf(b: any): number | null {
  const raw = b?.eventTypeId ?? b?.eventType?.id ?? b?.type?.id ?? null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Cal.com's booking title is "<Event title> between <Organiser> and <Attendee>",
// and the event titles carry their price ("… (60 min) — $95") — the email
// shows the price on its own, so keep just the session name.
function eventTitleOf(b: any): string {
  const t = b?.eventTitle || b?.eventType?.title || b?.title || "";
  return String(t)
    .split(/\s+between\s+/i)[0]
    .replace(/\s*[—–-]\s*\$\d+(?:\.\d+)?\s*$/, "")
    .trim();
}

function slugOf(b: any): string {
  const s = typeof b?.type === "string" ? b.type : b?.eventType?.slug || b?.eventTypeSlug || "";
  return String(s);
}

/** Works on a webhook payload or a Cal.com v2 booking object. */
export function classifyEventType(b: any): EventKind {
  const id = eventTypeIdOf(b);
  if (id && FNH_EVENT_TYPES[id]) return "fnh";
  if (id && VOICE_EVENT_TYPES[id]) return "voice";
  const text = `${eventTitleOf(b)} ${slugOf(b)}`.toLowerCase();
  if (/\b(fnh|neuro|kinesiology)\b/.test(text)) return "fnh";
  if (/\b(voice|piano|coaching|singing|vocal)\b/.test(text)) return "voice";
  return "other";
}

export interface EventTypeInfo {
  id: number | null;
  kind: EventKind;
  /** Client-facing session name, e.g. "Voice and Piano Coaching (60 min)". */
  name: string;
  durationMin: number | null;
  /** Price to charge in AUD (0 = no payment link). */
  price: number;
}

/**
 * Name, length and price for a booking. The editable event_pricing table wins
 * (Settings → event pricing), then the known catalogue, then Cal.com's own
 * payload (title, length, paid-event amount).
 */
export async function resolveEventType(supabase: any, b: any): Promise<EventTypeInfo> {
  const id = eventTypeIdOf(b);
  const kind = classifyEventType(b);
  const known = id ? (FNH_EVENT_TYPES[id] || VOICE_EVENT_TYPES[id]) : null;

  let pricing: any = null;
  if (id && supabase) {
    try {
      const { data } = await supabase
        .from("event_pricing")
        .select("label, price, duration_minutes, send_payment_link")
        .eq("calcom_event_type_id", id)
        .maybeSingle();
      pricing = data;
    } catch (_e) { /* table missing — fall back below */ }
  }

  const start = b?.startTime || b?.start;
  const end = b?.endTime || b?.end;
  const fromTimes = start && end ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000) : null;
  const durationMin = pricing?.duration_minutes ?? known?.durationMin ?? b?.length ?? b?.duration ?? (fromTimes && fromTimes > 0 ? fromTimes : null);

  const paidAmount = b?.payment?.[0]?.amount ? b.payment[0].amount / 100 : null;
  let price = 0;
  if (pricing) price = pricing.send_payment_link === false ? 0 : Number(pricing.price) || 0;
  else if (known) price = known.price;
  else if (paidAmount) price = paidAmount;
  else if (b?.price) price = Number(b.price) / 100 || 0; // Cal.com event price is in cents

  const name = eventTitleOf(b) || pricing?.label || known?.label || "Session";
  return { id, kind, name, durationMin, price };
}
