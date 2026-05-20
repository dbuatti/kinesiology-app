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

serve(async (req) => {
  const functionName = "sync-to-notion";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    console.log(`[${functionName}] Body:`, JSON.stringify(body));

    const appointmentId = body.appointmentId || body.appointment?.id || body.record?.id;
    if (!appointmentId) {
      throw new Error("Missing appointmentId or appointment in request body.");
    }

    const NOTION_KEY = Deno.env.get('NOTION_API_KEY')
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.")

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    const origin = body.origin || "https://kinesiology-app.vercel.app";

    console.log(`[${functionName}] Syncing appointment: ${appointmentName} (${appointmentId})`);

    // Prepare properties for Main Appointments DB
    const mainProps = {
      "Name": { title: [{ text: { content: appointmentName } }] },
      "Date": { date: { start: appointment.date } },
      "Goal": { rich_text: [{ text: { content: appointment.goal || "" } }] },
      "Issue": { multi_select: [{ name: appointment.tag || "Kinesiology" }] },
      "Notes": { rich_text: [{ text: { content: `${appointment.issue ? `ISSUE: ${appointment.issue}\n\n` : ''}${appointment.notes || ""}` } }] },
      "🎛️ Modes & Balances": { rich_text: [{ text: { content: appointment.modes_balances || "" } }] },
      "🔺 Acupoints": { rich_text: [{ text: { content: appointment.acupoints || "" } }] }
    }

    let mainPageId = appointment.notion_page_id;
    let mainPageUrl = appointment.notion_link;
    let isNewMainPage = false;

    const notionHeaders = {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    }

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
      isNewMainPage = true;

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
              { text: { content: "Pronouns: ", bold: true } },
              { text: { content: appointment.clients?.pronouns || "Not provided" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Date of Birth: ", bold: true } },
              { text: { content: appointment.clients?.born ? new Date(appointment.clients.born).toLocaleDateString() : "Not provided" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Occupation: ", bold: true } },
              { text: { content: appointment.clients?.occupation || "Not provided" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Medical History: ", bold: true } },
              { text: { content: appointment.clients?.medical_history || "None reported" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Medications & Supplements: ", bold: true } },
              { text: { content: appointment.medications_supplements || appointment.clients?.medications_supplements || "None" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Sleep Quality: ", bold: true } },
              { text: { content: appointment.sleep_quality || appointment.clients?.sleep_quality || "Not provided" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Digestive Health: ", bold: true } },
              { text: { content: appointment.digestive_health || appointment.clients?.digestive_health || "Not provided" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Current Stress Level: ", bold: true } },
              { text: { content: String(appointment.current_stress_level || appointment.clients?.current_stress_level || "Not provided") } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Emergency Contact: ", bold: true } },
              { text: { content: appointment.clients?.emergency_contact_name ? `${appointment.clients.emergency_contact_name} (${appointment.clients.emergency_contact_phone || 'No phone'})` : "Not provided" } }
            ]
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              { text: { content: "Referral Source: ", bold: true } },
              { text: { content: appointment.clients?.referral_source || "Not provided" } }
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
              { text: { content: "🔗 Open in CRM: ", bold: true } },
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

  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})