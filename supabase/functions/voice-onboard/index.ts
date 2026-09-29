// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";
import { ensurePerson } from "../_shared/people.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

// Notion caps each rich_text item at 2000 characters; a transcript profile is longer.
const richText = (text: string) => {
  const parts = [];
  for (let i = 0; i < text.length && parts.length < 100; i += 2000) {
    parts.push({ text: { content: text.slice(i, i + 2000) } });
  }
  return parts;
};

// The app is the main record for students: make sure they're in People and keep
// the onboarding notes on their row. Non-fatal — Notion already has the copy.
async function saveToPeople(opts: { email: string; name: string; practice: string; notes: string; notionPageId: string }) {
  if (!opts.email) return null;
  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const clientId = await ensurePerson(admin, {
    email: opts.email,
    name: opts.name,
    practice: opts.practice,
    notionVoiceClientId: opts.notionPageId,
  });
  if (clientId && opts.notes) {
    const { data: row } = await admin.from("clients").select("notes").eq("id", clientId).single();
    const existing = (row?.notes || "").trim();
    if (!existing.includes(opts.notes)) {
      const notes = existing ? `${existing}\n\n${opts.notes}` : opts.notes;
      const { error } = await admin.from("clients").update({ notes }).eq("id", clientId);
      if (error) console.error("[voice-onboard] notes update failed:", error.message);
    }
  }
  return clientId;
}

serve(async (req) => {
  const functionName = "voice-onboard";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authErr = await requirePractitioner(req, corsHeaders);
    if (authErr) return authErr;

    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");

    const { name, email, phone, notes, practice } = await req.json();
    if (!name || !name.trim()) throw new Error("Full name is required.");

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // Check for existing client by email first
    let existingPageId = null;
    if (email && email.trim()) {
      console.log(`[${functionName}] Checking for existing client with email: ${email.trim()}`);
      const queryRes = await fetch(
        `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
        {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({
            filter: {
              property: "Email",
              email: { equals: email.trim() },
            },
            page_size: 1,
          }),
        }
      );

      if (queryRes.ok) {
        const queryData = await queryRes.json();
        if (queryData.results?.length > 0) {
          existingPageId = queryData.results[0].id;
          console.log(`[${functionName}] Found existing client: ${existingPageId}`);
        }
      }
    }

    if (existingPageId) {
      // Update existing page
      console.log(`[${functionName}] Updating existing client: ${existingPageId}`);

      const updateProperties = {
        Name: { title: [{ text: { content: name.trim() } }] },
      };
      if (phone && phone.trim()) {
        updateProperties["Phone"] = { phone_number: phone.trim() };
      }
      if (notes && notes.trim()) {
        updateProperties["Additional Notes"] = {
          rich_text: richText(notes.trim()),
        };
      }

      const updateRes = await fetch(`https://api.notion.com/v1/pages/${existingPageId}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ properties: updateProperties }),
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        console.error(`[${functionName}] Update failed:`, JSON.stringify(err));
        throw new Error(err.message || "Notion update failed");
      }

      console.log(`[${functionName}] Existing client updated: ${existingPageId}`);
      const clientId = await saveToPeople({
        email: (email || "").trim(),
        name: name.trim(),
        practice: practice === "piano" ? "piano" : "voice",
        notes: (notes || "").trim(),
        notionPageId: existingPageId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          notionPageId: existingPageId,
          clientId,
          updated: true,
          message: `Student ${name.trim()} already existed — updated their record.`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create new page
    console.log(`[${functionName}] Creating new Notion page in Voice Clients DB...`);

    const properties = {
      Name: { title: [{ text: { content: name.trim() } }] },
    };

    if (email && email.trim()) {
      properties["Email"] = { email: email.trim() };
    }
    if (phone && phone.trim()) {
      properties["Phone"] = { phone_number: phone.trim() };
    }
    if (notes && notes.trim()) {
      properties["Additional Notes"] = {
        rich_text: richText(notes.trim()),
      };
    }

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: VOICE_CLIENTS_DB_ID },
        properties,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[${functionName}] Notion API error:`, JSON.stringify(data));
      throw new Error(data.message || "Notion API request failed");
    }

    console.log(`[${functionName}] Notion page created: ${data.id}`);
    const clientId = await saveToPeople({
      email: (email || "").trim(),
      name: name.trim(),
      practice: practice === "piano" ? "piano" : "voice",
      notes: (notes || "").trim(),
      notionPageId: data.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        notionPageId: data.id,
        notionUrl: data.url,
        clientId,
        updated: false,
        message: `Student ${name.trim()} onboarded successfully.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
