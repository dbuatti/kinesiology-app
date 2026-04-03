// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

// Helper to get Gmail Access Token using Refresh Token
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
  return data.access_token;
}

// Helper to send email via Gmail API
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
  return response.json();
}

serve(async (req) => {
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: "active", provider: "gmail", version: "v43" }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL');
    
    const PRACTITIONER_ID = "6f2caa85-bfce-4264-97cd-c0d2f62b24f0";

    const body = await req.json();
    const triggerEvent = body.triggerEvent;
    const payload = body.payload || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id')
      .eq('calcom_booking_id', calcomId)
      .maybeSingle();

    // Handle Cancellation
    if (triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_REJECTED') {
      if (existingApp) {
        await supabase.from('appointments').delete().eq('id', existingApp.id);
      }
      return new Response(JSON.stringify({ success: true, action: 'deleted' }), { status: 200, headers: corsHeaders });
    }

    // Handle Reschedule
    if (triggerEvent === 'BOOKING_RESCHEDULED' && existingApp) {
      await supabase
        .from('appointments')
        .update({ date: payload.startTime })
        .eq('id', existingApp.id);
      return new Response(JSON.stringify({ success: true, action: 'rescheduled' }), { status: 200, headers: corsHeaders });
    }

    // Handle New Booking
    if (existingApp && triggerEvent === 'BOOKING_CREATED') {
      return new Response(JSON.stringify({ success: true, action: 'skipped_duplicate' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0];
    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;
    const hasPaidViaStripe = !!(payload.payment?.[0]?.amount || payload.metadata?.is_paid === "true");

    const dateObj = new Date(startTime);
    const formattedTime = new Intl.DateTimeFormat('en-AU', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Australia/Melbourne'
    }).format(dateObj);

    let { data: dbClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
    if (!dbClient && email) {
      const { data: newDbC } = await supabase.from('clients').insert({ user_id: PRACTITIONER_ID, name, email, phone }).select().single();
      dbClient = newDbC;
    }

    if (!existingApp && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && dbClient) {
      try {
        const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
        const onboardingUrl = `https://kinesiology-app.vercel.app/onboarding/${dbClient.id}`;
        const showBankDetails = !hasPaidViaStripe;

        const paymentSection = showBankDetails ? `
          <div style="background-color: #F8FAFC; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #E2E8F0; text-align: left;">
            <div style="font-size: 11px; font-weight: 800; color: #1E3261; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Payment Details ($50)</div>
            <p style="margin: 0; font-size: 16px; color: #475569; line-height: 1.6;">This session is a paid clinical assessment. You can settle the fee via bank transfer using the details below, or via tap-to-pay during our session:</p>
            <div style="margin-top: 24px; padding: 20px; background-color: #ffffff; border-radius: 16px; border: 1px solid #F1F5F9; font-family: monospace; font-size: 18px; color: #1E3261; font-weight: 700; text-align: center;">
              BSB: 923100<br/>
              ACC: 301110875
            </div>
          </div>
        ` : '';

        const htmlBody = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                <tr>
                  <td style="background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #E0F2FE; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <!-- Top Accent Bar -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
                    </table>

                    <!-- Header Section -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 56px 40px 40px 40px; text-align: center;">
                      <tr>
                        <td>
                          <div style="color: #1E3261; font-size: 28px; font-weight: 700; letter-spacing: 0.02em;">✦ Resonance Kinesiology</div>
                          <div style="color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 16px; text-transform: uppercase; opacity: 0.8;">Neuro-Somatic Support</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Main Content -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 0 56px 56px 56px; text-align: left;">
                      <tr>
                        <td style="line-height: 1.8; font-size: 17px; color: #334155;">
                          <h2 style="color: #1E3261; margin-top: 0; font-size: 26px; font-weight: 800; text-align: center;">Session Confirmed</h2>
                          <p style="margin-top: 24px;">Hi ${name.split(' ')[0]},</p>
                          <p>Thank you for booking your session. Your appointment is confirmed for:</p>
                          
                          <!-- Time Block -->
                          <div style="background-color: #F0F9FF; border-radius: 24px; padding: 32px; margin: 32px 0; text-align: center; border: 1px solid #E0F2FE;">
                            <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Scheduled Time</div>
                            <div style="font-size: 20px; font-weight: 800; color: #1E3261;">${formattedTime}</div>
                          </div>

                          <p>Please complete your clinical onboarding form before we meet:</p>
                          
                          ${paymentSection}

                          <div style="text-align: center; padding: 32px 0;">
                            <a href="${onboardingUrl}" style="display: inline-block; background-color: #1E3261; color: #ffffff; padding: 20px 48px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.05em;">Complete Onboarding Form</a>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Signature -->
                      <tr>
                        <td style="border-top: 1px solid #F1F5F9; margin-top: 20px; padding-top: 32px;">
                          <div style="font-weight: 700; color: #1E3261; font-size: 20px; margin-bottom: 4px;">Daniele Buatti</div>
                          <div style="color: #D46A9B; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">Neuro-Somatic Kinesiologist</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 48px 20px; text-align: center; color: #64748b; font-size: 13px;">
                    <p>© ${new Date().getFullYear()} Resonance Kinesiology</p>
                  </td>
                </tr>
              </table>
            </center>
          </body>
          </html>
        `;

        await sendGmail(accessToken, SENDER_EMAIL, email, "Action Required: Your Onboarding Form", htmlBody);
      } catch (e) {
        console.error("[calcom-webhook] Failed to send Gmail:", e.message);
      }
    }

    if (dbClient) {
      const appointmentData = {
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        is_paid: true,
        payment_received: hasPaidViaStripe
      };
      await supabase.from('appointments').upsert(appointmentData, { onConflict: 'calcom_booking_id' });
    }

    return new Response(JSON.stringify({ success: true, action: existingApp ? 'updated' : 'created' }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[calcom-webhook] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})