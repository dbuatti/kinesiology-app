// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [sync-calcom-bookings] START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // Get the practitioner profile
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;
    if (!PRACTITIONER_ID) throw new Error("No practitioner profile found.");

    // 1. Fetch upcoming bookings from Cal.com
    const now = new Date().toISOString();
    const bookingsUrl = new URL('https://api.cal.com/v2/bookings');
    bookingsUrl.searchParams.set('status', 'upcoming');
    bookingsUrl.searchParams.set('startTime', now);

    const response = await fetch(bookingsUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALCOM_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Cal.com API Error");

    const bookings = result.data || [];
    console.log(`Found ${bookings.length} upcoming bookings to sync.`);

    let syncedCount = 0;

    for (const booking of bookings) {
      const attendee = booking.attendees?.[0];
      if (!attendee || !attendee.email) continue;

      const name = String(attendee.name || "Unknown Client").trim();
      const email = String(attendee.email || "").toLowerCase().trim();
      const calcomId = String(booking.uid || booking.id);

      // 2. Upsert Client
      const { data: dbClient, error: clientError } = await supabase
        .from('clients')
        .upsert({ 
          user_id: PRACTITIONER_ID, 
          name, 
          email, 
          phone: attendee.phoneNumber || attendee.phone || "" 
        }, { onConflict: 'email' })
        .select('id')
        .single();

      if (clientError) {
        console.error(`Failed to sync client ${email}:`, clientError);
        continue;
      }

      // 3. Upsert Appointment
      const { error: appError } = await supabase
        .from('appointments')
        .upsert({
          user_id: PRACTITIONER_ID,
          client_id: dbClient.id,
          date: booking.start,
          tag: "Kinesiology",
          status: "Scheduled",
          calcom_booking_id: calcomId,
          is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
        }, { onConflict: 'calcom_booking_id' });

      if (appError) {
        console.error(`Failed to sync appointment ${calcomId}:`, appError);
        continue;
      }

      syncedCount++;
    }

    return new Response(JSON.stringify({ success: true, syncedCount }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Critical Sync Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})