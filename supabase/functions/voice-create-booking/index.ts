// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "voice-create-booking";

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');

    const body = await req.json();
    const { studentName, studentEmail, startTime, eventTypeId, title, notes, bookingUid, notionLessonId1, notionLessonId2, force } = body;

    if (!studentName || !studentEmail) throw new Error("Missing studentName or studentEmail.");
    if (!startTime) throw new Error("Missing startTime.");

    console.log(`[${functionName}] Booking for ${studentName} at ${startTime}`);

    const cleanStartTime = new Date(startTime).toISOString();

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // Reschedule if UID provided
    if (bookingUid && bookingUid !== "undefined" && bookingUid !== "null" && bookingUid !== "") {
      console.log(`[${functionName}] RESCHEDULE booking ${bookingUid} → ${cleanStartTime}`);

      const res = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}/reschedule`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          start: cleanStartTime,
          reschedulingReason: "Rescheduled via Voice Studio CRM",
        }),
      });

      const result = await res.json();

      if (res.ok) {
        const newUid = result.data?.uid || bookingUid;

        // Update Notion lesson pages with new date/time
        if (NOTION_KEY) {
          const notionHeaders = {
            Authorization: `Bearer ${NOTION_KEY}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          };

          const newDate = cleanStartTime.split("T")[0];
          const newTime = new Date(cleanStartTime).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne",
          });

          // Update DB 1 lesson (has Date + Breakthroughs properties)
          if (notionLessonId1) {
            try {
              await fetch(`https://api.notion.com/v1/pages/${notionLessonId1}`, {
                method: "PATCH",
                headers: notionHeaders,
                body: JSON.stringify({
                  properties: {
                    Date: { date: { start: newDate } },
                    Breakthroughs: { rich_text: [{ text: { content: newTime } }] },
                  },
                }),
              });
              console.log(`[${functionName}] Updated DB 1 lesson ${notionLessonId1}`);
            } catch (notionErr) {
              console.error(`[${functionName}] DB 1 update error:`, notionErr.message);
            }
          }

          // Update DB 2 lesson (has Title, Date, Details properties)
          if (notionLessonId2) {
            try {
              await fetch(`https://api.notion.com/v1/pages/${notionLessonId2}`, {
                method: "PATCH",
                headers: notionHeaders,
                body: JSON.stringify({
                  properties: {
                    Date: { date: { start: newDate } },
                    Details: { rich_text: [{ text: { content: newTime } }] },
                  },
                }),
              });
              console.log(`[${functionName}] Updated DB 2 lesson ${notionLessonId2}`);
            } catch (notionErr) {
              console.error(`[${functionName}] DB 2 update error:`, notionErr.message);
            }
          }
        }

        // Update voice_bookings table
        try {
          const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
          // Mark old booking as rescheduled
          await supabase
            .from("voice_bookings")
            .update({ status: "rescheduled" })
            .eq("calcom_booking_id", bookingUid);
          // Insert new booking record with the new Cal.com UID so it stays linked
          await supabase
            .from("voice_bookings")
            .insert({
              calcom_booking_id: newUid,
              student_email: studentEmail,
              student_name: studentName,
              lesson_date: cleanStartTime.split("T")[0],
              status: "scheduled",
              notion_lesson_id_1: notionLessonId1 || null,
              notion_lesson_id_2: notionLessonId2 || null,
            });
        } catch (dbErr) {
          console.error(`[${functionName}] DB update error:`, dbErr.message);
        }

        return new Response(JSON.stringify({ success: true, uid: newUid, action: "rescheduled" }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(result.error?.message || "Failed to reschedule");
    }

    // Create new booking
    console.log(`[${functionName}] CREATE new booking`);

    if (force) {
      console.log(`[${functionName}] FORCE booking — skipping Cal.com`);
      const syntheticUid = `force-${Date.now()}`;
      return new Response(JSON.stringify({ success: true, uid: syntheticUid, action: "force_booked" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const createRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        start: cleanStartTime,
        eventTypeId: parseInt(eventTypeId, 10) || 1945081,
        attendee: {
          name: studentName,
          email: studentEmail,
          timeZone: "Australia/Melbourne",
          language: "en",
        },
        metadata: {
          crm_title: title || "Voice Lesson",
          crm_notes: notes || "",
          source: "Voice Studio CRM",
        },
      }),
    });

    const createResult = await createRes.json();

    if (createRes.ok) {
      const bookingUid = createResult.data.uid;
      // Confirm immediately so it syncs to calendar (payment tracked externally via Stripe)
      const confirmHeaders = { ...headers, 'cal-api-version': '2026-02-25' };
      await fetch(`https://api.cal.com/v2/bookings/${bookingUid}/confirm`, {
        method: "POST",
        headers: confirmHeaders,
      }).catch((e) => console.error(`[${functionName}] Confirm call failed:`, e.message));
      return new Response(JSON.stringify({ success: true, uid: bookingUid, action: "created" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle conflicts
    const errorMsg = createResult.error?.message || createResult.message || "";
    if (createRes.status === 400 && errorMsg.includes("already has booking")) {
      const dayStart = new Date(cleanStartTime);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(cleanStartTime);
      dayEnd.setHours(23, 59, 59, 999);

      const listRes = await fetch(
        `https://api.cal.com/v2/bookings?startTime=${dayStart.toISOString()}&endTime=${dayEnd.toISOString()}&status=upcoming`,
        { method: "GET", headers }
      );

      const listData = await listRes.json();
      const existing = (listData.data || []).find((b) => {
        const bStart = new Date(b.start).toISOString();
        const bEmail = b.attendees?.[0]?.email?.toLowerCase();
        return bStart === cleanStartTime && bEmail === studentEmail.toLowerCase();
      });

      if (existing) {
        return new Response(JSON.stringify({ success: true, uid: existing.uid, repaired: true, action: "linked" }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error("This slot is unavailable. It may have just been booked.");
    }

    throw new Error(errorMsg || "Cal.com Create Error");

  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
