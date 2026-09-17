// @ts-nocheck
// Client-portal slot listing. Deliberately NOT a thin wrapper around
// get-calcom-slots — that function also returns existing bookings +
// attendee emails (real PII, fine for the practitioner's own tools, never
// fine to hand to a client). This only ever returns open time slots.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireClient } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_EVENT_TYPE_IDS = new Set([4279898, 1945081, 5925021, 6488157]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const identity = await requireClient(req, corsHeaders);
    if (identity instanceof Response) return identity;

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const { start, end, eventTypeId, timeZone } = await req.json();
    if (!start || !end) throw new Error("Missing start/end.");
    const resolvedEventTypeId = parseInt(eventTypeId, 10) || 4279898;
    if (!ALLOWED_EVENT_TYPE_IDS.has(resolvedEventTypeId)) throw new Error("Unrecognised event type.");

    const slotsUrl = new URL("https://api.cal.com/v2/slots");
    slotsUrl.searchParams.set("start", start);
    slotsUrl.searchParams.set("end", end);
    slotsUrl.searchParams.set("eventTypeId", String(resolvedEventTypeId));
    if (timeZone) slotsUrl.searchParams.set("timeZone", timeZone);

    const res = await fetch(slotsUrl.toString(), {
      headers: { Authorization: `Bearer ${CALCOM_KEY}`, "cal-api-version": "2024-09-04" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Cal.com slots error.");

    // Normalise to { "2026-10-26": ["2026-10-26T10:00:00.000+11:00", ...] } —
    // start times only, nothing else from the upstream response.
    const raw = data?.data?.slots || data?.data || {};
    const slots: Record<string, string[]> = {};
    for (const [date, entries] of Object.entries<any>(raw)) {
      slots[date] = (entries || []).map((e: any) => (typeof e === "string" ? e : e?.start || e?.time)).filter(Boolean);
    }

    return new Response(JSON.stringify({ slots }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[client-get-slots] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
