// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";
const CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

function parseTimeSlot(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const cleaned = time.replace(/UTC|AEDT|AEST|AWST|ACDT|ACST|AEDT/g, "").trim();
  const parts = cleaned.split("–").map((s) => s.trim()) || [cleaned];

  const toDate = (t) => {
    const m = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    return new Date(year, month - 1, day, h, min);
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("NOTION_API_KEY");
    if (!key) throw new Error("Missing NOTION_API_KEY");

    const hdrs = { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" };

    const lessons = [];
    let cursor;
    while (true) {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const res = await fetch(`https://api.notion.com/v1/databases/${LESSONS_DB_1_ID}/query`, {
        method: "POST", headers: hdrs, body: JSON.stringify(body),
      });
      if (!res.ok) break;
      const d = await res.json();
      for (const p of d.results || []) {
        const props = p.properties;
        const rel = props["Client CRM"]?.relation || [];
        if (rel.length === 0) continue;
        lessons.push({
          id: p.id,
          date: props.Date?.date?.start || null,
          time: props.Breakthroughs?.rich_text?.map((t) => t.plain_text).join("") || null,
          studentId: rel[0].id,
          studentName: null, studentEmail: null,
        });
      }
      if (!d.has_more) break;
      cursor = d.next_cursor;
    }

    // Resolve student names
    const studentIds = [...new Set(lessons.map((l) => l.studentId))];
    const studentMap = {};
    cursor = undefined;
    while (true) {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const res = await fetch(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
        method: "POST", headers: hdrs, body: JSON.stringify(body),
      });
      if (!res.ok) break;
      const d = await res.json();
      for (const p of d.results || []) {
        const props = p.properties;
        studentMap[p.id] = {
          name: props.Name?.title?.map((t) => t.plain_text).join("") || "Unknown",
          email: props.Email?.email || "",
        };
      }
      if (!d.has_more) break;
      cursor = d.next_cursor;
    }

    for (const l of lessons) {
      const s = studentMap[l.studentId];
      if (s) { l.studentName = s.name; l.studentEmail = s.email; }
    }

    // Build ICS
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0",
      "PRODID:-//Voice Studio//Lessons//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-PUBLISHED-TTL:PT1H",
    ];

    for (const l of lessons) {
      if (!l.date || !l.time) continue;
      const p = parseTimeSlot(l.date, l.time);
      if (!p) continue;
      const summary = l.studentName ? `Voice Lesson — ${l.studentName}` : "Voice Lesson";
      const desc = l.studentEmail
        ? `Student: ${l.studentName || "Unknown"} (${l.studentEmail})`
        : `Student: ${l.studentName || "Unknown"}`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${l.id}@voice-studio`);
      lines.push(`DTSTART:${fmtDt(p.start)}`);
      lines.push(`DTEND:${fmtDt(p.end)}`);
      lines.push(`SUMMARY:${escapeIcs(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcs(desc)}`);
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
    console.error("[voice-ics-feed] Error:", error.message);
    return new Response("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Voice Studio//Error//EN\r\nEND:VCALENDAR", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/calendar; charset=utf-8" },
    });
  }
});
