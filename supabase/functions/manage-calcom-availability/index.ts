// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1 START ---");

  try {
    const { action, date, eventTypeId, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    let scheduleId = providedScheduleId;

    // 1. Try to find schedule via Event Type (v1)
    if (!scheduleId && eventTypeId) {
      console.log(`[v1] Fetching event type ${eventTypeId}...`);
      const etRes = await fetch(`https://api.cal.com/v1/event-types/${eventTypeId}?apiKey=${CALCOM_KEY}`);
      const etData = await etRes.json();
      
      if (etRes.ok && etData.eventType?.scheduleId) {
        scheduleId = etData.eventType.scheduleId;
        console.log(`[v1] Found Schedule ID from Event Type: ${scheduleId}`);
      } else {
        console.log(`[v1] Could not find schedule via event type. Status: ${etRes.status}`);
      }
    }

    // 2. Fallback: Fetch all schedules (v1)
    if (!scheduleId) {
      console.log("[v1] Fetching all schedules...");
      const schedulesRes = await fetch(`https://api.cal.com/v1/schedules?apiKey=${CALCOM_KEY}`);
      const schedulesData = await schedulesRes.json();
      
      if (schedulesRes.ok && schedulesData.schedules?.length > 0) {
        // Log all IDs to help the user find the right one
        console.log("Available Schedules:", JSON.stringify(schedulesData.schedules.map(s => ({ id: s.id, name: s.name }))));
        
        const preferred = schedulesData.schedules.find(s => s.name?.toLowerCase().includes('work') || s.isDefault);
        scheduleId = preferred ? preferred.id : schedulesData.schedules[0].id;
        console.log(`[v1] Selected Schedule ID: ${scheduleId}`);
      }
    }

    if (!scheduleId) {
      throw new Error("Could not identify a valid Schedule ID. Check Supabase logs for 'Available Schedules' list.");
    }

    // 3. Fetch current schedule (v1)
    console.log(`[v1] Fetching schedule details for ID: ${scheduleId}`);
    const scheduleRes = await fetch(`https://api.cal.com/v1/schedules/${scheduleId}?apiKey=${CALCOM_KEY}`);
    const scheduleData = await scheduleRes.json();
    
    if (!scheduleRes.ok) {
      throw new Error(`Failed to fetch schedule: ${JSON.stringify(scheduleData)}`);
    }

    // v1 uses 'availability' array for overrides/slots
    // We need to find existing overrides for this date
    const currentAvailability = scheduleData.schedule.availability || [];
    let newAvailability = [];

    if (action === 'block-day') {
      console.log(`[v1] Blocking day: ${date}`);
      // Remove any existing availability for this date and add a "blocked" entry (no slots)
      newAvailability = [
        ...currentAvailability.filter(a => a.date !== date),
        { date: date, startTime: "00:00:00", endTime: "00:00:00" } // v1 blocking style
      ];
    } else if (action === 'unblock-day') {
      console.log(`[v1] Unblocking day: ${date}`);
      // Simply remove the date-specific override to return to default
      newAvailability = currentAvailability.filter(a => a.date !== date);
    }

    console.log("[v1] Sending update...");

    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${scheduleId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: newAvailability })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(`Failed to update schedule: ${JSON.stringify(updateData)}`);
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