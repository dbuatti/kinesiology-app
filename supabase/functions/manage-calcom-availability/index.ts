// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] START ---");

  try {
    const { action, date, eventTypeId, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-09-04',
      'Content-Type': 'application/json',
    };

    let scheduleId = providedScheduleId;

    // 1. If no scheduleId is provided, try to find it via the eventTypeId
    if (!scheduleId && eventTypeId) {
      console.log(`Fetching event type ${eventTypeId} to find its schedule...`);
      const etRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, { headers });
      const etData = await etRes.json();
      
      if (etData.status === 'success' && etData.data?.scheduleId) {
        scheduleId = etData.data.scheduleId;
        console.log(`Found Schedule ID from Event Type: ${scheduleId}`);
      }
    }

    // 2. Fallback: Fetch all schedules and take the first one
    if (!scheduleId) {
      console.log("Fetching all schedules as fallback...");
      const schedulesRes = await fetch('https://api.cal.com/v2/schedules', { headers });
      const schedulesData = await schedulesRes.json();
      
      if (schedulesData.status === 'success' && schedulesData.data?.length > 0) {
        scheduleId = schedulesData.data[0].id;
        console.log(`Using first available Schedule ID: ${scheduleId}`);
      } else {
        throw new Error("No schedules found in your Cal.com account. Please ensure you have an availability schedule set up.");
      }
    }

    // 3. Fetch current schedule to manage overrides
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
    const scheduleData = await scheduleRes.json();
    
    if (scheduleData.status !== 'success') {
      throw new Error(`Failed to fetch schedule details: ${scheduleData.message}`);
    }

    const currentOverrides = scheduleData.data.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      console.log(`Blocking day: ${date}`);
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      console.log(`Unblocking day: ${date}`);
      newOverrides = currentOverrides.filter(o => o.date !== date);
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

    const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (updateData.status !== 'success') {
      throw new Error(`Failed to update schedule: ${updateData.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Day ${date} ${action === 'block-day' ? 'blocked' : 'unblocked'} successfully.` 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})