// @ts-nocheck
// One person, one `clients` row (Phase 5, supabase_people_practices.sql).
// Called whenever someone books or signs up for a practice, so new voice and
// piano students join the same list as kinesiology clients.

const PRACTICES = ["kinesiology", "voice", "piano"];

/**
 * Find the person by email and make sure they have `practice`; create them if
 * they're new. Never touches the practitioner's own record. Non-fatal: returns
 * the client id, or null if anything goes wrong.
 */
export async function ensurePerson(admin, opts: { email: string; name?: string | null; practice: string; notionVoiceClientId?: string | null }): Promise<string | null> {
  try {
    const email = (opts.email || "").toLowerCase().trim();
    const practice = PRACTICES.includes(opts.practice) ? opts.practice : "voice";
    if (!email || !/^[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i.test(email)) return null;

    const { data: rows } = await admin
      .from("clients")
      .select("id, practices, is_practitioner, notion_voice_client_id")
      .ilike("email", email.replace(/[\\%_]/g, (c) => `\\${c}`)); // case-insensitive exact match
    if (rows && rows.length > 1) return null; // duplicates: leave for Duplicate resolution
    const row = rows?.[0];
    if (row) {
      if (row.is_practitioner) return null;
      const practices = row.practices || ["kinesiology"];
      const update: Record<string, unknown> = {};
      if (!practices.includes(practice)) update.practices = [...practices, practice];
      if (opts.notionVoiceClientId && !row.notion_voice_client_id) update.notion_voice_client_id = opts.notionVoiceClientId;
      if (Object.keys(update).length) await admin.from("clients").update(update).eq("id", row.id);
      return row.id;
    }

    const practitionerId = Deno.env.get("PRACTITIONER_USER_ID");
    if (!practitionerId) return null;
    const { data: created, error } = await admin
      .from("clients")
      .insert({
        user_id: practitionerId,
        name: (opts.name || "").trim() || email.split("@")[0],
        email,
        practices: [practice],
        notion_voice_client_id: opts.notionVoiceClientId || null,
        source: "voice_signup",
      })
      .select("id")
      .single();
    if (error) { console.error("[ensurePerson]", error.message); return null; }
    return created.id;
  } catch (e) {
    console.error("[ensurePerson]", e?.message);
    return null;
  }
}
