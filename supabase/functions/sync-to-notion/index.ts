// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { syncClientToNotion } from "./client-sync.ts";
import { syncSingleAppointment } from "./appointment-sync.ts";
import { fetchWithRetry, CLIENTS_DB_ID, fetchDatabaseSchema, findSchemaProperty, extractNotionPropertyValue, normalizeId } from "./notion-api.ts";

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
    const origin = body.origin || Deno.env.get('SITE_URL') || "https://kinesiology-app.vercel.app";

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

          // Self-healing duplicate email logic to bypass unique constraints
          let finalEmail = email;
          if (email && !targetId) {
            const { data: emailMatch } = await supabase
              .from('clients')
              .select('id, notion_page_id')
              .eq('email', email.toLowerCase().trim())
              .maybeSingle();
            
            if (emailMatch) {
              if (!emailMatch.notion_page_id) {
                // The client exists in Supabase but hasn't been linked to Notion yet.
                // Link them now instead of creating a duplicate!
                targetId = emailMatch.id;
                console.log(`[pull-from-notion] Linked existing Supabase client ${name} (${targetId}) to Notion page ${page.id} via email match.`);
              } else if (emailMatch.notion_page_id !== page.id) {
                // This is an actual duplicate client with the same email.
                const parts = email.split('@');
                if (parts.length === 2) {
                  finalEmail = `${parts[0]}+dup-${page.id.slice(0,8)}@${parts[1]}`;
                } else {
                  finalEmail = `${email}+dup-${page.id.slice(0,8)}`;
                }
                console.log(`[pull-from-notion] Detected duplicate email. Renamed to ${finalEmail} to bypass unique constraint.`);
              }
            }
          }

          const clientPayload = {
            user_id: PRACTITIONER_ID,
            name,
            email: finalEmail || null,
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

    // Flow: Audit Notion vs Supabase — report mismatches without modifying anything
    if (action === 'audit-notion-appointments') {
      console.log(`[${functionName}] Auditing Notion Appointments DB vs Supabase...`);

      // Build Supabase lookup: notion_page_id → appointment
      const { data: allAppts } = await supabase.from('appointments').select('id, client_id, date, name, notion_page_id, status');
      const supabaseByNotionId: Record<string, any> = {};
      const supabaseByClientDate: Record<string, string[]> = {};
      for (const a of allAppts || []) {
        if (a.notion_page_id) supabaseByNotionId[a.notion_page_id] = a;
        const key = `${a.client_id}|${(a.date || '').split('T')[0]}`;
        if (!supabaseByClientDate[key]) supabaseByClientDate[key] = [];
        supabaseByClientDate[key].push(a.id);
      }

      // Build Notion lookup: client notion_id → client supabase_id
      const { data: allClients } = await supabase.from('clients').select('id, name, notion_page_id');
      const clientByNid: Record<string, any> = {};
      for (const c of allClients || []) {
        if (c.notion_page_id) clientByNid[c.notion_page_id] = c;
      }

      const schema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);
      const missing: any[] = [];
      const matched = { count: 0 };
      let total = 0;

      let hasMore = true;
      let startCursor = undefined;
      while (hasMore) {
        const qb: any = { page_size: 100 };
        if (startCursor) qb.start_cursor = startCursor;
        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
          method: 'POST', headers: notionHeaders, body: JSON.stringify(qb)
        });
        if (!res.ok) throw new Error(`Notion query failed: ${await res.text()}`);
        const data = await res.json();
        for (const page of (data.results || [])) {
          total++;
          if (supabaseByNotionId[page.id]) { matched.count++; continue; }
          const props = page.properties;
          const dateProp = findSchemaProperty(schema, ['Date']);
          const dateVal = dateProp ? extractNotionPropertyValue(props[dateProp.name]) : null;
          const nameProp = findSchemaProperty(schema, ['Name', 'Title']);
          const nameVal = nameProp ? extractNotionPropertyValue(props[nameProp.name]) : null;
          const relProp = Object.keys(schema).find(k => {
            const p = schema[k];
            return p.type === 'relation' && p.relation?.database_id && normalizeId(p.relation.database_id) === normalizeId(CLIENTS_DB_ID);
          });
          const notionClientId = relProp && props[relProp]?.relation?.[0]?.id;

          missing.push({
            notion_page_id: page.id,
            notion_url: page.url,
            archived: page.archived || false,
            name: nameVal,
            date: dateVal,
            notion_client_id: notionClientId,
            supabase_client: notionClientId ? (clientByNid[notionClientId]?.name || null) : null,
            supabase_client_id: notionClientId ? (clientByNid[notionClientId]?.id || null) : null,
            reason: !dateVal ? 'no_date' : (!notionClientId ? 'no_client_relation' : (!clientByNid[notionClientId] ? 'client_not_in_supabase' : 'unknown'))
          });
        }
        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      const summary = {
        total_notion_pages: total,
        matched_in_supabase: matched.count,
        missing_from_supabase: missing.length,
        missing_details: missing
      };
      console.log(`[${functionName}] Audit: ${JSON.stringify(summary, null, 2)}`);
      return new Response(JSON.stringify(summary), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Flow: Pull all appointments from Notion into Supabase
    if (action === 'pull-from-notion-appointments') {
      console.log(`[${functionName}] Pulling all appointments from Notion Database: ${MAIN_DB_ID}`);

      let hasMore = true;
      let startCursor = undefined;
      let importedCount = 0;
      let skippedCount = 0;

      // Pre-fetch all Supabase clients indexed by notion_page_id for fast lookups
      const { data: allClients } = await supabase.from('clients').select('id, name, notion_page_id');
      const clientByNotionId: Record<string, any> = {};
      for (const c of allClients || []) {
        if (c.notion_page_id) clientByNotionId[c.notion_page_id] = c;
      }

      // Pre-fetch all existing appointment notion_page_ids to skip duplicates
      const { data: existingApps } = await supabase.from('appointments').select('notion_page_id');
      const existingPageIds = new Set<string>();
      for (const a of existingApps || []) {
        if (a.notion_page_id) existingPageIds.add(a.notion_page_id);
      }

      const schema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);

      while (hasMore) {
        const queryBody: any = { page_size: 100 };
        if (startCursor) queryBody.start_cursor = startCursor;

        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify(queryBody)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(`Failed to query Notion Appointments DB: ${JSON.stringify(err)}`);
        }

        const data = await res.json();

        for (const page of (data.results || [])) {
          try {
            const props = page.properties;

            if (existingPageIds.has(page.id)) {
              skippedCount++;
              continue;
            }

            const titleProp = findSchemaProperty(schema, ['Name', 'Title']);
            const nameValue = titleProp ? extractNotionPropertyValue(props[titleProp.name]) : null;
            const dateProp = findSchemaProperty(schema, ['Date']);
            const dateValue = dateProp ? extractNotionPropertyValue(props[dateProp.name]) : null;
            const goalProp = findSchemaProperty(schema, ['Goal']);
            const goalValue = goalProp ? extractNotionPropertyValue(props[goalProp.name]) : null;
            const notesProp = findSchemaProperty(schema, ['Notes']);
            const notesValue = notesProp ? extractNotionPropertyValue(props[notesProp.name]) : null;
            const issueProp = findSchemaProperty(schema, ['Issue', 'Tag', 'Category']);
            const issueValue = issueProp ? extractNotionPropertyValue(props[issueProp.name]) : null;
            const tagValue = Array.isArray(issueValue) ? issueValue[0] || "Kinesiology" : (issueValue || "Kinesiology");

            // Extract the client relation from the page
            const clientRelationProp = Object.keys(schema).find(k => {
              const p = schema[k];
              return p.type === 'relation' && p.relation?.database_id && normalizeId(p.relation.database_id) === normalizeId(CLIENTS_DB_ID);
            });
            let notionClientId: string | null = null;
            if (clientRelationProp && props[clientRelationProp]?.relation?.length > 0) {
              notionClientId = props[clientRelationProp].relation[0].id;
            }

            // If no date, skip
            if (!dateValue) {
              console.warn(`[${functionName}] Skipping Notion page ${page.id}: No date`);
              skippedCount++;
              continue;
            }

            // Find the Supabase client by notion_page_id
            const supabaseClient = notionClientId ? clientByNotionId[notionClientId] : null;
            if (!supabaseClient) {
              console.warn(`[${functionName}] Skipping Notion page ${page.id}: No client match in Supabase for Notion page ${notionClientId}`);
              skippedCount++;
              continue;
            }

            const appointmentPayload: any = {
              user_id: PRACTITIONER_ID,
              client_id: supabaseClient.id,
              date: dateValue,
              name: nameValue || `Session with ${supabaseClient.name}`,
              goal: goalValue || null,
              issue: Array.isArray(issueValue) ? issueValue.join(', ') : (issueValue || null),
              tag: tagValue,
              notes: notesValue || null,
              status: dateValue < new Date().toISOString().split('T')[0] ? 'Completed' : 'Scheduled',
              notion_page_id: page.id,
              notion_link: page.url
            };

            const { error: insertError } = await supabase.from('appointments').insert(appointmentPayload);
            if (insertError) {
              console.error(`[${functionName}] Failed to insert appointment from Notion page ${page.id}:`, insertError.message);
            } else {
              importedCount++;
            }
          } catch (itemErr) {
            console.error(`[${functionName}] Error processing Notion page ${page.id}:`, itemErr.message);
          }
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Imported ${importedCount} appointments from Notion (${skippedCount} already existed).`
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

    // Flow: Retitle all 2026+ Notion pages to "FNH · Client · Day Month DayNum, Time"
    if (action === 'retitle-notion-pages') {
      console.log(`[${functionName}] Retitling 2026+ Notion pages in ${MAIN_DB_ID}`);

      // Build client name cache from Supabase (notion_page_id → name)
      const { data: allClients } = await supabase.from('clients').select('name, notion_page_id');
      const clientNameByNid: Record<string, string> = {};
      for (const c of allClients || []) {
        if (c.notion_page_id) clientNameByNid[c.notion_page_id] = c.name;
      }

      const schema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);
      const titleProp = findSchemaProperty(schema, ['Name', 'Title']);
      if (!titleProp) throw new Error('No title property found in schema');

      const dateProp = findSchemaProperty(schema, ['Date']);
      if (!dateProp) throw new Error('No date property found in schema');

      const relProp = Object.keys(schema).find(k => {
        const p = schema[k];
        return p.type === 'relation' && p.relation?.database_id && normalizeId(p.relation.database_id) === normalizeId(CLIENTS_DB_ID);
      });

      function formatTitle(dateStr: string, clientName: string): string {
        const d = new Date(dateStr);
        const tz = 'Australia/Sydney';
        const weekday = d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
        const month = d.toLocaleDateString('en-US', { timeZone: tz, month: 'short' });
        const day = d.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
        if (!dateStr.includes('T')) return `FNH · ${clientName} · ${weekday} ${month} ${day}`;
        const time = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
        return `FNH · ${clientName} · ${weekday} ${month} ${day}, ${time}`;
      }

      function extractClientNameFromTitle(title: string): string | null {
        // "Jacqui Dwyer - Kinesiology (Jul 8, 2026)" → "Jacqui Dwyer"
        const dash = title.split(' - ')[0]?.trim();
        if (dash && dash !== 'Appointment' && dash !== 'Session' && dash !== 'Follow Up' && dash !== 'Self Practice' && dash !== 'Initial Checkup' && dash !== 'VHS balance') {
          // Check if dash contains a date pattern (old Notion auto-title), skip those
          if (!/202\d/.test(dash)) return dash;
        }
        // "Session with Jacqui Dwyer" → "Jacqui Dwyer"
        const sw = title.match(/^Session with (.+)$/);
        if (sw) return sw[1].trim();
        return null;
      }

      let hasMore = true;
      let startCursor = undefined;
      let updated = 0;
      let skipped = 0;

      while (hasMore) {
        const qb: any = {
          page_size: 100,
          filter: {
            property: dateProp.name,
            date: { on_or_after: '2026-01-01' }
          }
        };
        if (startCursor) qb.start_cursor = startCursor;

        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
          method: 'POST', headers: notionHeaders, body: JSON.stringify(qb)
        });
        if (!res.ok) throw new Error(`Notion query failed: ${await res.text()}`);
        const data = await res.json();

        for (const page of (data.results || [])) {
          try {
            const props = page.properties;
            const currentName = extractNotionPropertyValue(props[titleProp.name]);
            const dateVal = extractNotionPropertyValue(props[dateProp.name]);
            if (!currentName || !dateVal) { skipped++; continue; }

            // Resolve client name
            let clientName: string | null = null;
            const notionClientId = relProp && props[relProp]?.relation?.[0]?.id;
            if (notionClientId) clientName = clientNameByNid[notionClientId] || null;
            if (!clientName) clientName = extractClientNameFromTitle(currentName);
            if (!clientName) clientName = 'Unknown Client';

            const newTitle = formatTitle(dateVal, clientName);
            if (currentName === newTitle) { skipped++; continue; }

            await fetchWithRetry(`https://api.notion.com/v1/pages/${page.id}`, {
              method: 'PATCH',
              headers: notionHeaders,
              body: JSON.stringify({
                properties: { [titleProp.name]: { title: [{ text: { content: newTitle } }] } }
              })
            });
            updated++;
          } catch (e) {
            console.error(`[${functionName}] Failed to retitle ${page.id}:`, e.message);
          }
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      const msg = `Renamed ${updated} pages (${skipped} skipped).`;
      console.log(`[${functionName}] ${msg}`);
      return new Response(JSON.stringify({ success: true, updated, skipped }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Flow: Sync Notion titles back to Supabase appointment names
    if (action === 'sync-names-from-notion') {
      console.log(`[${functionName}] Syncing Notion titles to Supabase names...`);

      const schema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);
      const titleProp = findSchemaProperty(schema, ['Name', 'Title']);
      if (!titleProp) throw new Error('No title property found');

      // Pre-fetch all appointments indexed by notion_page_id
      const { data: allAppts } = await supabase.from('appointments').select('id, notion_page_id');
      const apptByNid: Record<string, string> = {};
      for (const a of allAppts || []) {
        if (a.notion_page_id) apptByNid[a.notion_page_id] = a.id;
      }

      let hasMore = true;
      let startCursor = undefined;
      let updated = 0;
      let skipped = 0;

      while (hasMore) {
        const qb: any = { page_size: 100 };
        if (startCursor) qb.start_cursor = startCursor;
        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
          method: 'POST', headers: notionHeaders, body: JSON.stringify(qb)
        });
        if (!res.ok) throw new Error(`Notion query failed: ${await res.text()}`);
        const data = await res.json();

        for (const page of (data.results || [])) {
          const props = page.properties;
          const title = extractNotionPropertyValue(props[titleProp.name]);
          const apptId = apptByNid[page.id];
          if (!title || !apptId) { skipped++; continue; }
          const { error } = await supabase.from('appointments').update({ name: title }).eq('id', apptId);
          if (error) { skipped++; continue; }
          updated++;
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      console.log(`[${functionName}] Updated ${updated} names (${skipped} skipped).`);
      return new Response(JSON.stringify({ success: true, updated, skipped }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Flow: Cancel appointments whose Notion pages are archived (ghost bookings)
    if (action === 'cancel-ghost-appointments') {
      console.log(`[${functionName}] Looking for archived Notion pages with active Supabase rows...`);
      const schema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);
      let totalArchived = 0;
      let cancelled = 0;
      let hasMore = true;
      let startCursor = undefined;

      const { data: allAppts } = await supabase.from('appointments').select('id, notion_page_id, status');
      const apptByNid: Record<string, any> = {};
      for (const a of allAppts || []) {
        if (a.notion_page_id) apptByNid[a.notion_page_id] = { id: a.id, status: a.status };
      }

      while (hasMore) {
        const qb: any = { page_size: 100 };
        if (startCursor) qb.start_cursor = startCursor;
        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
          method: 'POST', headers: notionHeaders, body: JSON.stringify(qb)
        });
        if (!res.ok) throw new Error(`Notion query failed: ${await res.text()}`);
        const data = await res.json();

        for (const page of (data.results || [])) {
          if (!page.archived) continue;
          totalArchived++;
          const match = apptByNid[page.id];
          if (!match || match.status === 'Cancelled') continue;
          await supabase.from('appointments').update({ status: 'Cancelled', calcom_booking_id: null }).eq('id', match.id);
          cancelled++;
        }
        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      const msg = `Cancelled ${cancelled} ghost appointments (${totalArchived} total archived Notion pages found).`;
      console.log(`[${functionName}] ${msg}`);
      return new Response(JSON.stringify({ success: true, cancelled, totalArchived }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Flow: Remove orphan Notion client + session (no matching Supabase client)
    if (action === 'remove-orphan') {
      console.log(`[${functionName}] Archiving orphan pages...`);
      const sessionPageId = '39aaad21-cd09-81d8-a346-ee99c06b9ab6';
      const clientPageId = '39aaad21-cd09-813d-b151-c0ce9c5e072a';
      let archived = 0;

      for (const pid of [sessionPageId, clientPageId]) {
        const res = await fetchWithRetry(`https://api.notion.com/v1/pages/${pid}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ archived: true }),
        });
        if (res.ok) archived++;
        else console.error(`[${functionName}] Failed to archive ${pid}: ${await res.text()}`);
      }

      const msg = `Archived ${archived}/2 orphan Notion pages.`;
      console.log(`[${functionName}] ${msg}`);
      return new Response(JSON.stringify({ success: true, archived }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Flow: Bulk-archive orphaned Notion pages (active in Notion, no Supabase backing)
    if (action === 'archive-orphans') {
      const dryRun = body.dryRun !== false; // safe by default
      const beforeDate = body.beforeDate || null; // ISO date cutoff, e.g. "2026-08-01"
      const onlyReasons = body.reasons || ['no_client_relation', 'client_not_in_supabase', 'no_date', 'unknown'];
      const pageIdFilter = body.pageIds || null; // specific page IDs to archive

      console.log(`[${functionName}] archive-orphans: dryRun=${dryRun} beforeDate=${beforeDate} reasons=${onlyReasons.join(',')}`);

      // Build Supabase lookup: notion_page_id → appointment
      const { data: allAppts } = await supabase.from('appointments').select('id, client_id, date, name, notion_page_id, status');
      const supabaseByNotionId: Record<string, any> = {};
      for (const a of allAppts || []) {
        if (a.notion_page_id) supabaseByNotionId[a.notion_page_id] = a;
      }

      // Build Notion client lookup
      const { data: allClients } = await supabase.from('clients').select('id, name, notion_page_id');
      const clientByNid: Record<string, any> = {};
      for (const c of allClients || []) {
        if (c.notion_page_id) clientByNid[c.notion_page_id] = c;
      }

      const schema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);
      const orphansToArchive: any[] = [];
      let total = 0;

      let hasMore = true;
      let startCursor = undefined;
      while (hasMore) {
        const qb: any = { page_size: 100 };
        if (startCursor) qb.start_cursor = startCursor;
        const res = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
          method: 'POST', headers: notionHeaders, body: JSON.stringify(qb)
        });
        if (!res.ok) throw new Error(`Notion query failed: ${await res.text()}`);
        const data = await res.json();
        for (const page of (data.results || [])) {
          total++;
          if (page.archived) continue; // already archived
          if (supabaseByNotionId[page.id]) continue; // has Supabase backing

          const props = page.properties;
          const dateProp = findSchemaProperty(schema, ['Date']);
          const dateVal = dateProp ? extractNotionPropertyValue(props[dateProp.name]) : null;
          const nameProp = findSchemaProperty(schema, ['Name', 'Title']);
          const nameVal = nameProp ? extractNotionPropertyValue(props[nameProp.name]) : null;
          const relProp = Object.keys(schema).find(k => {
            const p = schema[k];
            return p.type === 'relation' && p.relation?.database_id && normalizeId(p.relation.database_id) === normalizeId(CLIENTS_DB_ID);
          });
          const notionClientId = relProp && props[relProp]?.relation?.[0]?.id;

          const reason = !dateVal ? 'no_date' : (!notionClientId ? 'no_client_relation' : (!clientByNid[notionClientId] ? 'client_not_in_supabase' : 'unknown'));

          if (!onlyReasons.includes(reason)) continue;

          // Date cutoff filter
          if (beforeDate && dateVal) {
            const pageDate = dateVal.split('T')[0];
            if (pageDate >= beforeDate) continue;
          }

          // Specific page ID filter
          if (pageIdFilter && !pageIdFilter.includes(page.id)) continue;

          orphansToArchive.push({
            notion_page_id: page.id,
            notion_url: page.url,
            name: nameVal,
            date: dateVal,
            reason,
          });
        }
        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      if (dryRun) {
        const msg = `Dry run: would archive ${orphansToArchive.length} orphan pages (out of ${total} total active).`;
        console.log(`[${functionName}] ${msg}`);
        return new Response(JSON.stringify({ success: true, dryRun: true, wouldArchive: orphansToArchive.length, details: orphansToArchive }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let archived = 0;
      const failed: string[] = [];
      for (const orphan of orphansToArchive) {
        const res = await fetchWithRetry(`https://api.notion.com/v1/pages/${orphan.notion_page_id}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ archived: true }),
        });
        if (res.ok) {
          archived++;
          console.log(`[${functionName}] Archived: ${orphan.name} (${orphan.notion_page_id})`);
        } else {
          failed.push(orphan.notion_page_id);
          console.error(`[${functionName}] Failed to archive ${orphan.notion_page_id}: ${await res.text()}`);
        }
      }

      const msg = `Archived ${archived}/${orphansToArchive.length} orphan pages.`;
      console.log(`[${functionName}] ${msg}`);
      return new Response(JSON.stringify({ success: true, archived, total: orphansToArchive.length, failed }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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