// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v2 MIGRATION START ---");

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

    // 1. Try to find schedule via Event Type (v2)
    if (!scheduleId && eventTypeId) {
      console.log(`[v2] Fetching event type ${eventTypeId}...`);
      const etRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, { headers });
      const etData = await etRes.json();
      
      if (etRes.ok && etData.data?.scheduleId) {
        scheduleId = etData.data.scheduleId;
        console.log(`[v2] Found Schedule ID from Event Type: ${scheduleId}`);
      } else {
        console.log(`[v2] Event Type lookup failed or no scheduleId found. Status: ${etRes.status}`);
      }
    }

    // 2. Fallback: Fetch all schedules (v2)
    if (!scheduleId) {
      console.log("[v2] Fetching all schedules...");
      const schedulesRes = await fetch('https://api.cal.com/v2/schedules', { headers });
      const schedulesData = await schedulesRes.json();
      
      if (schedulesRes.ok && schedulesData.data?.length > 0) {
        console.log("Available v2 Schedules:", JSON.stringify(schedulesData.data.map(s => ({ id: s.id, name: s.name }))));
        
        const preferred = schedulesData.data.find(s => s.name?.toLowerCase().includes('work') || s.isDefault);
        scheduleId = preferred ? preferred.id : schedulesData.data[0].id;
        console.log(`[v2] Selected Schedule ID: ${scheduleId}`);
      }
    }

    if (!scheduleId) {
      throw new Error("Could not identify a valid v2 Schedule ID. Please ensure you have a schedule created in Cal.com.");
    }

    // 3. Fetch current schedule (v2)
    console.log(`[v2] Fetching schedule details for ID: ${scheduleId}`);
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
    const scheduleData = await scheduleRes.json();
    
    if (!scheduleRes.ok) {
      throw new Error(`Failed to fetch v2 schedule: ${JSON.stringify(scheduleData)}`);
    }

    // v2 uses 'overrides' array
    const currentOverrides = scheduleData.data.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      console.log(`[v2] Blocking day: ${date}`);
      // In v2, an empty slots array for a date blocks it
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      console.log(`[v2] Unblocking day: ${date}`);
      // Remove the override to return to default availability
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    console.log("[v2] Sending update...");

    const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`Failed to update v2 schedule: ${JSON.stringify(updateData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Day ${date} ${action === 'block-day' ? 'blocked' : 'unblocked'} successfully via v2 API.` 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("v2 Migration Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})