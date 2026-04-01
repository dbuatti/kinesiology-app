// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1.2 PRODUCTION ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // 1. Resolve the schedule ID (Default to your Kinesiology schedule)
    const targetId = providedScheduleId || "1387833";
    
    // 2. Fetch current schedule to preserve existing overrides
    console.log(`Fetching schedule ${targetId} to check existing blocks...`);
    const getRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const getData = await getRes.json();

    if (!getRes.ok) {
      throw new Error(`Failed to fetch schedule: ${getData.message || JSON.stringify(getData)}`);
    }

    const currentOverrides = getData.schedule?.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      console.log(`Applying hard block for: ${date}`);
      
      // We create a "Zero-Duration" slot. Cal.com interprets 00:00-00:00 as "No Availability".
      // We include both 'timeSlots' and 'slots' for maximum API compatibility.
      const blockEntry = { 
        date: date, 
        timeSlots: [{ start: "00:00", end: "00:00" }],
        slots: [{ start: "00:00", end: "00:00" }] 
      };

      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        blockEntry
      ];
    } else if (action === 'unblock-day') {
      console.log(`Removing blocks for: ${date}`);
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    console.log(`Syncing ${newOverrides.length} total overrides to Cal.com...`);

    // 3. Update the Schedule via PATCH
    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      console.error("Cal.com API Update Error:", updateData);
      throw new Error(`Update failed: ${updateData.message || JSON.stringify(updateData)}`);
    }

    console.log("✅ Update Successful. Current Overrides:", JSON.stringify(updateData.schedule?.overrides));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully ${action === 'block-day' ? 'blocked' : 'unblocked'} ${date}.`,
      count: updateData.schedule?.overrides?.length
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Management Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})