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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    const body = await req.json().catch(() => ({}));
    const rawId = body.data?.id || body.id || body.page_id || body.source?.page_id;

    if (!rawId) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });

    const notionPageId = rawId.includes('-') ? rawId : rawId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, calcom_booking_id, notion_planner_id, notion_page_id')
      .eq('notion_page_id', notionPageId)
      .maybeSingle();

    if (!appointment) return new Response(JSON.stringify({ message: "No record" }), { status: 200, headers: corsHeaders });

    // Archive Notion
    const notionHeaders = { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' };
    if (appointment.notion_page_id) await fetch(`https://api.notion.com/v1/pages/${appointment.notion_page_id}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });
    if (appointment.notion_planner_id) await fetch(`https://api.notion.com/v1/pages/${appointment.notion_planner_id}`, { method: 'PATCH', headers: notionHeaders, body: JSON.stringify({ archived: true }) });

    // Cancel Cal.com
    if (appointment.calcom_booking_id && appointment.calcom_booking_id !== "undefined") {
      await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}/cancel?apiKey=${CALCOM_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: "Cancelled via Notion Sync" })
      });
    }

    await supabase.from('appointments').update({ status: 'Cancelled' }).eq('id', appointment.id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})