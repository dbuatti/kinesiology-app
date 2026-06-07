// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

serve(async (req) => {
  const functionName = "voice-onboard";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY in Supabase Secrets.");

    const { name, email, phone, notes } = await req.json();
    if (!name || !name.trim()) throw new Error("Full name is required.");

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    const properties = {
      Name: {
        title: [{ text: { content: name.trim() } }],
      },
    };

    if (email && email.trim()) {
      properties["Email"] = { email: email.trim() };
    }
    if (phone && phone.trim()) {
      properties["Phone"] = { phone_number: phone.trim() };
    }
    if (notes && notes.trim()) {
      properties["Additional Notes"] = {
        rich_text: [{ text: { content: notes.trim() } }],
      };
    }

    console.log(`[${functionName}] Creating Notion page in Voice Clients DB...`);

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

    return new Response(
      JSON.stringify({
        success: true,
        notionPageId: data.id,
        notionUrl: data.url,
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
