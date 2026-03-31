// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- NOTION TO CAL.COM SYNC START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase secrets.");

    const body = await req.json();
    const notionPageId = body.data?.id || body.id;

    if (!notionPageId) throw new Error("No Notion Page ID provided.");

    // 1. Find the appointment in Supabase
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, calcom_booking_id, notion_planner_id')
      .eq('notion_page_id', notionPageId)
      .single();

    if (fetchError || !appointment) {
      console.log("No matching appointment found in Supabase.");
      return new Response(JSON.stringify({ message: "No matching record" }), { status: 200, headers: corsHeaders });
    }

    // 2. Archive the page in the Yearly Planner DB if it exists
    if (appointment.notion_planner_id && NOTION_KEY) {
      console.log(`Archiving Yearly Planner page: ${appointment.notion_planner_id}`);
      await fetch(`https://api.notion.com/v1/pages/${appointment.notion_planner_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({ archived: true })
      });
    }

    // 3. Cancel on Cal.com
    if (appointment.calcom_booking_id) {
      console.log(`Cancelling Cal.com booking: ${appointment.calcom_booking_id}`);
      await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}/cancel?apiKey=${CALCOM_KEY}`, {
        method: 'DELETE'
      });
    }

    // 4. Update Supabase Status
    await supabase
      .from('appointments')
      .update({ status: 'Cancelled' })
      .eq('id', appointment.id);

    console.log("SUCCESS: Cal.com cancelled, Planner archived, and CRM updated.");
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})