// @ts-nocheck
export const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";

// Voice Studio databases — used by the voice studio integration client
export const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";
export const VOICE_LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";
// Reuses the existing planner database for voice lesson records
export const VOICE_LESSONS_DB_2_ID = "11caad21cd0980d8a3eeeffb27fc43c0";

export const normalizeId = (id: string) => id ? id.replace(/-/g, "").toLowerCase() : "";

/**
 * Robust fetch helper with exponential backoff retry logic for handling Notion API rate limits (429)
 */
export const fetchWithRetry = async (url: string, options: any, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      
      // If rate limited (429) or server error (502, 503, 504), retry with backoff
      if ((res.status === 429 || res.status >= 502) && i < retries - 1) {
        console.warn(`[notion-api] Rate limited or server error (${res.status}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      return res;
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`[notion-api] Network error: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries reached");
};

export const fetchDatabaseSchema = async (dbId: string, notionHeaders: any) => {
  try {
    const dbRes = await fetchWithRetry(`https://api.notion.com/v1/databases/${dbId}`, {
      method: 'GET',
      headers: notionHeaders
    });
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      return dbData.properties || {};
    } else {
      const errData = await dbRes.json();
      console.warn(`[notion-api] Failed to fetch DB schema for ${dbId}:`, errData);
    }
  } catch (schemaErr) {
    console.warn(`[notion-api] Error fetching DB schema for ${dbId}:`, schemaErr);
  }
  return {};
};

export const findSchemaProperty = (schema: any, possibleNames: string[]) => {
  const keys = Object.keys(schema);
  for (const name of possibleNames) {
    const match = keys.find(k => k.toLowerCase().trim() === name.toLowerCase().trim());
    if (match) return { name: match, schema: schema[match] };
  }
  return null;
};

export const mapValueToNotionProperty = (value: any, propertySchema: any) => {
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
    case 'checkbox':
      return { checkbox: Boolean(value) };
    default:
      return null;
  }
};

export const extractNotionPropertyValue = (property: any) => {
  if (!property) return null;
  const type = property.type;
  switch (type) {
    case 'title':
      return property.title?.map((t: any) => t.plain_text).join('') || null;
    case 'rich_text':
      return property.rich_text?.map((t: any) => t.plain_text).join('') || null;
    case 'email':
      return property.email || null;
    case 'phone_number':
      return property.phone_number || null;
    case 'date':
      return property.date?.start || null;
    case 'number':
      return property.number !== undefined ? property.number : null;
    case 'select':
      return property.select?.name || null;
    case 'multi_select':
      return property.multi_select?.map((m: any) => m.name) || [];
    case 'url':
      return property.url || null;
    default:
      return null;
  }
};

export const findExistingNotionClient = async (client: any, schema: any, notionHeaders: any) => {
  const titleProp = findSchemaProperty(schema, ['Name', 'Client Name', 'Full Name']);
  const emailProp = findSchemaProperty(schema, ['Email', 'Email Address']);
  
  const filters = [];
  if (titleProp && client.name) {
    filters.push({
      property: titleProp.name,
      title: { equals: client.name }
    });
  }
  if (emailProp && client.email) {
    filters.push({
      property: emailProp.name,
      email: { equals: client.email }
    });
  }

  if (filters.length === 0) return null;

  try {
    console.log(`[notion-api] Querying Notion for existing client matching name/email...`);
    const queryRes = await fetchWithRetry(`https://api.notion.com/v1/databases/${CLIENTS_DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({
        filter: filters.length === 1 ? filters[0] : { or: filters },
        page_size: 1
      })
    });

    if (queryRes.ok) {
      const queryData = await queryRes.json();
      if (queryData.results && queryData.results.length > 0) {
        const match = queryData.results[0];
        console.log(`[notion-api] Found existing Notion page match: ${match.id}`);
        return {
          id: match.id,
          url: match.url
        };
      }
    } else {
      const errData = await queryRes.json();
      console.warn(`[notion-api] Notion query failed:`, errData);
    }
  } catch (err) {
    console.warn(`[notion-api] Error querying existing client:`, err);
  }
  return null;
};