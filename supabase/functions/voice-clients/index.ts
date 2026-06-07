// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

serve(async (req) => {
  const functionName = "voice-clients";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    let allResults = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const queryBody = { page_size: 100 };
      if (startCursor) queryBody.start_cursor = startCursor;

      const res = await fetch(
        `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
        {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify(queryBody),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Notion query failed: ${err.message || JSON.stringify(err)}`);
      }

      const data = await res.json();
      allResults.push(...(data.results || []));
      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    const students = allResults.map((page) => {
      const props = page.properties;

      const extractTitle = (prop) =>
        prop?.title?.map((t) => t.plain_text).join("") || null;

      const extractEmail = (prop) => prop?.email || null;

      const extractPhone = (prop) => prop?.phone_number || null;

      const extractRichText = (prop) =>
        prop?.rich_text?.map((t) => t.plain_text).join("") || null;

      const extractMultiSelect = (prop) =>
        prop?.multi_select?.map((m) => m.name) || [];

      const extractRollupDate = (prop) => {
        const d = prop?.rollup?.date?.start || prop?.rollup?.array?.[0]?.date?.start || null;
        return d;
      };

      const extractDate = (prop) => prop?.date?.start || null;

      return {
        id: page.id,
        notionUrl: page.url,
        archived: page.archived || false,
        name: extractTitle(props.Name),
        email: extractEmail(props.Email),
        phone: extractPhone(props.Phone),
        notes: extractRichText(props["Additional Notes"]),
        tags: extractMultiSelect(props.Tags || props.Streams || props["Voice Stream"]),
        latestDate: extractRollupDate(props["Latest Date"]),
        allDates: extractRollupDate(props["All Dates"]),
        lastCommunication: extractDate(props["Last communication"]),
        createdAt: page.created_time,
        updatedAt: page.last_edited_time,
      };
    });

    // Sort by name, null-safe
    students.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    console.log(`[${functionName}] Returned ${students.length} students`);

    return new Response(JSON.stringify({ success: true, students }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message, students: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
