// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v5] CAL.COM WEBHOOK START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    // Create client with explicit headers to avoid picking up 'Authorization' from the incoming request
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      },
      auth: {
        persistSession: false,
      }
    })

    const body = await req.json()
    const { triggerEvent, payload } = body

    if (triggerEvent !== 'BOOKING_CREATED') {
      return new Response(JSON.stringify({ message: 'Ignored event type' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = String(attendee.email).toLowerCase().trim()
    const name = String(attendee.name).trim()
    const startTime = payload.startTime
    const title = String(payload.title || "Kinesiology Session")
    const description = String(payload.description || "")
    
    let amountPaid = 0;
    if (payload.payment && payload.payment.length > 0) {
      amountPaid = payload.payment[0].amount / 100; 
    }

    // Get the practitioner (owner)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !users.users.length) throw new Error("Could not find practitioner user");
    
    const userId = users.users[0].id;

    // 1. Manual Check for Client (Avoids 'upsert' conflict issues)
    console.log(`Checking for client: ${email} for user ${userId}`);
    
    let { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch Client Error:", fetchError);
      throw new Error(`Client Lookup Failed: ${fetchError.message}`);
    }

    if (client) {
      console.log(`Updating existing client: ${client.id}`);
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: name,
          phone: attendee.phoneNumber ? String(attendee.phoneNumber) : null,
        })
        .eq('id', client.id);
      
      if (updateError) throw updateError;
    } else {
      console.log(`Creating new client for: ${email}`);
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: name,
          email: email,
          phone: attendee.phoneNumber ? String(attendee.phoneNumber) : null,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Insert Client Error:", insertError);
        throw insertError;
      }
      client = newClient;
    }

    // 2. Create Appointment
    console.log(`Creating appointment for client: ${client.id}`);
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        client_id: client.id,
        name: title,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        issue: description,
        notes: `Booked via Cal.com. Paid: $${amountPaid}. UID: ${payload.uid}`
      })

    if (appError) {
      console.error("Appointment Insert Error:", appError);
      throw new Error(`Appointment Creation Error: ${appError.message}`);
    }

    console.log("--- WEBHOOK SUCCESS ---");
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})