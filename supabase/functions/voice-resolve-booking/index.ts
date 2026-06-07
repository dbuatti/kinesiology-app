// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

serve(async (req) => {
  const functionName = "voice-resolve-booking";

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const { date, studentEmail, lessonNotionId1, lessonNotionId2 } = await req.json();
    if (!date || !studentEmail) throw new Error("Missing date or studentEmail.");

    console.log(`[${functionName}] Looking up Cal.com booking for ${studentEmail} on ${date}`);

    // Query ALL upcoming bookings (no time range filter to avoid TZ edge cases)
    const bookingsUrl = new URL('https://api.cal.com/v2/bookings');
    bookingsUrl.searchParams.set('status', 'upcoming');

    console.log(`[${functionName}] Fetching: ${bookingsUrl.toString()}`);

    const res = await fetch(bookingsUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${CALCOM_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || `Cal.com API error: ${res.status}`);

    const allBookings = result.data || [];
    console.log(`[${functionName}] Cal.com returned ${allBookings.length} upcoming bookings`);

    // Log all returned bookings for debugging
    for (const b of allBookings) {
      const emails = (b.attendees || []).map(a => a?.email?.toLowerCase()).join(", ");
      console.log(`[${functionName}] Booking: ${b.uid} start=${b.start} eventTypeId=${b.eventTypeId} attendees=[${emails}]`);
    }

    // Match by email + date
    const booking = allBookings.find((b) => {
      const bEmail = b.attendees?.[0]?.email?.toLowerCase().trim();
      if (bEmail !== studentEmail.toLowerCase().trim()) return false;
      // Also match the date (extract YYYY-MM-DD from Cal.com start time)
      const bookingDate = b.start ? b.start.split("T")[0] : null;
      const dateMatch = bookingDate === date;
      console.log(`[${functionName}] Email matched! Booking date=${bookingDate}, requested date=${date}, match=${dateMatch}`);
      return dateMatch;
    });

    if (!booking) {
      console.log(`[${functionName}] No matching Cal.com booking found for ${studentEmail}`);
      return new Response(JSON.stringify({ found: false, message: "No matching Cal.com booking found" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${functionName}] Found matching booking: ${booking.uid} on ${booking.start}`);

    // Create voice_bookings record
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const { error: insertError } = await supabase
      .from("voice_bookings")
      .insert({
        calcom_booking_id: booking.uid,
        student_email: studentEmail,
        lesson_date: date,
        status: 'scheduled',
        notion_lesson_id_1: lessonNotionId1 || null,
        notion_lesson_id_2: lessonNotionId2 || null,
      });

    if (insertError) {
      if (insertError.message?.includes('duplicate key')) {
        console.log(`[${functionName}] Booking ${booking.uid} already exists in voice_bookings`);
      } else {
        console.error(`[${functionName}] Insert error:`, insertError.message);
        throw insertError;
      }
    } else {
      console.log(`[${functionName}] Inserted voice_bookings record for ${booking.uid}`);
    }

    return new Response(JSON.stringify({
      found: true,
      booking: {
        calcom_booking_id: booking.uid,
        lesson_date: date,
        student_email: studentEmail,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ found: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
