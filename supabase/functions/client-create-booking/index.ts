// @ts-nocheck
// Client-portal booking creation. Unlike create-calcom-booking (practitioner
// tool, trusts a clientId from the request body), this derives the caller's
// OWN client_id server-side via requireClient() — a client can only ever
// book a session for themselves, never for another client_id. Create-only
// (no reschedule/UID-repair admin logic — that stays in the practitioner tool).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireClient, resolveClientContact } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Only these event types may be booked from the portal — prevents a client
// from passing an arbitrary/unintended eventTypeId.
const ALLOWED_EVENT_TYPE_IDS = new Set([4279898, 1945081, 5925021, 6488157]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const identity = await requireClient(req, corsHeaders);
    if (identity instanceof Response) return identity;

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const { startTime, eventTypeId, notes } = await req.json();
    if (!startTime) throw new Error("Missing startTime.");
    const resolvedEventTypeId = parseInt(eventTypeId, 10) || 4279898;
    if (!ALLOWED_EVENT_TYPE_IDS.has(resolvedEventTypeId)) throw new Error("Unrecognised event type.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const client = await resolveClientContact(supabase, identity);
    if (!client?.email) throw new Error("We couldn't find your contact details on file — contact your practitioner.");

    const headers = {
      Authorization: `Bearer ${CALCOM_KEY}`,
      "cal-api-version": "2024-08-13",
      "Content-Type": "application/json",
    };

    const createRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        start: new Date(startTime).toISOString(),
        eventTypeId: resolvedEventTypeId,
        attendee: { name: client.name, email: client.email, timeZone: "Australia/Melbourne", language: "en" },
        metadata: { crm_notes: notes || "", source: "Client Portal" },
      }),
    });
    const result = await createRes.json();
    if (!createRes.ok) throw new Error(result.error?.message || result.message || "Cal.com booking failed.");

    return new Response(JSON.stringify({ success: true, uid: result.data.uid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[client-create-booking] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
