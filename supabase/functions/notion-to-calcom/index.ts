// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v3] NOTION TO CAL.COM SYNC START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    const body = await req.json();
    const notionPageId = body.data?.id || body.id || body.page_id || body.source?.page_id;

    if (!notionPageId) {
      return new Response(JSON.stringify({ error: "Missing Notion Page ID" }), { status: 400, headers: corsHeaders });
    }

    // 1. Find the appointment in Supabase
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, calcom_booking_id, notion_planner_id, notion_page_id')
      .eq('notion_page_id', notionPageId)
      .single();

    if (fetchError || !appointment) {
      return new Response(JSON.stringify({ message: "No matching record found in CRM" }), { status: 200, headers: corsHeaders });
    }

    // 2. Archive BOTH pages in Notion
    const archivePromises = [];
    if (appointment.notion_page_id && NOTION_KEY) {
      archivePromises.push(fetch(`https://api.notion.com/v1/pages/${appointment.notion_page_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ archived: true })
      }));
    }
    if (appointment.notion_planner_id && NOTION_KEY) {
      archivePromises.push(fetch(`https://api.notion.com/v1/pages/${appointment.notion_planner_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ archived: true })
      }));
    }
    await Promise.all(archivePromises);

    // 3. Cancel on Cal.com
    if (appointment.calcom_booking_id && CALCOM_KEY) {
      await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}/cancel?apiKey=${CALCOM_KEY}`, {
        method: 'DELETE'
      });
    }

    // 4. Update Supabase Status
    await supabase.from('appointments').update({ status: 'Cancelled' }).eq('id', appointment.id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})