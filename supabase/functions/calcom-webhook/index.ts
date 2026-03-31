// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v17] MULTI-NOTION SYNC START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";
    const APPOINTMENTS_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const body = await req.json();
    const { triggerEvent, payload } = body;
    if (triggerEvent !== 'BOOKING_CREATED') return new Response('Ignored', { status: 200 });

    const attendee = payload.attendees[0];
    const name = String(attendee.name).trim();
    const email = String(attendee.email).toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;

    // --- 1. NOTION CLIENT MANAGEMENT ---
    console.log(`Searching Notion for client: ${name}`);
    const searchRes = await fetch(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        filter: { property: "Name", title: { equals: name } }
      })
    });
    
    const searchData = await searchRes.json();
    let notionClientId;

    if (searchData.results.length > 0) {
      notionClientId = searchData.results[0].id;
      console.log("Existing Notion client found. Updating details...");
      await fetch(`https://api.notion.com/v1/pages/${notionClientId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
        body: JSON.stringify({
          properties: {
            "Email": { email: email },
            "Phone": { phone_number: phone }
          }
        })
      });
    } else {
      console.log("Creating new Notion client...");
      const createClientRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
        body: JSON.stringify({
          parent: { database_id: CLIENTS_DB_ID },
          properties: {
            "Name": { title: [{ text: { content: name } }] },
            "Email": { email: email },
            "Phone": { phone_number: phone }
          }
        })
      });
      const newClientData = await createClientRes.json();
      notionClientId = newClientData.id;
    }

    // --- 2. NOTION APPOINTMENT CREATION ---
    console.log("Creating Notion Appointment with Relation...");
    let amountPaid = 0;
    if (payload.payment && payload.payment.length > 0) amountPaid = payload.payment[0].amount / 100;

    const appointmentRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        parent: { database_id: APPOINTMENTS_DB_ID },
        properties: {
          "Title": { title: [{ text: { content: `${name} - ${payload.title}` } }] },
          "Date": { date: { start: startTime } },
          "Dollars": { number: amountPaid },
          "Project": { select: { name: "Kinesiology" } },
          "Clients": { relation: [{ id: notionClientId }] } // <--- THE RELATION FIELD
        }
      })
    });

    if (!appointmentRes.ok) console.error("Appointment Link Error:", await appointmentRes.json());

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V17 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})