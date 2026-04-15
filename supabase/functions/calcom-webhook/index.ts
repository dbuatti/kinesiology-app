// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  const functionName = "calcom-webhook";
  console.log(`[${functionName}] Webhook received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    
    console.log(`[${functionName}] Event Type: ${triggerEvent}`);

    if (triggerEvent === 'PING') {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    // 1. Handle Cancellations
    if (triggerEvent === 'BOOKING_CANCELLED') {
      console.log(`[${functionName}] Deleting cancelled booking: ${calcomId}`);
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) {
      console.log(`[${functionName}] Skipping: No attendee email found.`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;
    const eventTypeId = String(payload.eventTypeId || "");

    // 2. Ensure Client exists
    const { data: dbClient } = await supabase
      .from('clients')
      .upsert({ user_id: PRACTITIONER_ID, name, email }, { onConflict: 'email' })
      .select('*')
      .single();

    if (!dbClient) throw new Error("Failed to upsert client.");

    // 3. Smart Upsert Logic
    const isCreationEvent = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED'].includes(triggerEvent);
    
    // Check if we already have this booking
    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id')
      .eq('calcom_booking_id', calcomId)
      .maybeSingle();

    if (!existingApp && !isCreationEvent) {
      console.log(`[${functionName}] Skipping: Received ${triggerEvent} for non-existent booking ${calcomId}`);
      return new Response(JSON.stringify({ success: true, message: "Ignored non-creation event for unknown booking" }), { status: 200, headers: corsHeaders });
    }

    // If it's a new booking, try to find a manual entry to link first
    let targetId = existingApp?.id;
    if (!targetId && isCreationEvent) {
      const { data: manualMatch } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', dbClient.id)
        .eq('date', startTime)
        .is('calcom_booking_id', null)
        .maybeSingle();
      
      if (manualMatch) {
        console.log(`[${functionName}] Linking manual entry ${manualMatch.id} to Cal.com booking ${calcomId}`);
        targetId = manualMatch.id;
      }
    }

    // Price Mapping
    let priceAmount = 0;
    if (eventTypeId === "4279898") priceAmount = 50;
    else if (eventTypeId === "5302336") priceAmount = 100;
    if (payload.payment && payload.payment[0]) priceAmount = payload.payment[0].amount / 100;

    console.log(`[${functionName}] Upserting record for booking: ${calcomId} at ${startTime}`);

    const { error: appError } = await supabase
      .from('appointments')
      .upsert({
        id: targetId,
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        calcom_booking_id: calcomId,
        status: triggerEvent === 'BOOKING_RESCHEDULED' ? 'Scheduled' : undefined,
        is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0],
        price_amount: priceAmount,
        price_currency: 'AUD'
      }, { 
        onConflict: 'calcom_booking_id' 
      });

    if (appError) throw appError;

    console.log(`[${functionName}] Webhook processed successfully`);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})