// @ts-nocheck
// Cross-client inbox: every recent email FROM a known client or voice student,
// across the whole practice, sorted chronologically — not scoped to one person.
// Read-only (gmail.readonly scope), same as gmail-get-client-thread.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keeps the Gmail search query (and round-trip cost) bounded — a practice with
// more distinct client emails than this would need pagination, not a bigger cap.
const MAX_ADDRESSES = 200;
const MAX_MESSAGES = 60;

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

function headerValue(headers: { name: string; value: string }[], name: string) {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

// Pulls the bare address out of a "Name" <email@x.com> or plain email@x.com header.
function extractEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match ? match[1] : fromHeader).toLowerCase().trim();
}

function extractDisplayName(fromHeader: string): string {
  const match = fromHeader.match(/^"?([^"<]+?)"?\s*</);
  return match ? match[1].trim() : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_READONLY_INBOX_REFRESH_TOKEN");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH) throw new Error("Gmail inbox read is not configured.");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Known client/student emails — the single source of truth for "who counts",
    // so the inbox view never shows a stranger's email just because it matched text.
    const [{ data: clients }, { data: voiceRows }] = await Promise.all([
      supabase.from("clients").select("id, name, email").not("email", "is", null),
      supabase.from("voice_bookings").select("student_name, student_email").not("student_email", "is", null),
    ]);

    const byEmail = new Map<string, { id: string; name: string; kind: "kinesiology" | "voice" }>();
    for (const c of (clients || []) as any[]) {
      const email = String(c.email || "").toLowerCase().trim();
      if (email) byEmail.set(email, { id: c.id, name: c.name || "Unknown", kind: "kinesiology" });
    }
    for (const v of (voiceRows || []) as any[]) {
      const email = String(v.student_email || "").toLowerCase().trim();
      if (email && !byEmail.has(email)) byEmail.set(email, { id: `voice:${email}`, name: v.student_name || "Unknown", kind: "voice" });
    }

    const addresses = Array.from(byEmail.keys()).slice(0, MAX_ADDRESSES);
    if (addresses.length === 0) {
      return new Response(JSON.stringify({ messages: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // One search covering every known client, rather than one call per client —
    // the whole point is this stays fast enough to run every time the view opens.
    const fromClause = addresses.map((e) => `from:${e}`).join(" OR ");
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("q", `in:inbox newer_than:90d (${fromClause})`);
    listUrl.searchParams.set("maxResults", String(MAX_MESSAGES));
    const listRes = await fetch(listUrl.toString(), { headers: authHeaders });
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error(listData?.error?.message || "Gmail search failed.");

    const ids: string[] = (listData.messages || []).map((m: any) => m.id);
    const messages = await Promise.all(
      ids.map(async (id) => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
        url.searchParams.set("format", "metadata");
        url.searchParams.append("metadataHeaders", "Subject");
        url.searchParams.append("metadataHeaders", "Date");
        url.searchParams.append("metadataHeaders", "From");
        const res = await fetch(url.toString(), { headers: authHeaders });
        if (!res.ok) return null;
        const data = await res.json();
        const headers = data.payload?.headers || [];
        const fromHeader = headerValue(headers, "From");
        const email = extractEmail(fromHeader);
        const known = byEmail.get(email);
        if (!known) return null; // defensive — the search already scoped to known senders
        return {
          id: data.id,
          thread_id: data.threadId,
          client_id: known.kind === "kinesiology" ? known.id : null,
          voice_student_email: known.kind === "voice" ? email : null,
          name: known.name,
          from_display_name: extractDisplayName(fromHeader) || known.name,
          email,
          kind: known.kind,
          subject: headerValue(headers, "Subject") || "(no subject)",
          snippet: data.snippet || "",
          date: headerValue(headers, "Date"),
          date_iso: new Date(headerValue(headers, "Date")).toISOString(),
        };
      }),
    );

    const clean = messages.filter(Boolean).sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime());

    return new Response(JSON.stringify({ messages: clean }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gmail-list-client-inbox] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
