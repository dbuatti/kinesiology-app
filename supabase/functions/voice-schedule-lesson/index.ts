// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { studentId, date, time, cost, studentName, studentEmail, calcomBookingUid } = await req.json();

    if (!studentId || !date || !time) {
      throw new Error("Missing required fields: studentId, date, time");
    }

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    const namePart = studentName ? ` ${studentName} —` : '';
    const title = `Voice Lesson —${namePart} ${date}`;

    const db1Properties = {
      Name: { title: [{ text: { content: title } }] },
      Date: { date: { start: date } },
      Breakthroughs: { rich_text: [{ text: { content: time } }] },
      "Client CRM": { relation: [{ id: studentId }] },
      Payment: { select: { name: "Unpaid" } },
    };

    // DB 2 doesn't have a Cost property; only include it for DB 1
    if (cost) {
      db1Properties.Cost = { number: Number(cost) };
    }

    const db2Properties: Record<string, unknown> = {
      Title: { title: [{ text: { content: title } }] },
      Date: { date: { start: date } },
      Details: { rich_text: [{ text: { content: time } }] },
      Project: { select: { name: "Coaching" } },
      "Voice Students": { relation: [{ id: studentId }] },
    };

    if (cost) {
      db2Properties.Dollars = { number: Number(cost) };
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

    // If DB 2 failed because of the Voice Students relation, retry without it
    let finalResult2 = result2;
    if (!result2.success && result2.error?.includes("relation") || result2.error?.includes("not found") || result2.error?.includes("validation")) {
      console.log(`[${functionName}] DB 2 failed with relation, retrying without Voice Students...`);
      const db2PropsNoRelation = { ...db2Properties };
      delete db2PropsNoRelation["Voice Students"];
      const retryResult = await createPage(LESSONS_DB_2_ID, db2PropsNoRelation, "Lesson Database 2 (no relation)");
      if (retryResult.success) {
        finalResult2 = retryResult;
        console.log(`[${functionName}] DB 2 created successfully without Voice Students relation`);
      } else {
        console.error(`[${functionName}] DB 2 retry also failed:`, retryResult.error);
      }
    }

    const allOk = result1.success && finalResult2.success;

    // Store booking UID in voice_bookings for cancel/reschedule
    // Insert even if DB 2 failed (DB 1 success is enough to have a lesson to manage)
    if (calcomBookingUid && studentEmail && result1.success) {
      try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
        const { error: upsertError } = await supabase
          .from("voice_bookings")
          .upsert({
            calcom_booking_id: calcomBookingUid,
            student_id: studentId,
            student_name: studentName || null,
            student_email: studentEmail,
            lesson_date: date,
            lesson_time: time,
            duration: null,
            cost: cost || null,
            notion_lesson_id_1: result1.id || null,
            notion_lesson_id_2: result2.id || null,
          }, { onConflict: 'calcom_booking_id' });
        if (upsertError) {
          console.error(`[${functionName}] voice_bookings upsert error:`, upsertError.message);
        }
        console.log(`[${functionName}] voice_bookings record saved for ${calcomBookingUid}`);
      } catch (dbErr) {
        console.error(`[${functionName}] voice_bookings upsert error (non-fatal):`, dbErr.message);
      }
    }

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
