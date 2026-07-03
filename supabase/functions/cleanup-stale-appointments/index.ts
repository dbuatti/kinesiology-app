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

    const result = { deleted: [] as string[], errors: [] as string[] };

    // Delete stale Georg Gleeson appointment (rescheduled from Jul 8 to Jul 15)
    const { error: err1 } = await supabase
      .from("appointments")
      .delete()
      .eq("id", "47a1b422-10e1-4666-af1d-9461d20faee4");

    if (err1) result.errors.push(`Georg Jul 8: ${err1.message}`);
    else result.deleted.push("47a1b422-10e1-4666-af1d-9461d20faee4 (Georg Jul 8 stale)");

    // Also delete any appointments whose calcom_booking_id is in the old numeric
    // UID format and whose status is Cancelled — they're pre-migration orphans.
    const { data: cancelledWithOldUid } = await supabase
      .from("appointments")
      .select("id, date, calcom_booking_id, clients(name)")
      .eq("status", "Cancelled")
      .not("calcom_booking_id", "is", null)
      .gte("date", "2026-06-01");

    for (const a of cancelledWithOldUid || []) {
      const uid = String(a.calcom_booking_id);
      // Old numeric UIDs are relics from before the Cal.com v2 migration
      if (/^\d+$/.test(uid)) {
        const { error } = await supabase.from("appointments").delete().eq("id", a.id);
        if (error) result.errors.push(`delete ${a.id}: ${error.message}`);
        else result.deleted.push(`${a.id} (cancelled old-UID)`);
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
