// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

  try {
    const { notionPageId, notionPlannerId, calcomBookingId } = await req.json()
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    const results = { notion: 'skipped', planner: 'skipped', calcom: 'skipped' };

    if (NOTION_KEY) {
      const notionHeaders = { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' };
      if (notionPageId) {
        const res = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
        results.notion = res.ok ? 'success' : 'failed';
      }
      if (notionPlannerId) {
        const res = await fetch(`https://api.notion.com/v1/pages/${notionPlannerId}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
        results.planner = res.ok ? 'success' : 'failed';
      }
    }

    // v2 Cancellation: POST /v2/bookings/{uid}/cancel
    if (calcomBookingId && CALCOM_KEY && calcomBookingId !== "undefined") {
      console.log(`[v2] Cancelling Cal.com booking: ${calcomBookingId}`);
      try {
        const res = await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CALCOM_KEY}`,
            'cal-api-version': '2024-08-13',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cancellationReason: "Cancelled via Antigravity CRM" })
        });
        if (res.ok) {
          results.calcom = 'success';
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = (data?.error?.message || data?.message || '').toLowerCase();
          if (errMsg.includes('already') || errMsg.includes('cancelled')) {
            results.calcom = 'success';
          } else {
            results.calcom = 'failed';
          }
        }
      } catch (e) {
        results.calcom = 'failed';
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