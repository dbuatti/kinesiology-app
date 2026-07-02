// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cal.com is the single source of truth. This sweep pulls the full set of upcoming
// bookings and removes any app/Notion records whose Cal.com booking no longer exists
// (deleted or cancelled) — the safety net that catches missed webhooks + deletions.
// Runs on a schedule (pg_cron) and can be triggered manually.

const GRACE_MS = 15 * 60 * 1000; // don't touch rows created in the last 15 min (avoid racing a fresh booking)

async function archiveNotionPages(notionKey: string, pageIds: (string | null | undefined)[]) {
  if (!notionKey) return;
  for (const id of pageIds.filter(Boolean)) {
    await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ archived: true }),
    }).catch((e) => console.error(`[reconcile-calcom] Notion archive failed for ${id}:`, e.message));
  }
}

async function fetchLiveUids(calKey: string): Promise<Set<string>> {
  const uids = new Set<string>();
  const headers = { Authorization: `Bearer ${calKey}`, "cal-api-version": "2024-08-13", "Content-Type": "application/json" };
  let skip = 0;
  const take = 100;
  for (let page = 0; page < 20; page++) { // hard cap: 2000 bookings
    const url = new URL("https://api.cal.com/v2/bookings");
    url.searchParams.set("status", "upcoming");
    url.searchParams.set("take", String(take));
    url.searchParams.set("skip", String(skip));
    const res = await fetch(url.toString(), { method: "GET", headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Cal.com bookings fetch failed: ${res.status} ${JSON.stringify(err).slice(0, 200)}`);
    }
    const data = await res.json();
    const rows = data.data || [];
    for (const b of rows) {
      if (b.uid) uids.add(String(b.uid));
      if (b.id) uids.add(String(b.id));
    }
    if (rows.length < take) break;
    skip += take;
  }
  return uids;
}

serve(async (req) => {
  const fn = "reconcile-calcom";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const CAL_KEY = Deno.env.get("CALCOM_API_KEY");
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY") || "";
    if (!CAL_KEY) throw new Error("Missing CALCOM_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const live = await fetchLiveUids(CAL_KEY);
    const nowIso = new Date().toISOString();
    const graceIso = new Date(Date.now() - GRACE_MS).toISOString();
    const todayStr = new Date().toISOString().split("T")[0];
    const isGhost = (uid: string | null) =>
      uid && !uid.startsWith("force-") && !live.has(String(uid));

    const removed = { appointments: [] as string[], voice: [] as string[] };

    // ---- FNH appointments (future, not brand-new) ----
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, calcom_booking_id, notion_page_id, notion_planner_id, status, date, created_at")
      .not("calcom_booking_id", "is", null)
      .gt("date", nowIso)
      .lt("created_at", graceIso);

    for (const a of appts || []) {
      if ((a.status || "").toLowerCase() === "cancelled") continue;
      if (!isGhost(a.calcom_booking_id)) continue;
      await archiveNotionPages(NOTION_KEY, [a.notion_page_id, a.notion_planner_id]);
      const { error } = await supabase.from("appointments").delete().eq("id", a.id);
      if (!error) removed.appointments.push(a.id);
      else console.error(`[${fn}] delete appointment ${a.id} failed:`, error.message);
    }

    // ---- Voice bookings (upcoming, not superseded/cancelled) ----
    const { data: vb } = await supabase
      .from("voice_bookings")
      .select("calcom_booking_id, notion_lesson_id_1, notion_lesson_id_2, status, lesson_date, created_at")
      .not("calcom_booking_id", "is", null)
      .gte("lesson_date", todayStr)
      .lt("created_at", graceIso);

    for (const b of vb || []) {
      const st = (b.status || "").toLowerCase();
      if (st === "cancelled" || st === "rescheduled") continue;
      if (!isGhost(b.calcom_booking_id)) continue;
      await archiveNotionPages(NOTION_KEY, [b.notion_lesson_id_1, b.notion_lesson_id_2]);
      const { error } = await supabase.from("voice_bookings").delete().eq("calcom_booking_id", b.calcom_booking_id);
      if (!error) removed.voice.push(b.calcom_booking_id);
      else console.error(`[${fn}] delete voice_booking ${b.calcom_booking_id} failed:`, error.message);
    }

    const summary = { success: true, liveBookings: live.size, removedAppointments: removed.appointments.length, removedVoice: removed.voice.length };
    console.log(`[${fn}] ${JSON.stringify(summary)}`);
    return new Response(JSON.stringify(summary), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(`[${fn}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
