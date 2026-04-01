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
    let { start, end, eventTypeId, timeZone, username, eventTypeSlug } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-09-04',
      'Content-Type': 'application/json',
    };

    // 1. If no identifier is provided, try to fetch the first active event type
    if (!eventTypeId && !username && !eventTypeSlug) {
      console.log("No identifier provided. Fetching event types...");
      const etResponse = await fetch('https://api.cal.com/v2/event-types', { headers });
      const etData = await etResponse.json();
      
      if (etData.status === 'success' && etData.data?.length > 0) {
        eventTypeId = etData.data[0].id;
        console.log(`Auto-selected Event Type ID: ${eventTypeId} (${etData.data[0].title})`);
      } else {
        throw new Error("No active Event Types found in your Cal.com account. Please create one first.");
      }
    }

    // 2. Build the slots URL
    const url = new URL('https://api.cal.com/v2/slots')
    url.searchParams.set('start', start)
    url.searchParams.set('end', end)
    if (eventTypeId) url.searchParams.set('eventTypeId', eventTypeId)
    if (username) url.searchParams.set('username', username)
    if (eventTypeSlug) url.searchParams.set('eventTypeSlug', eventTypeSlug)
    if (timeZone) url.searchParams.set('timeZone', timeZone)

    console.log(`Fetching slots from: ${url.toString()}`);

    const response = await fetch(url.toString(), { method: 'GET', headers })
    const data = await response.json()
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: data.message || "Cal.com API Error",
        details: data 
      }), { 
        status: 200,
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
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})