// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.25.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requirePractitioner } from "../_shared/auth.ts"

// Branded confirmation for Cal.com event types that are neither FNH nor voice
// & piano coaching (15/30 Min Meeting, 2 hour meeting, anything new). FNH uses
// send-manual-onboarding and coaching uses voice-send-onboarding — this is the
// fallback so every Cal.com booking gets a confirmation from info@.

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

async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: info@danielebuatti.com`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    htmlBody,
  ].join('\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encodedMessage }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Gmail send failed (${response.status}): ${data?.error?.message || data?.message || "unknown"}`);
  return data;
}

async function logEmail(supabase, rec) {
  try {
    await supabase.from("email_log").insert({
      function_name: rec.fn,
      recipient: rec.to,
      subject: rec.subject ?? null,
      status: rec.status,
      error_message: rec.error ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`[${rec.fn}] email_log insert failed:`, e?.message);
  }
}

const escapeHtml = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

serve(async (req) => {
  const functionName = "send-booking-confirmation";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authErr = await requirePractitioner(req, corsHeaders);
  if (authErr) return authErr;

  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  let to = "";
  let subject = "";
  try {
    const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) throw new Error("Missing Gmail credentials in Supabase Secrets.");
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const APP_ORIGIN = Deno.env.get('SITE_URL') || 'https://kinesiology-app.vercel.app';
    const FROM_ADDRESS = "Daniele Buatti <info@danielebuatti.com>";

    const { name, email, startTime, sessionName, durationMin, price, calcomBookingUid, location } = await req.json();
    if (!email || !startTime) throw new Error("Missing required fields: email, startTime");
    to = String(email).trim();

    const start = new Date(startTime);
    if (isNaN(start.getTime())) throw new Error(`Invalid startTime: ${startTime}`);
    const friendlyDate = start.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Melbourne" });
    const friendlyTime = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
    const session = String(sessionName || "Session").trim();
    const firstName = String(name || "").trim().split(/\s+/)[0] || "there";
    const amount = Number(price) || 0;

    let paymentUrl = null;
    if (amount > 0 && STRIPE_KEY) {
      try {
        const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
        const metadata: Record<string, string> = { attendee_email: to, session: session };
        if (calcomBookingUid) metadata.calcom_booking_uid = String(calcomBookingUid);
        const checkout = await stripe.checkout.sessions.create({
          customer_email: to,
          line_items: [{
            price_data: {
              currency: 'aud',
              product_data: { name: session, description: `${session} on ${friendlyDate} at ${friendlyTime}` },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: APP_ORIGIN,
          cancel_url: APP_ORIGIN,
          metadata,
          expires_at: Math.floor(Date.now() / 1000) + 23 * 60 * 60,
        });
        paymentUrl = checkout.url;
      } catch (stripeErr) {
        console.error(`[${functionName}] Stripe error (non-fatal):`, stripeErr.message);
      }
    }

    subject = `Your ${session} is Confirmed — ${friendlyDate}`;
    const paymentSection = paymentUrl ? `
      <div style="background-color: #FFF1F2; border-radius: 24px; padding: 24px; margin: 28px 0; border: 1px solid #FECDD3; text-align: center;">
        <div style="font-size: 10px; font-weight: 800; color: #BE123C; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Secure Payment (AU $${amount})</div>
        <a href="${paymentUrl}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 14px;">Pay Now</a>
      </div>
    ` : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
        <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #E2E8F0;">
            <tr><td style="height: 6px; background-color: #1E3261;"></td></tr>
            <tr>
              <td style="padding: 56px 40px;">
                <div style="text-align: center;">
                  <div style="color: #1E3261; font-size: 28px; font-weight: 700;">Daniele Buatti</div>
                  <div style="color: #64748B; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 16px; text-transform: uppercase;">Booking Confirmed</div>
                </div>
                <div style="text-align: left; margin-top: 48px; line-height: 1.8; font-size: 17px; color: #334155;">
                  <p>Hi ${escapeHtml(firstName)},</p>
                  <p>Thanks for booking. Here are your details:</p>
                  <div style="background-color: #F8FAFC; border-radius: 24px; padding: 28px; margin: 28px 0; border: 1px solid #E2E8F0;">
                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">What</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1E293B;">${escapeHtml(session)}</div>
                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px;">Date</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1E293B;">${friendlyDate}</div>
                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px;">Time</div>
                    <div style="font-size: 20px; font-weight: 700; color: #1E293B;">${friendlyTime}</div>
${durationMin ? `                    <div style="font-size: 14px; color: #94A3B8; margin-top: 6px;">${Number(durationMin)} minutes</div>` : ''}
${location ? `                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px;">Where</div>
                    <div style="font-size: 16px; color: #1E293B;">${escapeHtml(location)}</div>` : ''}
                  </div>
                  ${paymentSection}
                  <p>If anything changes, just reply to this email.</p>
                </div>
                <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 32px; text-align: left;">
                  <div style="font-weight: 700; color: #1E3261; font-size: 18px;">Daniele Buatti</div>
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    await sendGmail(accessToken, FROM_ADDRESS, to, subject, htmlBody);
    console.log(`[${functionName}] Confirmation sent to ${to} (${session})`);
    await logEmail(supabase, { fn: functionName, to, subject, status: "sent" });

    return new Response(JSON.stringify({ success: true, paymentUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    if (to) await logEmail(supabase, { fn: functionName, to, subject, status: "failed", error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
