// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

serve(async (req) => {
  const functionName = "calcom-voice-webhook";
  console.log(`[${functionName}] Webhook received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL.");

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    console.log(`[${functionName}] Event: ${triggerEvent}`);

    // Acknowledge PING health checks from Cal.com
    if (triggerEvent === "PING") {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Handle cancellations
    if (triggerEvent === "BOOKING_CANCELLED") {
      const payload = body.payload || body.data || body;
      const calcomBookingUid = payload.uid || payload.data?.uid || null;
      console.log(`[${functionName}] Processing cancellation for booking: ${calcomBookingUid}`);

      if (calcomBookingUid) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabase
          .from("voice_bookings")
          .update({ status: "cancelled" })
          .eq("calcom_booking_id", calcomBookingUid);
      }

      return new Response(JSON.stringify({ success: true, message: "Cancelled" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only process booking creation events
    if (triggerEvent !== "BOOKING_CREATED") {
      console.log(`[${functionName}] Ignoring non-creation event: ${triggerEvent}`);
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const payload = body.payload || body.data || body;
    const attendee =
      payload.attendees?.[0] || payload.responses;

    if (!attendee || !attendee.email) {
      console.warn(`[${functionName}] No attendee email found.`);
      return new Response(JSON.stringify({ success: true, message: "No email" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const attendeeEmail = attendee.email.toLowerCase().trim();
    const calcomBookingUid = payload.uid || payload.data?.uid || null;
    const startTime = payload.startTime || payload.start;
    const endTime = payload.endTime || payload.end;

    if (!startTime) {
      throw new Error("Missing startTime in Cal.com payload");
    }

    const lessonDate = startTime.split("T")[0];
    const startTimeStr = new Date(startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    const endTimeStr = endTime
      ? new Date(endTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : "";
    const lessonTime = endTimeStr ? `${startTimeStr} – ${endTimeStr}` : startTimeStr;

    // Find the student in Notion Voice Clients DB by email
    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    console.log(`[${functionName}] Searching for student by email: ${attendeeEmail}`);

    const queryRes = await fetch(
      `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
      {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          filter: {
            property: "Email",
            email: { equals: attendeeEmail },
          },
          page_size: 1,
        }),
      }
    );

    const queryData = await queryRes.json();
    if (!queryRes.ok) {
      throw new Error(
        `Notion query failed: ${queryData.message || JSON.stringify(queryData)}`
      );
    }

    const matchedPage = queryData.results?.[0];

    let studentId;

    if (matchedPage) {
      studentId = matchedPage.id;
      console.log(`[${functionName}] Found existing student: ${studentId}`);
    } else {
      // Fallback: try matching by name if the attendee name is available
      const attendeeName = attendee.name || attendee.email?.split("@")[0];
      if (attendeeName) {
        console.log(`[${functionName}] No email match. Trying name fallback: ${attendeeName}`);
        const nameQueryRes = await fetch(
          `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
          {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              filter: {
                property: "Name",
                title: { equals: attendeeName },
              },
              page_size: 1,
            }),
          }
        );
        const nameQueryData = await nameQueryRes.json();
        const nameMatch = nameQueryData.results?.[0];
        if (nameMatch) {
          studentId = nameMatch.id;
          console.log(`[${functionName}] Found student by name: ${studentId}`);
        }
      }

      if (!studentId) {
        // Fallback: create a new student record in the Voice Clients DB
        console.warn(
          `[${functionName}] No student found for ${attendeeEmail}. Creating fallback record...`
        );
        const attendeeName = attendee.name || attendee.email?.split("@")[0] || "Unknown Student";
        const createRes = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({
            parent: { database_id: VOICE_CLIENTS_DB_ID },
            properties: {
              Name: { title: [{ text: { content: attendeeName } }] },
              Email: { email: attendeeEmail },
            },
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          console.error(`[${functionName}] Fallback creation failed:`, JSON.stringify(createData));
          return new Response(
            JSON.stringify({
              success: true,
              message: `No student found and fallback creation failed for ${attendeeEmail}.`,
            }),
            { status: 200, headers: corsHeaders }
          );
        }
        studentId = createData.id;
        console.log(`[${functionName}] Created fallback student: ${studentId}`);
      }
    }

    console.log(`[${functionName}] Resolved student ${studentId}. Invoking voice-schedule-lesson...`);

    // Invoke the voice-schedule-lesson edge function internally
    const scheduleRes = await fetch(
      `${SUPABASE_URL}/functions/v1/voice-schedule-lesson`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          studentId,
          date: lessonDate,
          time: lessonTime,
          studentName: attendee.name || null,
          studentEmail: attendeeEmail,
          calcomBookingUid,
        }),
      }
    );

    const scheduleData = await scheduleRes.json();
    console.log(`[${functionName}] voice-schedule-lesson response:`, JSON.stringify(scheduleData));

    if (!scheduleData.success) {
      console.error(`[${functionName}] voice-schedule-lesson failed:`, scheduleData);
      return new Response(
        JSON.stringify({
          success: false,
          error: scheduleData.error || "voice-schedule-lesson failed",
          details: scheduleData,
        }),
        {
          status: 207,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${functionName}] Lesson successfully logged for ${attendeeEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Lesson scheduled in both Notion databases." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
