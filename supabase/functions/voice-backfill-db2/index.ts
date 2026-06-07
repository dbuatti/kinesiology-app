// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";
const LESSONS_DB_2_ID = "11caad21cd0980d8a3eeeffb27fc43c0";

serve(async (req) => {
  const functionName = "voice-backfill-db2";

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY");

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // Get all pages from DB 1
    const allDb1Pages = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const body = { page_size: 100 };
      if (startCursor) body.start_cursor = startCursor;

      const res = await fetch(`https://api.notion.com/v1/databases/${LESSONS_DB_1_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`DB 1 query failed: ${await res.text()}`);

      const data = await res.json();
      allDb1Pages.push(...data.results);
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    // Get all existing DB 2 pages to check which already exist
    const allDb2Pages = [];
    hasMore = true;
    startCursor = undefined;

    while (hasMore) {
      const body = { page_size: 100 };
      if (startCursor) body.start_cursor = startCursor;

      const res = await fetch(`https://api.notion.com/v1/databases/${LESSONS_DB_2_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`DB 2 query failed: ${await res.text()}`);

      const data = await res.json();
      allDb2Pages.push(...data.results);
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    // Build set of Date + Voice Students for DB 2 pages to find gaps
    const db2Keys = new Set();
    for (const page of allDb2Pages) {
      const props = page.properties;
      const date = props.Date?.date?.start;
      const students = props["Voice Students"]?.relation?.map((r) => r.id).sort().join(",") || "";
      if (date) db2Keys.add(`${date}|${students}`);
    }

    // Find DB 1 pages missing from DB 2
    const created = [];
    const skipped = [];

    for (const page of allDb1Pages) {
      const props = page.properties;
      const title = props.Name?.title?.map((t) => t.plain_text).join("") || "Untitled";
      const date = props.Date?.date?.start;
      const time = props.Breakthroughs?.rich_text?.map((t) => t.plain_text).join("") || "";
      const studentIds = (props["Client CRM"]?.relation || []).map((r) => r.id);
      const payment = props.Payment?.select?.name || null;

      if (!date) {
        skipped.push({ title, reason: "no date" });
        continue;
      }

      const studentKey = studentIds.sort().join(",");
      const key = `${date}|${studentKey}`;

      if (db2Keys.has(key)) {
        skipped.push({ title, reason: "already in DB 2" });
        continue;
      }

      // Determine cost from title (e.g. "$50" pattern) or notes
      let cost = null;
      const costMatch = title.match(/\$(\d+)/);
      if (costMatch) cost = parseInt(costMatch[1]);

      // Create in DB 2
      const db2Props = {
        Title: { title: [{ text: { content: title } }] },
        Date: { date: { start: date } },
        Details: { rich_text: [{ text: { content: time } }] },
        "Voice Students": { relation: studentIds.map((id) => ({ id })) },
      };

      if (cost) db2Props.Cost = { number: cost };

      const createRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          parent: { database_id: LESSONS_DB_2_ID },
          properties: db2Props,
        }),
      });

      if (createRes.ok) {
        const data = await createRes.json();
        created.push({ title, date, url: data.url });
        console.log(`[${functionName}] Created ${title} in DB 2`);
      } else {
        const err = await createRes.text();
        skipped.push({ title, reason: `DB 2 creation failed: ${err}` });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_db1: allDb1Pages.length,
      total_db2: allDb2Pages.length,
      created,
      skipped,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
