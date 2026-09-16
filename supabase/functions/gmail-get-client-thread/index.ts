// @ts-nocheck
// Full two-way email history with one client, rendered as a chat thread in the
// Assistant's per-client Email Thread view. Read-only (gmail.readonly scope) —
// this function never sends anything, only reads and decodes message bodies.
//
// Returns a summary of every distinct Gmail thread with this client (so the
// frontend can offer a thread picker), plus the full decoded messages for one
// "active" thread — either the one explicitly requested via `thread_id`, or
// the most recently active one by default.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requirePractitioner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function b64urlDecode(data: string) {
  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    // Decode as UTF-8 bytes, not Latin-1, or accented characters break.
    const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Finds the best readable body: prefers text/plain, falls back to a
// tag-stripped text/html. Recurses into multipart/* parts.
function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return b64urlDecode(payload.body.data);
  }
  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain" && p.body?.data);
    if (plain) return b64urlDecode(plain.body.data);
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
    const html = payload.parts.find((p: any) => p.mimeType === "text/html" && p.body?.data);
    if (html) return stripHtml(b64urlDecode(html.body.data));
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(b64urlDecode(payload.body.data));
  }
  return "";
}

function messageFromApi(data: any, practiceEmail: string) {
  const headers = data.payload?.headers || [];
  const from = headerValue(headers, "From");
  const direction = from.toLowerCase().includes(practiceEmail) ? "outbound" : "inbound";
  return {
    id: data.id,
    threadId: data.threadId,
    direction,
    from,
    to: headerValue(headers, "To"),
    subject: headerValue(headers, "Subject"),
    date: headerValue(headers, "Date"),
    messageIdHeader: headerValue(headers, "Message-ID"),
    referencesHeader: headerValue(headers, "References"),
    body: extractBody(data.payload).slice(0, 5000),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { client_email, thread_id } = await req.json();
    if (!client_email) throw new Error("Missing client_email.");

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_READONLY_INBOX_REFRESH_TOKEN");
    const PRACTICE_EMAIL = (Deno.env.get("GMAIL_USER_EMAIL") || "").toLowerCase();
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH) throw new Error("Gmail inbox read is not configured.");

    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // 1. Find every distinct thread with this client (cheap — thread list only,
    // no bodies) so the frontend can offer a "reply to a different thread" picker.
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/threads");
    listUrl.searchParams.set("q", `(from:${client_email} OR to:${client_email})`);
    listUrl.searchParams.set("maxResults", "15");
    const listRes = await fetch(listUrl.toString(), { headers: authHeaders });
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error(listData?.error?.message || "Gmail search failed.");

    const threadIds: string[] = (listData.threads || []).map((t: any) => t.id);
    if (threadIds.length === 0) {
      return new Response(JSON.stringify({
        threads: [], messages: [], thread_id: null,
        last_message_id_header: null, last_references_header: null, last_subject: null, suggested_status: null,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Pull lightweight metadata (headers only, no bodies) for each thread so
    // we can show a subject + date + message count in the picker.
    const threadSummaries = await Promise.all(
      threadIds.map(async (id) => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}`);
        url.searchParams.set("format", "metadata");
        url.searchParams.append("metadataHeaders", "Subject");
        url.searchParams.append("metadataHeaders", "Date");
        url.searchParams.append("metadataHeaders", "From");
        const res = await fetch(url.toString(), { headers: authHeaders });
        const data = await res.json();
        if (!res.ok || !data.messages?.length) return null;
        const msgs = data.messages.map((m: any) => messageFromApi(m, PRACTICE_EMAIL));
        const last = msgs[msgs.length - 1];
        return {
          id,
          subject: last.subject || "(no subject)",
          lastDate: last.date,
          lastDirection: last.direction,
          messageCount: msgs.length,
        };
      }),
    );
    const threads = threadSummaries.filter(Boolean).sort((a: any, b: any) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

    // 3. Fetch the FULL (bodies included) messages for the active thread only —
    // either the one explicitly requested, or the most recently active one.
    const activeThreadId = thread_id || threads[0]?.id || null;
    let messages: any[] = [];
    if (activeThreadId) {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${activeThreadId}?format=full`;
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      if (res.ok && data.messages) {
        messages = data.messages
          .map((m: any) => messageFromApi(m, PRACTICE_EMAIL))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    }
    const last = messages[messages.length - 1] || null;

    return new Response(JSON.stringify({
      threads,
      messages,
      thread_id: activeThreadId,
      last_message_id_header: last?.messageIdHeader || null,
      last_references_header: last ? `${last.referencesHeader || ""} ${last.messageIdHeader || ""}`.trim() : null,
      last_subject: last?.subject || null,
      suggested_status: last ? (last.direction === "inbound" ? "needs_reply" : "awaiting_client") : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gmail-get-client-thread] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
