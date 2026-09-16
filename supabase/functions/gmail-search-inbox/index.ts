// @ts-nocheck
// Read-only Gmail search, backing the assistant's `search_inbox` tool. Uses a
// SEPARATE refresh token (GMAIL_READONLY_INBOX_REFRESH_TOKEN, gmail.readonly scope)
// from the existing send-only GMAIL_REFRESH_TOKEN — this function can never send,
// modify, or delete anything, only list/read.
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { query, maxResults } = await req.json();
    if (!query) throw new Error("Missing search query.");

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_READONLY_INBOX_REFRESH_TOKEN");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH) throw new Error("Gmail inbox read is not configured.");

    const accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("q", query);
    listUrl.searchParams.set("maxResults", String(Math.min(maxResults || 8, 15)));

    const listRes = await fetch(listUrl.toString(), { headers: authHeaders });
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error(listData?.error?.message || "Gmail search failed.");

    const messages = listData.messages || [];
    const results = await Promise.all(
      messages.map(async (m: { id: string; threadId: string }) => {
        const msgUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`);
        msgUrl.searchParams.set("format", "metadata");
        ["From", "To", "Subject", "Date"].forEach((h) => msgUrl.searchParams.append("metadataHeaders", h));
        const msgRes = await fetch(msgUrl.toString(), { headers: authHeaders });
        const msgData = await msgRes.json();
        if (!msgRes.ok) return null;
        const headers = msgData.payload?.headers || [];
        return {
          id: m.id,
          threadId: m.threadId,
          from: headerValue(headers, "From"),
          to: headerValue(headers, "To"),
          subject: headerValue(headers, "Subject"),
          date: headerValue(headers, "Date"),
          snippet: msgData.snippet || "",
        };
      }),
    );

    return new Response(JSON.stringify({ results: results.filter(Boolean), resultSizeEstimate: listData.resultSizeEstimate || 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gmail-search-inbox] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
