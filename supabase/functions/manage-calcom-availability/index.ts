// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v2 START ---");

  try {
    const { action, date, eventTypeId, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    let scheduleId = providedScheduleId;

    // 1. Resolve Schedule ID if not provided
    if (!scheduleId) {
      console.log(`Attempting to auto-resolve schedule. EventType: ${eventTypeId}`);
      
      // Try Event Type first
      if (eventTypeId) {
        const etRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, { headers });
        const etData = await etRes.json();
        if (etRes.ok && etData.data?.scheduleId) {
          scheduleId = etData.data.scheduleId;
          console.log(`Resolved Schedule ID from Event Type: ${scheduleId}`);
        } else {
          console.log(`Could not find scheduleId in Event Type response: ${JSON.stringify(etData)}`);
        }
      }
      
      // Fallback to listing all schedules
      if (!scheduleId) {
        console.log("Falling back to listing all schedules...");
        const schedsRes = await fetch('https://api.cal.com/v2/schedules', { headers });
        const schedsData = await schedsRes.json();
        
        if (schedsRes.ok && schedsData.data?.length > 0) {
          const preferred = schedsData.data.find(s => s.isDefault) || schedsData.data[0];
          scheduleId = preferred.id;
          console.log(`Resolved Schedule ID from list: ${scheduleId} (Default: ${!!preferred.isDefault})`);
        } else {
          console.log(`Schedules list failed or empty: ${JSON.stringify(schedsData)}`);
        }
      }
    }

    if (!scheduleId) {
      throw new Error("Could not identify a valid v2 Schedule ID. Please provide it manually in the settings.");
    }

    // 2. Fetch current schedule to get existing overrides
    console.log(`Fetching schedule details for ID: ${scheduleId}`);
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
    const scheduleData = await scheduleRes.json();
    
    if (!scheduleRes.ok) {
      throw new Error(`Failed to fetch v2 schedule (${scheduleRes.status}): ${scheduleData.error?.message || JSON.stringify(scheduleData)}`);
    }

    const currentOverrides = scheduleData.data.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      // Add an override with empty slots for that date
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      // Remove the override for that date
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    // 3. Update Schedule
    console.log(`Updating schedule ${scheduleId} with ${newOverrides.length} overrides`);
    const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`Failed to update v2 schedule: ${updateData.error?.message || JSON.stringify(updateData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Day ${date} ${action === 'block-day' ? 'blocked' : 'unblocked'} successfully.` 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("v2 Management Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})