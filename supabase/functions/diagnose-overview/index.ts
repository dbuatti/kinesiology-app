// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    const hdr = { Authorization: `Bearer ${NOTION_KEY}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" };

    // Check all pages + DB schema for Lisa Capon's lessons
    const lessonIds = [
      "383aad21-cd09-813b-bbbc-d90af372117f",  // Jul 16
      "383aad21-cd09-81f4-b19a-ca562dab5f7e",  // Jul 21
    ];

    const pages = [];
    for (const pid of lessonIds) {
      const res = await fetch(`https://api.notion.com/v1/pages/${pid}`, { headers: hdr });
      const data = await res.json();
      const summary = { id: pid, archived: data.archived };
      for (const [key, val] of Object.entries(data.properties || {})) {
        const v = val;
        switch (v.type) {
          case "title": summary[key] = v.title?.[0]?.plain_text; break;
          case "rich_text": summary[key] = v.rich_text?.map(t => t.plain_text).join(""); break;
          case "number": summary[key] = v.number; break;
          case "select": summary[key] = v.select?.name; break;
          case "date": summary[key] = v.date?.start; break;
          case "relation": summary[key] = v.relation?.map(r => r.id); break;
          case "email": summary[key] = v.email; break;
          case "phone": summary[key] = v.phone_number; break;
          default: summary[key] = { type: v.type, value: JSON.stringify(v[v.type]) };
        }
      }
      pages.push(summary);
    }

    // DB schema
    const dbRes = await fetch(`https://api.notion.com/v1/databases/8d6369c637c8425fb007adf261f8e576`, { headers: hdr });
    const dbData = await dbRes.json();
    const dbProps = {};
    for (const [key, val] of Object.entries(dbData.properties || {})) {
      dbProps[key] = val.type;
    }

    return new Response(JSON.stringify({ pages, databaseProperties: dbProps }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
