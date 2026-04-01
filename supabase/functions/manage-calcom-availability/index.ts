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

    // 1. Try to find schedule via Event Type
    if (!scheduleId && eventTypeId) {
      console.log(`Fetching event type ${eventTypeId}...`);
      const etRes = await fetch(`https://api.cal.com/v2/event-types/${eventTypeId}`, { headers });
      const etData = await etRes.json();
      
      console.log("Event Type Response Status:", etRes.status);
      console.log("Event Type Data:", JSON.stringify(etData));

      if (etData.status === 'success') {
        scheduleId = etData.data?.scheduleId || etData.data?.schedule?.id;
        if (scheduleId) console.log(`Found Schedule ID: ${scheduleId}`);
      }
    }

    // 2. Fallback: Fetch all schedules
    if (!scheduleId) {
      console.log("Fetching all schedules...");
      const schedulesRes = await fetch('https://api.cal.com/v2/schedules', { headers });
      const schedulesData = await schedulesRes.json();
      
      console.log("Schedules Response Status:", schedulesRes.status);
      console.log("Schedules Data:", JSON.stringify(schedulesData));

      if (schedulesData.status === 'success' && schedulesData.data?.length > 0) {
        // Try to find a schedule named 'Work' or 'Default', otherwise take the first one
        const preferred = schedulesData.data.find(s => s.name?.toLowerCase().includes('work') || s.isDefault);
        scheduleId = preferred ? preferred.id : schedulesData.data[0].id;
        console.log(`Selected Schedule ID: ${scheduleId}`);
      }
    }

    if (!scheduleId) {
      throw new Error("Could not identify a valid Schedule ID. Please check your Cal.com account.");
    }

    // 3. Fetch current schedule to manage overrides
    console.log(`Fetching schedule details for ID: ${scheduleId}`);
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
    const scheduleData = await scheduleRes.json();
    
    if (scheduleData.status !== 'success') {
      throw new Error(`Failed to fetch schedule: ${scheduleData.message}`);
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
    }

    console.log("Sending update with overrides:", JSON.stringify(newOverrides));

    const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ overrides: newOverrides })
    });

    const updateData = await updateRes.json();
    console.log("Update Response:", JSON.stringify(updateData));

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