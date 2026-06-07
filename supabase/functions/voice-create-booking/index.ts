// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    const body = await req.json();
    const { studentName, studentEmail, startTime, eventTypeId, title, notes, bookingUid } = body;

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
        return new Response(JSON.stringify({ success: true, uid: newUid, action: "rescheduled" }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(result.error?.message || "Failed to reschedule");
    }

    // Create new booking
    console.log(`[${functionName}] CREATE new booking`);
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
      return new Response(JSON.stringify({ success: true, uid: createResult.data.uid, action: "created" }), {
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
