// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v12] CLEAN-ROOM WEBHOOK START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    /**
     * V12 CORE FIX: 
     * We create the client using a custom fetch that effectively strips 
     * the "Bearer" token from the incoming request context.
     */
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        fetch: (url, options) => {
          const headers = new Headers(options?.headers);
          // Force set the correct Service Role key
          headers.set('Authorization', `Bearer ${supabaseServiceKey}`);
          headers.set('apikey', supabaseServiceKey);
          return fetch(url, { ...options, headers });
        },
      },
    })

    const body = await req.json()
    const { triggerEvent, payload } = body

    if (triggerEvent !== 'BOOKING_CREATED') {
      return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = String(attendee.email).toLowerCase().trim()
    const name = String(attendee.name || "Unknown").trim()
    
    // Use the known User ID for your account to minimize lookups
    const userId = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    // 1. Process Client
    console.log(`Checking client: ${email}`);
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let clientId;
    if (existingClient) {
      clientId = existingClient.id;
      await supabase.from('clients').update({ name }).eq('id', clientId);
    } else {
      console.log("Inserting new client...");
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: name,
          email: email
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      clientId = newClient.id;
    }

    // 2. Create Appointment
    console.log(`Creating appointment for: ${clientId}`);
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        client_id: clientId,
        name: payload.title || "Kinesiology Session",
        date: payload.startTime,
        status: "Scheduled",
        notes: `Cal.com booking. UID: ${payload.uid}`
      })

    if (appError) throw appError;

    console.log("--- WEBHOOK SUCCESS ---");
    return new Response(JSON.stringify({ success: true, clientId }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V12 Final Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})