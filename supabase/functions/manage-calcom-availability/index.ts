// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1 STABLE ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // 1. Resolve the schedule ID (Default to your provided ID)
    const targetId = providedScheduleId || "1387833";
    
    // 2. Fetch current schedule via v1 to get existing overrides
    console.log(`Fetching schedule ${targetId} via v1...`);
    const getRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const getData = await getRes.json();

    if (!getRes.ok) {
      throw new Error(`Failed to fetch schedule: ${getData.message || JSON.stringify(getData)}`);
    }

    const currentOverrides = getData.schedule?.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      // Add an override with no slots for that date
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      // Remove the override for that date
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    // 3. Update via v1 PATCH
    console.log(`Updating schedule ${targetId} with ${newOverrides.length} overrides...`);
    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateData.message || JSON.stringify(updateData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully ${action === 'block-day' ? 'blocked' : 'unblocked'} ${date}.` 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Management Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})