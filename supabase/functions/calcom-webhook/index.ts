// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: "active", version: "v34" }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [v34] CAL.COM WEBHOOK + KIT SYNC START ---");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    const KIT_API_KEY = Deno.env.get('KIT_API_KEY');
    const KIT_FORM_ID = Deno.env.get('KIT_FORM_ID'); // The ID of the Kit form to trigger automation
    
    const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";
    const APPTS_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
    const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const body = await req.json();
    const triggerEvent = body.triggerEvent;
    const payload = body.payload || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    if (triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_REJECTED') {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id, notion_page_id, notion_planner_id')
        .eq('calcom_booking_id', calcomId)
        .maybeSingle();

      if (appointment) {
        if (NOTION_KEY) {
          const notionHeaders = { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' };
          if (appointment.notion_page_id) {
            await fetch(`https://api.notion.com/v1/pages/${appointment.notion_page_id}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
          }
          if (appointment.notion_planner_id) {
            await fetch(`https://api.notion.com/v1/pages/${appointment.notion_planner_id}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
          }
        }
        await supabase.from('appointments').delete().eq('id', appointment.id);
      }
      return new Response(JSON.stringify({ success: true, action: 'deleted' }), { status: 200, headers: corsHeaders });
    }

    // 1. Extract Data
    const attendee = payload.attendees[0];
    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;
    const notes = payload.description || "";

    // 2. Sync to Kit (Triggering the Onboarding Email)
    if (KIT_API_KEY && KIT_FORM_ID) {
      console.log(`Triggering Kit Automation for ${email}...`);
      try {
        const kitRes = await fetch(`https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: KIT_API_KEY,
            email: email,
            first_name: name.split(' ')[0],
            tags: ["New Booking"] 
          })
        });
        if (!kitRes.ok) {
          const kitError = await kitRes.json();
          console.error("Kit API Error:", kitError);
        } else {
          console.log("Successfully triggered Kit automation.");
        }
      } catch (e) {
        console.error("Failed to call Kit API:", e.message);
      }
    }

    // 3. Notion Sync (Clients)
    let notionClientId = null;
    if (NOTION_KEY) {
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
            properties: { "Name": { title: [{ text: { content: name } }] }, "Email": email ? { email: email } : undefined, "Phone": phone ? { phone_number: phone } : undefined }
          })
        });
        const newC = await createC.json();
        notionClientId = newC.id;
      }
    }

    // 4. Notion Sync (Appointments & Planner)
    let notionPageId = null;
    if (NOTION_KEY) {
      const apptProps = { "Name": { title: [{ text: { content: `${name} - ${payload.title || 'Session'}` } }] }, "Date": { date: { start: startTime } }, "Notes": { rich_text: [{ text: { content: notes } }] } };
      if (notionClientId) apptProps["Client"] = { relation: [{ id: notionClientId }] };
      const apptRes = await fetch("https://api.notion.com/v1/pages", { method: "POST", headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" }, body: JSON.stringify({ parent: { database_id: APPTS_DB_ID }, properties: apptProps }) });
      const apptData = await apptRes.json();
      notionPageId = apptData.id;
    }

    let notionPlannerId = null;
    if (NOTION_KEY) {
      const amountPaid = payload.payment?.[0]?.amount ? payload.payment[0].amount / 100 : 0;
      const plannerProps = { "Title": { title: [{ text: { content: `${name} - ${payload.title || 'Session'}` } }] }, "Date": { date: { start: startTime } }, "Dollars": { number: amountPaid }, "Project": { select: { name: "Kinesiology" } } };
      if (notionClientId) plannerProps["Client (Kin)"] = { relation: [{ id: notionClientId }] };
      const plannerRes = await fetch("https://api.notion.com/v1/pages", { method: "POST", headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" }, body: JSON.stringify({ parent: { database_id: PLANNER_DB_ID }, properties: plannerProps }) });
      const plannerData = await plannerRes.json();
      notionPlannerId = plannerData.id;
    }

    // 5. Supabase CRM Sync
    let { data: dbClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
    if (!dbClient && email) {
      const { data: newDbC } = await supabase.from('clients').insert({ user_id: PRACTITIONER_ID, name, email, phone }).select().single();
      dbClient = newDbC;
    }

    if (dbClient) {
      await supabase.from('appointments').insert({
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        notion_page_id: notionPageId,
        notion_planner_id: notionPlannerId
      });
    }

    return new Response(JSON.stringify({ success: true, action: 'created' }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Critical Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})