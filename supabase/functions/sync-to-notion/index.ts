// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAIN_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";

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

    const clientId = body.clientId || body.client?.id;
    const appointmentId = body.appointmentId || body.appointment?.id;

    // Helper to fetch database schema to map properties dynamically
    const fetchDatabaseSchema = async (dbId: string) => {
      try {
        const dbRes = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
          method: 'GET',
          headers: notionHeaders
        });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          return dbData.properties || {};
        } else {
          const errData = await dbRes.json();
          console.warn(`[${functionName}] Failed to fetch DB schema for ${dbId}:`, errData);
        }
      } catch (schemaErr) {
        console.warn(`[${functionName}] Error fetching DB schema for ${dbId}:`, schemaErr);
      }
      return {};
    };

    // Helper to find property in schema
    const findSchemaProperty = (schema: any, possibleNames: string[]) => {
      const keys = Object.keys(schema);
      for (const name of possibleNames) {
        const match = keys.find(k => k.toLowerCase().trim() === name.toLowerCase().trim());
        if (match) return { name: match, schema: schema[match] };
      }
      return null;
    };

    // Helper to map value to property
    const mapValueToNotionProperty = (value: any, propertySchema: any) => {
      if (value === null || value === undefined || value === "") return null;
      const type = propertySchema.type;
      switch (type) {
        case 'title':
          return { title: [{ text: { content: String(value) } }] };
        case 'rich_text':
          return { rich_text: [{ text: { content: String(value) } }] };
        case 'email':
          return { email: String(value) };
        case 'phone_number':
          return { phone_number: String(value) };
        case 'date':
          return { date: { start: String(value).split('T')[0] } };
        case 'number':
          const num = Number(value);
          return isNaN(num) ? null : { number: num };
        case 'select':
          return { select: { name: String(value).substring(0, 100) } };
        case 'multi_select':
          const items = Array.isArray(value) ? value : [value];
          return { multi_select: items.map(item => ({ name: String(item).substring(0, 100) })) };
        case 'url':
          return { url: String(value) };
        default:
          return null;
      }
    };

    // Helper to sync a client to the Client Database
    const syncClientToNotion = async (client: any) => {
      console.log(`[${functionName}] Syncing client to Client Database: ${client.name} (${client.id})`);
      const schema = await fetchDatabaseSchema(CLIENTS_DB_ID);
      const emergencyContact = [client.emergency_contact_name, client.emergency_contact_phone].filter(Boolean).join(' - ');

      const fieldMappings = [
        { value: client.name, possibleNames: ['Name', 'Client Name', 'Full Name'] },
        { value: client.email, possibleNames: ['Email', 'Email Address'] },
        { value: client.phone, possibleNames: ['Phone', 'Phone Number', 'Contact Number', 'Mobile'] },
        { value: client.born, possibleNames: ['Date of Birth', 'DOB', 'Born', 'Birth Date'] },
        { value: client.pronouns, possibleNames: ['Pronouns'] },
        { value: client.occupation, possibleNames: ['Occupation', 'Job', 'Work'] },
        { value: client.medical_history, possibleNames: ['Medical History', 'History', 'Conditions'] },
        { value: client.medications_supplements, possibleNames: ['Medications & Supplements', 'Medications', 'Supplements'] },
        { value: client.sleep_quality, possibleNames: ['Sleep Quality', 'Sleep'] },
        { value: client.digestive_health, possibleNames: ['Digestive Health', 'Digestion'] },
        { value: client.current_stress_level, possibleNames: ['Current Stress Level', 'Stress Level', 'Stress'] },
        { value: emergencyContact, possibleNames: ['Emergency Contact', 'Emergency Contact Details'] },
        { value: client.referral_source, possibleNames: ['Referral Source', 'Referral', 'How did you find me'] },
        { value: `${origin}/clients/${client.id}`, possibleNames: ['CRM Link', 'Link', 'URL', 'Client Link'] }
      ];

      const clientProps = {};
      for (const mapping of fieldMappings) {
        const prop = findSchemaProperty(schema, mapping.possibleNames);
        if (prop) {
          const mappedVal = mapValueToNotionProperty(mapping.value, prop.schema);
          if (mappedVal) {
            clientProps[prop.name] = mappedVal;
          }
        }
      }

      // Ensure Name is always set
      if (!clientProps['Name'] && schema['Name']) {
        clientProps['Name'] = { title: [{ text: { content: client.name } }] };
      } else if (!clientProps['Name']) {
        const titleProp = Object.keys(schema).find(k => schema[k].type === 'title');
        if (titleProp) {
          clientProps[titleProp] = { title: [{ text: { content: client.name } }] };
        } else {
          clientProps['Name'] = { title: [{ text: { content: client.name } }] };
        }
      }

      let clientPageId = client.notion_page_id;
      let clientPageUrl = client.notion_link;

      if (clientPageId) {
        console.log(`[${functionName}] Updating existing Client page: ${clientPageId}`);
        const updateRes = await fetch(`https://api.notion.com/v1/pages/${clientPageId}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ properties: clientProps })
        })

        if (!updateRes.ok) {
          const errData = await updateRes.json();
          console.warn(`[${functionName}] Failed to update existing Client page, will recreate:`, errData);
          clientPageId = null;
        } else {
          const updateData = await updateRes.json();
          clientPageUrl = updateData.url;
        }
      }

      if (!clientPageId) {
        console.log(`[${functionName}] Creating new Client page in DB: ${CLIENTS_DB_ID}`);
        
        const childrenBlocks = [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "📋 Client Onboarding Details" } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { text: { content: "This page is automatically synced from the CRM. Below are the onboarding details submitted by the client." } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Pronouns: " }, annotations: { bold: true } },
                { text: { content: client.pronouns || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Date of Birth: " }, annotations: { bold: true } },
                { text: { content: client.born ? new Date(client.born).toLocaleDateString() : "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Occupation: " }, annotations: { bold: true } },
                { text: { content: client.occupation || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Medical History: " }, annotations: { bold: true } },
                { text: { content: client.medical_history || "None reported" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Medications & Supplements: " }, annotations: { bold: true } },
                { text: { content: client.medications_supplements || "None" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Sleep Quality: " }, annotations: { bold: true } },
                { text: { content: client.sleep_quality || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Digestive Health: " }, annotations: { bold: true } },
                { text: { content: client.digestive_health || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Current Stress Level: " }, annotations: { bold: true } },
                { text: { content: String(client.current_stress_level || "Not provided") } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Emergency Contact: " }, annotations: { bold: true } },
                { text: { content: client.emergency_contact_name ? `${client.emergency_contact_name} (${client.emergency_contact_phone || 'No phone'})` : "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Referral Source: " }, annotations: { bold: true } },
                { text: { content: client.referral_source || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "divider",
            divider: {}
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { text: { content: "🔗 Open in CRM: " }, annotations: { bold: true } },
                { text: { content: `${origin}/clients/${client.id}`, link: { url: `${origin}/clients/${client.id}` } } }
              ]
            }
          }
        ];

        const createRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify({
            parent: { database_id: CLIENTS_DB_ID },
            properties: clientProps,
            children: childrenBlocks
          })
        })

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(`Failed to create Client page: ${JSON.stringify(errData)}`);
        }

        const createData = await createRes.json();
        clientPageId = createData.id;
        clientPageUrl = createData.url;
      }

      // Update client in Supabase with Notion details
      console.log(`[${functionName}] Updating client in Supabase with Notion details`);
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          notion_page_id: clientPageId,
          notion_link: clientPageUrl
        })
        .eq('id', client.id);

      if (updateError) {
        console.error(`[${functionName}] Failed to update client in Supabase:`, updateError);
      }

      return { id: clientPageId, url: clientPageUrl };
    };

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

      const result = await syncClientToNotion(client);
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
      // Fetch full appointment details including client
      const { data: appointment, error: appError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            *
          )
        `)
        .eq('id', appointmentId)
        .single()

      if (appError || !appointment) {
        throw new Error(`Failed to fetch appointment: ${appError?.message || "Not found"}`)
      }

      const clientName = appointment.clients?.name || "Unknown Client";
      const appointmentName = appointment.name || `Session with ${clientName}`;

      console.log(`[${functionName}] Syncing appointment: ${appointmentName} (${appointmentId})`);

      // Sync client first to ensure we have their Notion link
      let clientPageUrl = appointment.clients?.notion_link;
      if (appointment.clients) {
        try {
          const clientResult = await syncClientToNotion(appointment.clients);
          clientPageUrl = clientResult.url;
        } catch (clientSyncErr) {
          console.error(`[${functionName}] Failed to sync client as part of appointment sync:`, clientSyncErr);
        }
      }

      // Prepare properties for Main Appointments DB
      const mainProps = {
        "Name": { title: [{ text: { content: appointmentName } }] },
        "Date": { date: { start: appointment.date } },
        "Goal": { rich_text: [{ text: { content: appointment.goal || "" } }] },
        "Issue": { multi_select: [{ name: appointment.tag || "Kinesiology" }] },
        "Notes": { rich_text: [{ text: { content: `${appointment.issue ? `ISSUE: ${appointment.issue}\n\n` : ''}${appointment.notes || ""}` } }] }
      }

      let mainPageId = appointment.notion_page_id;
      let mainPageUrl = appointment.notion_link;

      // Try updating existing Main page if ID exists
      if (mainPageId) {
        console.log(`[${functionName}] Updating existing Main page: ${mainPageId}`);
        const updateRes = await fetch(`https://api.notion.com/v1/pages/${mainPageId}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ properties: mainProps })
        })

        if (!updateRes.ok) {
          const errData = await updateRes.json();
          console.warn(`[${functionName}] Failed to update existing Main page, will recreate:`, errData);
          mainPageId = null; // Reset to trigger recreation
        } else {
          const updateData = await updateRes.json();
          mainPageUrl = updateData.url;
        }
      }

      // Create new Main page if not exists or update failed
      if (!mainPageId) {
        console.log(`[${functionName}] Creating new Main page in DB: ${MAIN_DB_ID}`);

        // Prepare onboarding blocks for the page body
        const childrenBlocks = [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "📋 Client Onboarding & Clinical Context" } }]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { text: { content: "This information is synced from the client's onboarding form. Use this page to voice record notes or add session details." } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Pronouns: " }, annotations: { bold: true } },
                { text: { content: appointment.clients?.pronouns || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Date of Birth: " }, annotations: { bold: true } },
                { text: { content: appointment.clients?.born ? new Date(appointment.clients.born).toLocaleDateString() : "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Occupation: " }, annotations: { bold: true } },
                { text: { content: appointment.clients?.occupation || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Medical History: " }, annotations: { bold: true } },
                { text: { content: appointment.clients?.medical_history || "None reported" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Medications & Supplements: " }, annotations: { bold: true } },
                { text: { content: appointment.medications_supplements || appointment.clients?.medications_supplements || "None" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Sleep Quality: " }, annotations: { bold: true } },
                { text: { content: appointment.sleep_quality || appointment.clients?.sleep_quality || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Digestive Health: " }, annotations: { bold: true } },
                { text: { content: appointment.digestive_health || appointment.clients?.digestive_health || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Current Stress Level: " }, annotations: { bold: true } },
                { text: { content: String(appointment.current_stress_level || appointment.clients?.current_stress_level || "Not provided") } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Emergency Contact: " }, annotations: { bold: true } },
                { text: { content: appointment.clients?.emergency_contact_name ? `${appointment.clients.emergency_contact_name} (${appointment.clients.emergency_contact_phone || 'No phone'})` : "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Referral Source: " }, annotations: { bold: true } },
                { text: { content: appointment.clients?.referral_source || "Not provided" } }
              ]
            }
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "🎛️ Clinical Findings & Corrections" } }]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Modes & Balances: " }, annotations: { bold: true } },
                { text: { content: appointment.modes_balances || "None recorded yet" } }
              ]
            }
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { text: { content: "Acupoints: " }, annotations: { bold: true } },
                { text: { content: appointment.acupoints || "None recorded yet" } }
              ]
            }
          },
          {
            object: "block",
            type: "divider",
            divider: {}
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { text: { content: "👤 Notion Client Profile: " }, annotations: { bold: true } },
                { text: { content: clientPageUrl || "Not synced yet", link: clientPageUrl ? { url: clientPageUrl } : undefined } }
              ]
            }
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { text: { content: "🔗 Open in CRM: " }, annotations: { bold: true } },
                { text: { content: `${origin}/appointments/${appointment.id}`, link: { url: `${origin}/appointments/${appointment.id}` } } }
              ]
            }
          }
        ];

        const createRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify({
            parent: { database_id: MAIN_DB_ID },
            properties: mainProps,
            children: childrenBlocks
          })
        })

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(`Failed to create Main page: ${JSON.stringify(errData)}`);
        }

        const createData = await createRes.json();
        mainPageId = createData.id;
        mainPageUrl = createData.url;
      }

      // Prepare properties for Yearly Planner DB
      const plannerProps = {
        "Title": { title: [{ text: { content: appointmentName } }] },
        "Date": { date: { start: appointment.date } },
        "Project": { select: { name: "Kinesiology" } }
      }

      let plannerPageId = appointment.notion_planner_id;

      // Try updating existing Planner page if ID exists
      if (plannerPageId) {
        console.log(`[${functionName}] Updating existing Planner page: ${plannerPageId}`);
        const updateRes = await fetch(`https://api.notion.com/v1/pages/${plannerPageId}`, {
          method: 'PATCH',
          headers: notionHeaders,
          body: JSON.stringify({ properties: plannerProps })
        })

        if (!updateRes.ok) {
          const errData = await updateRes.json();
          console.warn(`[${functionName}] Failed to update existing Planner page, will recreate:`, errData);
          plannerPageId = null; // Reset to trigger recreation
        }
      }

      // Create new Planner page if not exists or update failed
      if (!plannerPageId) {
        console.log(`[${functionName}] Creating new Planner page in DB: ${PLANNER_DB_ID}`);
        const createRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify({
            parent: { database_id: PLANNER_DB_ID },
            properties: plannerProps
          })
        })

        if (!createRes.ok) {
          const errData = await createRes.json();
          console.warn(`[${functionName}] Failed to create Planner page:`, errData);
        } else {
          const createData = await createRes.json();
          plannerPageId = createData.id;
        }
      }

      // Update appointment in Supabase with Notion IDs and Link
      console.log(`[${functionName}] Updating appointment in Supabase with Notion details`);
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          notion_page_id: mainPageId,
          notion_planner_id: plannerPageId,
          notion_link: mainPageUrl
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error(`[${functionName}] Failed to update appointment in Supabase:`, updateError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        id: mainPageId, 
        plannerId: plannerPageId,
        url: mainPageUrl 
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
