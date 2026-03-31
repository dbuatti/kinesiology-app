// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// The new Notion Database ID provided by the user
const NOTION_DATABASE_ID = "171f7156cdc645e8b689af13d217bc7c";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { appointment } = await req.json()
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')

    if (!NOTION_KEY) {
      throw new Error("Missing NOTION_API_KEY in Supabase Secrets.")
    }

    // Map CRM fields to your Notion Database properties
    const properties = {
      "Name": {
        "title": [{ "text": { "content": appointment.name || `Session with ${appointment.clients.name}` } }]
      },
      "Date": {
        "date": { "start": appointment.date }
      },
      "Goal": {
        "rich_text": [{ "text": { "content": appointment.goal || "" } }]
      },
      "Issue": {
        "rich_text": [{ "text": { "content": appointment.issue || "" } }]
      },
      "Notes": {
        "rich_text": [{ "text": { "content": appointment.notes || "" } }]
      },
      "🎛️ Modes & Balances": {
        "rich_text": [{ "text": { "content": appointment.modes_balances || "" } }]
      },
      "🔺 Acupoints": {
        "rich_text": [{ "text": { "content": appointment.acupoints || "" } }]
      }
    }

    // Add numeric scores if they exist
    if (appointment.bolt_score) {
      properties["BOLT Score"] = { "number": appointment.bolt_score }
    }
    if (appointment.coherence_score) {
      properties["Coherence"] = { "number": appointment.coherence_score }
    }

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

    const result = await response.json()

    if (!response.ok) {
      console.error("Notion API Error:", result)
      throw new Error(result.message || "Notion Sync Failed")
    }

    return new Response(JSON.stringify({ success: true, url: result.url }), { 
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