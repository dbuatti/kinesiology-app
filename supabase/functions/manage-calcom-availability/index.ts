// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1/v2 HYBRID ---");

  try {
    const { action, date, eventTypeId, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    // 1. Try v1 API first as it's more stable for schedule management
    console.log("Attempting to resolve schedule via v1 API...");
    const v1ListRes = await fetch(`https://api.cal.com/v1/schedules?apiKey=${CALCOM_KEY}`);
    const v1ListData = await v1ListRes.json();

    let targetSchedule = null;

    if (v1ListRes.ok && v1ListData.schedules) {
      const allSchedules = v1ListData.schedules;
      console.log(`v1 found ${allSchedules.length} schedules.`);
      
      if (providedScheduleId) {
        targetSchedule = allSchedules.find(s => String(s.id) === String(providedScheduleId));
      }
      
      if (!targetSchedule) {
        targetSchedule = allSchedules.find(s => s.isDefault) || allSchedules[0];
      }
    }

    if (!targetSchedule) {
      throw new Error("Could not find a valid schedule via v1 or v2 API.");
    }

    const scheduleId = targetSchedule.id;
    console.log(`Targeting Schedule: "${targetSchedule.name}" (ID: ${scheduleId})`);

    // 2. Get current overrides
    const currentOverrides = targetSchedule.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      // Add an override with no availability for that date
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      // Remove the override for that date
      newOverrides = currentOverrides.filter(o => o.date !== date);
    }

    // 3. Update via v1 API
    console.log(`Updating schedule ${scheduleId} via v1...`);
    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${scheduleId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`v1 Update failed: ${updateData.message || JSON.stringify(updateData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully ${action === 'block-day' ? 'blocked' : 'unblocked'} ${date} on schedule "${targetSchedule.name}".` 
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