// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [manage-calcom-availability] v1.8 RE-VERIFY ---");

  try {
    const { action, date, scheduleId: providedScheduleId } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')
    const targetId = providedScheduleId || "1387833";
    
    // 1. Format the Date for Cal.com's DB
    const isoDate = new Date(date).toISOString();

    // 2. The Update (Using the root-level 'overrides' which is v1 standard)
    const updateRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        overrides: action === 'block-day' ? [{ date: isoDate, slots: [] }] : [] 
      })
    });

    const updateData = await updateRes.json();
    console.log("POST-PATCH STATE:", JSON.stringify(updateData));

    // 3. THE RE-VERIFY: Fetch it again to see if it stuck
    const verifyRes = await fetch(`https://api.cal.com/v1/schedules/${targetId}?apiKey=${CALCOM_KEY}`);
    const verifyData = await verifyRes.json();
    const finalOverrides = verifyData.schedule?.overrides || [];

    console.log("RE-VERIFIED OVERRIDES:", JSON.stringify(finalOverrides));

    return new Response(JSON.stringify({ 
      success: finalOverrides.length > 0 || action === 'unblock-day', 
      count: finalOverrides.length,
      status: finalOverrides.length > 0 ? "Blocked" : "Failed to save"
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})