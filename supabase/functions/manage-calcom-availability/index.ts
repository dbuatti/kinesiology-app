// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1.7 FLAT & ISO ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    const targetId = providedScheduleId || "1387833";
    
    // 1. Fetch current schedule
    const getRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const getData = await getRes.json();
    if (!getRes.ok) throw new Error("Fetch failed.");

    const currentOverrides = getData.schedule?.overrides || [];

    let newOverrides = [];
    if (action === 'block-day') {
      // THE FIX: Convert "2026-05-13" to "2026-05-13T00:00:00.000Z"
      // Many Cal.com v1 instances ignore raw date strings.
      const isoDate = new Date(date).toISOString();
      
      newOverrides = [
        ...currentOverrides.filter(o => !o.date.includes(date)),
        { date: isoDate, slots: [] }
      ];
    } else {
      newOverrides = currentOverrides.filter(o => !o.date.includes(date));
    }

    // 2. THE FLAT PAYLOAD
    // We send 'overrides' at the root level, NOT nested inside 'schedule'.
    const payload = {
      overrides: newOverrides
    };

    console.log("SENDING FLAT PAYLOAD:", JSON.stringify(payload));

    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const updateData = await updateRes.json();
    console.log("CAL.COM API RESPONSE:", JSON.stringify(updateData));

    // Check both potential response locations
    const finalOverrides = updateData.schedule?.overrides || updateData.overrides || [];

    return new Response(JSON.stringify({ 
      success: true, 
      count: finalOverrides.length,
      date_sent: date
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