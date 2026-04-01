// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v2.0 DATE FORMAT FIX ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    const targetId = providedScheduleId || "1387833";
    
    // 1. Format the Date - Using YYYY-MM-DD which is often more reliable for Cal.com v1 overrides
    const dateObj = new Date(date);
    const dateOnly = dateObj.toISOString().split('T')[0];

    console.log(`Action: ${action}, Input: ${date}, Target Date: ${dateOnly}, ScheduleID: ${targetId}`);

    // 2. PRE-PATCH CHECK: See what's there now
    console.log("FETCHING CURRENT STATE...");
    const preRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const preData = await preRes.json();
    console.log("CURRENT OVERRIDES:", JSON.stringify(preData.schedule?.overrides || []));

    // 3. Prepare Payload
    // We send the date as YYYY-MM-DD. 
    // For 'block-day', we send an empty slots array for that date.
    const payload = { 
      overrides: action === 'block-day' ? [{ date: dateOnly, slots: [] }] : [] 
    };

    console.log("SENDING PATCH PAYLOAD:", JSON.stringify(payload));

    // 4. The Update
    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const updateData = await updateRes.json();
    console.log(`PATCH Status: ${updateRes.status}, Response:`, JSON.stringify(updateData));

    // 5. THE RE-VERIFY
    console.log("RE-VERIFYING...");
    const verifyRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const verifyData = await verifyRes.json();
    const finalOverrides = verifyData.schedule?.overrides || [];
    
    console.log("FINAL OVERRIDES STATE:", JSON.stringify(finalOverrides));

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      date: dateOnly,
      overrides: finalOverrides,
      debug: {
        sent: payload,
        received: finalOverrides
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})