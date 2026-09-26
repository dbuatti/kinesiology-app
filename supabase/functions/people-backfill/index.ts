// @ts-nocheck
// Phase 5, step 2: give every voice and piano student a row in `clients`.
//
// Sources: the Notion "Voice Clients" database and Cal.com voice_bookings,
// matched to existing clients by email, so someone doing kinesiology and
// voice stays one person with both practices.
//
//   { action: "dry_run" } — report what would change; writes nothing
//   { action: "apply" }   — make those changes, logging each one
//   { action: "undo" }    — reverse the logged changes (inserted rows are
//                           removed only if nothing has been attached to them)
//
// Needs supabase_people_practices.sql. Safe to run apply more than once: a
// second run only picks up students added since.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";
const PRACTICES = ["kinesiology", "voice", "piano"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const norm = (e: string | null | undefined) => (e || "").toLowerCase().trim();
const practiceFrom = (d: string | null | undefined) => ((d || "").toLowerCase() === "piano" ? "piano" : "voice");

async function notionStudents(key: string) {
  const out = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Notion Voice Clients: ${err.message || res.status}`);
    }
    const data = await res.json();
    for (const page of data.results || []) {
      const p = page.properties || {};
      out.push({
        notionId: page.id,
        archived: !!page.archived,
        name: (p.Name?.title || []).map((t) => t.plain_text).join("").trim() || null,
        email: p.Email?.email || null,
        phone: p.Phone?.phone_number || null,
        discipline: p.Discipline?.select?.name || null,
      });
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return out;
}

/** Everyone who should have a row, keyed by email, plus the people who can't be matched. */
async function gatherStudents(admin, notionKey: string, practitionerEmail: string) {
  const people = new Map();
  const noEmail = [];
  const add = (email, name, phone, practice, notionId) => {
    const key = norm(email);
    if (!key || key === practitionerEmail) return;
    const p = people.get(key) || { email: key, name: null, phone: null, practices: new Set(), notionId: null };
    if (name && (!p.name || notionId)) p.name = name; // Notion's name wins over a booking form's
    if (phone && !p.phone) p.phone = phone;
    if (notionId && !p.notionId) p.notionId = notionId;
    p.practices.add(practice);
    people.set(key, p);
  };

  for (const s of await notionStudents(notionKey)) {
    if (s.archived) continue;
    if (!norm(s.email)) { if (s.name) noEmail.push({ name: s.name, from: "Notion" }); continue; }
    add(s.email, s.name, s.phone, practiceFrom(s.discipline), s.notionId);
  }

  const { data: bookings, error } = await admin
    .from("voice_bookings")
    .select("student_name, student_email, discipline, status");
  if (error) throw new Error(`voice_bookings: ${error.message}`);
  for (const b of bookings || []) {
    if ((b.status || "").toLowerCase() === "cancelled" && !people.has(norm(b.student_email))) continue;
    add(b.student_email, (b.student_name || "").trim() || null, null, practiceFrom(b.discipline), null);
  }
  return { people, noEmail };
}

async function plan(admin, notionKey: string, practitionerEmail: string) {
  const { people, noEmail } = await gatherStudents(admin, notionKey, practitionerEmail);
  const { data: clients, error } = await admin.from("clients").select("id, name, email, practices, notion_voice_client_id");
  if (error) throw new Error(`clients: ${error.message} — has supabase_people_practices.sql been run?`);

  const byEmail = new Map();
  for (const c of clients || []) {
    const key = norm(c.email);
    if (!key) continue;
    byEmail.set(key, [...(byEmail.get(key) || []), c]);
  }

  const toInsert = [], toTag = [], duplicates = [], unchanged = [];
  for (const p of people.values()) {
    const wanted = [...p.practices].filter((x) => PRACTICES.includes(x));
    const matches = byEmail.get(p.email) || [];
    if (matches.length > 1) {
      duplicates.push({ email: p.email, names: matches.map((m) => m.name) });
      continue;
    }
    if (matches.length === 0) {
      toInsert.push({ name: p.name || p.email.split("@")[0], email: p.email, phone: p.phone, practices: wanted, notion_voice_client_id: p.notionId });
      continue;
    }
    const c = matches[0];
    const current = c.practices || ["kinesiology"];
    const next = [...new Set([...current, ...wanted])];
    const linkNotion = p.notionId && !c.notion_voice_client_id;
    if (next.length !== current.length || linkNotion) {
      toTag.push({ id: c.id, name: c.name, email: p.email, from: current, to: next, notionId: linkNotion ? p.notionId : null });
    } else {
      unchanged.push(c.name);
    }
  }
  return { toInsert, toTag, duplicates, noEmail, unchanged };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const notionKey = Deno.env.get("NOTION_API_KEY");
    const practitionerId = Deno.env.get("PRACTITIONER_USER_ID");
    if (!notionKey || !practitionerId) throw new Error("Missing NOTION_API_KEY or PRACTITIONER_USER_ID.");
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: pUser } = await admin.auth.admin.getUserById(practitionerId);
    const practitionerEmail = norm(pUser?.user?.email);

    let body: { action?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const action = body.action || "dry_run";

    if (action === "undo") {
      const { data: log, error } = await admin.from("people_backfill_log").select("*").is("undone_at", null).order("id", { ascending: false });
      if (error) throw new Error(error.message);
      let removed = 0, restored = 0;
      const kept = [];
      for (const row of log || []) {
        if (row.action === "inserted") {
          const [{ count: appts }, { count: portal }] = await Promise.all([
            admin.from("appointments").select("id", { count: "exact", head: true }).eq("client_id", row.client_id),
            admin.from("client_portal_accounts").select("id", { count: "exact", head: true }).eq("client_id", row.client_id),
          ]);
          if ((appts || 0) + (portal || 0) > 0) {
            // Something real now points at this person; keep them rather than lose it.
            const { data: c } = await admin.from("clients").select("name").eq("id", row.client_id).maybeSingle();
            kept.push(c?.name || row.client_id);
            continue;
          }
          await admin.from("clients").delete().eq("id", row.client_id).eq("source", "voice_backfill");
          removed++;
        } else {
          await admin.from("clients").update({ practices: row.previous_practices }).eq("id", row.client_id);
          restored++;
        }
        await admin.from("people_backfill_log").update({ undone_at: new Date().toISOString() }).eq("id", row.id);
      }
      return json({ success: true, action, removed, restored, kept });
    }

    const result = await plan(admin, notionKey, practitionerEmail);
    const summary = {
      toInsert: result.toInsert.map((r) => ({ name: r.name, email: r.email, practices: r.practices })),
      toTag: result.toTag.map((r) => ({ name: r.name, email: r.email, from: r.from, to: r.to })),
      duplicates: result.duplicates,
      noEmail: result.noEmail,
      unchangedCount: result.unchanged.length,
    };
    if (action !== "apply") return json({ success: true, action: "dry_run", ...summary });

    let inserted = 0, tagged = 0;
    const failed = [];
    for (const r of result.toInsert) {
      const { data, error } = await admin.from("clients")
        .insert({ user_id: practitionerId, name: r.name, email: r.email, phone: r.phone, practices: r.practices, notion_voice_client_id: r.notion_voice_client_id, source: "voice_backfill" })
        .select("id").single();
      if (error) { failed.push({ email: r.email, error: error.message }); continue; }
      await admin.from("people_backfill_log").insert({ user_id: practitionerId, client_id: data.id, action: "inserted" });
      inserted++;
    }
    for (const r of result.toTag) {
      const update: Record<string, unknown> = { practices: r.to };
      if (r.notionId) update.notion_voice_client_id = r.notionId;
      const { error } = await admin.from("clients").update(update).eq("id", r.id);
      if (error) { failed.push({ email: r.email, error: error.message }); continue; }
      await admin.from("people_backfill_log").insert({ user_id: practitionerId, client_id: r.id, action: "added_practices", previous_practices: r.from });
      tagged++;
    }
    return json({ success: true, action: "apply", inserted, tagged, failed, ...summary });
  } catch (error) {
    console.error("[people-backfill]", error.message);
    return json({ success: false, error: error.message }, 400);
  }
});
