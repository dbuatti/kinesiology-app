// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v2 MIGRATION ---");

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

    // 1. Resolve Schedule ID
    if (!scheduleId) {
      // Try Event Type first
      if (eventTypeId) {
        const etRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, { headers });
        const etData = await etRes.json();
        if (etRes.ok && etData.data?.scheduleId) {
          scheduleId = etData.data.scheduleId;
        }
      }
      
      // Fallback to listing schedules
      if (!scheduleId) {
        const schedsRes = await fetch('https://api.cal.com/v2/schedules', { headers });
        const schedsData = await schedsRes.json();
        if (schedsRes.ok && schedsData.data?.length > 0) {
          const preferred = schedsData.data.find(s => s.isDefault) || schedsData.data[0];
          scheduleId = preferred.id;
        }
      }
    }

    if (!scheduleId) {
      throw new Error("Could not identify a valid v2 Schedule ID.");
    }

    // 2. Fetch current schedule to get existing overrides
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
    const scheduleData = await scheduleRes.json();
    
    if (!scheduleRes.ok) {
      throw new Error(`Failed to fetch v2 schedule: ${scheduleData.error?.message}`);
    }

    const currentOverrides = scheduleData.data.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    // 3. Update Schedule
    const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`Failed to update v2 schedule: ${updateData.error?.message}`);
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