// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, cal-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v5.0 V2 API MIGRATION ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    
    // Default schedule ID if not provided
    const targetId = providedScheduleId || "1387833";
    
    // 1. Format the Date to YYYY-MM-DD
    const dateObj = new Date(date);
    const dateOnly = dateObj.toISOString().split('T')[0];

    console.log(`Action: ${action}, Target Date: ${dateOnly}, ScheduleID: ${targetId}`);

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // 2. FETCH CURRENT STATE (V2)
    console.log("FETCHING CURRENT SCHEDULE STATE (V2)...");
    const getRes = await fetch(`https://api.cal.com/v2/schedules/${targetId}`, {
      method: 'GET',
      headers
    });
    
    const getJson = await getRes.json();
    
    if (!getRes.ok) {
      console.error("V2 Fetch Error:", JSON.stringify(getJson));
      throw new Error(`Failed to fetch schedule: ${getJson.error?.message || getRes.statusText}`);
    }

    // V2 structure: data.overrides
    let currentOverrides = getJson.data?.overrides || [];
    console.log(`CURRENT OVERRIDES COUNT: ${currentOverrides.length}`);

    // 3. MODIFY OVERRIDES
    // Filter out any existing override for this specific date
    let updatedOverrides = currentOverrides.filter(o => o.date !== dateOnly);

    if (action === 'block-day') {
      console.log(`Adding V2 block for ${dateOnly}`);
      updatedOverrides.push({
        date: dateOnly,
        timeSlots: [] // Empty timeSlots array blocks the day in Cal.com V2
      });
    } else {
      console.log(`Removing block for ${dateOnly} (Unblocking)`);
      // Already filtered out above
    }

    // 4. PUSH UPDATED STATE (V2)
    // V2 PATCH expects the fields directly in the body
    const payload = { 
      overrides: updatedOverrides 
    };
    
    console.log("SENDING V2 PATCH PAYLOAD:", JSON.stringify(payload));

    const patchRes = await fetch(`https://api.cal.com/v2/schedules/${targetId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });

    const patchJson = await patchRes.json();
    console.log(`PATCH Status: ${patchRes.status}`);

    if (!patchRes.ok) {
      console.error("V2 PATCH Error:", JSON.stringify(patchJson));
      throw new Error(`Failed to update schedule: ${patchJson.error?.message || patchRes.statusText}`);
    }

    const finalOverrides = patchJson.data?.overrides || [];
    console.log("FINAL OVERRIDES COUNT:", finalOverrides.length);

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      date: dateOnly,
      overridesCount: finalOverrides.length,
      message: action === 'block-day' ? `Day ${dateOnly} blocked successfully.` : `Day ${dateOnly} unblocked.`
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})