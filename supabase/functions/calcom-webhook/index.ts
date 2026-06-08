// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Only process these specific clinical event types
const ALLOWED_EVENT_IDS = [4279898, 5302336, 5927215];

serve(async (req) => {
  const functionName = "calcom-webhook";
  console.log(`[${functionName}] Webhook received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase environment variables.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
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

    if (triggerEvent === 'BOOKING_CANCELLED') {
      console.log(`[${functionName}] Deleting cancelled booking: ${calcomId}`);
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    // SECURITY FILTER: Check if this is a clinical event (creation/reschedule only)
    const eventTypeId = parseInt(payload.eventTypeId);
    if (eventTypeId && !ALLOWED_EVENT_IDS.includes(eventTypeId)) {
      console.log(`[${functionName}] Skipping non-clinical event type: ${eventTypeId}`);
      return new Response(JSON.stringify({ success: true, message: "Skipped: Non-clinical event type" }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) {
      console.warn(`[${functionName}] Skipping: No attendee email found in payload.`);
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), { status: 200, headers: corsHeaders });
    }

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;

    // Find existing client by email to avoid unique constraint issues
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let dbClient;
    if (existingClient) {
      const { data: updatedClient, error: clientError } = await supabase
        .from('clients')
        .update({ name })
        .eq('id', existingClient.id)
        .select('*')
        .single();
      
      if (clientError) throw clientError;
      dbClient = updatedClient;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ user_id: PRACTITIONER_ID, name, email })
        .select('*')
        .single();

      if (clientError) throw clientError;
      dbClient = newClient;
    }

    const isCreationEvent = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED'].includes(triggerEvent);
    
    // 1. Check for existing record by Calcom ID
    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id')
      .eq('calcom_booking_id', calcomId)
      .maybeSingle();

    if (!existingApp && !isCreationEvent) {
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), { status: 200, headers: corsHeaders });
    }

    let targetId = existingApp?.id;

    // 2. If not found by ID, check for ANY appointment for this client within a 1-minute window
    if (!targetId && isCreationEvent) {
      const startDate = new Date(startTime);
      const windowStart = new Date(startDate.getTime() - 60000).toISOString();
      const windowEnd = new Date(startDate.getTime() + 60000).toISOString();

      const { data: timeMatch } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', dbClient.id)
        .gte('date', windowStart)
        .lte('date', windowEnd)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (timeMatch) {
        console.log(`[${functionName}] Found existing appointment by time window. Linking to Cal.com ID: ${calcomId}`);
        targetId = timeMatch.id;
      }
    }

    let priceAmount = 0;
    if (String(eventTypeId) === "4279898") priceAmount = 70;
    else if (String(eventTypeId) === "5927215") priceAmount = 0;
    else if (String(eventTypeId) === "5302336") priceAmount = 100;
    if (payload.payment && payload.payment[0]) priceAmount = payload.payment[0].amount / 100;

    const { error: appError } = await supabase
      .from('appointments')
      .upsert({
        ...(targetId ? { id: targetId } : {}),
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        calcom_booking_id: calcomId,
        status: triggerEvent === 'BOOKING_RESCHEDULED' ? 'Scheduled' : undefined,
        is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0],
        price_amount: priceAmount,
        price_currency: 'AUD'
      }, { 
        onConflict: targetId ? 'id' : 'calcom_booking_id' 
      });

    if (appError) throw appError;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})