// @ts-nocheck
// Client-portal booking cancellation. Verifies ownership before cancelling —
// fetches the booking from Cal.com and checks the attendee email matches the
// caller's own client record (resolved server-side via requireClient(), not
// trusted from the request body) — a client can only ever cancel their own
// bookings, never another client's by guessing a uid.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireClient, resolveClientContact } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const identity = await requireClient(req, corsHeaders);
    if (identity instanceof Response) return identity;

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const { bookingUid } = await req.json();
    if (!bookingUid) throw new Error("Missing bookingUid.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const client = await resolveClientContact(supabase, identity);
    if (!client?.email) throw new Error("We couldn't find your contact details on file — contact your practitioner.");

    const headers = { Authorization: `Bearer ${CALCOM_KEY}`, "cal-api-version": "2024-08-13", "Content-Type": "application/json" };

    const getRes = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}`, { headers });
    const getResult = await getRes.json();
    if (!getRes.ok) throw new Error("Booking not found.");

    const attendeeEmail = getResult.data?.attendees?.[0]?.email?.toLowerCase();
    if (!attendeeEmail || attendeeEmail !== client.email?.toLowerCase()) {
      return new Response(JSON.stringify({ error: "That booking doesn't belong to you." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cancelRes = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}/cancel`, {
      method: "POST",
      headers,
      body: JSON.stringify({ cancellationReason: "Cancelled by client via portal" }),
    });
    const cancelResult = await cancelRes.json();
    if (!cancelRes.ok) throw new Error(cancelResult.error?.message || "Failed to cancel.");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[client-cancel-booking] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
