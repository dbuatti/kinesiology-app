// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  const functionName = "list-calcom-event-types";

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const res = await fetch("https://api.cal.com/v2/event-types", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CALCOM_KEY}`,
        "cal-api-version": "2024-06-14",
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || "Failed to list Cal.com event types");
    }

    // The v2 payload nests event types differently across versions; normalise.
    const raw = Array.isArray(data.data)
      ? data.data
      : (data.data?.eventTypeGroups || []).flatMap((g: any) => g.eventTypes || []);

    const eventTypes = raw.map((et: any) => ({
      id: et.id,
      slug: et.slug,
      title: et.title,
      lengthInMinutes: et.lengthInMinutes ?? et.length ?? null,
    }));

    return new Response(JSON.stringify({ success: true, eventTypes }), {
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
