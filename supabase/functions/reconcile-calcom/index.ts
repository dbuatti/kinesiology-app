// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cal.com is the single source of truth. This sweep pulls the full set of upcoming
// bookings and unlinks app/Notion records whose Cal.com booking no longer exists
// (deleted or cancelled) — the safety net that catches missed webhooks + deletions.
// IMPORTANT: We NEVER delete appointment rows (that would destroy clinical notes,
// assessments, and session data). We only unlink calcom_booking_id and archive
// Notion pages so the data survives in both systems.
// Runs on a schedule (pg_cron) and can be triggered manually.

const GRACE_MS = 15 * 60 * 1000; // don't touch rows created in the last 15 min (avoid racing a fresh booking)

const VOICE_EVENT_IDS = new Set([1945081, 5925021]);
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
    if (!CAL_KEY) throw new Error("Missing CALCOM_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const liveBookings = await fetchLiveBookings(CAL_KEY);
    const live = new Set<string>();
    for (const b of liveBookings) { if (b.uid) live.add(String(b.uid)); if (b.id) live.add(String(b.id)); }
    const nowIso = new Date().toISOString();
    const graceIso = new Date(Date.now() - GRACE_MS).toISOString();
    const todayStr = new Date().toISOString().split("T")[0];
    const isGhost = (uid: string | null) =>
      uid && !uid.startsWith("force-") && !live.has(String(uid));

    const removed = { appointments: [] as string[], voice: [] as string[] };

    // ---- FNH appointments (future, not brand-new) ----
    // NOTE: We NEVER delete appointment rows — that would destroy clinical notes,
    // assessments, and session data. Instead we unlink the Cal.com booking and
    // archive the Notion pages so the data survives in both systems.
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
      const { error } = await supabase.from("appointments").update({ calcom_booking_id: null, status: "Cancelled" }).eq("id", a.id);
      if (!error) removed.appointments.push(a.id);
      else console.error(`[${fn}] unlink appointment ${a.id} failed:`, error.message);
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
      const { error } = await supabase.from("voice_bookings").update({ status: "cancelled" }).eq("calcom_booking_id", b.calcom_booking_id);
      if (!error) removed.voice.push(b.calcom_booking_id);
      else console.error(`[${fn}] cancel voice_booking ${b.calcom_booking_id} failed:`, error.message);
    }

    // ---- ADD missing: any live Cal.com booking absent from the app gets replayed
    // through its normal create webhook (self-heals a missed BOOKING_CREATED). ----
    const added = { appointments: 0, voice: 0 };
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const { data: apptUids } = await supabase.from("appointments").select("calcom_booking_id").not("calcom_booking_id", "is", null);
    const { data: vbUids } = await supabase.from("voice_bookings").select("calcom_booking_id").not("calcom_booking_id", "is", null);
    const known = new Set<string>();
    for (const r of apptUids || []) known.add(String(r.calcom_booking_id));
    for (const r of vbUids || []) known.add(String(r.calcom_booking_id));

    const voiceDebug: any[] = [];
    for (const b of liveBookings) {
      const uid = String(b.uid || b.id || "");
      const etidDbg = Number(b.eventTypeId);
      if (VOICE_EVENT_IDS.has(etidDbg)) {
        voiceDebug.push({ uid, name: b.attendees?.[0]?.name || null, email: b.attendees?.[0]?.email || null, etid: etidDbg, known: known.has(uid), status: b.status });
      }
      if (!uid || known.has(uid)) continue;
      if ((b.status || "").toLowerCase() === "cancelled") continue;
      // Let the normal webhook handle very fresh bookings (avoid racing it).
      if (b.createdAt && (Date.now() - new Date(b.createdAt).getTime()) < GRACE_MS) continue;
      const etid = Number(b.eventTypeId);
      const isVoice = VOICE_EVENT_IDS.has(etid);
      const isFnh = FNH_EVENT_IDS.has(etid);
      if (!isVoice && !isFnh) continue; // ignore generic (non-clinical/non-voice) event types

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

    // Attach the actual voice_bookings row for each live voice uid (diagnostics).
    const vUids = voiceDebug.map((v) => v.uid);
    if (vUids.length) {
      const { data: vrows } = await supabase
        .from("voice_bookings")
        .select("calcom_booking_id, student_name, student_email, lesson_date, status, notion_lesson_id_1, notion_lesson_id_2")
        .in("calcom_booking_id", vUids);
      const byUid: Record<string, any> = {};
      for (const r of vrows || []) byUid[String(r.calcom_booking_id)] = r;
      for (const v of voiceDebug) v.row = byUid[v.uid] || null;

      // Inspect the linked Notion lesson page(s) to see why voice-lessons may drop it.
      if (NOTION_KEY) {
        for (const v of voiceDebug) {
          const pid = v.row?.notion_lesson_id_1;
          if (!pid) continue;
          try {
            const pr = await fetch(`https://api.notion.com/v1/pages/${pid}`, {
              headers: { Authorization: `Bearer ${NOTION_KEY}`, "Notion-Version": "2022-06-28" },
            });
            const p = await pr.json();
            v.notion = {
              ok: pr.ok,
              archived: p.archived,
              date: p.properties?.Date?.date?.start ?? null,
              clientCrm: (p.properties?.["Client CRM"]?.relation || []).length,
            };
          } catch (e) { v.notion = { error: e.message }; }
        }
      }
    }

    // ---- Archive any Cancelled appointment's Notion pages that are still active ----
    // This catches manual cancellations made in the app (not via Cal.com webhook)
    // where the Notion page wasn't archived.
    const { data: cancelledNeedingArchive } = await supabase
      .from("appointments")
      .select("notion_page_id, notion_planner_id")
      .eq("status", "Cancelled")
      .not("notion_page_id", "is", null);
    let archivedCancelled = 0;
    for (const c of cancelledNeedingArchive || []) {
      const toArchive = [c.notion_page_id, c.notion_planner_id].filter(Boolean);
      if (toArchive.length) { await archiveNotionPages(NOTION_KEY, toArchive); archivedCancelled += toArchive.length; }
    }

    const summary = { success: true, liveBookings: live.size, removedAppointments: removed.appointments.length, removedVoice: removed.voice.length, addedAppointments: added.appointments, addedVoice: added.voice, archivedCancelled, voiceDebug };
    console.log(`[${fn}] ${JSON.stringify(summary)}`);
    return new Response(JSON.stringify(summary), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(`[${fn}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
