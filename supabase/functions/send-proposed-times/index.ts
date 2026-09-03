// @ts-nocheck
// Emails a client the session time you've penciled in for them, asking them to
// confirm or suggest a change. Called from the Timetable auto-draft.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

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
    `From: ${from}`, `To: ${to}`, `Bcc: daniele.buatti@gmail.com`, "MIME-Version: 1.0",
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
  const authErr = await requireUser(req, corsHeaders);
  if (authErr) return authErr;

  try {
    const { to, name, startISO, kind, message } = await req.json();
    if (!to || !startISO) throw new Error("Missing recipient or time.");
    const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) throw new Error("Gmail is not configured.");

    const d = new Date(startISO);
    const friendlyDate = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne" });
    const friendlyTime = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Melbourne" });
    const firstName = (name || "there").split(" ")[0];
    const sessionType = kind === "voice" ? "session" : "session";

    const subject = `A time for you — does ${friendlyDate} work?`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background-color:#FDFCFB;font-family:sans-serif;">
        <center style="width:100%;background-color:#FDFCFB;padding:40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:40px;overflow:hidden;border:1px solid #F1E9EF;">
            <tr><td style="height:6px;background-color:#D46A9B;"></td></tr>
            <tr>
              <td style="padding:56px 44px;">
                <div style="text-align:center;">
                  <div style="color:#1E3261;font-size:26px;font-weight:700;">✦ Resonance Kinesiology</div>
                  <div style="color:#D46A9B;font-size:11px;font-weight:900;letter-spacing:0.36em;margin-top:14px;text-transform:uppercase;">Proposed Time</div>
                </div>
                <div style="text-align:left;margin-top:44px;line-height:1.8;font-size:17px;color:#334155;">
                  ${message
                    ? esc(message).split(/\n+/).map((p) => `<p style="margin:0 0 14px;">${p}</p>`).join("")
                    : `<p style="margin:0 0 18px;">Hi ${firstName},</p>
                       <p style="margin:0 0 8px;">I've pencilled you in for your next ${sessionType}:</p>
                       <div style="background-color:#F8FAFC;border-radius:20px;padding:24px;margin:20px 0;border:1px solid #EEF2F7;text-align:center;">
                         <div style="font-size:22px;font-weight:700;color:#1E293B;">${friendlyDate}</div>
                         <div style="font-size:16px;color:#64748B;margin-top:6px;">${friendlyTime}</div>
                       </div>
                       <p style="margin:20px 0 0;">Does that work for you? Just reply to let me know — and if it's not quite right, tell me what suits and I'll move it.</p>
                       <div style="margin-top:40px;"><p style="margin:0;">All the best,</p><div style="font-weight:700;color:#1E3261;font-size:18px;margin-top:6px;">Daniele</div></div>`}
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>`;

    const token = await getGmailAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    await sendGmail(token, SENDER, to, subject, html);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
