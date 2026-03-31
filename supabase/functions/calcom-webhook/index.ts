// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v14] CAL.COM WEBHOOK START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
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
    const name = String(attendee.name).trim()
    const phone = attendee.phoneNumber ? String(attendee.phoneNumber) : null
    
    let amountPaid = 0;
    if (payload.payment && payload.payment.length > 0) {
      amountPaid = payload.payment[0].amount / 100; 
    }

    // 1. Manage Client
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .eq('user_id', PRACTITIONER_ID)
      .maybeSingle();

    let clientId;
    if (client) {
      clientId = client.id;
      await supabase.from('clients').update({ name, phone }).eq('id', clientId);
    } else {
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: PRACTITIONER_ID,
          name: name,
          email: email,
          phone: phone
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      clientId = newClient.id;
    }

    // 2. Create Appointment
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: PRACTITIONER_ID,
        client_id: clientId,
        name: payload.title || "Kinesiology Session",
        date: payload.startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        issue: payload.description || "",
        notes: `Booked via Cal.com. Paid: $${amountPaid}. UID: ${payload.uid}`
      })

    if (appError) throw appError;

    console.log("--- WEBHOOK SUCCESS ---");
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V14 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})