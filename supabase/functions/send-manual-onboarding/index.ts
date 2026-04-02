// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { clientId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL');

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
      throw new Error("Gmail API secrets are not configured.");
    }

    // Fetch client and their appointments, sorted by date descending to find the most recent status
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, appointments(is_paid, date)')
      .eq('id', clientId)
      .single();

    if (clientError || !client) throw new Error("Client not found.");
    if (!client.email) throw new Error("Client has no email address.");

    // Check if the most recent appointment is marked as paid
    const sortedApps = (client.appointments || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const isPaid = sortedApps.length > 0 ? sortedApps[0].is_paid : false;

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    const onboardingUrl = `https://kinesiology-app.vercel.app/onboarding/${client.id}`;
    
    const paymentSection = isPaid ? `
      <div style="background-color: #F8FAFC; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #E2E8F0;">
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
        <style>
          body { margin: 0; padding: 0; background-color: #FDFCFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .wrapper { width: 100%; background-color: #FDFCFB; padding: 40px 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #E0F2FE; box-shadow: 0 20px 40px -10px rgba(30, 50, 97, 0.05); }
          .top-bar { height: 6px; background-color: #D46A9B; width: 100%; }
          .header { padding: 56px 40px 40px 40px; text-align: center; }
          .logo { color: #1E3261; font-size: 28px; font-weight: 700; letter-spacing: 0.02em; }
          .sub-logo { color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 16px; text-transform: uppercase; opacity: 0.8; }
          .content { padding: 0 56px 48px 56px; line-height: 1.8; font-size: 17px; color: #334155; font-weight: 400; }
          .button-container { text-align: center; padding: 32px 0; }
          .button { display: inline-block; background-color: #1E3261; color: #ffffff !important; padding: 20px 48px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.05em; box-shadow: 0 12px 20px -5px rgba(30, 50, 97, 0.25); }
          .signature { padding: 0 56px 56px 56px; border-top: 1px solid #F1F5F9; margin-top: 20px; padding-top: 32px; }
          .sig-name { font-weight: 700; color: #1E3261; font-size: 20px; margin-bottom: 4px; }
          .sig-title { color: #D46A9B; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; }
          .footer { padding: 48px 20px; text-align: center; color: #64748b; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="top-bar"></div>
            <div class="header">
              <div class="logo">✦ Resonance Kinesiology</div>
              <div class="sub-logo">Neuro-Somatic Support</div>
            </div>
            <div class="content">
              <h2 style="color: #1E3261; margin-top: 0; font-size: 26px; font-weight: 800;">Clinical Onboarding</h2>
              <p>Hi ${client.name.split(' ')[0]},</p>
              <p>To ensure we make the most of our time together, I need to gather some foundational information about your clinical history and current health goals.</p>
              
              <p>This form allows me to review your context before we meet, so we can dive straight into the neurological work during our session.</p>

              ${paymentSection}

              <div class="button-container">
                <a href="${onboardingUrl}" class="button">Complete Onboarding Form</a>
              </div>
              
              <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                The form takes about 5-10 minutes to complete and is stored securely in our clinical database.
              </p>
            </div>
            <div class="signature">
              <div class="sig-name">Daniele Buatti</div>
              <div class="sig-title">Neuro-Somatic Kinesiologist</div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Resonance Kinesiology</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendGmail(accessToken, SENDER_EMAIL, client.email, "Action Required: Your Onboarding Form", htmlBody);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})