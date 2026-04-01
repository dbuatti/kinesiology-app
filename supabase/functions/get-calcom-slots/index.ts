// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [get-calcom-slots] v3 WITH OOO SYNC ---");

  try {
    let { start, end, eventTypeId, timeZone } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // 1. Fetch Available Slots
    const targetEventTypeId = eventTypeId || "4279898";
    const slotsUrl = new URL('https://api.cal.com/v2/slots/available')
    slotsUrl.searchParams.set('startTime', start)
    slotsUrl.searchParams.set('endTime', end)
    slotsUrl.searchParams.set('eventTypeId', targetEventTypeId)
    if (timeZone) slotsUrl.searchParams.set('timeZone', timeZone)

    const slotsResponse = await fetch(slotsUrl.toString(), { method: 'GET', headers })
    const slotsData = await slotsResponse.json()
    
    // 2. Fetch Out-of-Office Blocks (to cross-reference)
    const oooResponse = await fetch('https://api.cal.com/v2/me/ooo', { method: 'GET', headers })
    const oooData = await oooResponse.json()

    if (!slotsResponse.ok) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: slotsData.error?.message || "Cal.com Slots API Error"
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({
      status: 'success',
      data: slotsData.data.slots,
      blockedDates: (oooData.data || []).map(entry => entry.start.split('T')[0])
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("Slots Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})