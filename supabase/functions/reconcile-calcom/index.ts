// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cal.com is the single source of truth. This sweep pulls the full set of upcoming
// bookings and reconciles the app + Notion to match:
//   • REMOVE  — hard-delete app rows (+ archive Notion) whose booking is gone/cancelled
//   • ADD     — replay any live booking missing from the app through its create webhook
// The safety net that catches missed webhooks, deletions, and dropped creations.
// Runs on a schedule (pg_cron) and can be triggered manually.

const GRACE_MS = 15 * 60 * 1000; // don't touch rows created in the last 15 min (avoid racing a fresh booking)

const VOICE_EVENT_IDS = new Set([1945081, 5925021, 6488157]);
const FNH_EVENT_IDS = new Set([4279898, 5302336, 5927215]);

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

async function fetchLiveBookings(calKey: string): Promise<any[]> {
  const all: any[] = [];
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
    all.push(...rows);
    if (rows.length < take) break;
    skip += take;
  }
  return all;
}

serve(async (req) => {
  const fn = "reconcile-calcom";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const CAL_KEY = Deno.env.get("CALCOM_API_KEY");
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!CAL_KEY) throw new Error("Missing CALCOM_API_KEY");

    const supabase = createClient(SUPABASE_URL ?? "", SERVICE);

    const liveBookings = await fetchLiveBookings(CAL_KEY);
    const live = new Set<string>();
    for (const b of liveBookings) { if (b.uid) live.add(String(b.uid)); if (b.id) live.add(String(b.id)); }

    const nowIso = new Date().toISOString();
    const graceIso = new Date(Date.now() - GRACE_MS).toISOString();
    const todayStr = new Date().toISOString().split("T")[0];
    const isGhost = (uid: string | null) => uid && !uid.startsWith("force-") && !live.has(String(uid));

    const removed = { appointments: 0, voice: 0 };

    // ---- REMOVE: FNH appointments whose Cal.com booking is gone ----
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
      if (!error) removed.appointments++;
      else console.error(`[${fn}] delete appointment ${a.id} failed:`, error.message);
    }

    // ---- REMOVE: voice bookings whose Cal.com booking is gone ----
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
      if (!error) removed.voice++;
      else console.error(`[${fn}] delete voice_booking ${b.calcom_booking_id} failed:`, error.message);
    }

    // ---- ADD: replay any live Cal.com booking missing from the app ----
    const added = { appointments: 0, voice: 0 };
    const { data: apptUids } = await supabase.from("appointments").select("calcom_booking_id").not("calcom_booking_id", "is", null);
    const { data: vbUids } = await supabase.from("voice_bookings").select("calcom_booking_id").not("calcom_booking_id", "is", null);
    const known = new Set<string>();
    for (const r of apptUids || []) known.add(String(r.calcom_booking_id));
    for (const r of vbUids || []) known.add(String(r.calcom_booking_id));

    for (const b of liveBookings) {
      const uid = String(b.uid || b.id || "");
      if (!uid || known.has(uid)) continue;
      if ((b.status || "").toLowerCase() === "cancelled") continue;
      if (b.createdAt && (Date.now() - new Date(b.createdAt).getTime()) < GRACE_MS) continue; // let the live webhook handle fresh ones
      const etid = Number(b.eventTypeId);
      const isVoice = VOICE_EVENT_IDS.has(etid);
      const isFnh = FNH_EVENT_IDS.has(etid);
      if (!isVoice && !isFnh) continue;

      const target = isVoice ? "calcom-voice-webhook" : "calcom-webhook";
      const replay = {
        triggerEvent: "BOOKING_CREATED",
        payload: { uid, startTime: b.start, endTime: b.end, eventTypeId: b.eventTypeId, attendees: b.attendees, responses: b.responses, metadata: b.metadata },
      };
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/${target}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE}`, apikey: SERVICE },
          body: JSON.stringify(replay),
        });
        if (r.ok) { if (isVoice) added.voice++; else added.appointments++; known.add(uid); }
        else console.error(`[${fn}] replay ${uid} → ${target} failed: ${r.status}`);
      } catch (e) {
        console.error(`[${fn}] replay ${uid} error:`, e.message);
      }
    }

    const summary = {
      success: true,
      liveBookings: liveBookings.length,
      removedAppointments: removed.appointments,
      removedVoice: removed.voice,
      addedAppointments: added.appointments,
      addedVoice: added.voice,
    };
    console.log(`[${fn}] ${JSON.stringify(summary)}`);
    return new Response(JSON.stringify(summary), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(`[${fn}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
