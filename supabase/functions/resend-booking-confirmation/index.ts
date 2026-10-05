// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";
import { classifyEventType, resolveEventType } from "../_shared/event-types.ts";

// Resend the confirmation email for ONE Cal.com booking, whatever its event
// type: FNH → send-manual-onboarding, coaching → voice-send-onboarding, any
// other type → send-booking-confirmation. Reads the booking from Cal.com (the
// source of truth), so it works for bookings the app never recorded too — in
// that case the booking is replayed through its webhook, which records it and
// sends the email in one go.
//
// POST { calcomBookingUid: "mxCiSBKg2kmsVn5CBWK7Ld" }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  const fn = "resend-booking-confirmation";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const CAL_KEY = Deno.env.get("CALCOM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!CAL_KEY) throw new Error("Missing CALCOM_API_KEY");
    const supabase = createClient(SUPABASE_URL, SERVICE);

    const { calcomBookingUid } = await req.json().catch(() => ({}));
    const uid = String(calcomBookingUid || "").trim();
    if (!uid || uid.startsWith("force-")) throw new Error("Missing Cal.com booking uid (force-booked lessons have none).");

    const res = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${CAL_KEY}`, "cal-api-version": "2024-08-13" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Cal.com booking ${uid} not found (${res.status}): ${data?.error?.message || ""}`);
    const b = Array.isArray(data.data) ? data.data[0] : data.data;
    if (!b) throw new Error(`Cal.com returned no booking for ${uid}`);
    if (String(b.status || "").toLowerCase() === "cancelled") throw new Error("That booking is cancelled — no confirmation sent.");

    const attendee = b.attendees?.[0] || {};
    const email = String(attendee.email || "").toLowerCase().trim();
    if (!email) throw new Error("The booking has no attendee email.");

    const kind = classifyEventType(b);
    const info = await resolveEventType(supabase, b);
    const call = (name: string, body: unknown) =>
      fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE}` },
        body: JSON.stringify(body),
      });
    // Not recorded in the app yet: replay it through its webhook (records the
    // booking and sends the confirmation). Mirrors reconcile-calcom's replay.
    const replay = (target: string, metadata: Record<string, unknown>) =>
      call(target, {
        triggerEvent: "BOOKING_CREATED",
        payload: { uid, startTime: b.start, endTime: b.end, eventTypeId: b.eventTypeId, title: b.title, attendees: b.attendees, responses: b.responses, metadata },
      });

    let r: Response;
    let via: string;
    if (kind === "fnh") {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, client_id")
        .eq("calcom_booking_id", uid)
        .maybeSingle();
      if (appt?.client_id) {
        via = "send-manual-onboarding";
        r = await call(via, { clientId: appt.client_id, appointmentId: appt.id, force: true });
      } else {
        via = "calcom-webhook (replay)";
        r = await replay("calcom-webhook", b.metadata || {});
      }
    } else if (kind === "voice") {
      const { data: logged } = await supabase
        .from("voice_bookings")
        .select("discipline")
        .eq("calcom_booking_id", uid)
        .maybeSingle();
      if (logged) {
        // Same date/time strings calcom-voice-webhook builds for the email.
        const fmt = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne", timeZoneName: "short" });
        const lessonDate = new Date(b.start).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
        via = "voice-send-onboarding";
        r = await call(via, {
          studentName: attendee.name || email.split("@")[0],
          studentEmail: email,
          date: lessonDate,
          time: b.end ? `${fmt(b.start)} – ${fmt(b.end)}` : fmt(b.start),
          duration: info.durationMin,
          cost: info.price,
          calcomBookingUid: uid,
          discipline: logged.discipline || b.metadata?.discipline || undefined,
          sessionName: info.name,
        });
      } else {
        via = "calcom-voice-webhook (replay)";
        r = await replay("calcom-voice-webhook", { ...(b.metadata || {}), confirmation: "webhook" });
      }
    } else {
      via = "send-booking-confirmation";
      r = await call(via, {
        name: attendee.name,
        email,
        startTime: b.start,
        sessionName: info.name,
        durationMin: info.durationMin,
        price: info.price,
        calcomBookingUid: uid,
        location: typeof b.location === "string" ? b.location : null,
      });
    }

    const out = await r.json().catch(() => ({}));
    // A replay can answer 200 without sending (a duplicate-date guard, an
    // ignored event) — don't report that as a resend.
    const skipped = typeof out?.message === "string" && /already|skipp|ignored|not a voice/i.test(out.message);
    if (!r.ok || out?.error || out?.success === false || skipped) {
      throw new Error(`${via} failed (${r.status}): ${out?.error || JSON.stringify(out).slice(0, 300)}`);
    }
    console.log(`[${fn}] Resent ${info.name} confirmation to ${email} via ${via}`);
    return json({ success: true, kind, via, email, session: info.name, price: info.price, paymentUrl: out?.paymentUrl || null });
  } catch (error) {
    console.error(`[${fn}] Error:`, error.message);
    return json({ error: error.message }, 400);
  }
});
