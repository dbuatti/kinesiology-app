// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [sync-calcom-bookings] v2.1 START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY")

    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;
    if (!PRACTITIONER_ID) throw new Error("No practitioner profile found.");

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
    console.log(`[sync-calcom-bookings] Found ${bookings.length} upcoming bookings.`);
    
    let syncedCount = 0;

    for (const booking of bookings) {
      const attendee = booking.attendees?.[0];
      if (!attendee || !attendee.email) continue;

      const name = String(attendee.name || "Unknown Client").trim();
      const email = String(attendee.email || "").toLowerCase().trim();
      const calcomId = String(booking.uid || booking.id);
      const startTime = booking.start;

      console.log(`[sync-calcom-bookings] Processing: ${name} (${email})`);

      const { data: dbClient } = await supabase
        .from('clients')
        .upsert({ user_id: PRACTITIONER_ID, name, email }, { onConflict: 'email' })
        .select('id')
        .single();

      if (!dbClient) {
        console.error(`[sync-calcom-bookings] Failed to upsert client: ${name}`);
        continue;
      }

      const { data: existingApp } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', dbClient.id)
        .eq('date', startTime)
        .maybeSingle();

      if (existingApp) {
        console.log(`[sync-calcom-bookings] Updating existing app: ${existingApp.id}`);
        await supabase
          .from('appointments')
          .update({ 
            calcom_booking_id: calcomId,
            is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
          })
          .eq('id', existingApp.id);
      } else {
        console.log(`[sync-calcom-bookings] Creating new app for: ${name}`);
        await supabase
          .from('appointments')
          .upsert({
            user_id: PRACTITIONER_ID,
            client_id: dbClient.id,
            date: startTime,
            tag: "Kinesiology",
            status: "Scheduled",
            calcom_booking_id: calcomId,
            is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
          }, { onConflict: 'calcom_booking_id' });
      }

      syncedCount++;
    }

    console.log(`--- [sync-calcom-bookings] FINISHED: ${syncedCount} synced ---`);
    return new Response(JSON.stringify({ success: true, syncedCount }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("[sync-calcom-bookings] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})