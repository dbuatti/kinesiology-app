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

// Gmail's own `snippet` field is generated from the HTML body and can leave
// individual words still HTML-entity-encoded (seen live: "I&#39;m" next to an
// already-clean "wasn't" in the same snippet) — decode before it reaches the UI.
function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
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
    const PRACTICE_EMAIL = (Deno.env.get("GMAIL_USER_EMAIL") || "").toLowerCase();
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

    // Daniele has his own self-test row in `clients` (same email he practices
    // from) — without excluding it, his own sent mail (which lands back in his
    // inbox) gets swept up and shown as if a client named "Daniele Buatti"
    // emailed him, and opening it searches his own address against his whole
    // inbox instead of one real client's thread.
    const byEmail = new Map<string, { id: string; name: string; kind: "kinesiology" | "voice" }>();
    for (const c of (clients || []) as any[]) {
      const email = String(c.email || "").toLowerCase().trim();
      if (email && email !== PRACTICE_EMAIL) byEmail.set(email, { id: c.id, name: c.name || "Unknown", kind: "kinesiology" });
    }
    for (const v of (voiceRows || []) as any[]) {
      const email = String(v.student_email || "").toLowerCase().trim();
      if (email && email !== PRACTICE_EMAIL && !byEmail.has(email)) byEmail.set(email, { id: `voice:${email}`, name: v.student_name || "Unknown", kind: "voice" });
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
          subject: decodeHtmlEntities(headerValue(headers, "Subject")) || "(no subject)",
          snippet: decodeHtmlEntities(data.snippet || ""),
          date: headerValue(headers, "Date"),
          date_iso: new Date(headerValue(headers, "Date")).toISOString(),
        };
      }),
    );

    const clean = messages.filter(Boolean).sort((a: any, b: any) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime());

    // For each distinct thread, check whether the practice has already sent a
    // later reply — that's what actually determines "needs a reply" vs
    // "already handled", not just that a client message exists at all.
    // Compare the last message's sender against THIS CLIENT's own email
    // (always known for certain) rather than a hardcoded GMAIL_USER_EMAIL env
    // var — same real bug already fixed once in gmail-get-client-thread
    // (GMAIL_USER_EMAIL didn't match the actual sending address
    // "info@danielebuatti.com", so a real reply was never recognised as one).
    const threadClientEmail = new Map<string, string>();
    for (const m of clean as any[]) threadClientEmail.set(m.thread_id, m.email);
    const threadIds = Array.from(new Set(clean.map((m: any) => m.thread_id)));
    const needsReplyByThread = new Map<string, boolean>();
    await Promise.all(
      threadIds.map(async (threadId) => {
        try {
          const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`);
          url.searchParams.set("format", "metadata");
          url.searchParams.append("metadataHeaders", "From");
          url.searchParams.append("metadataHeaders", "Date");
          const res = await fetch(url.toString(), { headers: authHeaders });
          if (!res.ok) { needsReplyByThread.set(threadId, true); return; }
          const data = await res.json();
          const msgs = data.messages || [];
          if (msgs.length === 0) { needsReplyByThread.set(threadId, true); return; }
          const last = msgs[msgs.length - 1];
          const lastFrom = extractEmail(headerValue(last.payload?.headers || [], "From"));
          const clientEmail = threadClientEmail.get(threadId) || "";
          // Needs a reply only if the LAST message is from the client, not the practice.
          needsReplyByThread.set(threadId, lastFrom === clientEmail);
        } catch {
          needsReplyByThread.set(threadId, true);
        }
      }),
    );

    const withStatus = clean.map((m: any) => ({ ...m, needs_reply: needsReplyByThread.get(m.thread_id) ?? true }));

    return new Response(JSON.stringify({ messages: withStatus }), {
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
