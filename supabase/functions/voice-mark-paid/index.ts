// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Manually record/clear a voice lesson's payment (for payments made outside our Stripe
// flow). Writes to Notion's Payment property AND voice_bookings.status, so the badge —
// which reads either source — reflects it even when no booking row exists.
serve(async (req) => {
  const fn = "voice-mark-paid";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requireUser(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { lessonId, notionLessonId2, calcomBookingId, paid } = await req.json();
    const isPaid = paid !== false;

    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    const notionPaymentName = isPaid ? "Paid (External)" : "Unpaid";

    // 1. Update Notion Payment property on whichever lesson page ids we have.
    if (NOTION_KEY) {
      const notionHeaders = {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      };
      const body = JSON.stringify({ properties: { Payment: { select: { name: notionPaymentName } } } });
      for (const pageId of [lessonId, notionLessonId2].filter(Boolean)) {
        await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "PATCH",
          headers: notionHeaders,
          body,
        }).catch((e) => console.error(`[${fn}] Notion update failed for ${pageId}:`, e.message));
      }
    }

    // 2. Update voice_bookings.status when a linked booking exists.
    if (calcomBookingId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      await supabase
        .from("voice_bookings")
        .update({ status: isPaid ? "paid" : "scheduled" })
        .eq("calcom_booking_id", calcomBookingId);
    }

    return new Response(JSON.stringify({ success: true, paid: isPaid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${fn}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
