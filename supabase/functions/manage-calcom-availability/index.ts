// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1.1 UPDATED ---");

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
      console.error("Fetch Error:", getData);
      throw new Error(`Failed to fetch schedule: ${getData.message || JSON.stringify(getData)}`);
    }

    // Cal.com v1 uses 'timeSlots' inside overrides, not 'slots'
    const currentOverrides = getData.schedule?.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      // Add an override with no timeSlots for that date to block it
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, timeSlots: [] }
      ];
    } else if (action === 'unblock-day') {
      // Remove the override for that date to restore default availability
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    console.log(`Updating schedule ${targetId} with ${newOverrides.length} total overrides...`);
    console.log(`Target Date: ${date}, Action: ${action}`);

    // 3. Update via v1 PATCH
    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      console.error("Update Error Response:", updateData);
      throw new Error(`Update failed: ${updateData.message || JSON.stringify(updateData)}`);
    }

    console.log("Update successful:", JSON.stringify(updateData.schedule?.overrides));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully ${action === 'block-day' ? 'blocked' : 'unblocked'} ${date}.`,
      overrides: updateData.schedule?.overrides
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