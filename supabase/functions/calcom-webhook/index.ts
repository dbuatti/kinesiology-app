// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v2] CAL.COM TO NOTION AUTOMATION START ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const NOTION_DATABASE_ID = Deno.env.get('NOTION_DATABASE_ID')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
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

    // Get the owner of the project (the practitioner)
    // We assume the first user in the auth table is the practitioner for this single-user setup
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !users.users.length) throw new Error("Could not find practitioner user");
    
    const userId = users.users[0].id;
    console.log(`Processing booking for User: ${userId}`);

    // 1. Upsert Client (Requires the unique constraint we just added)
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
      console.error("Client Upsert Error:", clientError);
      throw clientError;
    }

    // 2. Create Appointment
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
      throw appError;
    }

    // 3. Sync to Notion
    if (NOTION_KEY && NOTION_DATABASE_ID) {
      console.log("Syncing to Notion...");
      
      const notionProperties = {
        "Name": {
          "title": [{ "text": { "content": `${name} - ${title}` } }]
        },
        "Date": {
          "date": { "start": startTime }
        },
        "Goal": {
          "rich_text": [{ "text": { "content": title } }]
        },
        "Issue": {
          "rich_text": [{ "text": { "content": description } }]
        },
        "Client": {
          "rich_text": [{ "text": { "content": name } }]
        }
      };

      const notionResponse = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DATABASE_ID },
          properties: notionProperties
        })
      });

      if (!notionResponse.ok) {
        const errorData = await notionResponse.json();
        console.error("Notion Sync Error:", errorData);
      } else {
        console.log("Successfully synced to Notion.");
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Critical Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})