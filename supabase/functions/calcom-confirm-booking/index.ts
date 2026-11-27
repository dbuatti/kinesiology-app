// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Confirms existing pending/unconfirmed Cal.com bookings. Used when a booking
// was created by the API before payment requirements were removed from an event
// type, or when a client paid through the app's own Stripe link.
serve(async (req) => {
  const functionName = "calcom-confirm-booking";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authErr = await requirePractitioner(req, corsHeaders);
    if (authErr) return authErr;

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const body = await req.json();
    const uids = body.uids ? body.uids.map(String) : body.uid ? [String(body.uid)] : [];
    if (!uids.length) throw new Error("Provide uid or uids.");

    const results = [];
    for (const uid of uids) {
      const res = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CALCOM_KEY}`,
          "cal-api-version": "2026-02-25",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        results.push({ uid, success: false, error: data.error?.message || data.message || res.status });
      } else {
        results.push({ uid, success: true, status: data.data?.status || "confirmed" });
      }
    }

    return new Response(JSON.stringify({ success: results.every((r) => r.success), results }), {
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
