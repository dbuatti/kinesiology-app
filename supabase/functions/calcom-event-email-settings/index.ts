// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Voice & piano booking links. Keep this list explicit: this endpoint must
// never become a generic event-type editor for unrelated Cal.com links.
// NOTE: Cal.com's disableEmailsToAttendees flag is broad — it suppresses all
// default attendee mail (confirmations, reminders and cancellations), not just
// the immediate booking receipt. Only enable it once the app sends every
// attendee message the practice still needs.
const VOICE_EVENT_TYPE_IDS = [6488157, 5925021, 1945081];

serve(async (req) => {
  const functionName = "calcom-event-email-settings";
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authErr = await requirePractitioner(req, corsHeaders);
    if (authErr) return authErr;

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const body = await req.json();
    const disableEmailsToAttendees = body.disableEmailsToAttendees;
    if (typeof disableEmailsToAttendees !== "boolean") {
      throw new Error("disableEmailsToAttendees must be true or false.");
    }

    const requested = Array.isArray(body.eventTypeIds)
      ? body.eventTypeIds
      : VOICE_EVENT_TYPE_IDS;
    const eventTypeIds = [...new Set(requested.map(Number))];
    if (
      !eventTypeIds.length ||
      eventTypeIds.some((id) => !VOICE_EVENT_TYPE_IDS.includes(id))
    ) {
      throw new Error("Only the Voice & Piano event type ids are allowed.");
    }

    const results = [];
    for (const eventTypeId of eventTypeIds) {
      const res = await fetch(
        `https://api.cal.com/v2/event-types/${eventTypeId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${CALCOM_KEY}`,
            "cal-api-version": "2026-06-12",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailSettings: { disableEmailsToAttendees },
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          `Cal.com update failed for ${eventTypeId}: ${
            data.error?.message || data.message || res.status
          }`,
        );
      }
      results.push({
        eventTypeId,
        disableEmailsToAttendees,
        emailSettings: data.data?.emailSettings || data.emailSettings || null,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
