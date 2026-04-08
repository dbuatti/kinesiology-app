// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [calcom-webhook] v3.0 — Handling Reschedules ---");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    
    if (triggerEvent === 'PING') return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    // 1. Handle Cancellations
    if (triggerEvent === 'BOOKING_CANCELLED') {
      console.log(`[calcom-webhook] Deleting cancelled booking: ${calcomId}`);
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) {
      console.log("[calcom-webhook] Skipping: No attendee email found.");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;
    const eventTypeId = String(payload.eventTypeId || "");

    // Price Mapping
    let priceAmount = 0;
    if (eventTypeId === "4279898") priceAmount = 50;
    else if (eventTypeId === "5302336") priceAmount = 100;
    
    // Override with actual payment data if present
    if (payload.payment && payload.payment[0]) {
      priceAmount = payload.payment[0].amount / 100;
    }

    // 2. Ensure Client exists
    const { data: dbClient } = await supabase
      .from('clients')
      .upsert({ user_id: PRACTITIONER_ID, name, email }, { onConflict: 'email' })
      .select('*')
      .single();

    if (!dbClient) throw new Error("Failed to upsert client.");

    // 3. Handle Reschedules or New Bookings
    // Smart Match: Check if an appointment already exists for this client at this time
    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', dbClient.id)
      .eq('date', startTime)
      .maybeSingle();

    if (existingApp) {
      console.log(`[calcom-webhook] Linking existing app ${existingApp.id} to Cal.com ID ${calcomId}`);
      await supabase
        .from('appointments')
        .update({
          calcom_booking_id: calcomId,
          is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0],
          price_amount: priceAmount,
          price_currency: 'AUD'
        })
        .eq('id', existingApp.id);
    } else if (triggerEvent === 'BOOKING_RESCHEDULED') {
      // If rescheduled, update the record that matches the Cal.com ID
      console.log(`[calcom-webhook] Updating rescheduled date for booking: ${calcomId}`);
      await supabase
        .from('appointments')
        .update({
          date: startTime,
          is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0],
          price_amount: priceAmount,
          price_currency: 'AUD'
        })
        .eq('calcom_booking_id', calcomId);
    } else {
      // New Booking
      console.log(`[calcom-webhook] Creating new record for booking: ${calcomId}`);
      await supabase
        .from('appointments')
        .upsert({
          user_id: PRACTITIONER_ID,
          client_id: dbClient.id,
          date: startTime,
          tag: "Kinesiology",
          status: "Scheduled",
          calcom_booking_id: calcomId,
          is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0],
          price_amount: priceAmount,
          price_currency: 'AUD'
        }, { onConflict: 'calcom_booking_id' });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[calcom-webhook] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})