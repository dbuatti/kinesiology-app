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
    const { calcomBookingId, notionLessonId1, notionLessonId2, seriesId } = await req.json();
    if (!calcomBookingId && !seriesId) throw new Error("Missing calcomBookingId or seriesId");

    const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

    const results: Record<string, unknown> = {};

    // Resolve all bookings to cancel
    let targets = [{ calcomBookingId, notionLessonId1, notionLessonId2 }];

    if (seriesId) {
      const { data: seriesBookings } = await supabase
        .from("voice_bookings")
        .select("calcom_booking_id, notion_lesson_id_1, notion_lesson_id_2")
        .eq("series_id", seriesId)
        .neq("status", "cancelled");
      if (seriesBookings) {
        targets = seriesBookings.map((b: Record<string, unknown>) => ({
          calcomBookingId: b.calcom_booking_id,
          notionLessonId1: b.notion_lesson_id_1,
          notionLessonId2: b.notion_lesson_id_2,
        }));
      }
    }

    for (const target of targets) {
      const { calcomBookingId: cid, notionLessonId1: n1, notionLessonId2: n2 } = target;

      // 1. Cancel in Cal.com
      if (CALCOM_KEY && cid) {
        const res = await fetch(`https://api.cal.com/v2/bookings/${cid}/cancel`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CALCOM_KEY}`,
            "cal-api-version": "2024-08-13",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cancellationReason: "Cancelled via Voice Studio CRM" }),
        });
        const data = await res.json();
        results[`calcom_${cid}`] = res.ok ? "cancelled" : data?.error?.message || "failed";
      }

      // 2. Archive Notion lesson pages
      if (NOTION_KEY) {
        const archive = (pageId: string, label: string) =>
          pageId
            ? fetch(`https://api.notion.com/v1/pages/${pageId}`, {
                method: "PATCH",
                headers: NOTION_HEADERS(NOTION_KEY),
                body: JSON.stringify({ archived: true }),
              }).then((r) => r.json()).then(() => label + " archived")
                .catch((e) => label + " failed: " + e.message)
            : Promise.resolve(label + " skipped");

        const [r1, r2] = await Promise.all([
          archive(n1 as string, `notion1_${cid}`),
          archive(n2 as string, `notion2_${cid}`),
        ]);
        results[`notion_${cid}`] = { n1: r1, n2: r2 };
      }

      // 3. Update voice_bookings status
      if (cid) {
        try {
          await supabase.from("voice_bookings").update({ status: "cancelled" }).eq("calcom_booking_id", cid);
        } catch {}
      }
    }

    return new Response(JSON.stringify({ success: true, results, cancelledCount: targets.length }), {
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
