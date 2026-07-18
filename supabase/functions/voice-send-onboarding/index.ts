// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.25.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VOICE_CLIENTS_DB_ID = "af3e38f400d84dc8975eff4b6269157b";

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
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );
  return await response.json();
}

serve(async (req) => {
  const functionName = "voice-send-onboarding";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY_VOICE');
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY_VOICE");
    const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
    const SENDER_EMAIL = Deno.env.get("GMAIL_USER_EMAIL");
    // Public-facing site URL for client-facing links (Stripe success/cancel, onboarding).
    // Must NOT depend on the caller's origin — when the practitioner books from localhost,
    // the client's email/redirect would otherwise point at localhost. Set the SITE_URL
    // secret to your production domain.
    const APP_ORIGIN = Deno.env.get('SITE_URL') || 'https://kinesiology-app.vercel.app';

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !SENDER_EMAIL) {
      throw new Error("Missing Gmail credentials in Supabase Secrets.");
    }

    const { studentName, studentEmail, date, time, duration, cost, calcomBookingUid, discipline } = await req.json();
    if (!studentName || !studentEmail || !date || !time) {
      throw new Error("Missing required fields: studentName, studentEmail, date, time");
    }
    const isPiano = discipline === "piano";

    // 1. Create Notion record if not already there (deduplicate by email)
    if (NOTION_KEY) {
      try {
        const notionHeaders = {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        };

        // Check for existing client by email
        const queryRes = await fetch(
          `https://api.notion.com/v1/databases/${VOICE_CLIENTS_DB_ID}/query`,
          {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              filter: { property: "Email", email: { equals: studentEmail.trim() } },
              page_size: 1,
            }),
          }
        );

        let existingId = null;
        if (queryRes.ok) {
          const queryData = await queryRes.json();
          if (queryData.results?.length > 0) {
            existingId = queryData.results[0].id;
          }
        }

        if (existingId) {
          console.log(`[${functionName}] Client already exists in Notion: ${existingId}`);
        } else {
          console.log(`[${functionName}] Creating Notion page for ${studentName}...`);
          await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              parent: { database_id: VOICE_CLIENTS_DB_ID },
              properties: {
                Name: { title: [{ text: { content: studentName.trim() } }] },
                Email: { email: studentEmail.trim() },
              },
            }),
          });
        }
      } catch (notionErr) {
        console.error(`[${functionName}] Notion creation error (non-fatal):`, notionErr.message);
      }
    }

    // 2. Create Stripe payment link (primary) with Cal.com booking UID for webhook matching
    let paymentUrl = null;
    if (cost && STRIPE_KEY) {
      try {
        const stripe = new Stripe(STRIPE_KEY, {
          apiVersion: '2023-10-16',
          httpClient: Stripe.createFetchHttpClient(),
        });
        const metadata: Record<string, string> = {
          student_name: studentName,
          student_email: studentEmail,
          lesson_date: date,
        };
        if (calcomBookingUid && !calcomBookingUid.startsWith("force-")) {
          metadata.calcom_booking_uid = calcomBookingUid;
        }
        const session = await stripe.checkout.sessions.create({
          customer_email: studentEmail,
          line_items: [{
            price_data: {
              currency: 'aud',
              product_data: {
                name: 'Voice & Piano Coaching',
                description: `${duration} min lesson on ${date} at ${time}`,
              },
              unit_amount: cost * 100,
            },
            quantity: 1,
          }],
          mode: 'payment',
          payment_intent_data: {
            statement_descriptor: 'VOICE COACHING',
          },
          success_url: `${APP_ORIGIN}/voice/paid`,
          cancel_url: `${APP_ORIGIN}/voice-onboarding/${encodeURIComponent(studentEmail)}`,
          metadata,
        });
        paymentUrl = session.url;
      } catch (stripeErr) {
        console.error(`[${functionName}] Stripe error (non-fatal):`, stripeErr.message);
      }
    }

    // 3. Create pending voice_onboarding record
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    try {
      await supabase.from('voice_onboarding').upsert({
        email: studentEmail,
        name: studentName,
        onboarding_completed: false,
      }, { onConflict: 'email' });
    } catch (dbErr) {
      console.error(`[${functionName}] DB error (non-fatal):`, dbErr.message);
    }

    // 4. Send welcome/confirmation email with payment + onboarding links
    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    const onboardingUrl = `${APP_ORIGIN}/voice-onboarding/${encodeURIComponent(studentEmail)}`;

    const paymentSection = paymentUrl ? `
      <div style="background-color: #FFF1F2; border-radius: 24px; padding: 24px; margin: 28px 0; border: 1px solid #FECDD3; text-align: center;">
        <div style="font-size: 10px; font-weight: 800; color: #BE123C; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Secure Payment (AU $${cost})</div>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">Complete your payment to confirm your lesson time.</p>
        <a href="${paymentUrl}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 14px;">Pay Now</a>
      </div>
    ` : '';

    const pianoTitle = "Piano Lesson";
    const voiceTitle = "Voice Lesson";
    const lessonTitle = isPiano ? pianoTitle : voiceTitle;
    const studioName = isPiano ? "Piano Studio" : "Voice Studio";
    const coachTitle = isPiano ? "Piano Coach" : "Voice Coach";
    const emoji = isPiano ? "🎹" : "🎵";
    const subjectLine = isPiano
      ? `Welcome to Piano Studio! 🎹 — Your Lesson Booking`
      : `Welcome to Voice Studio! 🎵 — Your Lesson Booking`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: sans-serif;">
        <center style="width: 100%; padding: 40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden;">
            <tr><td style="height: 6px; background-color: #E11D48;"></td></tr>
            <tr>
              <td style="padding: 56px 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
                <div style="color: #1E293B; font-size: 28px; font-weight: 700;">Welcome to ${studioName}</div>
                <div style="color: #E11D48; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 12px; text-transform: uppercase;">Lesson Confirmed</div>

                <div style="text-align: left; margin-top: 40px; line-height: 1.8; font-size: 16px; color: #475569;">
                  <p>Hi ${studentName.split(' ')[0]},</p>
                  <p>Thanks for booking a ${isPiano ? "piano" : "voice"} lesson! Here's your session details:</p>

                  <div style="background-color: #F8FAFC; border-radius: 24px; padding: 28px; margin: 28px 0; border: 1px solid #E2E8F0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Date</div>
                          <div style="font-size: 22px; font-weight: 700; color: #1E293B;">${date}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 4px; border-top: 1px solid #E2E8F0;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; margin-top: 18px;">Time</div>
                          <div style="font-size: 22px; font-weight: 700; color: #1E293B;">${time}${duration ? `<span style="color: #94A3B8; font-weight: 400; margin-left: 12px;">${duration} min</span>` : ''}</div>
                        </td>
                      </tr>
                    </table>
                  </div>

                  ${paymentSection}

                  <div style="text-align: center; padding: 12px 0 28px;">
                    <a href="${onboardingUrl}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 16px 40px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 15px;">Complete Student Profile</a>
                  </div>
                  <p style="font-size: 13px; color: #94A3B8; text-align: center;">Tell me about your goals, experience level, and what you'd like to focus on.</p>

                  <p>I'm looking forward to working with you!</p>
                </div>

                <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 32px; text-align: left;">
                  <div style="font-weight: 700; color: #1E293B; font-size: 18px;">Daniele Buatti</div>
                  <div style="color: #E11D48; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">${coachTitle}</div>
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;

    await sendGmail(accessToken, SENDER_EMAIL, studentEmail, subjectLine, htmlBody);

    console.log(`[${functionName}] Onboarding email sent to ${studentEmail}`);

    return new Response(JSON.stringify({ success: true, paymentUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
