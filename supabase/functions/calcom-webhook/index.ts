// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v23] FINANCE DB MAPPING FIX ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";
    const FINANCE_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0"; 
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const body = await req.json();
    const { payload } = body;
    const attendee = payload.attendees[0];
    const name = String(attendee.name).trim();
    const email = String(attendee.email).toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;

    // 1. NOTION CLIENT SYNC
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
          properties: {
            "Name": { title: [{ text: { content: name } }] },
            "Email": { email: email },
            "Phone": phone ? { phone_number: phone } : undefined
          }
        })
      });
      const newC = await createC.json();
      notionClientId = newC.id;
    }

    // 2. CREATE FINANCE ENTRY (Database: 11caad21...)
    const amountPaid = payload.payment?.[0]?.amount ? payload.payment[0].amount / 100 : 0;
    
    const financeProps = {
      "Title": { title: [{ text: { content: `${name} - ${payload.title}` } }] },
      "Date": { date: { start: startTime } },
      "Dollars": { number: amountPaid },
      "Project": { select: { name: "Kinesiology" } }
    };

    // FIXED: Corrected property name to "Client (Kin)"
    if (notionClientId) {
      financeProps["Client (Kin)"] = { relation: [{ id: notionClientId }] };
    }

    const financeRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ parent: { database_id: FINANCE_DB_ID }, properties: financeProps })
    });

    const financeData = await financeRes.json();
    if (!financeRes.ok) {
      console.error("FINANCE DB ERROR:", JSON.stringify(financeData));
      throw new Error(`Finance Sync Failed: ${financeData.message}`);
    }
    const notionPageId = financeData.id;

    // 3. SUPABASE SYNC
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
      notion_page_id: notionPageId
    });

    console.log("--- SYNC SUCCESSFUL ---");
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("V23 Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})