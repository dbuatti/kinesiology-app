// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";

serve(async (req) => {
  const functionName = "voice-lessons";
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

    const queryDb1 = async () => {
      const lessons = [];
      let hasMore = true;
      let startCursor = undefined;

      while (hasMore) {
        const queryBody = { page_size: 100 };
        if (startCursor) queryBody.start_cursor = startCursor;

        const res = await fetch(
          `https://api.notion.com/v1/databases/${LESSONS_DB_1_ID}/query`,
          {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify(queryBody),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(`Notion query failed for DB 1: ${err.message || JSON.stringify(err)}`);
        }

        const data = await res.json();
        for (const page of data.results || []) {
          const props = page.properties;
          lessons.push({
            id: page.id,
            notionUrl: page.url,
            name: props.Name?.title?.map((t) => t.plain_text).join("") || null,
            date: props.Date?.date?.start || null,
            time: props.Breakthroughs?.rich_text?.map((t) => t.plain_text).join("") || null,
            studentIds: (props["Client CRM"]?.relation || []).map((r) => r.id),
            paymentStatus: props.Payment?.select?.name || null,
            studentName: null,
            studentEmail: null,
          });
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      return lessons;
    };

    const db1Lessons = await queryDb1();

    // Resolve student names and emails from Voice Clients DB
    const allStudentIds = new Set<string>();
    for (const l of db1Lessons) {
      for (const id of l.studentIds) allStudentIds.add(id);
    }

    if (allStudentIds.size > 0) {
      const studentMap: Record<string, { name: string | null; email: string | null }> = {};

      const studentsRes = await fetch(
        `https://api.notion.com/v1/databases/af3e38f400d84dc8975eff4b6269157b/query`,
        {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({ page_size: 100 }),
        }
      );

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        for (const page of studentsData.results || []) {
          const props = page.properties;
          studentMap[page.id] = {
            name: props.Name?.title?.map((t) => t.plain_text).join("") || null,
            email: props.Email?.email || null,
          };
        }
      }

      for (const l of db1Lessons) {
        if (l.studentIds.length > 0) {
          const student = studentMap[l.studentIds[0]];
          if (student) {
            l.studentName = student.name;
            l.studentEmail = student.email;
          }
        }
      }
    }

    const allLessons = db1Lessons.filter((l) => l.studentIds.length > 0);

    allLessons.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

    console.log(`[${functionName}] Returned ${allLessons.length} lessons from DB 1`);

    return new Response(JSON.stringify({ success: true, lessons: allLessons }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message, lessons: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
