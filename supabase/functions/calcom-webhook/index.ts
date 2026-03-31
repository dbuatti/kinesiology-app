// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v3] CAL.COM WEBHOOK START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    console.log("Payload received:", JSON.stringify(body, null, 2));

    const { triggerEvent, payload } = body

    if (triggerEvent !== 'BOOKING_CREATED') {
      console.log(`Ignoring event type: ${triggerEvent}`);
      return new Response(JSON.stringify({ message: 'Ignored event type' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = attendee.email
    const name = attendee.name
    const startTime = payload.startTime
    const title = payload.title || "Kinesiology Session"
    const description = payload.description || ""
    
    let amountPaid = 0;
    if (payload.payment && payload.payment.length > 0) {
      amountPaid = payload.payment[0].amount / 100; 
    }

    // Get the practitioner (owner)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !users.users.length) throw new Error("Could not find practitioner user");
    
    const userId = users.users[0].id;
    console.log(`Target User ID: ${userId}`);

    // 1. Upsert Client
    console.log(`Upserting client: ${email}`);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
        user_id: userId,
        name: name,
        email: email,
        phone: attendee.phoneNumber || null,
      }, { onConflict: 'user_id,email' })
      .select()
      .single()

    if (clientError) {
      console.error("STEP 1 FAILED (Client Upsert):", clientError);
      throw new Error(`Client Sync Error: ${clientError.message}`);
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
        issue: String(description), // Force to string
        notes: `Booked via Cal.com. Paid: $${amountPaid}. UID: ${payload.uid}`
      })

    if (appError) {
      console.error("STEP 2 FAILED (Appointment Insert):", appError);
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