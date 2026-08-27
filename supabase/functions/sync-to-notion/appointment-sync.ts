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
  // Preserve a user-set custom name, but if the stored name looks generic
  // (e.g. "Session — Aug 3, 2026" without a client), rebuild it client-first so
  // the Notion page is properly named and dedup-able by client+date.
  const storedName = appointment.name || "";
  const looksGeneric = !storedName || /^(Session|FNH Session|Kinesiology Session)\b/i.test(storedName) && !storedName.toLowerCase().includes(clientName.toLowerCase());
  const appointmentName = looksGeneric
    ? `${clientName} — Kinesiology (${new Date(appointment.date).toISOString().split("T")[0]})`
    : (storedName || `Session with ${clientName}`);

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
  const mainProps: Record<string, any> = {
    "Name": { title: [{ text: { content: appointmentName } }] },
    "Date": { date: { start: appointment.date } },
    "Goal": { rich_text: [{ text: { content: appointment.goal || "" } }] },
    "Issue": { multi_select: [{ name: appointment.tag || "Kinesiology" }] },
    "Notes": { rich_text: [{ text: { content: `${appointment.issue ? `ISSUE: ${appointment.issue}\n\n` : ''}${appointment.notes || ""}` } }] }
  };

  // ─── Clinical fields (consolidated from the retired Session Notes DB) ───
  // Each is mapped dynamically via the schema so the exact Notion property
  // name/label doesn't need to be hardcoded. Skipped silently if the property
  // isn't present on the Notion DB yet.
  const clinicalMappings: Array<[string[], string | number | null, 'rich_text' | 'number']> = [
    [['BOLT Score (s)', 'BOLT Score', 'BOLT'], appointment.bolt_score, 'number'],
    [['Key Findings', 'Findings'], appointment.issue, 'rich_text'],
    [['Corrections Made', 'Corrections'], appointment.modes_balances, 'rich_text'],
    [['Next Priority', 'Next Focus'], appointment.next_session_note, 'rich_text'],
    [['Homework Given', 'Homework'], appointment.homework_given, 'rich_text'],
    [['What Held From Last Session', 'What Held', 'Carry Over'], appointment.what_held_from_last_session, 'rich_text'],
  ];
  for (const [possibleNames, value, kind] of clinicalMappings) {
    const prop = findSchemaProperty(mainSchema, possibleNames as string[]);
    if (!prop) continue;
    if (value === null || value === undefined || value === '') continue;
    if (kind === 'number') {
      const num = Number(value);
      if (!isNaN(num)) mainProps[prop.name] = { number: num };
    } else {
      mainProps[prop.name] = { rich_text: [{ text: { content: String(value) } }] };
    }
  }

  // Session Number is computed (count of client's appointments) rather than
  // stored, so it never drifts from reality when bookings are added/deleted.
  const sessionNumberProp = findSchemaProperty(mainSchema, ['Session Number', 'Session #']);
  if (sessionNumberProp && appointment.client_id) {
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', appointment.client_id)
      .in('status', ['Completed', 'Scheduled']);
    if (count) mainProps[sessionNumberProp.name] = { number: count };
  }

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

  // Guard against duplicates: before creating, query Notion for existing pages
  // matching this date + client relation. If found, adopt and update that page
  // instead of creating a new one.
  if (!mainPageId) {
    const dedupFilters = [];
    if (appointment.date) {
      dedupFilters.push({
        property: "Date",
        date: { equals: appointment.date.split("T")[0] }
      });
    }
    if (clientPageId) {
      const relProp = Object.keys(mainSchema).find(k => {
        const p = mainSchema[k];
        return p.type === 'relation' && p.relation?.database_id && normalizeId(p.relation.database_id) === normalizeId(CLIENTS_DB_ID);
      });
      if (relProp) {
        dedupFilters.push({
          property: relProp,
          relation: { contains: clientPageId }
        });
      }
    }
    if (dedupFilters.length >= 2) {
      const dedupRes = await fetchWithRetry(`https://api.notion.com/v1/databases/${MAIN_DB_ID}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({ filter: { and: dedupFilters }, page_size: 5 })
      });
      if (dedupRes.ok) {
        const dedupData = await dedupRes.json();
        if (dedupData.results?.length > 0) {
          const existing = dedupData.results[0];
          console.log(`[appointment-sync] Dedup match — updating existing Main page: ${existing.id}`);
          mainPageId = existing.id;
          mainPageUrl = existing.url;
          const updRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${mainPageId}`, {
            method: 'PATCH',
            headers: notionHeaders,
            body: JSON.stringify({ properties: mainProps })
          });
          if (!updRes.ok) {
            console.warn(`[appointment-sync] Dedup update failed, will try creating:`, await updRes.json());
            mainPageId = null;
          } else {
            const updData = await updRes.json();
            mainPageUrl = updData.url;
          }
        }
      }
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

  // Fetch database schema to map properties dynamically
  const plannerSchema = await fetchDatabaseSchema(PLANNER_DB_ID, notionHeaders);

  // Prepare properties for Yearly Planner / Finance DB
  const plannerProps = {};

  // 1. Title/Name
  const titleProp = findSchemaProperty(plannerSchema, ['Title', 'Name', 'Item', 'Description', 'Appointment']);
  if (titleProp) {
    plannerProps[titleProp.name] = { title: [{ text: { content: appointmentName } }] };
  } else {
    // Fallback
    plannerProps["Title"] = { title: [{ text: { content: appointmentName } }] };
  }

  // 2. Date
  const dateProp = findSchemaProperty(plannerSchema, ['Date', 'Created', 'Time', 'Session Date']);
  if (dateProp) {
    plannerProps[dateProp.name] = { date: { start: appointment.date } };
  } else {
    // Fallback
    plannerProps["Date"] = { date: { start: appointment.date } };
  }

  // 3. Project/Category
  const projectProp = findSchemaProperty(plannerSchema, ['Project', 'Category', 'Type', 'Source', 'Service']);
  if (projectProp) {
    if (projectProp.schema.type === 'select') {
      plannerProps[projectProp.name] = { select: { name: "FNH" } };
    } else if (projectProp.schema.type === 'multi_select') {
      plannerProps[projectProp.name] = { multi_select: [{ name: "FNH" }] };
    } else if (projectProp.schema.type === 'rich_text') {
      plannerProps[projectProp.name] = { rich_text: [{ text: { content: "FNH" } }] };
    }
  } else {
    // Fallback
    plannerProps["Project"] = { select: { name: "FNH" } };
  }

  // 4. Amount/Price (Finance specific)
  // ALWAYS use the client's CURRENT standing rate (standard_rate) so the
  // Planner reflects current pricing, not historical. Fall back to the
  // appointment's stored price, then $50.
  const amountProp = findSchemaProperty(plannerSchema, ['Amount', 'Price', 'Cost', 'Value', 'Income', 'Earnings', 'Fee', 'Dollars']);
  if (amountProp) {
    const clientRate = Number(appointment.clients?.standard_rate);
    const apptPrice = Number(appointment.price_amount);
    const price = clientRate > 0 ? clientRate : (apptPrice > 0 ? apptPrice : 50);
    if (amountProp.schema.type === 'number') {
      plannerProps[amountProp.name] = { number: price };
    } else if (amountProp.schema.type === 'rich_text') {
      plannerProps[amountProp.name] = { rich_text: [{ text: { content: `$${price}` } }] };
    }
  }

  // 5. Paid/Status (Finance specific)
  const paidProp = findSchemaProperty(plannerSchema, ['Paid', 'Status', 'Received', 'Is Paid', 'Payment Status']);
  if (paidProp) {
    const isPaid = Boolean(appointment.payment_received || appointment.is_paid);
    if (paidProp.schema.type === 'checkbox') {
      plannerProps[paidProp.name] = { checkbox: isPaid };
    } else if (paidProp.schema.type === 'select') {
      plannerProps[paidProp.name] = { select: { name: isPaid ? "Paid" : "Unpaid" } };
    } else if (paidProp.schema.type === 'rich_text') {
      plannerProps[paidProp.name] = { rich_text: [{ text: { content: isPaid ? "Paid" : "Unpaid" } }] };
    }
  }

  // 6. Payment Method (Finance specific)
  const methodProp = findSchemaProperty(plannerSchema, ['Payment Method', 'Method', 'Account', 'Paid Via']);
  if (methodProp) {
    const method = appointment.payment_method || "Stripe";
    if (methodProp.schema.type === 'select') {
      plannerProps[methodProp.name] = { select: { name: method } };
    } else if (methodProp.schema.type === 'rich_text') {
      plannerProps[methodProp.name] = { rich_text: [{ text: { content: method } }] };
    }
  }

  // 7. Client relation for Planner DB (links to Client CRM)
  const clientKinProp = findSchemaProperty(plannerSchema, ['Client (Kin)', 'Client', 'Client Name', 'Client Profile', 'Linked Client']);
  if (clientKinProp && clientPageId) {
    console.log(`[appointment-sync] Linking planner page to client: ${clientPageId} via property: ${clientKinProp.name}`);
    plannerProps[clientKinProp.name] = { relation: [{ id: clientPageId }] };
  }

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

  // Session Notes DB has been retired (consolidated into Main Appointments via
  // the clinical fields mapped above). The previous create-only write to that
  // DB was the source of duplicate rows; it is intentionally removed here.

  return { id: mainPageId, url: mainPageUrl };
};