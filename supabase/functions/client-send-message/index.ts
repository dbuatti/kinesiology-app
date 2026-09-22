// @ts-nocheck
// Client-portal "message Daniele" — sends a real email into his own Gmail
// inbox (rather than a separate in-app chat store), so it shows up
// naturally in the existing Email Thread view for that client. The client's
// identity is resolved server-side via requireClient(), never trusted from
// the request body.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireClient, resolveClientContact } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const identity = await requireClient(req, corsHeaders);
    if (identity instanceof Response) return identity;

    const { message } = await req.json();
    if (!message || !message.trim()) throw new Error("Message is empty.");

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) throw new Error("Gmail is not configured.");
    // GMAIL_USER_EMAIL is where the client's message lands; it also authenticates
    // the API call. The visible sender is the practice identity instead, so a
    // future "reply-to-sender" flow (or forwarding) shows the right address.
    const FROM_ADDRESS = "info@danielebuatti.com";

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const client = await resolveClientContact(supabase, identity);
    if (!client) throw new Error("We couldn't find your contact details on file — contact your practitioner.");

    const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const subject = `Message from ${client.name} (Client Portal)`;
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;font-size:15px;color:#334155;">
      <p><strong>${esc(client.name)}</strong> sent this via the Client Portal:</p>
      <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin:12px 0;white-space:pre-wrap;">${esc(message)}</div>
      <p style="color:#94A3B8;font-size:12px;">Reply to this email to respond directly to ${esc(client.name)}.</p>
      </body></html>`;

    const headerLines = [
      `From: ${FROM_ADDRESS}`, `To: ${SENDER}`, `Reply-To: ${client.email}`, "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8", `Subject: ${utf8Subject}`,
    ];
    const raw = [...headerLines, "", html].join("\n");
    const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const token = await getGmailAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded }),
    });
    const sendData = await sendRes.json();
    if (!sendRes.ok) throw new Error(`Gmail send failed: ${sendData?.error?.message || "unknown"}`);

    await supabase.from("email_log").insert({ function_name: "client-send-message", recipient: SENDER, subject, status: "sent", client_id: identity.clientId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[client-send-message] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
