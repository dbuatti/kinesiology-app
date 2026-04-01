// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v3.0 V2 API + MERGE LOGIC ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    
    // Default schedule ID if none provided
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
    console.log("FETCHING CURRENT SCHEDULE STATE...");
    const getRes = await fetch(`https://api.cal.com/v2/schedules/${targetId}`, {
      method: 'GET',
      headers
    });
    
    const getData = await getRes.json();
    
    if (!getRes.ok) {
      console.error("Fetch Error:", JSON.stringify(getData));
      throw new Error(`Failed to fetch schedule: ${getData.error?.message || getRes.statusText}`);
    }

    // Extract existing overrides
    let currentOverrides = getData.data?.overrides || [];
    console.log(`Found ${currentOverrides.length} existing overrides.`);

    // 3. MODIFY OVERRIDES (Additive/Subtractive)
    // Always remove existing entries for this specific date first to avoid duplicates
    let updatedOverrides = currentOverrides.filter(o => {
      const oDate = o.date.includes('T') ? o.date.split('T')[0] : o.date;
      return oDate !== dateOnly;
    });

    if (action === 'block-day') {
      console.log(`Adding block for ${dateOnly}`);
      updatedOverrides.push({
        date: dateOnly,
        slots: [] // Empty slots array blocks the day in Cal.com
      });
    } else {
      console.log(`Removing override for ${dateOnly} (Restoring default)`);
      // Already filtered out above
    }

    // 4. PUSH UPDATED STATE (V2)
    const payload = { overrides: updatedOverrides };
    console.log("SENDING V2 PATCH PAYLOAD:", JSON.stringify(payload));

    const patchRes = await fetch(`https://api.cal.com/v2/schedules/${targetId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });

    const patchData = await patchRes.json();
    console.log(`PATCH Status: ${patchRes.status}`);

    if (!patchRes.ok) {
      console.error("PATCH Error:", JSON.stringify(patchData));
      throw new Error(`Failed to update schedule: ${patchData.error?.message || patchRes.statusText}`);
    }

    // 5. FINAL VERIFICATION
    const finalOverrides = patchData.data?.overrides || [];
    console.log("FINAL OVERRIDES COUNT:", finalOverrides.length);

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      date: dateOnly,
      overridesCount: finalOverrides.length,
      debug: {
        sentCount: updatedOverrides.length,
        receivedCount: finalOverrides.length
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