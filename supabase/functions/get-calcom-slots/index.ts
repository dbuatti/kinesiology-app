// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [get-calcom-slots] v2 WITH VERSION ---");

  try {
    let { start, end, eventTypeId, timeZone } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // Use provided event type or default
    const targetEventTypeId = eventTypeId || "4279898";

    const url = new URL('https://api.cal.com/v2/slots/available')
    url.searchParams.set('startTime', start)
    url.searchParams.set('endTime', end)
    url.searchParams.set('eventTypeId', targetEventTypeId)
    if (timeZone) url.searchParams.set('timeZone', timeZone)

    const response = await fetch(url.toString(), { method: 'GET', headers })
    const data = await response.json()
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: data.error?.message || "Cal.com v2 API Error"
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({
      status: 'success',
      data: data.data.slots
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