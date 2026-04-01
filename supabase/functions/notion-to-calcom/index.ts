// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v5.0 — Cal.com Out-of-Office FULL DAY BLOCK ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY?.startsWith('cal_')) {
      throw new Error("Invalid or missing CALCOM_API_KEY. Must start with 'cal_' or 'cal_live_'");
    }

    const targetDate = new Date(date);
    const dateOnly = targetDate.toISOString().split('T')[0];

    console.log(`Action: ${action}, Target Date: ${dateOnly}, ScheduleID: ${providedScheduleId || 1387833}`);

    if (action === 'block-day') {
      const startISO = `${dateOnly}T00:00:00.000Z`;
      const endISO = `${dateOnly}T23:59:59.999Z`;

      const oooPayload = {
        start: startISO,
        end: endISO,
        reason: "unavailable",           // Options: unavailable, vacation, sick, etc.
        notes: `Blocked full day via API - ${dateOnly}`
      };

      console.log("SENDING OOO PAYLOAD:", JSON.stringify(oooPayload));

      // Create Out-of-Office entry for the authenticated user
      const res = await fetch(`https://api.cal.com/v2/me/ooo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CALCOM_KEY}`,
          'cal-api-version': '2024-08-13',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(oooPayload)
      });

      const data = await res.json();
      console.log(`OOO Status: ${res.status}`);
      console.log("FULL OOO RESPONSE:", JSON.stringify(data, null, 2));

      if (!res.ok) {
        throw new Error(`Failed to create OOO: ${data.message || res.statusText}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        action: "block-day",
        date: dateOnly,
        message: "Out-of-Office entry created successfully. The full day should now be blocked.",
        oooId: data.id || "unknown"
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error("Unsupported action. Only 'block-day' is supported in this version.");

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})