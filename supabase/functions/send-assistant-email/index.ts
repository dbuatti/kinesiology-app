// @ts-nocheck
// Sends an assistant-drafted email. This is the ONLY code path that reaches the
// Gmail send API for assistant drafts — it is only ever called from the frontend's
// explicit "Send" button click on a DraftEmailCard, never from assistant-chat itself.
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

async function sendGmail(accessToken: string, from: string, to: string, subject: string, html: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const raw = [
    `From: ${from}`, `To: ${to}`, `Bcc: info@danielebuatti.com`, "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8", `Subject: ${utf8Subject}`, "", html,
  ].join("\n");
  const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail send failed (${res.status}): ${data?.error?.message || "unknown"}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let logRow: any = { function_name: "assistant-chat" };

  try {
    const { to, subject, body, client_id, appointment_id } = await req.json();
    if (!to || !subject || !body) throw new Error("Missing recipient, subject, or body.");
    logRow = { ...logRow, recipient: to, subject, client_id: client_id || null, appointment_id: appointment_id || null };

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) throw new Error("Gmail is not configured.");
    // GMAIL_USER_EMAIL is the account these credentials authenticate as, not
    // necessarily what a client should see as the sender — clients were
    // seeing daniele.buatti@gmail.com instead of the practice's real
    // address. info@danielebuatti.com is already a real, working identity
    // on this account (Daniele's own manual Gmail replies go out under it —
    // confirmed live in a real thread), so this only works if Gmail has it
    // registered as a verified "Send mail as" alias; if it isn't, Gmail's
    // API will reject the send with a clear error rather than silently
    // sending as the wrong address.
    const FROM_ADDRESS = "info@danielebuatti.com";

    const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background-color:#FDFCFB;font-family:sans-serif;">
        <center style="width:100%;background-color:#FDFCFB;padding:40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:40px;overflow:hidden;border:1px solid #F1E9EF;">
            <tr><td style="height:6px;background-color:#D46A9B;"></td></tr>
            <tr>
              <td style="padding:56px 44px;">
                <div style="text-align:left;line-height:1.8;font-size:17px;color:#334155;">
                  ${esc(body).split(/\n+/).map((p) => `<p style="margin:0 0 14px;">${p}</p>`).join("")}
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>`;

    const token = await getGmailAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    await sendGmail(token, FROM_ADDRESS, to, subject, html);

    await supabase.from("email_log").insert({ ...logRow, status: "sent" });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    await supabase.from("email_log").insert({ ...logRow, status: "failed", error_message: error.message }).then(() => {}, () => {});
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
