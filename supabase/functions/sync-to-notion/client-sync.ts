// @ts-nocheck
import { 
  CLIENTS_DB_ID, 
  fetchDatabaseSchema, 
  findSchemaProperty, 
  mapValueToNotionProperty, 
  findExistingNotionClient,
  fetchWithRetry
} from "./notion-api.ts";

export const syncClientToNotion = async (client: any, supabase: any, notionHeaders: any, origin: string) => {
  console.log(`[client-sync] Syncing client to Client Database: ${client.name} (${client.id})`);
  const schema = await fetchDatabaseSchema(CLIENTS_DB_ID, notionHeaders);
  const emergencyContact = [client.emergency_contact_name, client.emergency_contact_phone].filter(Boolean).join(' - ');

  // Auto-calculate session stats from appointments
  let firstSessionDate = client.first_session_date;
  let mostRecentSession = client.most_recent_session;
  let totalSessions = client.total_sessions;
  let autoStatus = client.status;

  try {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('date, status')
      .eq('client_id', client.id)
      .in('status', ['Completed', 'Scheduled', 'AP'])
      .order('date', { ascending: true });

    if (appointments && appointments.length > 0) {
      firstSessionDate = appointments[0].date;
      mostRecentSession = appointments[appointments.length - 1].date;
      totalSessions = appointments.length;

      // Auto-set status based on recency
      if (!autoStatus || autoStatus === 'Active' || autoStatus === 'Inactive') {
        const lastDate = new Date(appointments[appointments.length - 1].date);
        const daysSinceLastSession = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        autoStatus = daysSinceLastSession > 90 ? 'Inactive' : 'Active';
      }
    }
  } catch (e) {
    console.warn(`[client-sync] Could not calculate session stats for ${client.name}:`, e.message);
  }

  const fieldMappings = [
    // Existing fields
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
    { value: `${origin}/clients/${client.id}`, possibleNames: ['CRM Link', 'Link', 'URL', 'Client Link'] },
    // New clinical tracking fields
    { value: client.status, possibleNames: ['Status'] },
    { value: client.programme, possibleNames: ['Programme', 'Program'] },
    { value: client.primary_presentation, possibleNames: ['Primary Presentation', 'Presentation'] },
    { value: client.priority_pathways, possibleNames: ['Priority Pathways', 'Pathways'] },
    { value: client.corrections_holding, possibleNames: ['Corrections Holding?', 'Corrections Holding', 'Corrections'] },
    // Session tracking (auto-calculated)
    { value: firstSessionDate, possibleNames: ['First Session Date', 'First Session'] },
    { value: mostRecentSession, possibleNames: ['Most Recent Session', 'Last Session', 'Recent Session'] },
    { value: totalSessions, possibleNames: ['Total Sessions', 'Session Count'] },
    // Auto-calculated status (only set if we derived it)
    { value: autoStatus, possibleNames: ['Status'] },
    // Session notes
    { value: client.homework_assigned, possibleNames: ['Homework Assigned', 'Homework'] },
    { value: client.next_session_focus, possibleNames: ['Next Session Focus', 'Next Focus'] },
    // Admin
    { value: client.intake_submitted_at ? true : false, possibleNames: ['Intake Form Completed?', 'Intake Completed', 'Intake Form'] },
    { value: client.consent_signed, possibleNames: ['Consent Signed?', 'Consent Signed', 'Consent'] },
    { value: client.additional_notes || client.medical_history, possibleNames: ['Notes', 'General Notes'] },
    // Intake form goals
    { value: client.goal_working, possibleNames: ['Goal — Working', 'Goal Working', 'What "working" looks like'] },
    { value: client.goal_12_sessions, possibleNames: ['Goal — 12 Sessions', 'Goal 12 Sessions', '12 Session Goal'] },
    { value: client.goal_safe_feeling, possibleNames: ['Goal — Safe Feeling', 'Goal Safe Feeling', 'What helps me feel safe'] }
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

  // If we don't have a page ID in Supabase, check if a page already exists in Notion with this name/email
  if (!clientPageId) {
    const existingMatch = await findExistingNotionClient(client, schema, notionHeaders);
    if (existingMatch) {
      clientPageId = existingMatch.id;
      clientPageUrl = existingMatch.url;
    }
  }

  if (clientPageId) {
    console.log(`[client-sync] Updating existing Client page: ${clientPageId}`);
    const updateRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${clientPageId}`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify({ properties: clientProps })
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      console.warn(`[client-sync] Failed to update existing Client page, will recreate:`, errData);
      clientPageId = null;
    } else {
      const updateData = await updateRes.json();
      clientPageUrl = updateData.url;
    }
  }

  if (!clientPageId) {
    console.log(`[client-sync] Creating new Client page in DB: ${CLIENTS_DB_ID}`);
    
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

    const createRes = await fetchWithRetry('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: CLIENTS_DB_ID },
        properties: clientProps,
        children: childrenBlocks
      })
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      throw new Error(`Failed to create Client page: ${JSON.stringify(errData)}`);
    }

    const createData = await createRes.json();
    clientPageId = createData.id;
    clientPageUrl = createData.url;
  }

  // Update client in Supabase with Notion details + calculated session stats
  console.log(`[client-sync] Updating client in Supabase with Notion details + session stats`);
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      notion_page_id: clientPageId,
      notion_link: clientPageUrl,
      first_session_date: firstSessionDate || null,
      most_recent_session: mostRecentSession || null,
      total_sessions: totalSessions || null,
      status: autoStatus || null,
    })
    .eq('id', client.id);

  if (updateError) {
    console.error(`[client-sync] Failed to update client in Supabase:`, updateError);
  }

  return { id: clientPageId, url: clientPageUrl };
};