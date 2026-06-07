// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";
const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

serve(async (req) => {
  const functionName = "voice-backfill";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY");

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // ── Step 1: Read all lessons from Notion DB 1 ──
    const lessons = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const queryBody: Record<string, any> = { page_size: 100 };
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
        throw new Error(`Notion query failed: ${err.message || JSON.stringify(err)}`);
      }

      const data = await res.json();
      for (const page of data.results || []) {
        const props = page.properties;
        lessons.push({
          id: page.id,
          date: props.Date?.date?.start || null,
          time: props.Breakthroughs?.rich_text?.map((t) => t.plain_text).join("") || null,
          studentIds: (props["Client CRM"]?.relation || []).map((r) => r.id),
          cost: props.Cost?.number || null,
          paymentStatus: props.Payment?.select?.name || null,
        });
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    console.log(`[${functionName}] Found ${lessons.length} lessons in Notion DB 1`);

    // ── Step 2: Resolve student names/emails from Voice Clients DB ──
    const allStudentIds = new Set<string>();
    for (const l of lessons) {
      for (const id of l.studentIds) allStudentIds.add(id);
    }

    const studentMap: Record<string, { name: string | null; email: string | null }> = {};

    if (allStudentIds.size > 0) {
      const studentsRes = await fetch(
        `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
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
    }

    // ── Step 3: Sync each lesson to voice_bookings ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase env vars");

    const supabase = createClient(supabaseUrl, supabaseKey);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const lesson of lessons) {
      if (!lesson.date) { skipped++; continue; }

      const student = lesson.studentIds.length > 0 ? studentMap[lesson.studentIds[0]] : null;
      const studentName = student?.name || null;
      const studentEmail = student?.email || null;
      const notionLessonId = lesson.id;

      // Check if voice_bookings record already exists
      const { data: existing } = await supabase
        .from("voice_bookings")
        .select("id, cost")
        .eq("notion_lesson_id_1", notionLessonId)
        .maybeSingle();

      if (existing) {
        // Update cost if it changed
        if (lesson.cost !== null && existing.cost !== lesson.cost) {
          await supabase
            .from("voice_bookings")
            .update({ cost: lesson.cost })
            .eq("id", existing.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Insert new record using notion_ prefix as unique ID
        const { error: insertErr } = await supabase
          .from("voice_bookings")
          .insert({
            calcom_booking_id: `notion_${notionLessonId}`,
            student_id: lesson.studentIds[0] || null,
            student_name: studentName,
            student_email: studentEmail,
            lesson_date: lesson.date,
            lesson_time: lesson.time,
            cost: lesson.cost,
            status: lesson.paymentStatus === "Paid (Stripe)" ? "paid" : "scheduled",
            notion_lesson_id_1: notionLessonId,
          });
        if (insertErr && !insertErr.message?.includes("duplicate key")) {
          console.error(`[${functionName}] Insert error for ${notionLessonId}:`, insertErr.message);
        } else if (!insertErr) {
          created++;
        }
      }
    }

    console.log(`[${functionName}] Done: ${created} created, ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        created,
        updated,
        skipped,
        total: lessons.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
