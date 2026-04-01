// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1.6 FINAL ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    const targetId = providedScheduleId || "1387833";
    
    // 1. Fetch current schedule to keep your Wed 10am-6pm availability safe
    const getRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const getData = await getRes.json();
    
    if (!getRes.ok) throw new Error("Could not fetch schedule.");

    const currentAvailability = getData.schedule?.availability || [];
    const currentOverrides = getData.schedule?.overrides || [];

    let newOverrides = [];

    if (action === 'block-day') {
      // We format the date to ensure no timezone shifting (YYYY-MM-DD)
      // Some Cal.com versions require an empty array for BOTH keys to register a block
      const blockEntry = { 
        date: date, 
        slots: [],
        timeSlots: [] 
      };

      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        blockEntry
      ];
    } else {
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    // 2. The Final Payload Structure
    // We provide the schedule object with BOTH availability and overrides.
    // This tells Cal.com "Keep my regular hours, but add this specific date block."
    const payload = {
      schedule: {
        availability: currentAvailability,
        overrides: newOverrides
      }
    };

    console.log("SENDING TO CAL.COM:", JSON.stringify(payload));

    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const updateData = await updateRes.json();
    console.log("FINAL RESPONSE:", JSON.stringify(updateData));

    const finalCount = updateData.schedule?.overrides?.length ?? 0;

    return new Response(JSON.stringify({ 
      success: true, 
      date: date,
      count: finalCount 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})