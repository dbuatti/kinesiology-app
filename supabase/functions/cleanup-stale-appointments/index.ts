// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const NOTION_KEY = Deno.env.get("NOTION_API_KEY") || "";

    const result = { unlinked: [] as string[], archived: [] as string[], errors: [] as string[] };

    async function archivePage(pageId: string | null | undefined) {
      if (!pageId || !NOTION_KEY) return;
      await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
        body: JSON.stringify({ archived: true }),
      }).catch(() => {});
    }

    // Mark stale Georg Gleeson appointment as cancelled (rescheduled from Jul 8 to Jul 15)
    const { data: staleGeorg } = await supabase.from("appointments")
      .select("notion_page_id, notion_planner_id")
      .eq("id", "47a1b422-10e1-4666-af1d-9461d20faee4")
      .maybeSingle();

    if (staleGeorg) {
      await archivePage(staleGeorg.notion_page_id);
      await archivePage(staleGeorg.notion_planner_id);
      const { error: err1 } = await supabase.from("appointments")
        .update({ calcom_booking_id: null, status: "Cancelled" })
        .eq("id", "47a1b422-10e1-4666-af1d-9461d20faee4");
      if (err1) result.errors.push(`Georg Jul 8: ${err1.message}`);
      else result.unlinked.push("47a1b422-10e1-4666-af1d-9461d20faee4 (Georg Jul 8 stale)");
    }

    // Also unlink any appointments whose calcom_booking_id is in the old numeric
    // UID format and whose status is Cancelled — they're pre-migration orphans.
    const { data: cancelledWithOldUid } = await supabase
      .from("appointments")
      .select("id, date, calcom_booking_id, notion_page_id, notion_planner_id")
      .eq("status", "Cancelled")
      .not("calcom_booking_id", "is", null)
      .gte("date", "2026-06-01");

    for (const a of cancelledWithOldUid || []) {
      const uid = String(a.calcom_booking_id);
      if (/^\d+$/.test(uid)) {
        await archivePage(a.notion_page_id);
        await archivePage(a.notion_planner_id);
        const { error } = await supabase.from("appointments")
          .update({ calcom_booking_id: null })
          .eq("id", a.id);
        if (error) result.errors.push(`unlink ${a.id}: ${error.message}`);
        else result.unlinked.push(`${a.id} (cancelled old-UID)`);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
