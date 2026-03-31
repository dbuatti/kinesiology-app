// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  console.log("--- [v4] NOTION TO CAL.COM SYNC START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    // 1. Check for missing secrets immediately
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.");

    const body = await req.json().catch(() => ({}));
    console.log("Full Webhook Body:", JSON.stringify(body));

    // 2. Robust ID extraction
    // Notion Automations usually send data.id or page_id
    const rawId = body.data?.id || body.id || body.page_id || body.source?.page_id;

    if (!rawId) {
      console.error("FAILED: No ID found in payload. Keys received:", Object.keys(body));
      return new Response(JSON.stringify({ 
        error: "Missing Notion Page ID in webhook payload.",
        hint: "Ensure 'Content' checkboxes are checked in Notion Automation settings.",
        received_keys: Object.keys(body)
      }), { status: 400, headers: corsHeaders });
    }

    // Normalize ID (Notion IDs in DB might have hyphens, webhook might not)
    const notionPageId = rawId.includes('-') ? rawId : rawId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

    console.log(`Searching for appointment with Notion ID: ${notionPageId}`);

    // 3. Find the appointment in Supabase
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, calcom_booking_id, notion_planner_id, notion_page_id')
      .eq('notion_page_id', notionPageId)
      .maybeSingle();

    if (fetchError) throw new Error(`Database error: ${fetchError.message}`);

    if (!appointment) {
      console.log("No matching record found. This is normal if the appointment wasn't created via the CRM/Cal.com sync.");
      return new Response(JSON.stringify({ 
        message: "No matching record found in CRM. Sync skipped.",
        searched_id: notionPageId
      }), { status: 200, headers: corsHeaders });
    }

    // 4. Archive BOTH pages in Notion
    const archiveResults = { main: 'skipped', planner: 'skipped' };
    
    if (appointment.notion_page_id) {
      const res = await fetch(`https://api.notion.com/v1/pages/${appointment.notion_page_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ archived: true })
      });
      archiveResults.main = res.ok ? 'success' : 'failed';
    }

    if (appointment.notion_planner_id) {
      const res = await fetch(`https://api.notion.com/v1/pages/${appointment.notion_planner_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ archived: true })
      });
      archiveResults.planner = res.ok ? 'success' : 'failed';
    }

    // 5. Cancel on Cal.com
    let calcomStatus = 'skipped';
    if (appointment.calcom_booking_id) {
      const res = await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}/cancel?apiKey=${CALCOM_KEY}`, {
        method: 'DELETE'
      });
      calcomStatus = res.ok ? 'success' : 'failed';
    }

    // 6. Update Supabase Status
    await supabase.from('appointments').update({ status: 'Cancelled' }).eq('id', appointment.id);

    console.log("SUCCESS:", { archiveResults, calcomStatus });
    return new Response(JSON.stringify({ success: true, archiveResults, calcomStatus }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: "Check Supabase Edge Function logs for full details."
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})