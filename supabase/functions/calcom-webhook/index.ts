// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v13] THE FINAL PUSH START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Using your actual ID from the logs to bypass the 'listUsers' call entirely
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    // V13 FIX: We create a client that strictly refuses to touch the request headers
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    const body = await req.json()
    const { payload } = body

    if (!payload || !payload.attendees) {
       return new Response(JSON.stringify({ error: "Missing payload" }), { status: 400, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = String(attendee.email).toLowerCase().trim()
    const name = String(attendee.name).trim()

    // 1. Check for Client - Using a raw select to avoid any library magic
    console.log(`Searching for: ${email}`);
    const { data: client, error: searchError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .eq('user_id', PRACTITIONER_ID)
      .maybeSingle();

    if (searchError) throw new Error(`Search Fail: ${searchError.message}`);

    let clientId;
    if (client) {
      clientId = client.id;
      console.log(`Found existing client: ${clientId}`);
    } else {
      console.log("Creating new client record...");
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: PRACTITIONER_ID,
          name: name,
          email: email,
          // Explicitly leaving out everything else
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error("DEBUG - Raw Insert Error:", insertError);
        throw insertError;
      }
      clientId = newClient.id;
    }

    // 2. Create Appointment
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: PRACTITIONER_ID,
        client_id: clientId,
        name: payload.title || "Session",
        date: payload.startTime,
        status: "Scheduled",
        notes: `Cal.com auto-sync. UID: ${payload.uid}`
      });

    if (appError) throw appError;

    return new Response(JSON.stringify({ success: true, version: 13 }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V13 CRITICAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})