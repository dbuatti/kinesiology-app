// @ts-nocheck
import { 
  CLIENTS_DB_ID, 
  fetchDatabaseSchema, 
  findSchemaProperty, 
  normalizeId,
  fetchWithRetry
} from "./notion-api.ts";
import { syncClientToNotion } from "./client-sync.ts";

const MAIN_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";

export const syncSingleAppointment = async (appId: string, supabase: any, notionHeaders: any, origin: string) => {
  // Fetch full appointment details including client
  const { data: appointment, error: appError } = await supabase
    .from('appointments')
    .select(`
      *,
      clients (
        *
      )
    `)
    .eq('id', appId)
    .single();

  if (appError || !appointment) {
    throw new Error(`Failed to fetch appointment: ${appError?.message || "Not found"}`);
  }

  const clientName = appointment.clients?.name || "Unknown Client";
  const appointmentName = appointment.name || `Session with ${clientName}`;

  console.log(`[appointment-sync] Syncing appointment: ${appointmentName} (${appId})`);

  // Sync client first to ensure we have their Notion link
  let clientPageId = appointment.clients?.notion_page_id;
  let clientPageUrl = appointment.clients?.notion_link;
  if (appointment.clients) {
    try {
      const clientResult = await syncClientToNotion(appointment.clients, supabase, notionHeaders, origin);
      clientPageId = clientResult.id;
      clientPageUrl = clientResult.url;
    } catch (clientSyncErr) {
      console.error(`[appointment-sync] Failed to sync client as part of appointment sync:`, clientSyncErr);
    }
  }

  // Fetch database schema to map properties dynamically
  const mainSchema = await fetchDatabaseSchema(MAIN_DB_ID, notionHeaders);

  // Prepare properties for Main Appointments DB
  const mainProps = {
    "Name": { title: [{ text: { content: appointmentName } }] },
    "Date": { date: { start: appointment.date } },
    "Goal": { rich_text: [{ text: { content: appointment.goal || "" } }] },
    "Issue": { multi_select: [{ name: appointment.tag || "Kinesiology" }] },
    "Notes": { rich_text: [{ text: { content: `${appointment.issue ? `ISSUE: ${appointment.issue}\n\n` : ''}${appointment.notes || ""}` } }] }
  };

  // Dynamically find the relation property pointing to the Clients DB
  const clientRelationProp = Object.keys(mainSchema).find(k => {
    const prop = mainSchema[k];
    return prop.type === 'relation' && prop.relation?.database_id && normalizeId(prop.relation.database_id) === normalizeId(CLIENTS_DB_ID);
  });

  if (clientRelationProp && clientPageId) {
    console.log(`[appointment-sync] Linking appointment to client page: ${clientPageId} via property: ${clientRelationProp}`);
    mainProps[clientRelationProp] = { relation: [{ id: clientPageId }] };
  }

  let mainPageId = appointment.notion_page_id;
  let mainPageUrl = appointment.notion_link;

  // Try updating existing Main page if ID exists
  if (mainPageId) {
    console.log(`[appointment-sync] Updating existing Main page: ${mainPageId}`);
    const updateRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${mainPageId}`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify({ properties: mainProps })
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      console.warn(`[appointment-sync] Failed to update existing Main page, will recreate:`, errData);
      mainPageId = null; // Reset to trigger recreation
    } else {
      const updateData = await updateRes.json();
      mainPageUrl = updateData.url;
    }
  }

  // Create new Main page if not exists or update failed
  if (!mainPageId) {
    console.log(`[appointment-sync] Creating new Main page in DB: ${MAIN_DB_ID}`);

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

    const createRes = await fetchWithRetry('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: MAIN_DB_ID },
        properties: mainProps,
        children: childrenBlocks
      })
    });

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
  };

  let plannerPageId = appointment.notion_planner_id;

  // Try updating existing Planner page if ID exists
  if (plannerPageId) {
    console.log(`[appointment-sync] Updating existing Planner page: ${plannerPageId}`);
    const updateRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${plannerPageId}`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify({ properties: plannerProps })
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      console.warn(`[appointment-sync] Failed to update existing Planner page, will recreate:`, errData);
      plannerPageId = null; // Reset to trigger recreation
    }
  }

  // Create new Planner page if not exists or update failed
  if (!plannerPageId) {
    console.log(`[appointment-sync] Creating new Planner page in DB: ${PLANNER_DB_ID}`);
    const createRes = await fetchWithRetry('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: PLANNER_DB_ID },
        properties: plannerProps
      })
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      console.warn(`[appointment-sync] Failed to create Planner page:`, errData);
    } else {
      const createData = await createRes.json();
      plannerPageId = createData.id;
    }
  }

  // Update appointment in Supabase with Notion IDs and Link
  console.log(`[appointment-sync] Updating appointment in Supabase with Notion details`);
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      notion_page_id: mainPageId,
      notion_planner_id: plannerPageId,
      notion_link: mainPageUrl
    })
    .eq('id', appId);

  if (updateError) {
    console.error(`[appointment-sync] Failed to update appointment in Supabase:`, updateError);
  }

  return { id: mainPageId, url: mainPageUrl };
};