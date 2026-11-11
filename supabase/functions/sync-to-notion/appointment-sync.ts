// @ts-nocheck
import { 
  CLIENTS_DB_ID, 
  fetchDatabaseSchema, 
  findSchemaProperty, 
  normalizeId,
  fetchWithRetry,
  extractNotionPropertyValue
} from "./notion-api.ts";
import { syncClientToNotion } from "./client-sync.ts";

const MAIN_DB_ID = "171f7156cdc645e8b689af13d217bc7c";
const PLANNER_DB_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
// Voice Lessons DB1 (lessons log) + Voice Clients DB (student cards).
// Unified People keeps Supabase as the single source; Notion DBs stay split so
// CLAUDE analysis + note-taking see unchanged structure.
const VOICE_LESSONS_DB_1_ID = "8d6369c637c8425fb007adf2618e576";
const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

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
  // Unified People routing: voice/piano lessons sync to the Voice Lessons DB,
  // kinesiology sessions to FNH Appointments. Notion DBs stay split for analysis.
  const discipline = String(appointment.discipline || "").toLowerCase();
  const tagLower = String(appointment.tag || "").toLowerCase();
  const isVoiceLesson = discipline === "voice" || discipline === "piano"
    || tagLower.includes("voice") || tagLower.includes("piano");
  const lessonPractice = discipline === "piano" || tagLower.includes("piano") ? "piano" : "voice";
  const targetMainDbId = isVoiceLesson ? VOICE_LESSONS_DB_1_ID : MAIN_DB_ID;
  // Preserve a user-set custom name, but if the stored name looks generic
  // (e.g. "Session — Aug 3, 2026" without a client), rebuild it client-first so
  // the Notion page is properly named and dedup-able by client+date.
  const storedName = appointment.name || "";
  const looksGeneric = !storedName || /^(Session|FNH Session|Kinesiology Session|Voice Lesson|Piano Lesson)\b/i.test(storedName) && !storedName.toLowerCase().includes(clientName.toLowerCase());
  const lessonType = lessonPractice === "piano" ? "Piano Lesson" : "Voice Lesson";
  const appointmentName = isVoiceLesson
    ? (looksGeneric ? `${lessonType} — ${clientName} — ${new Date(appointment.date).toISOString().split("T")[0]}` : storedName)
    : (looksGeneric
      ? `${clientName} — Kinesiology (${new Date(appointment.date).toISOString().split("T")[0]})`
      : (storedName || `Session with ${clientName}`));

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
  // Voice lessons link to the Voice Clients card, not the FNH Clients page.
  const voiceClientPageId = (appointment.clients as unknown as { notion_voice_client_id?: string })?.notion_voice_client_id || null;
  const linkClientPageId = isVoiceLesson ? (voiceClientPageId || clientPageId) : clientPageId;

  // Fetch database schema to map properties dynamically
  const mainSchema = await fetchDatabaseSchema(targetMainDbId, notionHeaders);

  // Prepare properties for Main Appointments DB (FNH) or Voice Lessons DB1.
  // NB (FNH): `Notes` is deliberately NOT here — it is the clinical write-up
  // field in Notion, so it is written only on create / while empty (see clinicalProps).
  const mainProps: Record<string, any> = isVoiceLesson
    ? {
      "Name": { title: [{ text: { content: appointmentName } }] },
      "Date": { date: { start: appointment.date } },
    }
    : {
      "Name": { title: [{ text: { content: appointmentName } }] },
      "Date": { date: { start: appointment.date } },
      "Goal": { rich_text: [{ text: { content: appointment.goal || "" } }] },
      "Issue": { multi_select: [{ name: appointment.tag || "Kinesiology" }] }
    };

  if (isVoiceLesson) {
    // Voice Lessons DB1 shape (mirrors voice-schedule-lesson): time in
    // Breakthroughs, cost in Cost, paid state in Payment, instrument in Discipline.
    const timeStr = (() => { try { return new Date(appointment.date).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" }); } catch { return ""; } })();
    if (timeStr) mainProps["Breakthroughs"] = { rich_text: [{ text: { content: timeStr } }] };
    const price = Number(appointment.price_amount) || Number(appointment.clients?.standard_rate) || 0;
    if (price > 0) mainProps["Cost"] = { number: price };
    const paid = Boolean(appointment.payment_received);
    mainProps["Payment"] = { select: { name: paid ? "Paid" : "Unpaid" } };
    mainProps["Discipline"] = { select: { name: lessonPractice === "piano" ? "Piano" : "Voice" } };
  }

  // ─── Status (practice codes AP / CH / OPCH) ───
  // The Appointments DB's Status select is the one-glance answer to "has this
  // session happened, and was it paid for?":
  //   AP   — booked, nothing has happened yet
  //   CH   — session completed
  //   OPCH — session completed and paid
  // Nothing here reads or writes clinical fields; the clinical props below keep
  // their Notion-wins guard.
  //
  // Codes are resolved against the option names actually present in the
  // database (they may be "AP", "AP — Appointment", …), and the status only
  // ever moves forwards, so a hand-set Notion status is never rolled back.
  const STATUS_RANK: Record<string, number> = { AP: 0, CH: 1, OPCH: 2 };
  // Voice Lessons DB1 tracks paid state via Payment (set above), not AP/CH/OPCH.
  const statusProp = isVoiceLesson ? null : findSchemaProperty(mainSchema, ['Status', 'Session Status', 'Appointment Status']);
  // The Appointments DB uses a Notion `status` property (options Cancelled /
  // AP / OPEN / OPCH / CH). A `status` property is written with `status:` and a
  // `select` with `select:` — using the wrong key is a 400, so both the option
  // lookup and the patch shape switch on the real type.
  const statusPropType: 'select' | 'status' | null =
    statusProp?.schema?.type === 'select' ? 'select'
    : statusProp?.schema?.type === 'status' ? 'status'
    : null;
  const statusOptions: Array<{ name: string }> =
    statusPropType === 'select' ? (statusProp.schema.select?.options || [])
    : statusPropType === 'status' ? (statusProp.schema.status?.options || [])
    : [];

  const statusValue = (name: string) =>
    statusPropType === 'status' ? { status: { name } } : { select: { name } };

  const isCancelled = String(appointment.status || '').toLowerCase() === 'cancelled';

  const wantedStatusCode = (appointment.payment_received ? 'OPCH'
    : String(appointment.status || '').toLowerCase() === 'completed' ? 'CH'
    : isCancelled ? null
    : 'AP');

  const optionForCode = (code: string | null) => {
    if (!code) return null;
    const upper = (s: string) => (s || '').trim().toUpperCase();
    return statusOptions.find(o => upper(o.name) === code)
      || statusOptions.find(o => upper(o.name).startsWith(`${code} `))
      || statusOptions.find(o => upper(o.name).startsWith(`${code}-`))
      || statusOptions.find(o => upper(o.name).startsWith(code))
      || null;
  };

  const wantedStatusOption = isVoiceLesson ? null : optionForCode(wantedStatusCode);
  const cancelledStatusOption = isVoiceLesson ? null : optionForCode('CANCELLED');

  // A cancelled appointment has no forward status to advance to, so on CREATE
  // it must not fall through to the database default (AP) — that reads as
  // "still booked", which is exactly the confusing state this sync exists to
  // remove.
  const createStatusOption = wantedStatusOption || cancelledStatusOption;

  /** Status patch for an update — only when it advances the current value. */
  const statusPatchFor = (existingStatusName: string | null | undefined): Record<string, any> => {
    if (!statusProp) return {};
    const current = (existingStatusName || '').trim().toUpperCase();
    const currentCode = Object.keys(STATUS_RANK).find(c => current === c || current.startsWith(`${c} `) || current.startsWith(c));

    // Cancellation is not part of the AP → CH → OPCH ladder: a session that
    // never happened should read Cancelled even if it was sitting on AP. It is
    // only written over AP/OPEN/empty — a completed or paid session keeps its
    // CH/OPCH, because the session did happen.
    if (isCancelled) {
      if (!cancelledStatusOption) return {};
      if (current === cancelledStatusOption.name.trim().toUpperCase()) return {};
      if (currentCode === 'CH' || currentCode === 'OPCH') return {};
      return { [statusProp.name]: statusValue(cancelledStatusOption.name) };
    }

    if (!wantedStatusOption) return {};
    const currentRank = currentCode ? STATUS_RANK[currentCode] : -1;
    const wantedRank = wantedStatusCode ? (STATUS_RANK[wantedStatusCode] ?? 0) : -1;
    if (current === wantedStatusOption.name.trim().toUpperCase()) return {};
    if (currentRank >= wantedRank) return {};
    return { [statusProp.name]: statusValue(wantedStatusOption.name) };
  };

  // ─── Clinical fields (consolidated from the retired Session Notes DB) ───
  // Built separately so they can be filtered against existing Notion content:
  // the CRM fills them on first sync (CREATE); after that Notion wins, because
  // that's where the post-session write-up happens. This prevents pre-session
  // CRM data (e.g. `issue` = presenting complaint) from overwriting hand-written
  // session findings already in Notion.
  const clinicalProps: Record<string, any> = {};
  // Voice lessons carry no clinical payload — FNH fields must never create
  // stray properties on the Lessons DB.
  const clinicalMappings: Array<[string[], string | number | null, 'rich_text' | 'number']> = isVoiceLesson ? [] : [
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
      if (!isNaN(num)) clinicalProps[prop.name] = { number: num };
    } else {
      clinicalProps[prop.name] = { rich_text: [{ text: { content: String(value) } }] };
    }
  }

  // The session write-up lives in Notion's Notes once the practitioner has
  // worked through a session. The CRM copy is the pre-session scratchpad, so it
  // seeds Notes on create and then steps aside — same "Notion wins" rule as the
  // fields above. (Previously every appointment update re-sent Notes, wiping
  // hand-written session findings whenever the CRM copy was blank.)
  // Voice lessons skip this: the Lessons DB is not a clinical write-up surface.
  if (!isVoiceLesson && (appointment.issue || appointment.notes)) {
    const notesProp = findSchemaProperty(mainSchema, ['Notes', 'Session Notes', 'Additional Notes']);
    if (notesProp && notesProp.schema?.type === 'rich_text') {
      clinicalProps[notesProp.name] = {
        rich_text: [{
          text: { content: `${appointment.issue ? `ISSUE: ${appointment.issue}\n\n` : ''}${appointment.notes || ""}` },
        }],
      };
    }
  }

  // Returns only clinical props where the Notion side is currently empty.
  const filterClinicalAgainstNotion = (existingProperties: Record<string, any>): Record<string, any> => {
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(clinicalProps)) {
      const existingValue = extractNotionPropertyValue(existingProperties[key]);
      if (existingValue === null || existingValue === undefined || existingValue === '' ||
          (Array.isArray(existingValue) && existingValue.length === 0)) {
        filtered[key] = value;
      }
    }
    return filtered;
  };

  // Dynamically find the relation property pointing to the Clients DB.
  // Voice lessons link to the Voice Clients DB ("Client CRM"); FNH sessions
  // link to the FNH Clients DB. Fall back to any relation so a renamed schema
  // never silently drops the link.
  const clientRelationProp = (() => {
    const ids = isVoiceLesson ? [VOICE_CLIENTS_DB_ID] : [CLIENTS_DB_ID];
    for (const want of ids) {
      const hit = Object.keys(mainSchema).find(k => {
        const prop = mainSchema[k];
        return prop.type === 'relation' && prop.relation?.database_id && normalizeId(prop.relation.database_id) === normalizeId(want);
      });
      if (hit) return hit;
    }
    // Voice DB1's relation is literally named "Client CRM".
    const byName = findSchemaProperty(mainSchema, ['Client CRM', 'Client', 'Student', 'Voice Students']);
    if (byName) return byName.name;
    return Object.keys(mainSchema).find(k => mainSchema[k].type === 'relation');
  })();

  if (clientRelationProp && linkClientPageId) {
    console.log(`[appointment-sync] Linking appointment to client page: ${linkClientPageId} via property: ${clientRelationProp}`);
    mainProps[clientRelationProp] = { relation: [{ id: linkClientPageId }] };
  }

  let mainPageId = appointment.notion_page_id;
  let mainPageUrl = appointment.notion_link;

  // Try updating existing Main page if ID exists
  if (mainPageId) {
    console.log(`[appointment-sync] Updating existing Main page: ${mainPageId}`);

    // Fetch existing page to check which clinical fields are already populated.
    // Notion wins after first write — only fill clinical fields that are empty.
    let patchProps = { ...mainProps };
    const pageRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${mainPageId}`, {
      method: 'GET',
      headers: notionHeaders
    });
    if (pageRes.ok) {
      const pageData = await pageRes.json();
      const filteredClinical = filterClinicalAgainstNotion(pageData.properties || {});
      const existingStatus = statusProp
        ? extractNotionPropertyValue(pageData.properties?.[statusProp.name])
        : null;
      patchProps = { ...mainProps, ...statusPatchFor(existingStatus), ...filteredClinical };
    } else {
      console.warn(`[appointment-sync] Could not fetch existing page for clinical guard; sending base props only.`);
    }

    const updateRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${mainPageId}`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify({ properties: patchProps })
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
      const dateProp = findSchemaProperty(mainSchema, ['Date', 'Session Date', 'Created'])?.name || "Date";
      dedupFilters.push({
        property: dateProp,
        date: { equals: appointment.date.split("T")[0] }
      });
    }
    if (linkClientPageId && clientRelationProp) {
      dedupFilters.push({
        property: clientRelationProp,
        relation: { contains: linkClientPageId }
      });
    }
    if (dedupFilters.length >= 2) {
      const dedupRes = await fetchWithRetry(`https://api.notion.com/v1/databases/${targetMainDbId}/query`, {
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
          const filteredClinical = filterClinicalAgainstNotion(existing.properties || {});
          const existingStatus = statusProp
            ? extractNotionPropertyValue(existing.properties?.[statusProp.name])
            : null;
          const dedupPatchProps = { ...mainProps, ...statusPatchFor(existingStatus), ...filteredClinical };
          const updRes = await fetchWithRetry(`https://api.notion.com/v1/pages/${mainPageId}`, {
            method: 'PATCH',
            headers: notionHeaders,
            body: JSON.stringify({ properties: dedupPatchProps })
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

    // Prepare onboarding blocks for the page body (FNH clinical context).
    // Voice lessons get a minimal block set below — no clinical intake dump.
    const fnhChildrenBlocks = [
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

    const voiceChildrenBlocks = [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: `🎙️ ${lessonType} Notes` } }]
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "Use this page to record lesson notes. Student onboarding answers sync from the CRM and are never overwritten here." } }
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
    const childrenBlocks = isVoiceLesson ? voiceChildrenBlocks : fnhChildrenBlocks;

    const createRes = await fetchWithRetry('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: targetMainDbId },
        properties: {
          ...mainProps,
          ...(statusProp && createStatusOption
            ? { [statusProp.name]: statusValue(createStatusOption.name) }
            : {}),
          ...clinicalProps
        },
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

  // 3. Project/Category (FNH sessions vs Coaching lessons — keeps Money/Planner split)
  const plannerProjectName = isVoiceLesson ? "Coaching" : "FNH";
  const projectProp = findSchemaProperty(plannerSchema, ['Project', 'Category', 'Type', 'Source', 'Service']);
  if (projectProp) {
    if (projectProp.schema.type === 'select') {
      plannerProps[projectProp.name] = { select: { name: plannerProjectName } };
    } else if (projectProp.schema.type === 'multi_select') {
      plannerProps[projectProp.name] = { multi_select: [{ name: plannerProjectName }] };
    } else if (projectProp.schema.type === 'rich_text') {
      plannerProps[projectProp.name] = { rich_text: [{ text: { content: plannerProjectName } }] };
    }
  } else {
    // Fallback
    plannerProps["Project"] = { select: { name: plannerProjectName } };
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
      // Some planner schemas use the practice status codes (AP / CH / OPCH)
      // on this property rather than Paid/Unpaid. Writing "Paid" into a
      // code-only select silently creates a new option, so resolve the code
      // first and only fall back to Paid/Unpaid when the property really is
      // that kind of select.
      const opts: Array<{ name: string }> = paidProp.schema.select?.options || [];
      const upper = (v: string) => (v || '').trim().toUpperCase();
      const code = wantedStatusCode || (isPaid ? 'OPCH' : 'AP');
      const byCode = opts.find(o => upper(o.name) === code || upper(o.name).startsWith(code));
      const byPaidWord = opts.find(o => ['PAID', 'RECEIVED', 'YES'].includes(upper(o.name)));
      plannerProps[paidProp.name] = { select: { name: byCode?.name ?? byPaidWord?.name ?? (isPaid ? "Paid" : "Unpaid") } };
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

  // 7. Client relation for Planner DB.
  // FNH sessions link via Client (Kin); voice/piano lessons via Voice Students
  // (same Planner/Finance DB, different relation — mirrors voice-schedule-lesson).
  if (isVoiceLesson) {
    const voiceRelProp = findSchemaProperty(plannerSchema, ['Voice Students', 'Voice Student', 'Student', 'Students']);
    if (voiceRelProp && voiceClientPageId) {
      console.log(`[appointment-sync] Linking planner page to voice student: ${voiceClientPageId} via property: ${voiceRelProp.name}`);
      plannerProps[voiceRelProp.name] = { relation: [{ id: voiceClientPageId }] };
    }
  } else {
    const clientKinProp = findSchemaProperty(plannerSchema, ['Client (Kin)', 'Client', 'Client Name', 'Client Profile', 'Linked Client']);
    if (clientKinProp && clientPageId) {
      console.log(`[appointment-sync] Linking planner page to client: ${clientPageId} via property: ${clientKinProp.name}`);
      plannerProps[clientKinProp.name] = { relation: [{ id: clientPageId }] };
    }
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