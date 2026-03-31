// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { notionPageId, notionPlannerId, calcomBookingId } = await req.json()
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    const results = { notion: 'skipped', planner: 'skipped', calcom: 'skipped' };

    // 1. Delete from Main Appointments DB (Archive)
    if (notionPageId && NOTION_KEY) {
      console.log(`Archiving Notion page: ${notionPageId}`);
      const res = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({ archived: true })
      });
      results.notion = res.ok ? 'success' : 'failed';
    }

    // 2. Delete from Yearly Planner DB (Archive)
    if (notionPlannerId && NOTION_KEY) {
      console.log(`Archiving Planner page: ${notionPlannerId}`);
      const res = await fetch(`https://api.notion.com/v1/pages/${notionPlannerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({ archived: true })
      });
      results.planner = res.ok ? 'success' : 'failed';
    }

    // 3. Delete from Cal.com (Cancel)
    // Corrected endpoint: DELETE /v1/bookings/{id}
    if (calcomBookingId && CALCOM_KEY) {
      console.log(`Cancelling Cal.com booking: ${calcomBookingId}`);
      const res = await fetch(`https://api.cal.com/v1/bookings/${calcomBookingId}?apiKey=${CALCOM_KEY}`, {
        method: 'DELETE'
      });
      results.calcom = res.ok ? 'success' : 'failed';
    }

    return new Response(JSON.stringify({ success: true, results }), { 
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