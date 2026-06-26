// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'
import { format } from 'https://esm.sh/date-fns@3.6.0'
import { requireUser } from "../_shared/auth.ts"

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

// Fields on the clients table that belong to the intake form.
// Used to calculate what percentage of the form is filled out.
const INTAKE_FIELDS = [
  'name', 'email', 'phone', 'born', 'home_address',
  'referral_source', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
  'occupation', 'children', 'change_one_thing', 'never_been_same_since', 'chief_complaint',
  'health_problem_severity', 'seen_medical_doctor', 'symptoms_worse_stress', 'symptoms_worse_fatigue',
  'pain_movement', 'current_stress_level', 'therapies_used', 'therapies_other', 'therapies_success',
  'specific_illnesses', 'covid_vaccinated', 'covid_shots', 'allergies_asthma',
  'energy_worse_time', 'family_medical_history', 'alcohol_frequency',
  'sleep_schedule', 'sleep_quality_details', 'concussion_history', 'concussion_details',
  'birthing_experience', 'avoided_emotion', 'craved_emotion', 'stress_response',
  'most_craved_human_need', 'startled_by_loud_noises', 'emotional_regulation_time', 'additional_notes',
];

function isIntakeFormFilled(client: Record<string, any>): boolean {
  let filled = 0;
  for (const field of INTAKE_FIELDS) {
    const val = client[field];
    if (val != null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      filled++;
    }
  }
  return (filled / INTAKE_FIELDS.length) >= 0.5;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const authErr = await requireUser(req, corsHeaders)
  if (authErr) return authErr

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

    // 1. Fetch Client & Appointment
    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (!client?.email) throw new Error("Client email missing");

    let targetApp = null;
    if (appointmentId) {
      const { data: app } = await supabase.from('appointments').select('*').eq('id', appointmentId).single();
      targetApp = app;
    } else {
      const { data: apps } = await supabase.from('appointments').select('*').eq('client_id', clientId).order('date', { ascending: false }).limit(1);
      targetApp = apps?.[0];
    }

    // 2. Generate Stripe Link — always send for any non-free session.
    let stripeUrl = null;
    const priceAmount = client?.standard_rate || targetApp?.price_amount || 50;

    if (targetApp && priceAmount > 0) {
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
        success_url: `${Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://kinesiology-app.vercel.app'}/onboarding/success`,
        cancel_url: `${Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://kinesiology-app.vercel.app'}/onboarding/${client.id}`,
        metadata: {
          appointment_id: targetApp.id,
          client_id: client.id
        }
      });
      
      stripeUrl = session.url;
      await supabase.from('appointments').update({ payment_link: stripeUrl }).eq('id', targetApp.id);
    }

    // 3. Check if intake form is filled enough (skip CTA if >= 50% complete).
    const intakeFilled = isIntakeFormFilled(client);
    const intakeUrl = `${Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://kinesiology-app.vercel.app'}/onboarding/${client.id}`;

    const appDate = targetApp?.date ? format(new Date(targetApp.date), "EEEE, MMMM d, yyyy 'at' h:mm a") : null;

    const appointmentSection = appDate ? `
      <div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #F1F5F9;">
        <div style="font-size: 13px; color: #64748B; margin-bottom: 8px;">Appointment</div>
        <div style="font-size: 18px; font-weight: 700; color: #1E3261;">${appDate}</div>
      </div>
    ` : '';

    const paymentSection = stripeUrl ? `
      <div style="background-color: #F8FAFC; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #E2E8F0; text-align: center;">
        <div style="font-size: 11px; font-weight: 800; color: #1E3261; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Secure Payment ($${priceAmount})</div>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #475569; line-height: 1.6;">This session is a paid clinical assessment. You can settle the fee securely via Stripe using the button below:</p>
        <div style="text-align: center;"><a href="${stripeUrl}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Pay via Stripe</a></div>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Alternatively, via PayID / Bank Transfer:</p>
          <div style="font-family: monospace; font-size: 14px; color: #1E3261; font-weight: 700;">
            PayID: 0424174067<br/>
            BSB: 923100 | ACC: 301110875
          </div>
        </div>
      </div>
    ` : '';

    const intakeSection = intakeFilled ? '' : `
      <div style="text-align: center; padding: 32px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background-color: #1E3261; color: #ffffff; padding: 20px 48px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px;">Complete Intake Form</a>
      </div>
    `;

    const subject = stripeUrl
      ? `Your FNH Session is Confirmed`
      : `Your FNH Session is Confirmed`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #FDFCFB; font-family: sans-serif;">
        <center style="width: 100%; background-color: #FDFCFB; padding: 40px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #E0F2FE;">
            <tr><td style="height: 6px; background-color: #D46A9B;"></td></tr>
            <tr>
              <td style="padding: 56px 40px;">
                <div style="text-align: center;">
                  <div style="color: #1E3261; font-size: 28px; font-weight: 700;">✦ Resonance Kinesiology</div>
                  <div style="color: #D46A9B; font-size: 11px; font-weight: 900; letter-spacing: 0.4em; margin-top: 16px; text-transform: uppercase;">Functional Neuro Health</div>
                </div>
                
                <div style="text-align: left; margin-top: 48px; line-height: 1.8; font-size: 17px; color: #334155;">
                  <p>Hi ${client.name.split(' ')[0]},</p>
                  <p>Your Functional Neuro Health session has been booked.</p>
                  
                  ${appointmentSection}

                  ${paymentSection}

                  ${!intakeFilled ? `
                    <div style="margin-top: 32px; padding: 24px; background-color: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; text-align: center;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748B;">If you haven't already, please also complete your clinical intake form so we can prepare for your session.</p>
                      <div style="text-align: center;"><a href="${intakeUrl}" style="display: inline-block; background-color: #1E3261; color: #ffffff; padding: 12px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 14px;">Complete Intake Form</a></div>
                    </div>
                  ` : ''}
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

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    await sendGmail(accessToken, SENDER_EMAIL, client.email, subject, htmlBody);

    return new Response(JSON.stringify({ 
      success: true, 
      paymentLinkSent: !!stripeUrl,
      intakeFormSent: !intakeFilled,
    }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("[send-manual-onboarding] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})