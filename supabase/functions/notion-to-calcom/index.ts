// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [v3] NOTION TO CAL.COM SYNC START ---");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Debug: Log available keys (names only)
    const envKeys = Object.keys(Deno.env.toObject());
    console.log("Available Env Keys:", envKeys.filter(k => k.includes('API') || k.includes('KEY')).join(', '));

    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY') || Deno.env.get('CAL_COM_API_KEY');

    if (!NOTION_KEY) {
      console.error("Missing NOTION_API_KEY");
      throw new Error("Missing NOTION_API_KEY in Supabase secrets.");
    }
    if (!CALCOM_KEY) {
      console.error("Missing CALCOM_API_KEY");
      throw new Error("Missing CALCOM_API_KEY in Supabase secrets. Please ensure it is named exactly CALCOM_API_KEY.");
    }

    const body = await req.json().catch(() => ({}));
    console.log("Incoming Notion Payload:", JSON.stringify(body));

    const rawId = body.data?.id || body.id || body.page_id || body.source?.page_id;

    if (!rawId) {
      console.error("No ID found in payload.");
      return new Response(JSON.stringify({ error: "Missing Notion Page ID in request body" }), { status: 400, headers: corsHeaders });
    }

    const notionPageId = rawId.includes('-') ? rawId : rawId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    console.log(`Searching for appointment linked to Notion Page: ${notionPageId}`);

    const { data: appointment, error: dbError } = await supabase
      .from('appointments')
      .select('id, calcom_booking_id, notion_planner_id, notion_page_id, clients(name)')
      .eq('notion_page_id', notionPageId)
      .maybeSingle();

    if (dbError) throw dbError;

    if (!appointment) {
      console.log("No matching appointment found in Supabase.");
      return new Response(JSON.stringify({ message: "No record found in database" }), { status: 200, headers: corsHeaders });
    }

    console.log(`Found appointment for: ${appointment.clients?.name}. Cal.com ID: ${appointment.calcom_booking_id}`);

    if (appointment.notion_planner_id) {
      console.log(`Archiving Notion Planner page: ${appointment.notion_planner_id}`);
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

    if (appointment.calcom_booking_id && appointment.calcom_booking_id !== "undefined") {
      console.log(`Cancelling Cal.com booking: ${appointment.calcom_booking_id}`);
      
      const calRes = await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}?apiKey=${CALCOM_KEY}`, {
        method: 'DELETE'
      });

      if (!calRes.ok) {
        console.log("Direct DELETE failed, trying /cancel endpoint...");
        await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}/cancel?apiKey=${CALCOM_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: "Cancelled via Notion Sync" })
        });
      }
    }

    await supabase
      .from('appointments')
      .update({ status: 'Cancelled' })
      .eq('id', appointment.id);

    console.log("Sync complete: Appointment marked as Cancelled.");

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Critical Sync Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})