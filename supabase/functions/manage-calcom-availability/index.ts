// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v2 AUTO-RESOLVE ---");

  try {
    const { action, date, eventTypeId, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // 1. Fetch all schedules to find the correct v2 ID
    console.log("Fetching all schedules to resolve ID...");
    const listRes = await fetch('https://api.cal.com/v2/schedules', { method: 'GET', headers });
    const listData = await listRes.json();

    if (!listRes.ok) {
      throw new Error(`Failed to list schedules: ${listData.error?.message || JSON.stringify(listData)}`);
    }

    // 2. Find the best matching schedule
    // We look for: 1. The provided ID, 2. The default schedule, 3. The first schedule in the list
    const allSchedules = listData.data || [];
    console.log(`Found ${allSchedules.length} schedules.`);

    let targetSchedule = null;
    
    if (providedScheduleId) {
      targetSchedule = allSchedules.find(s => String(s.id) === String(providedScheduleId));
    }

    if (!targetSchedule) {
      targetSchedule = allSchedules.find(s => s.isDefault) || allSchedules[0];
    }

    if (!targetSchedule) {
      throw new Error("No schedules found in your Cal.com account.");
    }

    const scheduleId = targetSchedule.id;
    console.log(`Resolved Target Schedule: "${targetSchedule.name}" (ID: ${scheduleId})`);

    // 3. Fetch the full schedule details to get existing overrides
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { method: 'GET', headers });
    const scheduleData = await scheduleRes.json();
    
    if (!scheduleRes.ok) {
      throw new Error(`Failed to fetch schedule details: ${scheduleData.error?.message || JSON.stringify(scheduleData)}`);
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

    // 4. Update the Schedule
    console.log(`Updating schedule with ${newOverrides.length} overrides...`);
    const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateData.error?.message || JSON.stringify(updateData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully ${action === 'block-day' ? 'blocked' : 'unblocked'} ${date} on schedule "${targetSchedule.name}".` 
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