// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'
import { format, subMonths } from 'https://esm.sh/date-fns@3.6.0'

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}));
    const { clientId, appointmentId, force = false } = body;
    
    if (!clientId) throw new Error("Missing clientId");

    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL');

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // 1. Check for recent appointments (6-month rule)
    if (!force) {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      const { data: recentApps, error: historyError } = await supabase
        .from('appointments')
        .select('id, date')
        .eq('client_id', clientId)
        .gt('date', sixMonthsAgo)
        .neq('id', appointmentId || '') // Exclude the current appointment
        .limit(1);

      if (historyError) console.error("[send-manual-onboarding] History check error:", historyError);

      if (recentApps && recentApps.length > 0) {
        console.log(`[send-manual-onboarding] Skipping email for client ${clientId}: Recent appointment found on ${recentApps[0].date}`);
        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: "Client had an appointment within the last 6 months." 
        }), { 
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // 2. Fetch Client & Appointment
    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (!client?.email) throw new Error("Client email missing");

    let targetApp = null;
    if (appointmentId) {
      const { data: app } = await supabase.from('appointments').select('*').eq('id', appointmentId).single();
      targetApp = app;
    } else {
      const { data: apps } = await supabase.from('appointments').select('*').eq('client_id', clientId).eq('is_paid', true).eq('payment_received', false).order('date', { ascending: true }).limit(1);
      targetApp = apps?.[0];
    }

    // 3. Generate Stripe Link if needed
    let stripeUrl = targetApp?.payment_link;
    const priceAmount = targetApp?.price_amount || 50;

    if (targetApp?.is_paid && !targetApp?.payment_received && !stripeUrl) {
      console.log(`[send-manual-onboarding] Generating Stripe link for app: ${targetApp.id} at $${priceAmount}`);
      
      const session = await stripe.checkout.sessions.create({
        customer: client.stripe_customer_id || undefined,
        customer_email: client.stripe_customer_id ? undefined : client.email,
        line_items: [{
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'FNH Clinical Assessment',
              description: `Session on ${format(new Date(targetApp.date), "MMM d, yyyy")}`
            },
            unit_amount: priceAmount * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.get('origin') || 'https://kinesiology-app.vercel.app'}/onboarding/success`,
        cancel_url: `${req.headers.get('origin') || 'https://kinesiology-app.vercel.app'}/onboarding/${client.id}`,
        metadata: {
          appointment_id: targetApp.id,
          client_id: client.id
        }
      });
      
      stripeUrl = session.url;
      await supabase.from('appointments').update({ payment_link: stripeUrl }).eq('id', targetApp.id);
    }

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    const onboardingUrl = `https://kinesiology-app.vercel.app/onboarding/${client.id}`;

    const paymentSection = stripeUrl ? `
      <div style="background-color: #F8FAFC; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #E2E8F0; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; color: #1E3261; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Secure Payment ($${priceAmount})</div>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">This session is a paid clinical assessment. You can settle the fee securely via Stripe using the button below:</p>
        <a href="${stripeUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Pay via Stripe</a>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Alternatively, via PayID / Bank Transfer:</p>
          <div style="font-family: monospace; font-size: 14px; color: #1E3261; font-weight: 700;">
            PayID: 0424174067<br/>
            BSB: 923100 | ACC: 301110875
          </div>
        </div>
      </div>
    ` : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
        <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #E0F2FE;">
            <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
            <tr>
              <td style="padding: 56px 40px; text-align: center;">
                <div style="color: #1E3261; font-size: 28px; font-weight: 700;">✦ Resonance Kinesiology</div>
                <div style="color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 16px; text-transform: uppercase;">Clinical Onboarding</div>
                
                <div style="text-align: left; margin-top: 48px; line-height: 1.8; font-size: 17px; color: #334155;">
                  <p>Hi ${client.name.split(' ')[0]},</p>
                  <p>To ensure we make the most of our time together, please complete your clinical history form before we meet.</p>
                  
                  ${paymentSection}

                  <div style="text-align: center; padding: 32px 0;">
                    <a href="${onboardingUrl}" style="display: inline-block; background-color: #1E3261; color: #ffffff; padding: 20px 48px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px;">Complete Onboarding Form</a>
                  </div>
                </div>
                
                <div style="border-top: 1px solid #F1F5F9; margin-top: 40px; padding-top: 32px; text-align: left;">
                  <div style="font-weight: 700; color: #1E3261; font-size: 18px;">Daniele Buatti</div>
                  <div style="color: #D46A9B; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Neuro-Somatic Kinesiologist</div>
                </div>
              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;

    await sendGmail(accessToken, SENDER_EMAIL, client.email, "Action Required: Your Onboarding Form", htmlBody);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("[send-manual-onboarding] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})