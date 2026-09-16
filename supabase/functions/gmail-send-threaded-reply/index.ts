// @ts-nocheck
// Sends a REAL reply that lands in the same Gmail thread as the client sees it
// (In-Reply-To/References headers + Cal.com-style threadId), rather than a new,
// disconnected email. Only ever called from an explicit user click on the Send
// button in ClientEmailThread.tsx — never called by the AI assistant directly.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePractitioner } from "../_shared/auth.ts";

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
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let logRow: any = { function_name: "gmail-send-threaded-reply" };

  try {
    const { to, subject, body, thread_id, in_reply_to, references, client_id, client_name } = await req.json();
    if (!to || !subject || !body) throw new Error("Missing recipient, subject, or body.");
    logRow = { ...logRow, recipient: to, subject, client_id: client_id || null };

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) throw new Error("Gmail is not configured.");

    const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const firstName = (client_name || "").trim().split(" ")[0];
    // The practitioner types just the message body — greeting and sign-off are
    // added automatically, matching the branded template used by every other
    // client-facing email in this app (send-proposed-times etc.).
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background-color:#FDFCFB;font-family:sans-serif;">
        <center style="width:100%;background-color:#FDFCFB;padding:40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:40px;overflow:hidden;border:1px solid #F1E9EF;">
            <tr><td style="height:6px;background-color:#D46A9B;"></td></tr>
            <tr>
              <td style="padding:48px 44px 32px;">
                <div style="text-align:center;">
                  <div style="color:#1E3261;font-size:22px;font-weight:700;">✦ Resonance Kinesiology</div>
                </div>
                <div style="text-align:left;margin-top:36px;line-height:1.8;font-size:17px;color:#334155;">
                  ${firstName ? `<p style="margin:0 0 18px;">Hi ${esc(firstName)},</p>` : ""}
                  ${esc(body).split(/\n+/).map((p) => `<p style="margin:0 0 14px;">${p}</p>`).join("")}
                  <div style="margin-top:32px;">
                    <p style="margin:0;">All the best,</p>
                    <div style="font-weight:700;color:#1E3261;font-size:18px;margin-top:6px;">Daniele</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 44px;background-color:#FAF7F5;border-top:1px solid #F1E9EF;">
                <div style="text-align:center;font-size:12px;color:#94A3B8;line-height:1.6;">
                  Resonance Kinesiology — Daniele Buatti<br />
                  <a href="mailto:info@danielebuatti.com" style="color:#D46A9B;text-decoration:none;">info@danielebuatti.com</a>
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>`;

    const buildRaw = (withThreading: boolean) => {
      const headerLines = [
        `From: ${SENDER}`, `To: ${to}`, `Cc: info@danielebuatti.com`, "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8", `Subject: ${utf8Subject}`,
      ];
      if (withThreading && in_reply_to) headerLines.push(`In-Reply-To: ${in_reply_to}`);
      if (withThreading && references) headerLines.push(`References: ${references}`);
      const raw = [...headerLines, "", html].join("\n");
      return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    const token = await getGmailAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const attemptSend = async (withThreading: boolean) => {
      const sendBody: any = { raw: buildRaw(withThreading) };
      if (withThreading && thread_id) sendBody.threadId = thread_id;
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(sendBody),
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    };

    let sendResult = await attemptSend(!!(thread_id || in_reply_to));
    let threadedFallback = false;
    // A stale/mismatched thread reference (e.g. the "last message" the thread
    // fetch found turned out to be an unrelated old email, or the thread was
    // since deleted) makes Gmail 404 on the threaded attempt. Rather than
    // failing the whole send, fall back to a plain, unthreaded email — the
    // message still needs to reach the client even if it won't thread nicely.
    if (!sendResult.ok && sendResult.status === 404 && (thread_id || in_reply_to)) {
      threadedFallback = true;
      sendResult = await attemptSend(false);
    }
    if (!sendResult.ok) throw new Error(`Gmail send failed (${sendResult.status}): ${sendResult.data?.error?.message || "unknown"}`);

    await supabase.from("email_log").insert({ ...logRow, status: "sent" });

    // A reply naturally means "waiting on the client" now — keep status tracking
    // honest. Only updates an existing row (no-op if none yet); the frontend
    // creates the initial row via upsert, which has the authenticated user_id RLS needs.
    if (client_id) {
      await supabase.from("client_email_status").update({ status: "awaiting_client", updated_at: new Date().toISOString() }).eq("client_id", client_id);
    }

    return new Response(JSON.stringify({
      success: true,
      threaded: !threadedFallback && !!(thread_id || in_reply_to),
      note: threadedFallback ? "Sent as a new email — the previous conversation reference was stale, so it may not thread with earlier messages." : undefined,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    await supabase.from("email_log").insert({ ...logRow, status: "failed", error_message: error.message }).then(() => {}, () => {});
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
