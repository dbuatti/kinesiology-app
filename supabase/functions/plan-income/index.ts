// @ts-nocheck
// Feed of income rows from the practitioner's Notion "The Plan"
// database — the gigs, institutions, musical theatre, corporate work and
// backing-track orders the CRM doesn't otherwise see. Used by Money → Planning,
// which can also add a row of upcoming work (action: "create").
// src/lib/planning.ts decides which projects count, so nothing is doubled
// with kinesiology appointments or the voice/piano Lessons database.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const THE_PLAN_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
// Budget lines and plain date markers are never income.
const NOT_INCOME = new Set(["Budget", "dates"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");

    let body: { action?: string; from?: string; to?: string; title?: string; date?: string; dollars?: number; project?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // Add a row of upcoming work to The Plan (Money → Planning "Add upcoming work").
    if (body.action === "create") {
      const title = String(body.title || "").trim().slice(0, 200);
      const date = String(body.date || "");
      const dollars = Number(body.dollars);
      if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(dollars > 0)) {
        return json({ success: false, error: "A name, a date and an amount are needed." }, 400);
      }
      const properties: Record<string, unknown> = {
        Title: { title: [{ text: { content: title } }] },
        Date: { date: { start: date } },
        Dollars: { number: dollars },
        Status: { status: { name: "Not started" } },
      };
      if (body.project && !NOT_INCOME.has(body.project)) properties.Project = { select: { name: String(body.project).slice(0, 100) } };
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({ parent: { database_id: THE_PLAN_DB_ID }, properties }),
      });
      const page = await res.json().catch(() => ({}));
      if (!res.ok) return json({ success: false, needsShare: page.code === "object_not_found", error: page.message || `Notion ${res.status}` });
      return json({ success: true, row: { id: page.id, url: page.url, title, date, dollars, project: body.project || null, status: "Not started" } });
    }

    const from = body.from || new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    const to = body.to || new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);

    const rows = [];
    let cursor: string | undefined;
    do {
      const res = await fetch(`https://api.notion.com/v1/databases/${THE_PLAN_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
          filter: {
            and: [
              { property: "Date", date: { on_or_after: from } },
              { property: "Date", date: { on_or_before: to } },
              { property: "Dollars", number: { greater_than: 0 } },
            ],
          },
          sorts: [{ property: "Date", direction: "ascending" }],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // object_not_found = the database hasn't been shared with the integration.
        return json({ success: false, needsShare: err.code === "object_not_found", error: err.message || `Notion ${res.status}`, rows: [] });
      }
      const data = await res.json();
      for (const page of data.results || []) {
        const p = page.properties || {};
        const project = p.Project?.select?.name || null;
        if (project && NOT_INCOME.has(project)) continue;
        rows.push({
          id: page.id,
          url: page.url,
          title: (p.Title?.title || []).map((t) => t.plain_text).join("") || null,
          date: p.Date?.date?.start || null,
          dollars: p.Dollars?.number ?? 0,
          project,
          status: p.Status?.status?.name || null,
        });
      }
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return json({ success: true, rows });
  } catch (error) {
    console.error("[plan-income]", error.message);
    return json({ success: false, error: error.message, rows: [] }, 400);
  }
});
