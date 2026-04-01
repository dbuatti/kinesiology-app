// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1.3 DEEP LOGGING ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // 1. Resolve the schedule ID
    const targetId = providedScheduleId || "1387833";
    
    // 2. Fetch current state to avoid wiping out other blocked days
    console.log(`Fetching schedule ${targetId}...`);
    const getRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const getData = await getRes.json();

    if (!getRes.ok) throw new Error(`Fetch failed: ${JSON.stringify(getData)}`);

    // Log the current state so we can see if the date already exists
    const currentOverrides = getData.schedule?.overrides || [];
    console.log("CURRENT OVERRIDES IN CAL.COM:", JSON.stringify(currentOverrides));

    let newOverrides = [];

    if (action === 'block-day') {
      console.log(`ACTION: Blocking ${date}`);
      
      // We send both 'timeSlots' and 'slots' as empty arrays. 
      // In Cal.com v1, an override with NO slots = a blocked day.
      const blockEntry = { 
        date: date, 
        timeSlots: [], 
        slots: [] 
      };

      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        blockEntry
      ];
    } else {
      console.log(`ACTION: Unblocking ${date}`);
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    // 3. The Update Request
    console.log("SENDING NEW OVERRIDES LIST:", JSON.stringify(newOverrides));

    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    // 4. DEEP LOGGING: See the actual response structure
    console.log("CAL.COM API STATUS:", updateRes.status);
    console.log("CAL.COM API RESPONSE:", JSON.stringify(updateData));

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateData.message || JSON.stringify(updateData)}`);
    }

    // Check if the update actually took effect in the response
    const finalOverrides = updateData.schedule?.overrides || [];
    console.log(`SUCCESS: Schedule now has ${finalOverrides.length} overrides.`);

    return new Response(JSON.stringify({ 
      success: true, 
      date: date,
      action: action,
      total_overrides: finalOverrides.length
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})