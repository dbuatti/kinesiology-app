// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v4.1 V1 API + WRAPPED PAYLOAD ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    
    const targetId = providedScheduleId || "1387833";
    
    // 1. Format the Date to YYYY-MM-DD strictly
    const dateObj = new Date(date);
    const dateOnly = dateObj.toISOString().split('T')[0];

    console.log(`Action: ${action}, Target Date: ${dateOnly}, ScheduleID: ${targetId}`);

    // 2. FETCH CURRENT STATE (V1)
    console.log("FETCHING CURRENT SCHEDULE STATE (V1)...");
    const getRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const getData = await getRes.json();
    
    if (!getRes.ok) {
      console.error("Fetch Error:", JSON.stringify(getData));
      throw new Error(`Failed to fetch schedule: ${getData.message || getRes.statusText}`);
    }

    // Extract existing overrides
    let currentOverrides = getData.schedule?.overrides || [];
    console.log(`CURRENT OVERRIDES COUNT: ${currentOverrides.length}`);

    // 3. MODIFY OVERRIDES
    let updatedOverrides = currentOverrides.filter(o => {
      const oDate = o.date.includes('T') ? o.date.split('T')[0] : o.date;
      return oDate !== dateOnly;
    });

    if (action === 'block-day') {
      console.log(`Adding block for ${dateOnly}`);
      updatedOverrides.push({
        date: dateOnly,
        slots: [] // Empty slots array blocks the day in Cal.com v1
      });
    }

    // 4. PUSH UPDATED STATE (V1)
    // We try wrapping the overrides in a 'schedule' object as the V1 API often mirrors its GET structure in PATCH
    const payload = { 
      schedule: {
        overrides: updatedOverrides 
      }
    };
    
    console.log("SENDING V1 PATCH PAYLOAD (WRAPPED):", JSON.stringify(payload));

    const patchRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const patchData = await patchRes.json();
    console.log(`PATCH Status: ${patchRes.status}`);
    console.log("FULL PATCH RESPONSE BODY:", JSON.stringify(patchData));

    if (!patchRes.ok) {
      console.error("PATCH Error:", JSON.stringify(patchData));
      throw new Error(`Failed to update schedule: ${patchData.message || patchRes.statusText}`);
    }

    // 5. FINAL VERIFICATION
    const finalOverrides = patchData.schedule?.overrides || [];
    console.log("FINAL OVERRIDES COUNT:", finalOverrides.length);

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      date: dateOnly,
      overridesCount: finalOverrides.length,
      debug: {
        sentCount: updatedOverrides.length,
        receivedCount: finalOverrides.length,
        matchFound: finalOverrides.some(o => (o.date.includes('T') ? o.date.split('T')[0] : o.date) === dateOnly)
      }
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