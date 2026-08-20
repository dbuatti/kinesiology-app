// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CLIENTS_DB_ID = "074e2c006bd541d88c502feb397ef31d";

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
        if (i < retries - 1) {
          console.log(`Retry ${i + 1}/${retries} after ${res.status}`);
          await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
          continue;
        }
      }
      return res;
    } catch (err) {
      if (i < retries - 1) {
        console.log(`Retry ${i + 1}/${retries} after error: ${err.message}`);
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY");

    const notionHeaders = {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    };

    const body = await req.json().catch(() => ({}));
    const step = body.step || 'all';
    const results: Record<string, any> = {};

    // ─── STEP 1: Add missing properties to existing Clients DB ───
    if (step === 'all' || step === 'clients') {
      console.log("[configure-fnh-schema] Updating Clients DB properties...");

      const clientsUpdate = {
        properties: {
          // Convert existing Referral Source from rich_text to select
          "Referral Source": {
            "select": {
              "options": [
                { "name": "Word of Mouth", "color": "green" },
                { "name": "Social Media", "color": "blue" },
                { "name": "Website", "color": "purple" },
                { "name": "Practitioner Referral", "color": "orange" },
                { "name": "Other", "color": "gray" }
              ]
            }
          },
          // New properties
          "Status": {
            "select": {
              "options": [
                { "name": "Active", "color": "green" },
                { "name": "Inactive", "color": "gray" },
                { "name": "On Hold", "color": "yellow" },
                { "name": "Completed Programme", "color": "blue" }
              ]
            }
          },
          "First Session Date": { "date": {} },
          "Most Recent Session": { "date": {} },
          "Total Sessions": { "number": { "format": "number" } },
          "Programme": {
            "select": {
              "options": [
                { "name": "Foundations", "color": "green" },
                { "name": "Mastery", "color": "blue" },
                { "name": "Intensive", "color": "red" },
                { "name": "Single Session", "color": "gray" }
              ]
            }
          },
          "Primary Presentation": {
            "multi_select": {
              "options": [
                { "name": "Chronic Pain", "color": "red" },
                { "name": "Neurological", "color": "blue" },
                { "name": "Emotional/Trauma", "color": "purple" },
                { "name": "Performance", "color": "green" },
                { "name": "Post-Injury", "color": "orange" },
                { "name": "Fatigue", "color": "yellow" },
                { "name": "Other", "color": "gray" }
              ]
            }
          },
          "Priority Pathways": { "rich_text": {} },
          "Corrections Holding?": {
            "select": {
              "options": [
                { "name": "Yes — holding well", "color": "green" },
                { "name": "Partially", "color": "yellow" },
                { "name": "No — regressing", "color": "red" }
              ]
            }
          },
          "Homework Assigned": { "rich_text": {} },
          "Next Session Focus": { "rich_text": {} },
          "Intake Form Completed?": { "checkbox": {} },
          "Consent Signed?": { "checkbox": {} },
          "Notes": { "rich_text": {} },
          // Intake form goals
          "Goal — Working": { "rich_text": {} },
          "Goal — 12 Sessions": { "rich_text": {} },
          "Goal — Safe Feeling": { "rich_text": {} }
        }
      };

      const clientsRes = await fetchWithRetry(
        `https://api.notion.com/v1/databases/${CLIENTS_DB_ID}`,
        { method: 'PATCH', headers: notionHeaders, body: JSON.stringify(clientsUpdate) }
      );

      if (!clientsRes.ok) {
        const err = await clientsRes.json();
        throw new Error(`Failed to update Clients DB: ${err.message || JSON.stringify(err)}`);
      }

      const clientsData = await clientsRes.json();
      results.clients = { success: true, id: clientsData.id, url: clientsData.url };
      console.log("[configure-fnh-schema] Clients DB updated successfully.");
    }

    // ─── STEP 2: Create Session Notes database ───
    let sessionNotesDbId: string | null = null;

    if (step === 'all' || step === 'session-notes') {
      console.log("[configure-fnh-schema] Creating Session Notes database...");

      // Find a workspace page to host the new database
      const searchRes = await fetchWithRetry(
        `https://api.notion.com/v1/search`,
        {
          method: 'POST',
          headers: notionHeaders,
          body: JSON.stringify({ filter: { value: "page", property: "object" }, page_size: 5 })
        }
      );
      if (!searchRes.ok) {
        const errText = await searchRes.text();
        throw new Error(`Failed to search for workspace pages: ${searchRes.status} ${errText}`);
      }
      const searchData = await searchRes.json();
      console.log(`[configure-fnh-schema] Search results: ${searchData.results?.length || 0} pages found`);
      const parentPageId = searchData.results?.[0]?.id;
      if (!parentPageId) throw new Error("No workspace pages found. Create a page in Notion first.");

      console.log(`[configure-fnh-schema] Using parent page: ${parentPageId}`);

      const sessionNotesCreate = {
        parent: { "type": "page_id", "page_id": parentPageId },
        icon: { "type": "emoji", "emoji": "📝" },
        title: [{ "type": "text", "text": { "content": "Session Notes" } }],
        properties: {
          "Name": { "title": {} },
          "Client": {
            "relation": {
              "database_id": CLIENTS_DB_ID,
              "type": "single_property",
              "single_property": {}
            }
          },
          "Session Date": { "date": {} },
          "Session Number": { "number": { "format": "number" } },
          "Key Findings": { "rich_text": {} },
          "Corrections Made": { "rich_text": {} },
          "What Held From Last Session": { "rich_text": {} },
          "Homework Given": { "rich_text": {} },
          "Next Priority": { "rich_text": {} },
          "Practitioner Notes": { "rich_text": {} }
        }
      };

      const sessionNotesRes = await fetchWithRetry(
        `https://api.notion.com/v1/databases`,
        { method: 'POST', headers: notionHeaders, body: JSON.stringify(sessionNotesCreate) }
      );

      if (!sessionNotesRes.ok) {
        const err = await sessionNotesRes.json();
        throw new Error(`Failed to create Session Notes DB: ${err.message || JSON.stringify(err)}`);
      }

      const sessionNotesData = await sessionNotesRes.json();
      sessionNotesDbId = sessionNotesData.id;
      results.sessionNotes = { success: true, id: sessionNotesDbId, url: sessionNotesData.url };
      console.log(`[configure-fnh-schema] Session Notes DB created: ${sessionNotesDbId}`);
    }

    // ─── STEP 3: Add Session Notes relation to Clients DB ───
    if ((step === 'all' || step === 'relation') && sessionNotesDbId) {
      console.log("[configure-fnh-schema] Adding Session Notes relation to Clients DB...");

      const relationUpdate = {
        properties: {
          "Session Notes": {
            "relation": {
              "database_id": sessionNotesDbId,
              "type": "single_property",
              "single_property": {}
            }
          }
        }
      };

      const relationRes = await fetchWithRetry(
        `https://api.notion.com/v1/databases/${CLIENTS_DB_ID}`,
        { method: 'PATCH', headers: notionHeaders, body: JSON.stringify(relationUpdate) }
      );

      if (!relationRes.ok) {
        const err = await relationRes.json();
        throw new Error(`Failed to add relation: ${err.message || JSON.stringify(err)}`);
      }

      results.relation = { success: true };
      console.log("[configure-fnh-schema] Relation added successfully.");
    }

    // ─── STEP 4: Create default views on Clients DB ───
    if (step === 'all' || step === 'views') {
      console.log("[configure-fnh-schema] Creating default views...");

      // Board view grouped by Status
      const boardView = {
        parent: { "database_id": CLIENTS_DB_ID },
        type: "board",
        board: {
          "group_by": "Status",
          "trello_like": true
        },
        name: "By Status"
      };

      const boardRes = await fetchWithRetry(
        `https://api.notion.com/v1/views`,
        { method: 'POST', headers: notionHeaders, body: JSON.stringify(boardView) }
      );

      if (boardRes.ok) {
        results.boardView = { success: true };
        console.log("[configure-fnh-schema] Board view created.");
      } else {
        const err = await boardRes.json();
        console.log(`[configure-fnh-schema] Board view failed: ${err.message}`);
        results.boardView = { success: false, error: err.message };
      }

      // Table view sorted by Most Recent Session (newest first)
      const tableView = {
        parent: { "database_id": CLIENTS_DB_ID },
        type: "table",
        table: {
          "sort": [
            {
              "timestamp": "last_edited_time",
              "direction": "descending"
            }
          ]
        },
        name: "All Clients"
      };

      const tableRes = await fetchWithRetry(
        `https://api.notion.com/v1/views`,
        { method: 'POST', headers: notionHeaders, body: JSON.stringify(tableView) }
      );

      if (tableRes.ok) {
        results.tableView = { success: true };
        console.log("[configure-fnh-schema] Table view created.");
      } else {
        const err = await tableRes.json();
        console.log(`[configure-fnh-schema] Table view failed: ${err.message}`);
        results.tableView = { success: false, error: err.message };
      }

      // Gallery view showing Client Name, Status, Programme
      const galleryView = {
        parent: { "database_id": CLIENTS_DB_ID },
        type: "gallery",
        gallery: {
          "card_cover": { "type": "none" }
        },
        name: "Gallery"
      };

      const galleryRes = await fetchWithRetry(
        `https://api.notion.com/v1/views`,
        { method: 'POST', headers: notionHeaders, body: JSON.stringify(galleryView) }
      );

      if (galleryRes.ok) {
        results.galleryView = { success: true };
        console.log("[configure-fnh-schema] Gallery view created.");
      } else {
        const err = await galleryRes.json();
        console.log(`[configure-fnh-schema] Gallery view failed: ${err.message}`);
        results.galleryView = { success: false, error: err.message };
      }
    }

    // ─── STEP 5: Batch backfill — set defaults for existing clients ───
    if (step === 'all' || step === 'backfill') {
      console.log("[configure-fnh-schema] Backfilling client statuses...");

      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch all clients without a status
      const { data: clients, error: fetchErr } = await supabase
        .from('clients')
        .select('id, name')
        .or('status.is.null,status.eq.');

      if (fetchErr) throw new Error(`Failed to fetch clients: ${fetchErr.message}`);

      let updated = 0;
      for (const client of (clients || [])) {
        // Check if client has any completed/scheduled appointments
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .in('status', ['Completed', 'Scheduled']);

        const status = (count || 0) > 0 ? 'Active' : 'Inactive';
        const { error: updateErr } = await supabase
          .from('clients')
          .update({ status })
          .eq('id', client.id);

        if (!updateErr) updated++;
      }

      results.backfill = { success: true, updated, total: (clients || []).length };
      console.log(`[configure-fnh-schema] Backfilled ${updated}/${clients?.length || 0} clients.`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("[configure-fnh-schema] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
