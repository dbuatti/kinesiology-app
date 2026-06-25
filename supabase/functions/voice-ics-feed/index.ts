// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Voice
const VOICE_LESSONS_DB_ID = "8d6369c637c8425fb007adf261f8e576";
const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

// Main (FNH / Kinesiology)
const MAIN_APPS_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
const MAIN_CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";

function toMelbourneUtc(year, month, day, h, min) {
  const d = new Date(Date.UTC(year, month - 1, day, h, min));
  const isDst = (m) => m >= 9 || m < 3;
  const offset = (isDst(month - 1) ? 11 : 10);
  return new Date(d.getTime() - offset * 3600000);
}

function parseTimeSlot(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  // If the stored time had "UTC", it was stored as UTC (old webhook bug)
  // Otherwise treat as Australia/Melbourne time
  const isUtc = time.includes("UTC");
  const cleaned = time.replace(/UTC|AEDT|AEST|AWST|ACDT|ACST/g, "").trim();
  const parts = cleaned.split("–").map((s) => s.trim()) || [cleaned];
  const toDate = (t) => {
    const m = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    if (isUtc) {
      return new Date(Date.UTC(year, month - 1, day, h, min));
    }
    return toMelbourneUtc(year, month, day, h, min);
  };
  const start = toDate(parts[0]);
  if (!start) return null;
  const end = parts.length >= 2 ? toDate(parts[1]) : new Date(start.getTime() + 3600000);
  return { start, end };
}

function escapeIcs(s) {
  return (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function fmtDt(d) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

async function queryDb(hdrs, dbId, label) {
  const rows = [];
  let cursor;
  while (true) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error(`[voice-ics-feed] queryDb(${label}) failed: ${res.status} ${errBody.substring(0, 200)}`);
      break;
    }
    const d = await res.json();
    rows.push(...(d.results || []));
    if (!d.has_more) break;
    cursor = d.next_cursor;
  }
  return rows;
}

async function resolveClients(hdrs, dbId, label) {
  const map = {};
  const pages = await queryDb(hdrs, dbId, label);
  for (const p of pages) {
    const props = p.properties;
    map[p.id] = {
      name: props.Name?.title?.map((t) => t.plain_text).join("") || "Unknown",
      email: props.Email?.email || "",
    };
  }
  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const key = Deno.env.get("NOTION_API_KEY");
    if (!key) throw new Error("Missing NOTION_API_KEY");
    const hdrs = { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" };

    // Resolve clients from both client DBs
    console.log("[voice-ics-feed] Resolving voice clients...");
    const voiceClientMap = await resolveClients(hdrs, VOICE_CLIENTS_DB_ID, "voice-clients");
    console.log(`[voice-ics-feed] Voice clients: ${Object.keys(voiceClientMap).length}`);

    let mainClientMap = {};
    try {
      mainClientMap = await resolveClients(hdrs, MAIN_CLIENTS_DB_ID, "main-clients");
      console.log(`[voice-ics-feed] Main clients: ${Object.keys(mainClientMap).length}`);
    } catch (mcErr) {
      console.error("[voice-ics-feed] Main clients error:", mcErr.message);
    }

    const clientEmailMap = { ...voiceClientMap, ...mainClientMap };

    const events = [];

    // --- Voice lessons ---
    console.log("[voice-ics-feed] Fetching voice lessons...");
    const voiceLessons = await queryDb(hdrs, VOICE_LESSONS_DB_ID, "voice");
    console.log(`[voice-ics-feed] Voice lessons: ${voiceLessons.length}`);
    for (const p of voiceLessons) {
      const props = p.properties;
      const rel = props["Client CRM"]?.relation || [];
      if (rel.length === 0) continue;
      // Skip paid lessons — Cal.com syncs those to Apple Calendar already
      const payment = props.Payment?.select?.name || "";
      if (payment.startsWith("Paid")) continue;
      const date = props.Date?.date?.start || null;
      const time = props.Breakthroughs?.rich_text?.map((t) => t.plain_text).join("") || null;
      if (!date || !time) continue;
      const parsed = parseTimeSlot(date, time);
      if (!parsed) continue;
      const student = clientEmailMap[rel[0].id];
      const paymentStatus = props.Payment?.select?.name || "";
      const cost = props.Cost?.number;
      const descParts = [
        student?.name ? `Student: ${student.name}` : "Student: Unknown",
        student?.email ? `Email: ${student.email}` : null,
        cost ? `Cost: $${cost}` : null,
        paymentStatus ? `Payment: ${paymentStatus}` : null,
      ].filter(Boolean);
      events.push({
        start: parsed.start,
        end: parsed.end,
        summary: student?.name ? `Voice Lesson — ${student.name}` : "Voice Lesson",
        desc: descParts.join("\n"),
        uid: p.id,
      });
    }

    // --- Main appointments (FNH / Kinesiology) ---
    console.log("[voice-ics-feed] Fetching main appointments...");
    let mainApps = [];
    try {
      const testRes = await fetch(`https://api.notion.com/v1/databases/${MAIN_APPS_DB_ID}`, { headers: hdrs });
      if (testRes.ok) {
        mainApps = await queryDb(hdrs, MAIN_APPS_DB_ID, "main");
        console.log(`[voice-ics-feed] Main appointments: ${mainApps.length}`);
      } else {
        console.error(`[voice-ics-feed] Main DB access: ${testRes.status}`);
      }
    } catch (qErr) {
      console.error("[voice-ics-feed] Main DB error:", qErr.message);
    }
    for (const p of mainApps) {
      try {
        const props = p.properties || {};
        const name = (() => {
          const titleKey = Object.keys(props).find(k => props[k]?.type === "title");
          if (titleKey) return props[titleKey]?.title?.map((t) => t.plain_text).join("") || "Appointment";
          return "Appointment";
        })();
        const dateField = (() => {
          const dateKey = Object.keys(props).find(k => props[k]?.type === "date");
          return dateKey ? props[dateKey]?.date : null;
        })();
        if (!dateField?.start) continue;
        const rel = (() => {
          for (const k of Object.keys(props)) {
            if (props[k]?.type === "relation") return props[k].relation || [];
          }
          return [];
        })();
        const clientRel = rel.length > 0 ? clientEmailMap[rel[0].id] : null;

        let start, end;
        if (dateField.start.includes("T")) {
          start = new Date(dateField.start);
          end = dateField.end ? new Date(dateField.end) : new Date(start.getTime() + 3600000);
        } else {
          const parts = dateField.start.split("-").map(Number);
          start = toMelbourneUtc(parts[0], parts[1], parts[2], 9, 0);
          end = new Date(start.getTime() + 3600000);
        }

        events.push({
          start,
          end,
          summary: clientRel?.name ? `${name} — ${clientRel.name}` : name,
          desc: clientRel?.email
            ? `Client: ${clientRel.name || "Unknown"} (${clientRel.email})`
            : `Client: ${clientRel.name || "Unknown"}`,
          uid: p.id,
        });
      } catch (err) {
        console.error(`[voice-ics-feed] Error processing main app ${p.id}:`, err.message);
      }
    }

    // Sort events by start time
    events.sort((a, b) => a.start - b.start);

    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0",
      "PRODID:-//Voice Studio//Lessons//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-PUBLISHED-TTL:PT5M",
    ];

    for (const e of events) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${e.uid}@voice-studio`);
      lines.push(`DTSTART:${fmtDt(e.start)}`);
      lines.push(`DTEND:${fmtDt(e.end)}`);
      lines.push(`SUMMARY:${escapeIcs(e.summary)}`);
      lines.push(`DESCRIPTION:${escapeIcs(e.desc)}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "max-age=300",
      },
    });
  } catch (error) {
    const errMsg = error.message || "Unknown error";
    console.error("[voice-ics-feed] Error:", errMsg);
    return new Response(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Voice Studio//Error//EN\r\nX-ERROR:${errMsg}\r\nEND:VCALENDAR`, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/calendar; charset=utf-8" },
    });
  }
});
