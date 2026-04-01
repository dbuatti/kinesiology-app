// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v2 DEEP DISCOVERY START ---");

  try {
    const { action, date, eventTypeId: providedEventTypeId, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-09-04',
      'Content-Type': 'application/json',
    };

    // --- DISCOVERY PHASE ---
    console.log("[v2] Running Discovery...");
    
    // 1. Check User/Me
    const meRes = await fetch('https://api.cal.com/v2/me', { headers });
    const meData = await meRes.json();
    console.log(`[v2] /me Status: ${meRes.status}`, JSON.stringify(meData));

    // 2. List Event Types
    const etsRes = await fetch('https://api.cal.com/v2/event-types', { headers });
    const etsData = await etsRes.json();
    console.log(`[v2] /event-types Status: ${etsRes.status}`, JSON.stringify(etsData));

    // 3. List Schedules
    const schedsRes = await fetch('https://api.cal.com/v2/schedules', { headers });
    const schedsData = await schedsRes.json();
    console.log(`[v2] /schedules Status: ${schedsRes.status}`, JSON.stringify(schedsData));

    // --- RESOLUTION PHASE ---
    let scheduleId = providedScheduleId;

    // Try to find schedule from event types if not provided
    if (!scheduleId && etsData.status === 'success' && etsData.data?.length > 0) {
      // If we have a specific event type ID we're looking for
      const targetEt = providedEventTypeId 
        ? etsData.data.find(et => String(et.id) === String(providedEventTypeId))
        : etsData.data[0];
      
      if (targetEt?.scheduleId) {
        scheduleId = targetEt.scheduleId;
        console.log(`[v2] Resolved Schedule ID from Event Type: ${scheduleId}`);
      }
    }

    // Fallback to first available schedule
    if (!scheduleId && schedsData.status === 'success' && schedsData.data?.length > 0) {
      scheduleId = schedsData.data[0].id;
      console.log(`[v2] Resolved Schedule ID from Schedules List: ${scheduleId}`);
    }

    if (!scheduleId) {
      throw new Error(`Could not find a valid Schedule ID. v2 API returned: Schedules(${schedsRes.status}), EventTypes(${etsRes.status}). Check logs for details.`);
    }

    // --- EXECUTION PHASE ---
    console.log(`[v2] Fetching schedule details for ID: ${scheduleId}`);
    const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
    const scheduleData = await scheduleRes.json();
    
    if (!scheduleRes.ok) {
      throw new Error(`Failed to fetch v2 schedule ${scheduleId}: ${JSON.stringify(scheduleData)}`);
    }

    const currentOverrides = scheduleData.data.overrides || [];
    let newOverrides = [];

    if (action === 'block-day') {
      console.log(`[v2] Blocking day: ${date}`);
      newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];
    } else if (action === 'unblock-day') {
      console.log(`[v2] Unblocking day: ${date}`);
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
      message: `Day ${date} ${action === 'block-day' ? 'blocked' : 'unblocked'} successfully.` 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("v2 Discovery Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})