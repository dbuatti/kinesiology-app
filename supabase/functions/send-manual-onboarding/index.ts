// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'
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
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gmail send failed (${response.status}): ${data?.error?.message || data?.message || "unknown"}`);
  }
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
      appointment_id: rec.appointment_id ?? null,
      client_id: rec.client_id ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`[${rec.fn}] email_log insert failed:`, e?.message);
  }
}

// Fields on the clients table that belong to the intake form.
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
    const { clientId, appointmentId, force } = body;

    if (!clientId) throw new Error("Missing clientId");

    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    const SENDER_EMAIL = Deno.env.get('GMAIL_USER_EMAIL');
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const APP_ORIGIN = Deno.env.get('SITE_URL') || 'https://kinesiology-app.vercel.app';

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (!client?.email) throw new Error("Client email missing");

    // Resolve the appointment: a specific id, else the client's most recent.
    let appointment: any = null;
    if (appointmentId) {
      const { data } = await supabase.from('appointments').select('*').eq('id', appointmentId).maybeSingle();
      appointment = data;
    } else {
      const { data } = await supabase.from('appointments').select('*').eq('client_id', clientId).order('date', { ascending: false }).limit(1);
      appointment = data?.[0] || null;
    }

    const priceAmount = appointment?.price_amount ?? 0;
    const alreadyPaid = appointment?.is_paid === true || appointment?.payment_received === true;
    const existingLink = appointment?.payment_link;
    const needsPayment = priceAmount > 0 && !alreadyPaid && !existingLink;

    let friendlyDate = "";
    let friendlyTime = "";
    if (appointment?.date) {
      const d = new Date(appointment.date);
      friendlyDate = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Melbourne" });
      friendlyTime = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" });
    }

    // 1. Create Stripe payment link for paid, unpaid sessions (then persist it).
    let paymentUrl = existingLink || null;
    if (needsPayment && STRIPE_KEY) {
      try {
        const stripe = new Stripe(STRIPE_KEY, {
          apiVersion: '2023-10-16',
          httpClient: Stripe.createFetchHttpClient(),
        });
        const session = await stripe.checkout.sessions.create({
          customer_email: client.email,
          line_items: [{
            price_data: {
              currency: 'aud',
              product_data: {
                name: 'Functional Neuro Health Session',
                description: `FNH session${friendlyDate ? ` on ${friendlyDate}` : ''}`,
              },
              unit_amount: Math.round(priceAmount * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          payment_intent_data: { statement_descriptor: 'RESONANCE KINE' },
          success_url: `${APP_ORIGIN}/clients`,
          cancel_url: `${APP_ORIGIN}/clients`,
          metadata: { appointment_id: appointment?.id, client_id: clientId },
          expires_at: Math.floor(Date.now() / 1000) + 23 * 60 * 60,
        });
        paymentUrl = session.url;
        if (appointment?.id) {
          await supabase.from('appointments').update({ payment_link: paymentUrl }).eq('id', appointment.id);
        }
      } catch (stripeErr) {
        console.error("[send-manual-onboarding] Stripe error (non-fatal):", stripeErr.message);
      }
    }

    // 2. Build the confirmation email (time + payment link + intake CTA).
    const intakeFilled = isIntakeFormFilled(client);
    const intakeUrl = `${APP_ORIGIN}/onboarding/${client.id}`;
    const subject = `Your FNH Session is Confirmed${friendlyDate ? ` — ${friendlyDate}` : ""}`;

    const paymentSection = paymentUrl ? `
      <div style="background-color: #FFF1F2; border-radius: 24px; padding: 24px; margin: 28px 0; border: 1px solid #FECDD3; text-align: center;">
        <div style="font-size: 10px; font-weight: 800; color: #BE123C; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Secure Payment (AU $${priceAmount})</div>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">Complete your payment to confirm your session.</p>
        <a href="${paymentUrl}" style="display: inline-block; background-color: #E11D48; color: #ffffff; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 14px;">Pay Now</a>
      </div>
    ` : (priceAmount > 0 ? `
      <div style="background-color: #FEF3C7; border-radius: 24px; padding: 20px; margin: 28px 0; border: 1px solid #FDE68A; text-align:center; font-size: 14px; color: #92400E;">A payment link could not be generated automatically — Daniele will send your payment details shortly.</div>
    ` : '');

    const intakeSection = !intakeFilled ? `
      <div style="margin-top: 8px; text-align: center;">
        <a href="${intakeUrl}" style="display: inline-block; background-color: #D46A9B; color: #ffffff; padding: 18px 48px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.02em;">Complete Intake Form</a>
      </div>
      <div style="margin-top: 24px; padding: 20px; background-color: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
        <p style="margin: 0; font-size: 14px; color: #64748B;">The form takes about 10 minutes and covers your health background, current concerns, and goals. Your information is kept confidential.</p>
      </div>
    ` : `
      <p>If you have any questions before your session, please don't hesitate to reach out.</p>
    `;

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
                  <p>Thank you for booking your Functional Neuro Health session. Here are your details:</p>

                  ${appointment?.date ? `
                  <div style="background-color: #F8FAFC; border-radius: 24px; padding: 28px; margin: 28px 0; border: 1px solid #E2E8F0;">
                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Date</div>
                    <div style="font-size: 22px; font-weight: 700; color: #1E293B;">${friendlyDate}</div>
                    <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px;">Time</div>
                    <div style="font-size: 22px; font-weight: 700; color: #1E293B;">${friendlyTime}</div>
                  </div>
                  ` : ''}

                  ${paymentSection}

                  <div style="text-align: center; padding: 12px 0 20px;">
                    ${intakeSection}
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

    const accessToken = await getGmailAccessToken(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
    try {
      await sendGmail(accessToken, SENDER_EMAIL, client.email, subject, htmlBody);
      console.log(`[send-manual-onboarding] Confirmation email sent to ${client.email}`);
      await logEmail(supabase, { fn: "send-manual-onboarding", to: client.email, subject, status: "sent", appointment_id: appointment?.id, client_id: clientId });
    } catch (sendErr) {
      console.error(`[send-manual-onboarding] Send failed:`, sendErr?.message || sendErr);
      await logEmail(supabase, { fn: "send-manual-onboarding", to: client.email, subject, status: "failed", error: sendErr?.message || String(sendErr), appointment_id: appointment?.id, client_id: clientId });
    }

    return new Response(JSON.stringify({
      success: true,
      appointmentIncluded: !!appointment?.date,
      paymentLinkSent: !!paymentUrl,
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
