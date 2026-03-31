// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// The new Notion Database ID provided by the user
const NOTION_DATABASE_ID = "171f7156cdc645e8b689af13d217bc7c";

async function syncToNotion(appointmentData: any) {
  const NOTION_KEY = Deno.env.get('NOTION_API_KEY')

  if (!NOTION_KEY) {
    console.error("--- NOTION SYNC SKIPPED: Missing NOTION_API_KEY in Supabase Secrets ---")
    return
  }

  const properties = {
    "Name": {
      "title": [{ "text": { "content": appointmentData.name } }]
    },
    "Date": {
      "date": { "start": appointmentData.date }
    },
    "Goal": {
      "rich_text": [{ "text": { "content": appointmentData.goal || "" } }]
    },
    "Issue": {
      "rich_text": [{ "text": { "content": appointmentData.issue || "" } }]
    },
    "Notes": {
      "rich_text": [{ "text": { "content": appointmentData.notes || "" } }]
    }
  }

  try {
    console.log(`Attempting to sync to Notion database: ${NOTION_DATABASE_ID.substring(0, 5)}...`);
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: properties
      })
    })

    const result = await response.json();

    if (!response.ok) {
      console.error("Notion API Error:", JSON.stringify(result));
    } else {
      console.log("--- NOTION SYNC SUCCESS ---");
    }
  } catch (err) {
    console.error("Critical error during Notion sync:", err.message);
  }
}

async function deleteFromNotion(calcomUid: string) {
  const NOTION_KEY = Deno.env.get('NOTION_API_KEY')

  if (!NOTION_KEY) {
    console.error("--- NOTION DELETE SKIPPED: Missing Secrets ---")
    return
  }

  try {
    // 1. Search for the page in the database that contains the Calcom UID in the Notes property
    const searchResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: "Notes",
          rich_text: {
            contains: calcomUid
          }
        }
      })
    })

    const searchResult = await searchResponse.json();

    if (searchResult.results && searchResult.results.length > 0) {
      const pageId = searchResult.results[0].id;
      
      // 2. Archive (delete) the found page
      const deleteResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({ archived: true })
      })

      if (deleteResponse.ok) {
        console.log(`--- NOTION DELETE SUCCESS: Archived page ${pageId} ---`);
      } else {
        console.error("Notion Delete Error:", await deleteResponse.text());
      }
    } else {
      console.log("--- NOTION DELETE: No matching page found for UID ---");
    }
  } catch (err) {
    console.error("Critical error during Notion deletion:", err.message);
  }
}

serve(async (req) => {
  console.log("--- [v17] CAL.COM WEBHOOK START ---");

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

    // HANDLE CANCELLATIONS
    if (triggerEvent === 'BOOKING_CANCELLED') {
      const calcomUid = payload.uid;
      console.log(`Processing cancellation for UID: ${calcomUid}`);

      // 1. Find and delete from Supabase
      const { data: appToDelete } = await supabase
        .from('appointments')
        .select('id')
        .ilike('notes', `%${calcomUid}%`)
        .maybeSingle();

      if (appToDelete) {
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appToDelete.id);
        
        if (!deleteError) {
          console.log(`Deleted appointment ${appToDelete.id} from Supabase`);
        }
      }

      // 2. Delete from Notion
      await deleteFromNotion(calcomUid);

      return new Response(JSON.stringify({ success: true, message: 'Cancelled' }), { status: 200, headers: corsHeaders });
    }

    // HANDLE CREATIONS
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

    // 2. Create Appointment in Supabase
    const appointmentName = payload.title || `Session with ${name}`;
    const appointmentDate = payload.startTime;
    const appointmentIssue = payload.description || "";
    const appointmentNotes = `Booked via Cal.com. Paid: $${amountPaid}. UID: ${payload.uid}`;

    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: PRACTITIONER_ID,
        client_id: clientId,
        name: appointmentName,
        date: appointmentDate,
        tag: "Kinesiology",
        status: "Scheduled",
        issue: appointmentIssue,
        notes: appointmentNotes
      })

    if (appError) throw appError;

    // 3. Sync to Notion
    await syncToNotion({
      name: appointmentName,
      date: appointmentDate,
      goal: "New Booking (Cal.com)",
      issue: appointmentIssue,
      notes: appointmentNotes
    });

    console.log("--- WEBHOOK SUCCESS ---");
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V17 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})