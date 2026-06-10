// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

function buildEmail(from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: daniele.buatti@gmail.com`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    htmlBody,
  ];
  const message = messageParts.join('\n');
  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER_EMAIL = Deno.env.get("GMAIL_USER_EMAIL");

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !SENDER_EMAIL) {
      throw new Error("Missing Gmail credentials in Supabase Secrets.");
    }

    const payload = await req.json().catch(() => ({}));
    const { clientName, clientEmail, currentRate, targetRate, effectiveMonth } = payload;

    const missing: string[] = [];
    if (!clientName) missing.push("clientName");
    if (!clientEmail) missing.push("clientEmail");
    if (currentRate === undefined || currentRate === null || currentRate === "") missing.push("currentRate");
    if (targetRate === undefined || targetRate === null || targetRate === "") missing.push("targetRate");
    if (missing.length > 0) {
      console.error("Received payload:", JSON.stringify(payload));
      throw new Error(`Missing fields: ${missing.join(", ")}`);
    }

    const firstName = clientName.split(' ')[0];
    const body = `
Hi ${firstName},

I hope this finds you well!

I just wanted to take a moment to say a huge thank you for working with me and for trusting me with your health and integration journey. It is always a privilege to support you.

I'm writing to let you know that from ${effectiveMonth || 'next month'} onwards, my session rate for you will be moving from $${currentRate} to $${targetRate} per session.

This allows me to continue investing in advanced clinical training, specialist protocols, and high-quality integration resources — all to ensure I'm able to support you in the very best way possible.

Please don't hesitate to reply directly to this email if you have any questions or would like to have a chat about it.

Looking forward to our next session!

Warmly,
Daniele`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: sans-serif;">
        <center style="width: 100%; padding: 40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
            <tr><td style="height: 4px; background-color: #4f46e5;"></td></tr>
            <tr>
              <td style="padding: 48px 40px;">
                <div style="color: #1E293B; font-size: 20px; font-weight: 700; margin-bottom: 4px;">Session Rate Update</div>
                <div style="color: #94A3B8; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">For ${firstName}</div>
                
                <div style="text-align: left; margin-top: 32px; line-height: 1.8; font-size: 16px; color: #475569;">
                  <p>Hi ${firstName},</p>
                  <p>I hope this finds you well!</p>
                  <p>I just wanted to take a moment to say a huge thank you for working with me and for trusting me with your health and integration journey. It is always a privilege to support you.</p>
                  
                  <div style="background-color: #F8FAFC; border-radius: 16px; padding: 24px; margin: 28px 0; border: 1px solid #E2E8F0; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Rate Change</div>
                    <div style="font-size: 24px; font-weight: 700; color: #1E293B;">$${currentRate} <span style="color: #4f46e5; margin: 0 8px;">→</span> $${targetRate}</div>
                    <div style="font-size: 12px; color: #64748B; margin-top: 6px;">per session · effective ${effectiveMonth || 'next month'}</div>
                  </div>
                  
                  <p>This allows me to continue investing in advanced clinical training, specialist protocols, and high-quality integration resources — all to ensure I'm able to support you in the very best way possible.</p>
                  <p>Please don't hesitate to reply directly to this email if you have any questions or would like to have a chat about it.</p>
                  <p>Looking forward to our next session!</p>
                </div>
                
                <div style="border-top: 1px solid #F1F5F9; margin-top: 32px; padding-top: 24px; text-align: left;">
                  <div style="font-weight: 700; color: #1E293B; font-size: 16px;">Daniele Buatti</div>
                  <div style="color: #4f46e5; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Clinical Kinesiology</div>
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>`;

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    const raw = buildEmail(SENDER_EMAIL, clientEmail, `Session Rate Update — ${firstName}`, htmlBody);

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Failed to send email");

    console.log(`Rate increase email sent to ${clientEmail} — ${currentRate} → ${targetRate}`);

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
