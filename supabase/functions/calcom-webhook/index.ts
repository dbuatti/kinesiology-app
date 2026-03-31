// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v16] CAL.COM + NOTION SYNC START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const NOTION_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0"
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
    const startTime = payload.startTime;
    const appointmentTitle = payload.title || "Kinesiology Session";
    
    let amountPaid = 0;
    if (payload.payment && payload.payment.length > 0) {
      amountPaid = payload.payment[0].amount / 100; 
    }

    // 1. Supabase: Manage Client
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
        .from('clients').insert({ user_id: PRACTITIONER_ID, name, email, phone }).select().single();
      if (insertError) throw insertError;
      clientId = newClient.id;
    }

    // 2. Supabase: Create Appointment
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: PRACTITIONER_ID,
        client_id: clientId,
        name: appointmentTitle,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        issue: payload.description || "",
        notes: `Booked via Cal.com. Paid: $${amountPaid}. UID: ${payload.uid}`
      })

    if (appError) throw appError;

    // 3. Notion: Create Page
    console.log("Sending to Notion...");
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          "Title": {
            title: [{ text: { content: `${name} - ${appointmentTitle}` } }]
          },
          "Date": {
            date: { start: startTime }
          },
          "Dollars": {
            number: amountPaid
          },
          "Project": {
            select: { name: "Kinesiology" }
          }
        },
      }),
    });

    if (!notionResponse.ok) {
      const errorData = await notionResponse.json();
      console.error("Notion Error:", errorData);
    }

    console.log("--- WEBHOOK & NOTION SUCCESS ---");
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V16 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})