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
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-09-04',
      'Content-Type': 'application/json',
    };

    let scheduleId = providedScheduleId;

    // 1. If no scheduleId is provided, fetch the default schedule
    if (!scheduleId) {
      console.log("Fetching schedules to find default...");
      const schedulesRes = await fetch('https://api.cal.com/v2/schedules', { headers });
      const schedulesData = await schedulesRes.json();
      
      if (schedulesData.status === 'success' && schedulesData.data?.length > 0) {
        // Use the first schedule found
        scheduleId = schedulesData.data[0].id;
        console.log(`Using Schedule ID: ${scheduleId}`);
      } else {
        throw new Error("No schedules found in your Cal.com account.");
      }
    }

    if (action === 'block-day') {
      console.log(`Blocking day: ${date} on schedule ${scheduleId}`);
      
      // 2. Get current schedule to preserve existing overrides
      const scheduleRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, { headers });
      const scheduleData = await scheduleRes.json();
      
      if (scheduleData.status !== 'success') {
        throw new Error(`Failed to fetch schedule: ${scheduleData.message}`);
      }

      const currentOverrides = scheduleData.data.overrides || [];
      
      // 3. Add new override for the date with NO time slots (empty array)
      // Format: { date: "YYYY-MM-DD", slots: [] }
      const newOverrides = [
        ...currentOverrides.filter(o => o.date !== date),
        { date: date, slots: [] }
      ];

      // 4. Update the schedule
      const updateRes = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ overrides: newOverrides })
      });

      const updateData = await updateRes.json();

      if (updateData.status !== 'success') {
        throw new Error(`Failed to update schedule: ${updateData.message}`);
      }

      return new Response(JSON.stringify({ success: true, message: `Day ${date} blocked successfully.` }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error(`Unsupported action: ${action}`);

  } catch (error) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})