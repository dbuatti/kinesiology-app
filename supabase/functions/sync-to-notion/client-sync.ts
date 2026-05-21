// @ts-nocheck
import { 
  CLIENTS_DB_ID, 
  fetchDatabaseSchema, 
  findSchemaProperty, 
  mapValueToNotionProperty, 
  findExistingNotionClient 
} from "./notion-api.ts";

export const syncClientToNotion = async (client: any, supabase: any, notionHeaders: any, origin: string) => {
  console.log(`[client-sync] Syncing client to Client Database: ${client.name} (${client.id})`);
  const schema = await fetchDatabaseSchema(CLIENTS_DB_ID, notionHeaders);
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
    const updateRes = await fetch(`https://api.notion.com/v1/pages/${clientPageId}`, {
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

    const createRes = await fetch('https://api.notion.com/v1/pages', {
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

  // Update client in Supabase with Notion details
  console.log(`[client-sync] Updating client in Supabase with Notion details`);
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      notion_page_id: clientPageId,
      notion_link: clientPageUrl
    })
    .eq('id', client.id);

  if (updateError) {
    console.error(`[client-sync] Failed to update client in Supabase:`, updateError);
  }

  return { id: clientPageId, url: clientPageUrl };
};