// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTION_HEADERS = (key) => ({
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { calcomBookingId, notionLessonId1, notionLessonId2 } = await req.json();
    if (!calcomBookingId) throw new Error("Missing calcomBookingId");

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");

    const results = { calcom: null, notion1: null, notion2: null };

    // 1. Cancel in Cal.com
    if (CALCOM_KEY) {
      const res = await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CALCOM_KEY}`,
          "cal-api-version": "2024-08-13",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancellationReason: "Cancelled via Voice Studio CRM" }),
      });
      const data = await res.json();
      results.calcom = res.ok ? "cancelled" : data?.error?.message || "failed";
    }

    // 2. Archive Notion lesson pages
    if (NOTION_KEY) {
      const archive = (pageId, label) =>
        pageId
          ? fetch(`https://api.notion.com/v1/pages/${pageId}`, {
              method: "PATCH",
              headers: NOTION_HEADERS(NOTION_KEY),
              body: JSON.stringify({ archived: true }),
            }).then((r) => r.json()).then(() => label + " archived")
              .catch((e) => label + " failed: " + e.message)
          : Promise.resolve(label + " skipped");

      const [r1, r2] = await Promise.all([
        archive(notionLessonId1, "notion1"),
        archive(notionLessonId2, "notion2"),
      ]);
      results.notion1 = r1;
      results.notion2 = r2;
    }

    // 3. Update voice_bookings status
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
      await supabase.from("voice_bookings").update({ status: "cancelled" }).eq("calcom_booking_id", calcomBookingId);
    } catch {}

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
