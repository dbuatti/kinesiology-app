// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v18] CLIENT RELATION FIX START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";
    const APPOINTMENTS_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";

    const body = await req.json();
    const { payload } = body;
    const attendee = payload.attendees[0];
    const name = String(attendee.name).trim();
    const email = String(attendee.email).toLowerCase().trim();
    const phone = attendee.phoneNumber || "";

    // 1. SEARCH FOR CLIENT
    const searchRes = await fetch(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ filter: { property: "Name", title: { equals: name } } })
    });
    
    const searchData = await searchRes.json();
    let notionClientId = null;

    if (searchData.results && searchData.results.length > 0) {
      notionClientId = searchData.results[0].id;
      console.log(`Found existing Notion client: ${notionClientId}`);
    } else {
      console.log("Creating new Notion client...");
      const createRes = await fetch("https://api.notion.com/v1/pages", {
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
      const newClient = await createRes.json();
      notionClientId = newClient.id; // Capture the new ID
    }

    // 2. CREATE APPOINTMENT (With safety check for ID)
    const amountPaid = payload.payment?.[0]?.amount ? payload.payment[0].amount / 100 : 0;
    
    const appointmentProps = {
      "Title": { title: [{ text: { content: `${name} - ${payload.title}` } }] },
      "Date": { date: { start: payload.startTime } },
      "Dollars": { number: amountPaid },
      "Project": { select: { name: "Kinesiology" } }
    };

    // Only add the relation if we actually have an ID to avoid the 400 error
    if (notionClientId) {
      appointmentProps["Clients"] = { relation: [{ id: notionClientId }] };
    }

    const appRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({
        parent: { database_id: APPOINTMENTS_DB_ID },
        properties: appointmentProps
      })
    });

    if (!appRes.ok) {
      const errorDetail = await appRes.json();
      throw new Error(`Appointment Creation Failed: ${JSON.stringify(errorDetail)}`);
    }

    return new Response(JSON.stringify({ success: true, clientId: notionClientId }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("V18 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})