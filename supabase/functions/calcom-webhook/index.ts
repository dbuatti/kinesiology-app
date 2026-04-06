// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

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
  console.log("[calcom-webhook] Request received");

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: "active", provider: "gmail", version: "v47-debug" }), { 
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

    console.log(`[calcom-webhook] Event: ${triggerEvent}, BookingID: ${calcomId}`);

    // Check if an appointment already exists
    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id, send_onboarding')
      .eq('calcom_booking_id', calcomId)
      .maybeSingle();

    if (triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_REJECTED') {
      console.log("[calcom-webhook] Handling cancellation");
      if (existingApp) {
        await supabase.from('appointments').delete().eq('id', existingApp.id);
      }
      return new Response(JSON.stringify({ success: true, action: 'deleted' }), { status: 200, headers: corsHeaders });
    }

    if (triggerEvent === 'BOOKING_RESCHEDULED' && existingApp) {
      console.log("[calcom-webhook] Handling reschedule");
      await supabase.from('appointments').update({ date: payload.startTime }).eq('id', existingApp.id);
      return new Response(JSON.stringify({ success: true, action: 'rescheduled' }), { status: 200, headers: corsHeaders });
    }

    if (existingApp && triggerEvent === 'BOOKING_CREATED') {
      console.log("[calcom-webhook] Skipping duplicate booking creation");
      return new Response(JSON.stringify({ success: true, action: 'skipped_duplicate' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0];
    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const phone = attendee.phoneNumber || "";
    const startTime = payload.startTime;
    
    const isPaidSession = payload.metadata?.is_paid === "true";
    const shouldSendOnboarding = payload.metadata?.send_onboarding !== "false";
    const hasPaidViaStripe = !!(payload.payment?.[0]?.amount);

    console.log(`[calcom-webhook] Processing: ${name} (${email}), Onboarding: ${shouldSendOnboarding}`);

    let { data: dbClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
    if (!dbClient && email) {
      console.log("[calcom-webhook] Creating new client record");
      const { data: newDbC } = await supabase.from('clients').insert({ user_id: PRACTITIONER_ID, name, email, phone }).select().single();
      dbClient = newDbC;
    }

    let appointmentId = existingApp?.id;
    if (dbClient) {
      const appointmentData = {
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        is_paid: isPaidSession,
        payment_received: hasPaidViaStripe,
        send_onboarding: shouldSendOnboarding
      };
      const { data: newApp } = await supabase.from('appointments').upsert(appointmentData, { onConflict: 'calcom_booking_id' }).select('id').single();
      appointmentId = newApp?.id;
      console.log(`[calcom-webhook] Appointment ${appointmentId} upserted`);
    }

    // LOGGING THE SEND CONDITIONS
    console.log("[calcom-webhook] Checking email conditions:", {
      shouldSendOnboarding,
      hasAppointmentId: !!appointmentId,
      hasGmailClientId: !!GMAIL_CLIENT_ID,
      hasGmailSecret: !!GMAIL_CLIENT_SECRET,
      hasRefreshToken: !!GMAIL_REFRESH_TOKEN,
      hasDbClient: !!dbClient
    });

    if (shouldSendOnboarding && appointmentId && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && dbClient) {
      try {
        console.log(`[calcom-webhook] Attempting to send email to ${email}`);
        const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
        const onboardingUrl = `https://kinesiology-app.vercel.app/onboarding/${dbClient.id}?appId=${appointmentId}`;
        
        const dateObj = new Date(startTime);
        const formattedTime = new Intl.DateTimeFormat('en-AU', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Australia/Melbourne'
        }).format(dateObj);

        const showBankDetails = isPaidSession && !hasPaidViaStripe;

        const htmlBody = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
            <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; border: 1px solid #E0F2FE;">
                <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
                <tr>
                  <td style="padding: 56px 40px; text-align: center;">
                    <div style="color: #1E3261; font-size: 28px; font-weight: 700;">✦ Resonance Kinesiology</div>
                    <h2 style="color: #1E3261; margin-top: 32px; font-size: 26px; font-weight: 800;">Session Confirmed</h2>
                    <p style="text-align: left; color: #334155; line-height: 1.8; font-size: 17px;">Hi ${name.split(' ')[0]},</p>
                    <p style="text-align: left; color: #334155; line-height: 1.8; font-size: 17px;">Your appointment is confirmed for <strong>${formattedTime}</strong>.</p>
                    <p style="text-align: left; color: #334155; line-height: 1.8; font-size: 17px;">Please complete your clinical onboarding form before we meet:</p>
                    
                    ${showBankDetails ? `
                      <div style="background-color: #F8FAFC; border-radius: 24px; padding: 24px; margin: 24px 0; border: 1px solid #E2E8F0; text-align: left;">
                        <div style="font-size: 11px; font-weight: 800; color: #1E3261; text-transform: uppercase; margin-bottom: 8px;">Payment Details ($50)</div>
                        <p style="margin: 0; font-size: 14px; color: #475569;">BSB: 923100 | ACC: 301110875</p>
                      </div>
                    ` : ''}

                    <div style="text-align: center; padding: 32px 0;">
                      <a href="${onboardingUrl}" style="display: inline-block; background-color: #1E3261; color: #ffffff; padding: 20px 48px; border-radius: 100px; text-decoration: none; font-weight: 700;">Complete Onboarding Form</a>
                    </div>
                  </td>
                </tr>
              </table>
            </center>
          </body>
          </html>
        `;

        const result = await sendGmail(accessToken, SENDER_EMAIL, email, "Action Required: Your Onboarding Form", htmlBody);
        console.log("[calcom-webhook] Gmail API response:", JSON.stringify(result));
      } catch (e) {
        console.error("[calcom-webhook] Failed to send Gmail:", e.message);
      }
    } else {
      console.log("[calcom-webhook] Email send conditions not met. Skipping email.");
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[calcom-webhook] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})