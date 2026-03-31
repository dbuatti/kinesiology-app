// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { notionPageId, notionPlannerId, calcomBookingId } = await req.json()
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    const results = { notion: 'skipped', planner: 'skipped', calcom: 'skipped' };

    // 1. Archive Notion Appointment
    if (notionPageId && NOTION_KEY) {
      const res = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ archived: true })
      });
      results.notion = res.ok ? 'success' : 'failed';
    }

    // 2. Archive Notion Planner
    if (notionPlannerId && NOTION_KEY) {
      const res = await fetch(`https://api.notion.com/v1/pages/${notionPlannerId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ archived: true })
      });
      results.planner = res.ok ? 'success' : 'failed';
    }

    // 3. Cancel Cal.com Booking
    // Standard Cal.com API v1 uses DELETE for cancellation
    if (calcomBookingId && CALCOM_KEY && calcomBookingId !== "undefined") {
      console.log(`Cancelling Cal.com booking: ${calcomBookingId}`);
      
      const res = await fetch(`https://api.cal.com/v1/bookings/${calcomBookingId}?apiKey=${CALCOM_KEY}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        results.calcom = 'success';
      } else {
        // Fallback to /cancel endpoint if DELETE fails
        console.log("Direct DELETE failed, trying /cancel endpoint...");
        const cancelRes = await fetch(`https://api.cal.com/v1/bookings/${calcomBookingId}/cancel?apiKey=${CALCOM_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: "Cancelled via Antigravity CRM" })
        });
        results.calcom = cancelRes.ok ? 'success' : 'failed';
      }
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