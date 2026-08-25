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

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // Handle payment success — mark lessons as Paid in Notion
    if (triggerEvent === "BOOKING_PAYMENT_SUCCESSFUL") {
      const payload = body.payload || body.data || body;
      const calcomBookingUid = payload.uid || payload.data?.uid || null;
      console.log(`[${functionName}] Payment successful for booking: ${calcomBookingUid}`);

      if (calcomBookingUid) {
        // Confirm the booking in Cal.com (created without auto-confirm so payment page shows)
        const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
        if (CALCOM_KEY) {
          await fetch(`https://api.cal.com/v2/bookings/${calcomBookingUid}/confirm`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${CALCOM_KEY}`,
              "Content-Type": "application/json",
              "cal-api-version": "2026-02-25",
            },
          }).catch((e) => console.error(`[${functionName}] Confirm after payment failed:`, e.message));
        }

        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: booking } = await supabase
          .from("voice_bookings")
          .select("notion_lesson_id_1, notion_lesson_id_2")
          .eq("calcom_booking_id", calcomBookingUid)
          .single();

        if (booking) {
          const patchBody = JSON.stringify({
            properties: { Payment: { select: { name: "Paid" } } },
          });
          if (booking.notion_lesson_id_1) {
            await fetch(`https://api.notion.com/v1/pages/${booking.notion_lesson_id_1}`, {
              method: "PATCH",
              headers: notionHeaders,
              body: patchBody,
            }).catch((e) => console.error(`[${functionName}] Failed to update lesson 1 payment:`, e.message));
          }
          if (booking.notion_lesson_id_2) {
            await fetch(`https://api.notion.com/v1/pages/${booking.notion_lesson_id_2}`, {
              method: "PATCH",
              headers: notionHeaders,
              body: patchBody,
            }).catch((e) => console.error(`[${functionName}] Failed to update lesson 2 payment:`, e.message));
          }
        }

        await supabase
          .from("voice_bookings")
          .update({ status: "paid" })
          .eq("calcom_booking_id", calcomBookingUid);
      }

      return new Response(JSON.stringify({ success: true, message: "Paid" }), {
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

        const { data: booking } = await supabase
          .from("voice_bookings")
          .select("notion_lesson_id_1, notion_lesson_id_2")
          .eq("calcom_booking_id", calcomBookingUid)
          .single();

        if (booking) {
          const notionHeaders = {
            Authorization: `Bearer ${NOTION_KEY}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          };
          if (booking.notion_lesson_id_1) {
            await fetch(`https://api.notion.com/v1/pages/${booking.notion_lesson_id_1}`, {
              method: "PATCH",
              headers: notionHeaders,
              body: JSON.stringify({ archived: true }),
            }).catch((e) => console.error(`[${functionName}] Failed to archive lesson 1:`, e.message));
          }
          if (booking.notion_lesson_id_2) {
            await fetch(`https://api.notion.com/v1/pages/${booking.notion_lesson_id_2}`, {
              method: "PATCH",
              headers: notionHeaders,
              body: JSON.stringify({ archived: true }),
            }).catch((e) => console.error(`[${functionName}] Failed to archive lesson 2:`, e.message));
          }
        }

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

    // Handle reschedules — Cal.com cancels the old booking and creates a new UID.
    // Update the existing voice_bookings row + Notion lesson dates in place so the
    // reconcile sweep doesn't later treat the old UID as a deleted booking.
    if (triggerEvent === "BOOKING_RESCHEDULED") {
      const payload = body.payload || body.data || body;
      const newUid = payload.uid || payload.data?.uid || null;
      const oldUid = payload.rescheduleUid || payload.oldBookingUid || payload.originalRescheduledBooking?.uid || payload.fromReschedule || null;
      const newStart = payload.startTime || payload.start;
      const attendeeEmail = (payload.attendees?.[0]?.email || payload.responses?.email || "").toLowerCase().trim();

      if (newStart) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        let booking = null;
        if (oldUid) {
          const { data } = await supabase.from("voice_bookings").select("*").eq("calcom_booking_id", oldUid).maybeSingle();
          booking = data;
        }
        if (!booking && attendeeEmail) {
          const { data } = await supabase.from("voice_bookings").select("*").eq("student_email", attendeeEmail).neq("status", "cancelled").order("lesson_date", { ascending: false }).limit(1).maybeSingle();
          booking = data;
        }

        if (booking) {
          const newDate = newStart.split("T")[0];
          const newTime = new Date(newStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
          await supabase.from("voice_bookings")
            .update({ calcom_booking_id: newUid || booking.calcom_booking_id, lesson_date: newDate, status: "scheduled" })
            .eq("calcom_booking_id", booking.calcom_booking_id);

          const nHeaders = { Authorization: `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" };
          if (booking.notion_lesson_id_1) {
            await fetch(`https://api.notion.com/v1/pages/${booking.notion_lesson_id_1}`, { method: "PATCH", headers: nHeaders,
              body: JSON.stringify({ properties: { Date: { date: { start: newDate } }, Breakthroughs: { rich_text: [{ text: { content: newTime } }] } } }) }).catch((e) => console.error(`[${functionName}] reschedule notion 1:`, e.message));
          }
          if (booking.notion_lesson_id_2) {
            await fetch(`https://api.notion.com/v1/pages/${booking.notion_lesson_id_2}`, { method: "PATCH", headers: nHeaders,
              body: JSON.stringify({ properties: { Date: { date: { start: newDate } }, Details: { rich_text: [{ text: { content: newTime } }] } } }) }).catch((e) => console.error(`[${functionName}] reschedule notion 2:`, e.message));
          }
          console.log(`[${functionName}] Rescheduled voice booking → ${newUid} @ ${newDate}`);
          return new Response(JSON.stringify({ success: true, message: "Rescheduled" }), { status: 200, headers: corsHeaders });
        }
        // No existing record — fall through to the creation flow below to add it.
        console.log(`[${functionName}] Reschedule with no existing voice booking — creating as new.`);
      }
    }

    // Only process creation (and reschedule-with-no-existing) events
    if (triggerEvent !== "BOOKING_CREATED" && triggerEvent !== "BOOKING_RESCHEDULED") {
      console.log(`[${functionName}] Ignoring event: ${triggerEvent}`);
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const payload = body.payload || body.data || body;
    const attendee =
      payload.attendees?.[0] || payload.responses;

    // Supabase client for the main booking flow (price lookup, etc.)
    // NOTE: previously undeclared here, causing "supabase is not defined" to
    // throw on every booking that carried an eventTypeId — which silently
    // aborted the whole flow before any lesson was logged or any email sent.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
      timeZone: "Australia/Melbourne",
      timeZoneName: "short",
    });
    const endTimeStr = endTime
      ? new Date(endTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Australia/Melbourne",
          timeZoneName: "short",
        })
      : "";
    const lessonTime = endTimeStr ? `${startTimeStr} – ${endTimeStr}` : startTimeStr;

    // Guard against duplicate creation: Cal.com fires both BOOKING_RESCHEDULED and
    // BOOKING_CREATED for a reschedule. If the reschedule handler already updated an
    // existing voice_bookings row for this student+date, skip creating new Notion pages.
    {
      const checkSupabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const { data: existingForDate } = await checkSupabase
        .from("voice_bookings")
        .select("calcom_booking_id")
        .eq("student_email", attendeeEmail)
        .eq("lesson_date", lessonDate)
        .neq("status", "cancelled")
        .maybeSingle();
      if (existingForDate && existingForDate.calcom_booking_id !== calcomBookingUid) {
        console.log(`[${functionName}] Skipping duplicate creation — existing booking ${existingForDate.calcom_booking_id} for ${attendeeEmail} on ${lessonDate}`);
        return new Response(JSON.stringify({ success: true, message: "Already exists" }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    }

    // Find the student in Notion Voice Clients DB by email
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

    // Resolve the price for this event type from the editable event_pricing table.
    // Must happen BEFORE calling voice-schedule-lesson so cost is persisted in voice_bookings.
    const eventTypeId = payload.eventTypeId || payload.eventType?.id || payload.type?.id || null;
    let cost = 0;
    let duration = null;
    let sendLink = true;
    if (eventTypeId) {
      const { data: pricing } = await supabase
        .from("event_pricing")
        .select("price, duration_minutes, send_payment_link")
        .eq("calcom_event_type_id", eventTypeId)
        .maybeSingle();
      if (pricing) {
        sendLink = pricing.send_payment_link;
        duration = pricing.duration_minutes;
        cost = sendLink ? Number(pricing.price) || 0 : 0;
      }
    }

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
          cost: cost || null,
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
      try {
        const sbFail = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await sbFail.from("webhook_failures").insert({ source: functionName, event_type: triggerEvent, reference: attendeeEmail, detail: `voice-schedule-lesson failed: ${scheduleData.error || "unknown"}` });
      } catch (_e) { /* non-fatal */ }
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

    // Send the Stripe "Pay Now" / onboarding email — but ONLY for bookings made via the
    // embedded Cal.com page. CRM bookings (source "Voice Studio CRM") already trigger the
    // onboarding email from the booking dialog, so we skip them here to avoid a double-send.
    const bookingSource = payload.metadata?.source || payload.data?.metadata?.source || null;
    if (bookingSource !== "Voice Studio CRM") {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/voice-send-onboarding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            studentName: attendee.name || attendeeEmail.split("@")[0],
            studentEmail: attendeeEmail,
            date: lessonDate,
            time: lessonTime,
            duration,
            cost,
            calcomBookingUid,
          }),
        });
        console.log(`[${functionName}] Onboarding/payment email triggered for embed booking (cost ${cost}).`);
      } catch (onboardErr) {
        console.error(`[${functionName}] Onboarding send failed (non-fatal):`, onboardErr.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Lesson scheduled in both Notion databases." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    try {
      const sbFail = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      await sbFail.from("webhook_failures").insert({ source: functionName, event_type: "calcom-voice-webhook", detail: error.message });
    } catch (_e) { /* non-fatal */ }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
