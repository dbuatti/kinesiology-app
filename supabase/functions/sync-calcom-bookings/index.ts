// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [sync-calcom-bookings] v5.0 — Aggressive Date Matching ---");

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
    let syncedCount = 0;

    for (const booking of bookings) {
      const attendee = booking.attendees?.[0];
      if (!attendee || !attendee.email) continue;

      const name = String(attendee.name || "Unknown Client").trim();
      const email = String(attendee.email || "").toLowerCase().trim();
      const calcomId = String(booking.uid || booking.id);
      const startTime = booking.start;

      // 1. Upsert Client
      const { data: dbClient } = await supabase
        .from('clients')
        .upsert({ user_id: PRACTITIONER_ID, name, email }, { onConflict: 'email' })
        .select('id')
        .single();

      if (!dbClient) continue;

      // 2. Match Strategy: ID first
      const { data: appById } = await supabase
        .from('appointments')
        .select('id')
        .eq('calcom_booking_id', calcomId)
        .maybeSingle();

      if (appById) {
        console.log(`[sync] Found by ID: ${calcomId}. Updating date to ${startTime}`);
        await supabase
          .from('appointments')
          .update({ 
            date: startTime,
            is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
          })
          .eq('id', appById.id);
      } else {
        // 3. Aggressive Match by Date + Client (Fixes 404/ID mismatch issues)
        console.log(`[sync] ID ${calcomId} not found in CRM. Searching by date ${startTime} for client ${dbClient.id}`);
        const { data: appByDate } = await supabase
          .from('appointments')
          .select('id')
          .eq('client_id', dbClient.id)
          .eq('date', startTime)
          .maybeSingle();

        if (appByDate) {
          console.log(`[sync] Match found by date! Linking CRM app ${appByDate.id} to Cal.com ID ${calcomId}`);
          await supabase
            .from('appointments')
            .update({ 
              calcom_booking_id: calcomId,
              is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
            })
            .eq('id', appByDate.id);
        } else {
          // 4. Create new if no match at all
          console.log(`[sync] No match found. Creating new record for ${calcomId}`);
          await supabase
            .from('appointments')
            .insert({
              user_id: PRACTITIONER_ID,
              client_id: dbClient.id,
              date: startTime,
              tag: "Kinesiology",
              status: "Scheduled",
              calcom_booking_id: calcomId,
              is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
            });
        }
      }

      syncedCount++;
    }

    return new Response(JSON.stringify({ success: true, syncedCount }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("[sync-calcom-bookings] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})