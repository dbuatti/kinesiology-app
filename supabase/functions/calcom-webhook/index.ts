// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v26] TRACKING BOTH NOTION DBS START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    
    // DB IDs
    const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";
    const APPTS_DB_ID = "171f7156cdc645e8b689af13d217bc7c";   // Main Appointments
    const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0"; // Yearly Planner
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const body = await req.json();
    const { payload } = body;
    const attendee = payload.attendees[0];
    const name = String(attendee.name).trim();
    const email = String(attendee.email).toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;
    const notes = payload.description || "";

    // 1. SYNC CLIENT (Master List)
    let notionClientId = null;
    const searchRes = await fetch(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ filter: { property: "Name", title: { equals: name } } })
    });
    const searchData = await searchRes.json();
    if (searchData.results?.length > 0) {
      notionClientId = searchData.results[0].id;
    } else {
      const createC = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
        body: JSON.stringify({
          parent: { database_id: CLIENTS_DB_ID },
          properties: { "Name": { title: [{ text: { content: name } }] }, "Email": { email: email }, "Phone": phone ? { phone_number: phone } : undefined }
        })
      });
      const newC = await createC.json();
      notionClientId = newC.id;
    }

    // 2. CREATE IN MAIN APPOINTMENTS DB
    console.log("Creating page in Appointments DB...");
    const apptProps = {
      "Name": { title: [{ text: { content: `${name} - ${payload.title}` } }] },
      "Date": { date: { start: startTime } },
      "Additional Notes": { rich_text: [{ text: { content: notes } }] }
    };
    if (notionClientId) apptProps["Client"] = { relation: [{ id: notionClientId }] };

    const apptRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ parent: { database_id: APPTS_DB_ID }, properties: apptProps })
    });
    const apptData = await apptRes.json();

    // 3. CREATE IN YEARLY PLANNER
    console.log("Creating page in Yearly Planner...");
    const amountPaid = payload.payment?.[0]?.amount ? payload.payment[0].amount / 100 : 0;
    const plannerProps = {
      "Title": { title: [{ text: { content: `${name} - ${payload.title}` } }] },
      "Date": { date: { start: startTime } },
      "Dollars": { number: amountPaid },
      "Project": { select: { name: "Kinesiology" } }
    };
    if (notionClientId) plannerProps["Client (Kin)"] = { relation: [{ id: notionClientId }] };

    const plannerRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ parent: { database_id: PLANNER_DB_ID }, properties: plannerProps })
    });
    const plannerData = await plannerRes.json();

    // 4. SUPABASE SYNC
    let { data: dbClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();

    if (!dbClient) {
      const { data: newDbC } = await supabase.from('clients').insert({ user_id: PRACTITIONER_ID, name, email, phone }).select().single();
      dbClient = newDbC;
    }

    await supabase.from('appointments').insert({
      user_id: PRACTITIONER_ID,
      client_id: dbClient.id,
      date: startTime,
      tag: "Kinesiology",
      status: "Scheduled",
      calcom_booking_id: String(payload.id),
      notion_page_id: apptData.id,      // Main Appointments DB ID
      notion_planner_id: plannerData.id // Yearly Planner DB ID
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("V26 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})