// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";
const LESSONS_DB_1_ID = "8d6369c637c8425fb007adf261f8e576";
const LESSONS_DB_2_ID = "11caad21cd0980d8a3eeeffb27fc43c0";
const DB1_RELATION_PROP = "Client CRM";
const DB2_RELATION_PROP = "Voice Students";

serve(async (req) => {
  const functionName = "merge-voice-clients";

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("Missing NOTION_API_KEY secret.");

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    const { sourcePageId, targetPageId } = await req.json();
    if (!sourcePageId || !targetPageId) {
      throw new Error("Missing sourcePageId or targetPageId");
    }

    const normalize = (id: string) => id.replace(/-/g, "").toLowerCase();
    const src = normalize(sourcePageId);
    const tgt = normalize(targetPageId);

    if (src === tgt) {
      throw new Error("sourcePageId and targetPageId are the same");
    }

    console.log(`[${functionName}] Merging ${src} -> ${tgt}`);

    // 1. Verify both pages exist in Voice Clients DB
    for (const [label, id] of [["Source", src], ["Target", tgt]] as const) {
      const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: "GET",
        headers: notionHeaders,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(`${label} page ${id} not found in Notion: ${err.message || JSON.stringify(err)}`);
      }
      console.log(`[${functionName}] ${label} page ${id} verified`);
    }

    // 2. Helper: transfer relations from source to target in a given database
    async function transferRelations(
      dbId: string,
      relationProp: string,
    ): Promise<number> {
      const lessonsToUpdate: { id: string; currentIds: string[] }[] = [];
      let hasMore = true;
      let startCursor: string | undefined;

      while (hasMore) {
        const queryBody: Record<string, unknown> = {
          page_size: 100,
          filter: {
            property: relationProp,
            relation: { contains: src },
          },
        };
        if (startCursor) queryBody.start_cursor = startCursor;

        const qRes = await fetch(
          `https://api.notion.com/v1/databases/${dbId}/query`,
          { method: "POST", headers: notionHeaders, body: JSON.stringify(queryBody) },
        );

        if (!qRes.ok) {
          const err = await qRes.json();
          throw new Error(`Query failed for DB ${dbId}: ${err.message || JSON.stringify(err)}`);
        }

        const data = await qRes.json();
        for (const page of data.results || []) {
          const relProp = page.properties[relationProp];
          const currentIds = (relProp?.relation || []).map((r: any) => normalize(r.id));
          lessonsToUpdate.push({ id: page.id, currentIds });
        }

        hasMore = data.has_more;
        startCursor = data.next_cursor;
      }

      console.log(`[${functionName}] Found ${lessonsToUpdate.length} lessons in DB ${dbId} related to source`);

      // Update each lesson's relation
      for (const lesson of lessonsToUpdate) {
        const newIds = lesson.currentIds.filter((id) => id !== src);
        if (!newIds.includes(tgt)) {
          newIds.push(tgt);
        }
        // Only update if the relation changed
        if (newIds.length !== lesson.currentIds.length ||
            !newIds.every((id) => lesson.currentIds.includes(id))) {
          const updateRes = await fetch(`https://api.notion.com/v1/pages/${lesson.id}`, {
            method: "PATCH",
            headers: notionHeaders,
            body: JSON.stringify({
              properties: {
                [relationProp]: { relation: newIds.map((id) => ({ id })) },
              },
            }),
          });
          if (!updateRes.ok) {
            const err = await updateRes.json();
            console.error(`[${functionName}] Failed to update lesson ${lesson.id}: ${err.message || JSON.stringify(err)}`);
          } else {
            console.log(`[${functionName}] Updated lesson ${lesson.id} in DB ${dbId}`);
          }
        } else {
          console.log(`[${functionName}] Lesson ${lesson.id} already has target, no update needed`);
        }
      }

      return lessonsToUpdate.length;
    }

    const db1Count = await transferRelations(LESSONS_DB_1_ID, DB1_RELATION_PROP);
    const db2Count = await transferRelations(LESSONS_DB_2_ID, DB2_RELATION_PROP);

    // 3. Archive the source client page
    const archiveRes = await fetch(`https://api.notion.com/v1/pages/${src}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ archived: true }),
    });

    if (!archiveRes.ok) {
      const err = await archiveRes.json();
      console.error(`[${functionName}] Failed to archive source page: ${err.message || JSON.stringify(err)}`);
    } else {
      console.log(`[${functionName}] Source page ${src} archived`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Merged source into target. Transferred ${db1Count} lessons from DB1 and ${db2Count} from DB2. Source page archived.`,
        sourcePageId: src,
        targetPageId: tgt,
        db1LessonsTransferred: db1Count,
        db2LessonsTransferred: db2Count,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
