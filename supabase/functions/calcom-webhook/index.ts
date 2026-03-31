// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v10] HARDENED WEBHOOK START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // V10 FIX: Use a custom fetch to FORCE-KILL any inherited headers from the request
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        fetch: (url, options) => {
          const newHeaders = new Headers(options?.headers);
          newHeaders.set('Authorization', `Bearer ${supabaseServiceKey}`);
          newHeaders.set('apikey', supabaseServiceKey);
          return fetch(url, { ...options, headers: newHeaders });
        },
      },
      auth: { persistSession: false }
    })

    const body = await req.json()
    const { triggerEvent, payload } = body

    if (triggerEvent !== 'BOOKING_CREATED') {
      return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = String(attendee.email).toLowerCase().trim()
    const name = String(attendee.name || "Unknown").trim()

    // 1. Get Practitioner ID
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw new Error(`User List Error: ${userError.message}`);
    const userId = userData.users[0].id;

    // 2. Process Client
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .maybeSingle();

    let clientId;
    if (existingClient) {
      clientId = existingClient.id;
      await supabase.from('clients').update({ name }).eq('id', clientId);
    } else {
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({ user_id: userId, name, email })
        .select()
        .single();
      
      if (insertError) throw insertError;
      clientId = newClient.id;
    }

    // 3. Create Appointment
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        client_id: clientId,
        name: payload.title || "Session",
        date: payload.startTime,
        status: "Scheduled",
        notes: `Cal.com UID: ${payload.uid}`
      })

    if (appError) throw appError;

    return new Response(JSON.stringify({ success: true, version: "v10" }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V10 Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})