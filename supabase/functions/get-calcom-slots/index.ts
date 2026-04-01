// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [get-calcom-slots] v4 TIMEZONE ROBUST ---");

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

    console.log(`Fetching slots for Event: ${targetEventTypeId} in TZ: ${timeZone || 'UTC'}`);

    const slotsResponse = await fetch(slotsUrl.toString(), { method: 'GET', headers })
    const slotsData = await slotsResponse.json()
    
    // 2. Fetch Out-of-Office Blocks
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

    // 3. Robust Date Matching (Timezone Aware)
    // We map OOO entries to the local date they represent for the user
    const blockedDates = (oooData.data || []).map(entry => {
      const date = new Date(entry.start);
      // Format to YYYY-MM-DD in the user's specific timezone
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    });

    console.log(`Detected ${blockedDates.length} OOO blocks. Localized dates:`, blockedDates);

    return new Response(JSON.stringify({
      status: 'success',
      data: slotsData.data.slots,
      blockedDates: blockedDates
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