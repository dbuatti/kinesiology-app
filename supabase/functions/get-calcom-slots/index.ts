// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [get-calcom-slots] START ---");

  try {
    const { start, end, eventTypeId, timeZone } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) {
      console.error("Error: CALCOM_API_KEY is not set in Supabase Secrets.");
      throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.");
    }

    const url = new URL('https://api.cal.com/v2/slots')
    url.searchParams.set('start', start)
    url.searchParams.set('end', end)
    if (eventTypeId) url.searchParams.set('eventTypeId', eventTypeId)
    if (timeZone) url.searchParams.set('timeZone', timeZone)

    console.log(`Fetching slots from: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALCOM_KEY}`,
        'cal-api-version': '2024-09-04',
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()
    console.log("Cal.com Response Status:", response.status);
    
    if (!response.ok) {
      console.error("Cal.com API Error:", JSON.stringify(data));
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: data.message || "Cal.com API Error",
        details: data 
      }), { 
        status: 200, // Return 200 so the client can parse the error message
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})