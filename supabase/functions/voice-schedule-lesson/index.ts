// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";
const LESSONS_DB_2_ID = "11caad21cd0980d8a3eeeffb27fc43c0";

serve(async (req) => {
  const functionName = "voice-schedule-lesson";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");

    const { studentId, date, time, cost } = await req.json();

    if (!studentId || !date || !time) {
      throw new Error("Missing required fields: studentId, date, time");
    }

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    const title = `Voice Lesson — ${date}`;

    const db1Properties = {
      Name: { title: [{ text: { content: title } }] },
      Date: { date: { start: date } },
      Breakthroughs: { rich_text: [{ text: { content: time } }] },
      "Client CRM": { relation: [{ id: studentId }] },
      Payment: { select: { name: "Unpaid" } },
    };

    const db2Properties: Record<string, unknown> = {
      Title: { title: [{ text: { content: title } }] },
      Date: { date: { start: date } },
      Details: { rich_text: [{ text: { content: time } }] },
      "Voice Students": { relation: [{ id: studentId }] },
    };

    if (cost) {
      db2Properties.Cost = { number: cost };
    }

    const createPage = async (dbId, properties, label) => {
      console.log(`[${functionName}] Creating page in ${label} (${dbId})...`);
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`[${functionName}] ${label} failed:`, JSON.stringify(data));
        return { success: false, error: data.message || `Notion API error for ${label}`, dbId };
      }
      console.log(`[${functionName}] ${label} created: ${data.id}`);
      return { success: true, id: data.id, url: data.url, dbId };
    };

    const [result1, result2] = await Promise.all([
      createPage(LESSONS_DB_1_ID, db1Properties, "Lesson Database 1"),
      createPage(LESSONS_DB_2_ID, db2Properties, "Lesson Database 2"),
    ]);

    const allOk = result1.success && result2.success;

    return new Response(
      JSON.stringify({
        success: allOk,
        db1: result1,
        db2: result2,
        message: allOk
          ? "Lesson scheduled in both databases."
          : "One or both database writes failed. Check db1/db2 for details.",
      }),
      {
        status: allOk ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
