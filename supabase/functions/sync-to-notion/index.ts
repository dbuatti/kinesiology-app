// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAIN_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { appointment } = await req.json()
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')

    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.")

    // 1. Create in Main Appointments DB
    const mainProps = {
      "Name": { title: [{ text: { content: appointment.name || `Session with ${appointment.clients.name}` } }] },
      "Date": { date: { start: appointment.date } },
      "Goal": { rich_text: [{ text: { content: appointment.goal || "" } }] },
      "Issue": { multi_select: [{ name: appointment.tag || "Kinesiology" }] },
      "Notes": { rich_text: [{ text: { content: `${appointment.issue ? `ISSUE: ${appointment.issue}\n\n` : ''}${appointment.notes || ""}` } }] },
      "🎛️ Modes & Balances": { rich_text: [{ text: { content: appointment.modes_balances || "" } }] },
      "🔺 Acupoints": { rich_text: [{ text: { content: appointment.acupoints || "" } }] }
    }

    const mainRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify({ parent: { database_id: MAIN_DB_ID }, properties: mainProps })
    })
    const mainData = await mainRes.json()

    // 2. Create in Yearly Planner DB
    const plannerProps = {
      "Title": { title: [{ text: { content: appointment.name || `Session with ${appointment.clients.name}` } }] },
      "Date": { date: { start: appointment.date } },
      "Project": { select: { name: "Kinesiology" } }
    }

    const plannerRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify({ parent: { database_id: PLANNER_DB_ID }, properties: plannerProps })
    })
    const plannerData = await plannerRes.json()

    return new Response(JSON.stringify({ 
      success: true, 
      id: mainData.id, 
      plannerId: plannerData.id,
      url: mainData.url 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})