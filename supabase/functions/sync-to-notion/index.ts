// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { syncClientToNotion } from "./client-sync.ts";
import { syncSingleAppointment } from "./appointment-sync.ts";
import { fetchWithRetry, CLIENTS_DB_ID, fetchDatabaseSchema, findSchemaProperty, extractNotionPropertyValue } from "./notion-api.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAIN_DB_ID = "171f7156cdc645e8b689af13d217bc7c";

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

    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    // Flow: Pull all clients from Notion into Supabase
    if (action === 'pull-from-notion') {
      console.log(`[${functionName}] Pulling all clients from Notion Database: ${CLIENTS_DB_ID}`);
      
      let hasMore = true;
      let startCursor = undefined;
      let importedCount = 0;
      const allNotionClients = [];

      while (hasMore) {
        const queryBody: any = { page_size: 100 };
        if (startCursor) queryBody.start_cursor = startCursor;

        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify(queryBody)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(`Failed to query Notion Clients DB: ${JSON.stringify(err)}`);
        }

        const data = await res.json();
        allNotionClients.push(...(data.results || []));
        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      console.log(`[${functionName}] Found ${allNotionClients.length} clients in Notion. Syncing to Supabase...`);

      const schema = await fetchDatabaseSchema(CLIENTS_DB_ID, notionHeaders);

      for (const page of allNotionClients) {
        try {
          const props = page.properties;
          
          const nameProp = findSchemaProperty(schema, ['Name', 'Client Name', 'Full Name']);
          const emailProp = findSchemaProperty(schema, ['Email', 'Email Address']);
          const phoneProp = findSchemaProperty(schema, ['Phone', 'Phone Number', 'Contact Number', 'Mobile']);
          const bornProp = findSchemaProperty(schema, ['Date of Birth', 'DOB', 'Born', 'Birth Date']);
          const pronounsProp = findSchemaProperty(schema, ['Pronouns']);
          const occupationProp = findSchemaProperty(schema, ['Occupation', 'Job', 'Work']);
          const historyProp = findSchemaProperty(schema, ['Medical History', 'History', 'Conditions']);
          const medsProp = findSchemaProperty(schema, ['Medications & Supplements', 'Medications', 'Supplements']);
          const sleepProp = findSchemaProperty(schema, ['Sleep Quality', 'Sleep']);
          const digestionProp = findSchemaProperty(schema, ['Digestive Health', 'Digestion']);
          const stressProp = findSchemaProperty(schema, ['Current Stress Level', 'Stress Level', 'Stress']);
          const referralProp = findSchemaProperty(schema, ['Referral Source', 'Referral', 'How did you find me']);
          const stripeProp = findSchemaProperty(schema, ['Stripe Customer ID', 'Stripe ID', 'Stripe Customer']);

          const name = nameProp ? extractNotionPropertyValue(props[nameProp.name]) : null;
          if (!name) {
            console.warn(`[${functionName}] Skipping page ${page.id}: No name property found.`);
            continue;
          }

          const email = emailProp ? extractNotionPropertyValue(props[emailProp.name]) : null;
          const phone = phoneProp ? extractNotionPropertyValue(props[phoneProp.name]) : null;
          const born = bornProp ? extractNotionPropertyValue(props[bornProp.name]) : null;
          const pronouns = pronounsProp ? extractNotionPropertyValue(props[pronounsProp.name]) : null;
          const occupation = occupationProp ? extractNotionPropertyValue(props[occupationProp.name]) : null;
          const medical_history = historyProp ? extractNotionPropertyValue(props[historyProp.name]) : null;
          const medications_supplements = medsProp ? extractNotionPropertyValue(props[medsProp.name]) : null;
          const sleep_quality = sleepProp ? extractNotionPropertyValue(props[sleepProp.name]) : null;
          const digestive_health = digestionProp ? extractNotionPropertyValue(props[digestionProp.name]) : null;
          const current_stress_level = stressProp ? extractNotionPropertyValue(props[stressProp.name]) : null;
          const referral_source = referralProp ? extractNotionPropertyValue(props[referralProp.name]) : null;
          const stripe_customer_id = stripeProp ? extractNotionPropertyValue(props[stripeProp.name]) : null;

          // Check if client already exists in Supabase strictly by notion_page_id
          const { data: existingByNotion } = await supabase
            .from('clients')
            .select('id')
            .eq('notion_page_id', page.id)
            .maybeSingle();

          let targetId = existingByNotion?.id;

          const clientPayload = {
            user_id: PRACTITIONER_ID,
            name,
            email: email || null,
            phone: phone || null,
            born: born || null,
            pronouns: pronouns || null,
            occupation: occupation || null,
            medical_history: medical_history || null,
            medications_supplements: medications_supplements || null,
            sleep_quality: sleep_quality || null,
            digestive_health: digestive_health || null,
            current_stress_level: current_stress_level || null,
            referral_source: referral_source || null,
            stripe_customer_id: stripe_customer_id || null,
            notion_page_id: page.id,
            notion_link: page.url
          };

          if (targetId) {
            await supabase.from('clients').update(clientPayload).eq('id', targetId);
          } else {
            await supabase.from('clients').insert(clientPayload);
          }

          importedCount++;
        } catch (itemErr) {
          console.error(`[${functionName}] Error importing page ${page.id}:`, itemErr.message);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully pulled and synced ${importedCount} clients from Notion to Supabase!` 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Flow: Configure Notion Schema (Create properties & relations)
    if (action === 'configure-schema') {
      console.log(`[${functionName}] Configuring Notion Database Schemas...`);

      // 1. Configure Clients Database Properties
      console.log(`[${functionName}] Updating Clients Database: ${CLIENTS_DB_ID}`);
      const clientSchemaUpdate = {
        properties: {
          "Email": { "email": {} },
          "Phone": { "phone_number": {} },
          "Date of Birth": { "date": {} },
          "Pronouns": { "rich_text": {} },
          "Occupation": { "rich_text": {} },
          "Medical History": { "rich_text": {} },
          "Medications & Supplements": { "rich_text": {} },
          "Sleep Quality": { "rich_text": {} },
          "Digestive Health": { "rich_text": {} },
          "Current Stress Level": { "number": {} },
          "Emergency Contact": { "rich_text": {} },
          "Referral Source": { "rich_text": {} },
          "CRM Link": { "url": {} }
        }
      };

      const clientRes = await fetchWithRetry(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}`, {
        method: 'PATCH',
        headers: notionHeaders,
        body: JSON.stringify(clientSchemaUpdate)
      });

      if (!clientRes.ok) {
        const err = await clientRes.json();
        throw new Error(`Failed to configure Clients DB: ${err.message || JSON.stringify(err)}`);
      }

      // 2. Configure Main Appointments Database & Two-Way Relation
      console.log(`[${functionName}] Updating Main Appointments Database: ${MAIN_DB_ID}`);
      const mainSchemaUpdate = {
        properties: {
          "Date": { "date": {} },
          "Goal": { "rich_text": {} },
          "Issue": { "multi_select": {} },
          "Notes": { "rich_text": {} },
          // Create Two-Way Relation to Clients Database
          "Client Profile": {
            "relation": {
              "database_id": CLIENTS_DB_ID,
              "type": "dual_property",
              "dual_property": {
                "synced_property_name": "Appointments History"
              }
            }
          }
        }
      };

      const mainRes = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}`, {
        method: 'PATCH',
        headers: notionHeaders,
        body: JSON.stringify(mainSchemaUpdate)
      });

      if (!mainRes.ok) {
        const err = await mainRes.json();
        throw new Error(`Failed to configure Main DB: ${err.message || JSON.stringify(err)}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Notion databases successfully configured with all required properties and two-way relations!" 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

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
      const { sourceClientId, targetClientId, mergedFields } = body;
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

      // 1.5 Update target client with merged fields if provided
      if (mergedFields && Object.keys(mergedFields).length > 0) {
        console.log(`[${functionName}] Updating target client ${targetClientId} with merged fields:`, Object.keys(mergedFields));
        const { error: updateError } = await supabase
          .from('clients')
          .update(mergedFields)
          .eq('id', targetClientId);
        if (updateError) throw updateError;
      }

      // 2. Move all appointments in Supabase and get their IDs
      const { data: movedApps, error: appError } = await supabase
        .from('appointments')
        .update({ client_id: targetClientId })
        .eq('client_id', sourceClientId)
        .select('id');

      if (appError) throw appError;

      // 2.5 Move all client wins in Supabase
      const { error: winsError } = await supabase
        .from('client_wins')
        .update({ client_id: targetClientId })
        .eq('client_id', sourceClientId);

      if (winsError) {
        console.warn(`[${functionName}] Failed to move client wins:`, winsError.message);
      }

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

      // 6. Sync all moved appointments to Notion to update their relations
      if (movedApps && movedApps.length > 0) {
        console.log(`[${functionName}] Syncing ${movedApps.length} moved appointments to Notion...`);
        for (const app of movedApps) {
          try {
            await syncSingleAppointment(app.id, supabase, notionHeaders, origin);
          } catch (syncAppErr) {
            console.error(`[${functionName}] Failed to sync moved appointment ${app.id} to Notion:`, syncAppErr.message);
          }
        }
      }

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