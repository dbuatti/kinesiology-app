// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v9] CAL.COM WEBHOOK START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Explicitly create a clean client to avoid header inheritance
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { Authorization: `Bearer ${supabaseServiceKey}` }
      }
    })

    const body = await req.json()
    const { triggerEvent, payload } = body

    if (triggerEvent !== 'BOOKING_CREATED') {
      console.log(`Ignored event: ${triggerEvent}`);
      return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = String(attendee.email).toLowerCase().trim()
    const name = String(attendee.name || "Unknown").trim()

    // Get your User ID (Practitioner)
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !userData.users.length) throw new Error("Could not find practitioner user");
    const userId = userData.users[0].id;

    // 1. Process Client
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw new Error(`Client Lookup Error: ${fetchError.message}`);

    let clientId;

    if (existingClient) {
      clientId = existingClient.id;
      console.log(`Updating existing client: ${clientId}`);
      await supabase.from('clients').update({ name }).eq('id', clientId);
    } else {
      const insertPayload = {
        user_id: userId,
        name: name,
        email: email
      };
      
      console.log("Attempting Client Insert with payload:", JSON.stringify(insertPayload));
      
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert(insertPayload)
        .select()
        .single();
      
      if (insertError) {
        console.error("DB Client Insert Error Details:", insertError);
        throw insertError;
      }
      clientId = newClient.id;
    }

    // 2. Create Appointment
    const appPayload = {
      user_id: userId,
      client_id: clientId,
      name: payload.title || "Session",
      date: payload.startTime,
      status: "Scheduled",
      notes: `Cal.com UID: ${payload.uid}`
    };

    console.log("Attempting Appointment Insert with payload:", JSON.stringify(appPayload));

    const { error: appError } = await supabase
      .from('appointments')
      .insert(appPayload);

    if (appError) {
      console.error("DB Appointment Insert Error Details:", appError);
      throw appError;
    }

    console.log("--- [v9] WEBHOOK SUCCESS ---");
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V9 Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})