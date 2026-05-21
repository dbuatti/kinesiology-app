// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { syncClientToNotion } from "./client-sync.ts";
import { syncSingleAppointment } from "./appointment-sync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  const functionName = "sync-to-notion";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    console.log(`[${functionName}] Body:`, JSON.stringify(body));

    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.")

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const origin = body.origin || "https://kinesiology-app.vercel.app";

    const notionHeaders = {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    }

    const action = body.action;
    const clientId = body.clientId || body.client?.id;
    const appointmentId = body.appointmentId || body.appointment?.id;

    // Flow 0: Sync All Clients
    if (action === 'sync-all-clients') {
      console.log(`[${functionName}] Starting bulk client sync...`);
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .or('is_practitioner.eq.false,is_practitioner.is.null');

      if (fetchError) throw fetchError;

      let count = 0;
      for (const client of (clients || [])) {
        try {
          await syncClientToNotion(client, supabase, notionHeaders, origin);
          count++;
        } catch (e) {
          console.error(`[${functionName}] Failed to sync client ${client.name}:`, e.message);
        }
      }

      console.log(`[${functionName}] Bulk client sync complete. Synced: ${count}`);
      return new Response(JSON.stringify({ success: true, syncedCount: count }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Flow: Sync All Appointments
    if (action === 'sync-all-appointments') {
      console.log(`[${functionName}] Starting bulk appointment sync...`);
      const { data: appointments, error: fetchError } = await supabase
        .from('appointments')
        .select('id')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      let count = 0;
      for (const app of (appointments || [])) {
        try {
          await syncSingleAppointment(app.id, supabase, notionHeaders, origin);
          count++;
        } catch (e) {
          console.error(`[${functionName}] Failed to sync appointment ${app.id}:`, e.message);
        }
      }

      console.log(`[${functionName}] Bulk appointment sync complete. Synced: ${count}`);
      return new Response(JSON.stringify({ success: true, syncedCount: count }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Flow: Merge Clients
    if (action === 'merge-clients') {
      const { sourceClientId, targetClientId } = body;
      if (!sourceClientId || !targetClientId) {
        throw new Error("Missing sourceClientId or targetClientId");
      }

      console.log(`[${functionName}] Merging client ${sourceClientId} into ${targetClientId}`);

      // 1. Fetch source client to get their Notion Page ID
      const { data: sourceClient, error: sourceError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', sourceClientId)
        .single();

      if (sourceError) throw sourceError;

      // 2. Move all appointments in Supabase
      const { error: appError } = await supabase
        .from('appointments')
        .update({ client_id: targetClientId })
        .eq('client_id', sourceClientId);

      if (appError) throw appError;

      // 3. Archive the source client's Notion page if it exists
      if (sourceClient.notion_page_id) {
        console.log(`[${functionName}] Archiving source client page in Notion: ${sourceClient.notion_page_id}`);
        await fetch(`https://api.notion.com/v1/pages/${sourceClient.notion_page_id}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ archived: true })
        });
      }

      // 4. Delete the source client from Supabase
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', sourceClientId);

      if (deleteError) throw deleteError;

      // 5. Fetch and sync the target client to update their appointments list in Notion
      const { data: targetClient, error: targetError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', targetClientId)
        .single();

      if (targetError) throw targetError;

      const syncResult = await syncClientToNotion(targetClient, supabase, notionHeaders, origin);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Clients merged successfully in both CRM and Notion.",
        targetNotionId: syncResult.id
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Flow 1: Sync Client Only
    if (clientId && !appointmentId) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError || !client) {
        throw new Error(`Failed to fetch client: ${clientError?.message || "Not found"}`)
      }

      const result = await syncClientToNotion(client, supabase, notionHeaders, origin);
      return new Response(JSON.stringify({ 
        success: true, 
        id: result.id, 
        url: result.url 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Flow 2: Sync Appointment (and optionally Client)
    if (appointmentId) {
      const result = await syncSingleAppointment(appointmentId, supabase, notionHeaders, origin);
      return new Response(JSON.stringify({ 
        success: true, 
        id: result.id, 
        url: result.url 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    throw new Error("Missing clientId or appointmentId in request body.");

  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})