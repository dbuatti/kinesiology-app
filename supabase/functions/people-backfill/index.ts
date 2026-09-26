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
const LESSONS_DB_ID = "8d6369c637c8425fb007adf261f8e576";
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

const EMAIL_RE = /^[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i;
// Placeholder and test sign-ups (e.g. url-check@example.com, test-student@dyad-test.io).
const isTestEntry = (email: string, name: string | null) =>
  /@(example\.(com|org|net)|[^@]*test[^@]*)$/i.test(email) || /^test\b/i.test(name || "");
const nameKey = (n: string | null | undefined) => (n || "").toLowerCase().replace(/\s+/g, " ").trim();

/** Voice / piano per Notion student, from the disciplines of their lessons. */
async function lessonPractices(key: string) {
  const byStudent = new Map();
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${LESSONS_DB_ID}/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Notion-Version": "2022-06-28" },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    if (!res.ok) break; // practices then fall back to Notion's Discipline / bookings
    const data = await res.json();
    for (const page of data.results || []) {
      const p = page.properties || {};
      // Discipline is sometimes left empty; the title ("Piano Lesson — …") still says which.
      const title = (p.Name?.title || []).map((t) => t.plain_text).join("");
      const practice = practiceFrom(p.Discipline?.select?.name || (/piano/i.test(title) ? "piano" : "voice"));
      for (const r of p["Client CRM"]?.relation || []) {
        byStudent.set(r.id, new Set([...(byStudent.get(r.id) || []), practice]));
      }
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return byStudent;
}

/**
 * Everyone who should have a row. Keyed by email where there is one; Notion
 * students without an email are matched to an emailed student by name, or
 * kept as Notion-only people (identified by their Notion page).
 */
async function gatherStudents(admin, notionKey: string, skipEmails: Set<string>) {
  const people = new Map();
  const skipped = [];
  const notionOnly = [];
  const add = (email, name, phone, practices, notionId) => {
    const key = norm(email);
    const p = people.get(key) || { email: key, name: null, phone: null, practices: new Set(), notionId: null };
    if (name && (!p.name || notionId)) p.name = name; // Notion's name wins over a booking form's
    if (phone && !p.phone) p.phone = phone;
    if (notionId && !p.notionId) p.notionId = notionId;
    for (const x of practices) p.practices.add(x);
    people.set(key, p);
  };
  const usable = (email, name, from) => {
    const key = norm(email);
    if (!key) return false;
    if (skipEmails.has(key)) return false; // you, or another practitioner record
    if (!EMAIL_RE.test(key)) { skipped.push({ name: name || key, from, reason: "not a valid email" }); return false; }
    if (isTestEntry(key, name)) { skipped.push({ name: name || key, from, reason: "test entry" }); return false; }
    return true;
  };

  const [students, fromLessons] = await Promise.all([notionStudents(notionKey), lessonPractices(notionKey)]);
  const noEmail = [];
  for (const s of students) {
    if (s.archived) continue;
    const lessonSet = fromLessons.get(s.notionId);
    const practices = lessonSet || new Set([practiceFrom(s.discipline)]);
    // A card with no lessons only guesses its instrument, so it never adds one to someone else.
    if (!norm(s.email)) { if (s.name) noEmail.push({ ...s, practices, guessed: !lessonSet }); continue; }
    if (usable(s.email, s.name, "Notion")) add(s.email, s.name, s.phone, practices, s.notionId);
  }

  const { data: bookings, error } = await admin
    .from("voice_bookings")
    .select("student_name, student_email, discipline, status");
  if (error) throw new Error(`voice_bookings: ${error.message}`);
  for (const b of bookings || []) {
    const key = norm(b.student_email);
    if ((b.status || "").toLowerCase() === "cancelled" && !people.has(key)) continue;
    if (!people.has(key) && !usable(b.student_email, b.student_name, "Cal.com")) continue;
    // Lessons know the instrument best; a booking only adds piano, or voice for someone new.
    const practice = practiceFrom(b.discipline);
    const known = people.get(key);
    add(key, (b.student_name || "").trim() || null, null, practice === "piano" || !known ? [practice] : [], null);
  }

  // A Notion entry with no email is usually a second card for someone who booked with one.
  const byName = new Map([...people.values()].filter((p) => nameKey(p.name)).map((p) => [nameKey(p.name), p]));
  const onlyByName = new Map();
  for (const s of noEmail) {
    const match = byName.get(nameKey(s.name));
    if (match) {
      if (!s.guessed) for (const x of s.practices) match.practices.add(x);
      if (!match.notionId) match.notionId = s.notionId;
      continue;
    }
    const twin = onlyByName.get(nameKey(s.name)); // two email-less cards for one person
    if (twin) {
      if (twin.guessed && !s.guessed) { twin.practices = [...s.practices]; twin.guessed = false; }
      else if (!s.guessed) for (const x of s.practices) if (!twin.practices.includes(x)) twin.practices.push(x);
      continue;
    }
    const entry = { name: s.name, phone: s.phone, practices: [...s.practices], notionId: s.notionId, guessed: s.guessed };
    onlyByName.set(nameKey(s.name), entry);
    notionOnly.push(entry);
  }
  return { people, skipped, notionOnly };
}

async function plan(admin, notionKey: string, practitionerEmails: string[]) {
  const { data: clients, error } = await admin.from("clients").select("id, name, email, practices, notion_voice_client_id, is_practitioner");
  if (error) throw new Error(`clients: ${error.message} — has supabase_people_practices.sql been run?`);
  const skipEmails = new Set([...practitionerEmails, ...(clients || []).filter((c) => c.is_practitioner).map((c) => norm(c.email))].filter(Boolean));
  const { people, skipped, notionOnly } = await gatherStudents(admin, notionKey, skipEmails);

  const byEmail = new Map();
  const byNotionId = new Map();
  const byClientName = new Map();
  for (const c of clients || []) {
    if (c.notion_voice_client_id) byNotionId.set(c.notion_voice_client_id, c);
    if (c.is_practitioner) continue;
    const key = norm(c.email);
    if (key) byEmail.set(key, [...(byEmail.get(key) || []), c]);
    byClientName.set(nameKey(c.name), [...(byClientName.get(nameKey(c.name)) || []), c]);
  }

  const toInsert = [], duplicates = [], unchanged = [];
  const tags = new Map(); // one update per client, however many ways it matched
  const tag = (c, wanted, notionId, email, how) => {
    const prev = tags.get(c.id);
    const current = c.practices || ["kinesiology"];
    const next = [...new Set([...(prev?.to || current), ...wanted])];
    tags.set(c.id, {
      id: c.id, name: c.name, email: prev?.email || email, from: current, to: next,
      notionId: prev?.notionId || (notionId && !c.notion_voice_client_id ? notionId : null),
      how: prev && prev.how !== "name" ? prev.how : how,
    });
  };

  for (const p of people.values()) {
    const wanted = [...p.practices].filter((x) => PRACTICES.includes(x));
    const matches = byEmail.get(p.email) || [];
    if (matches.length > 1) { duplicates.push({ email: p.email, names: matches.map((m) => m.name) }); continue; }
    if (matches.length === 1) { tag(matches[0], wanted, p.notionId, p.email, "email"); continue; }
    if (p.notionId && byNotionId.has(p.notionId)) { tag(byNotionId.get(p.notionId), wanted, null, p.email, "notion"); continue; }
    toInsert.push({ name: p.name || p.email.split("@")[0], email: p.email, phone: p.phone, practices: wanted, notion_voice_client_id: p.notionId });
  }

  // Notion-only students: already added on an earlier run, the same name as one
  // existing client (shown in the preview so a wrong match is caught), or new.
  for (const s of notionOnly) {
    const wanted = s.practices.filter((x) => PRACTICES.includes(x));
    if (byNotionId.has(s.notionId)) { tag(byNotionId.get(s.notionId), wanted, null, null, "notion"); continue; }
    const sameName = byClientName.get(nameKey(s.name)) || [];
    if (sameName.length === 1) { tag(sameName[0], wanted, s.notionId, null, "name"); continue; }
    toInsert.push({ name: s.name, email: null, phone: s.phone, practices: wanted, notion_voice_client_id: s.notionId });
  }
  const toTag = [];
  for (const t of tags.values()) {
    if (t.to.length !== t.from.length || t.notionId) toTag.push(t);
    else unchanged.push(t.name);
  }
  return { toInsert, toTag, duplicates, skipped, unchanged };
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
    // Your own email(s) never become a student: the practitioner account and whoever is signed in.
    const { data: pUser } = await admin.auth.admin.getUserById(practitionerId);
    const caller = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user: me } } = await caller.auth.getUser();
    const practitionerEmails = [norm(pUser?.user?.email), norm(me?.email)].filter(Boolean);

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

    const result = await plan(admin, notionKey, practitionerEmails);
    const summary = {
      toInsert: result.toInsert.map((r) => ({ name: r.name, email: r.email, practices: r.practices })),
      toTag: result.toTag.map((r) => ({ name: r.name, email: r.email, from: r.from, to: r.to, how: r.how })),
      duplicates: result.duplicates,
      skipped: result.skipped,
      unchangedCount: result.unchanged.length,
    };
    if (action !== "apply") return json({ success: true, action: "dry_run", ...summary });

    let inserted = 0, tagged = 0;
    const failed = [];
    for (const r of result.toInsert) {
      const { data, error } = await admin.from("clients")
        .insert({ user_id: practitionerId, name: r.name, email: r.email, phone: r.phone, practices: r.practices, notion_voice_client_id: r.notion_voice_client_id, source: "voice_backfill" })
        .select("id").single();
      if (error) { failed.push({ email: r.email || r.name, error: error.message }); continue; }
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
