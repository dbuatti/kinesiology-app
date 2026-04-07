// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
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
  if (!response.ok) {
    console.error("[calcom-webhook] Failed to get Gmail access token:", data);
    throw new Error("Gmail Auth Failed");
  }
  return data.access_token;
}

async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(encodeURIComponent(subject).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}?=`;
  
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
  const encodedMessage = btoa(encodeURIComponent(message).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
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
  
  const result = await response.json();
  if (!response.ok) {
    console.error("[calcom-webhook] Gmail API Error:", result);
    throw new Error(`Gmail API Error: ${result.error?.message || 'Unknown error'}`);
  }
  return result;
}

serve(async (req) => {
  console.log(`[calcom-webhook] Incoming ${req.method} request`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get the first available practitioner profile
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    if (!PRACTITIONER_ID) {
      throw new Error("System configuration error: No practitioner profile found.");
    }

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    
    console.log(`[calcom-webhook] Event: ${triggerEvent}`);

    if (triggerEvent === 'PING') {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid || (body.payload && body.payload.id));

    if (triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_REJECTED') {
      console.log(`[calcom-webhook] Deleting cancelled booking: ${calcomId}`);
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) {
      console.log("[calcom-webhook] Skipping: No attendee data found.");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;
    
    const metadataIsPaid = payload.metadata?.is_paid;
    let isPaidSession = true; 
    
    if (metadataIsPaid !== undefined) {
      isPaidSession = metadataIsPaid === "true";
    }

    const hasPaidViaStripe = !!(payload.payment?.[0]?.amount || payload.paymentId);

    console.log(`[calcom-webhook] Processing ${email}. Paid: ${isPaidSession}, Stripe: ${hasPaidViaStripe}`);

    // Use upsert for client to handle existing emails gracefully
    const { data: dbClient, error: clientError } = await supabase
      .from('clients')
      .upsert({ 
        user_id: PRACTITIONER_ID, 
        name, 
        email, 
        phone: attendee.phoneNumber || attendee.phone || "" 
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (clientError) {
      console.error("[calcom-webhook] Client upsert failed:", clientError);
      throw clientError;
    }

    let appointmentId = null;
    if (dbClient) {
      const appointmentData = {
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        is_paid: isPaidSession,
        payment_received: hasPaidViaStripe
      };
      
      const { data: newApp, error: appErr } = await supabase
        .from('appointments')
        .upsert(appointmentData, { onConflict: 'calcom_booking_id' })
        .select('id')
        .single();
        
      if (appErr) {
        console.error("[calcom-webhook] Appointment upsert failed:", appErr);
        throw appErr;
      }
      appointmentId = newApp.id;
    }

    // Send onboarding email for new bookings
    if ((triggerEvent === 'BOOKING_CREATED' || triggerEvent === 'BOOKING_PAID') && dbClient && email) {
      const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
      const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
      const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
      const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL');

      if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
        try {
          const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
          const onboardingUrl = `https://kinesiology-app.vercel.app/onboarding/${dbClient.id}`;
          
          const paymentSection = (isPaidSession && !hasPaidViaStripe) ? `
            <div style="background-color: #F8FAFC; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #E2E8F0; text-align: left;">
              <div style="font-size: 11px; font-weight: 800; color: #1E3261; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Payment Details ($50)</div>
              <p style="margin: 0; font-size: 16px; color: #475569; line-height: 1.6;">This session is a paid clinical assessment. You can settle the fee via PayID or bank transfer using the details below, or via tap-to-pay during our session:</p>
              <div style="margin-top: 24px; padding: 20px; background-color: #ffffff; border-radius: 16px; border: 1px solid #F1F5F9; font-family: monospace; font-size: 18px; color: #1E3261; font-weight: 700; text-align: center;">
                PayID: 0424174067<br/>
                <div style="margin: 12px 0; border-top: 1px solid #F1F5F9;"></div>
                BSB: 923100<br/>
                ACC: 301110875
              </div>
            </div>
          ` : '';

          const htmlBody = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
              <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; border: 1px solid #E0F2FE;">
                  <tr><td style="height: 6px; background-color: #D46A9B; border-radius: 40px 40px 0 0;"></td></tr>
                  <tr>
                    <td style="padding: 56px 40px; text-align: center;">
                      <div style="color: #1E3261; font-size: 28px; font-weight: 700;">✦ Resonance Kinesiology</div>
                      <h2 style="color: #1E3261; margin-top: 32px; font-size: 26px; font-weight: 800;">Clinical Onboarding</h2>
                      <p style="font-size: 17px; color: #334155; line-height: 1.8; text-align: left; margin-top: 24px;">Hi ${name.split(' ')[0]},</p>
                      <p style="font-size: 17px; color: #334155; line-height: 1.8; text-align: left;">To ensure we make the most of our time together, please complete your clinical history form before we meet.</p>
                      ${paymentSection}
                      <div style="text-align: center; padding: 32px 0;">
                        <a href="${onboardingUrl}" style="display: inline-block; background-color: #1E3261; color: #ffffff; padding: 20px 48px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px;">Complete Onboarding Form</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </center>
            </body>
            </html>
          `;

          await sendGmail(accessToken, SENDER_EMAIL, email, "Action Required: Your Onboarding Form", htmlBody);
          console.log(`[calcom-webhook] Onboarding email sent to ${email}`);
        } catch (emailErr) {
          console.error("[calcom-webhook] Email sending failed:", emailErr.message);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[calcom-webhook] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})