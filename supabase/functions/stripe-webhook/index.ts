// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NOTE: Cal.com payment sync removed — FNH event types are now payment-OFF, so bookings
// sync to the calendar on creation and `appointments.payment_received` is the source of truth.

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const message = [
    `From: ${from}`, `To: ${to}`, `Bcc: info@danielebuatti.com`,
    `Content-Type: text/html; charset=utf-8`, `MIME-Version: 1.0`, `Subject: ${utf8Subject}`, ``, htmlBody,
  ].join("\n");
  const encoded = btoa(unescape(encodeURIComponent(message))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
}

// Sends a "payment received" confirmation to the client. Non-fatal on failure.
async function sendFnhPaymentConfirmation(to: string | null, name: string | null, amountCents: number | null, currency: string) {
  if (!to) return;
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
  const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) {
    console.log("[stripe-webhook] Gmail creds missing — skipping confirmation email");
    return;
  }
  const first = (name || "there").split(" ")[0];
  const amount = amountCents ? `$${(amountCents / 100).toFixed(2)} ${(currency || "AUD").toUpperCase()}` : "";
  try {
    const token = await getGmailAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const html = `
      <!DOCTYPE html><html><body style="margin:0;padding:0;font-family:sans-serif;">
        <center style="width:100%;padding:40px 0;background:#f8fafc;">
          <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:32px;overflow:hidden;">
            <tr><td style="height:6px;background:#4f46e5;"></td></tr>
            <tr><td style="padding:48px 40px;text-align:center;">
              <div style="font-size:44px;">✅</div>
              <div style="color:#4f46e5;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;margin-top:12px;">Payment Received</div>
              <h1 style="color:#1E293B;font-size:24px;margin:12px 0 8px;">Thank you, ${first}!</h1>
              <p style="color:#475569;font-size:15px;line-height:1.6;">Your payment${amount ? ` of <strong>${amount}</strong>` : ""} for your FNH Neuro-Health Assessment is confirmed. Your session is locked in — looking forward to seeing you.</p>
              <div style="border-top:1px solid #F1F5F9;margin-top:32px;padding-top:24px;text-align:left;">
                <div style="font-weight:700;color:#1E293B;">Daniele Buatti</div>
                <div style="color:#4f46e5;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Resonance Kinesiology</div>
              </div>
            </td></tr>
          </table>
        </center>
      </body></html>`;
    // GMAIL_USER_EMAIL authenticates the send but shouldn't be the client-visible
    // From — clients see the practice's real, verified alias instead.
    await sendGmail(token, "Daniele Buatti <info@danielebuatti.com>", to, "Payment received — Your FNH session is confirmed", html);
    console.log(`[stripe-webhook] Confirmation email sent to ${to}`);
  } catch (e) {
    console.error("[stripe-webhook] Confirmation email failed (non-fatal):", e.message);
  }
}

// One shape for a successful payment, whichever event announced it. The Stripe
// endpoint is subscribed to payment_intent.* — a PaymentIntent created by Checkout
// carries no metadata, customer or email, so look up its Checkout Session, which
// holds the appointment_id/client_id (send-manual-onboarding) and the payer's email.
async function resolvePayment(stripe: Stripe, event: any) {
  const obj = event.data.object;
  let session: any = null;
  let intent: any = null;

  if (event.type === 'checkout.session.completed') {
    if (obj.payment_status !== 'paid') return null;
    session = obj;
  } else {
    intent = obj;
    try {
      const list = await stripe.checkout.sessions.list({ payment_intent: intent.id, limit: 1 });
      session = list.data[0] || null;
    } catch (e) {
      console.log(`[stripe-webhook] Checkout Session lookup failed for ${intent.id}: ${e.message}`);
    }
  }

  const customerId = session?.customer || intent?.customer || null;
  let email = session?.customer_details?.email || session?.customer_email || intent?.receipt_email || null;
  if (!email && customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) email = customer.email;
    } catch (e) {
      console.log(`[stripe-webhook] Failed to retrieve customer ${customerId}: ${e.message}`);
    }
  }

  const metadata = { ...(intent?.metadata || {}), ...(session?.metadata || {}) };
  return {
    paymentIntentId: intent?.id || session?.payment_intent || session?.id || null,
    metadata,
    appointmentId: metadata.appointment_id || null,
    clientIds: [session?.client_reference_id, metadata.client_id].filter(Boolean),
    customerId,
    email: email ? email.toLowerCase().trim() : null,
    name: session?.customer_details?.name || metadata.student_name || null,
    amountCents: session?.amount_total ?? intent?.amount_received ?? intent?.amount ?? null,
    currency: session?.currency || intent?.currency || 'aud',
  };
}

// Which appointment this payment is for. The appointment_id from the Checkout
// Session wins — a Cal.com reschedule keeps the same row (calcom-webhook updates
// it in place), so it still points at the moved session. Otherwise fall back to
// the client's latest unpaid, not-cancelled appointment.
async function findAppointment(supabase: any, payment: any) {
  if (payment.paymentIntentId) {
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('stripe_payment_intent_id', payment.paymentIntentId)
      .limit(1);
    // A missing column just means the migration isn't applied yet — carry on.
    if (!error && data?.length) return { id: data[0].id, via: 'payment intent', method: 'Stripe' };
  }

  if (payment.appointmentId) {
    const { data } = await supabase.from('appointments').select('id').eq('id', payment.appointmentId).maybeSingle();
    if (data) return { id: data.id, via: 'metadata', method: 'Stripe' };
    console.log(`[stripe-webhook] Appointment ${payment.appointmentId} from metadata no longer exists — falling back`);
  }

  const candidates: { clientId: string; via: string; method: string }[] = [];
  for (const id of payment.clientIds) {
    const { data } = await supabase.from('clients').select('id').eq('id', id).maybeSingle();
    if (data) candidates.push({ clientId: data.id, via: 'client id', method: 'Stripe' });
  }
  if (payment.customerId) {
    const { data } = await supabase.from('clients').select('id').eq('stripe_customer_id', payment.customerId).maybeSingle();
    if (data) candidates.push({ clientId: data.id, via: 'stripe customer', method: 'Stripe (Mobile App)' });
  }
  if (payment.email) {
    const { data } = await supabase.from('clients').select('id').eq('email', payment.email).maybeSingle();
    if (data) candidates.push({ clientId: data.id, via: 'email', method: 'Stripe' });
  }

  for (const c of candidates) {
    const { data: app } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', c.clientId)
      .eq('payment_received', false)
      .or('status.is.null,status.not.ilike.cancelled')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (app) return { id: app.id, via: c.via, method: c.method };
  }
  return null;
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET_CRM');

  if (!STRIPE_KEY) return new Response("Missing Stripe Key", { status: 500 });

  const stripe = new Stripe(STRIPE_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const body = await req.text();
    let event;

    if (!WEBHOOK_SECRET || !signature) {
      console.error(`[stripe-webhook] Missing webhook secret or signature — skipping verification`);
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401, headers: corsHeaders });
    }
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);

    console.log(`[stripe-webhook] Processing event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
      const payment = await resolvePayment(stripe, event);
      if (!payment) {
        return new Response(JSON.stringify({ received: true, skipped: 'not paid' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Voice/piano checkouts (voice-payment-link, voice-send-onboarding) are recorded
      // by voice-stripe-webhook. They carry type: "voice_lesson", or
      // student_email/lesson_date without an appointment_id. If one reaches this
      // endpoint the accounts are crossed — skip it so it can't match an FNH
      // appointment by email or fire the FNH confirmation email.
      const voiceMeta = payment.metadata || {};
      const isVoiceCheckout =
        voiceMeta.type === "voice_lesson" ||
        ((voiceMeta.lesson_date || voiceMeta.student_email) && !payment.appointmentId);
      if (isVoiceCheckout) {
        console.log(`[stripe-webhook] ${payment.paymentIntentId}: voice/piano checkout — skipping`);
        return new Response(JSON.stringify({ received: true, skipped: "voice" }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const match = await findAppointment(supabase, payment);
      let sendConfirmation = false;

      if (match) {
        // Only flip unpaid → paid. A resent event, or the PaymentIntent and the
        // Checkout Session events for the same payment, find it already paid
        // and change nothing — so the client is emailed once.
        const markPaid = (fields: Record<string, unknown>) => supabase
          .from('appointments')
          .update({ payment_received: true, payment_method: match.method, ...fields })
          .eq('id', match.id)
          .eq('payment_received', false)
          .select('id');
        let { data: flipped, error } = await markPaid(
          payment.paymentIntentId ? { stripe_payment_intent_id: payment.paymentIntentId } : {},
        );
        if (error && /stripe_payment_intent_id/.test(error.message)) {
          console.warn(`[stripe-webhook] stripe_payment_intent_id column missing — apply supabase_appointments_stripe_payment.sql`);
          ({ data: flipped, error } = await markPaid({}));
        }
        // 500 so Stripe retries: the payment is real and must land on the appointment.
        if (error) {
          console.error(`[stripe-webhook] Failed to mark appointment ${match.id} paid: ${error.message}`);
          return new Response(JSON.stringify({ error: 'Failed to record payment' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        sendConfirmation = (flipped?.length ?? 0) > 0;
        console.log(`[stripe-webhook] ${payment.paymentIntentId}: appointment ${match.id} via ${match.via} — ${sendConfirmation ? 'marked paid' : 'already paid'}`);
      } else {
        // Money came in but we couldn't match an appointment — never lose this silently.
        // Keyed on the PaymentIntent so a resend doesn't log (or email) twice.
        const reference = payment.paymentIntentId || payment.email;
        const { data: logged, error: lookupError } = await supabase
          .from('webhook_failures')
          .select('id')
          .eq('source', 'stripe-webhook')
          .eq('reference', reference)
          .limit(1);
        if (lookupError) console.error(`[stripe-webhook] webhook_failures lookup failed:`, lookupError.message);
        if (!logged?.length) {
          const { error: insertError } = await supabase.from('webhook_failures').insert({
            source: 'stripe-webhook',
            event_type: event.type,
            reference,
            amount: payment.amountCents ? payment.amountCents / 100 : null,
            detail: `Paid but unmatched (email: ${payment.email || 'none'})`,
          });
          if (insertError) console.error(`[stripe-webhook] failed to log webhook_failure:`, insertError.message);
          sendConfirmation = true;
        }
        console.log(`[stripe-webhook] ${payment.paymentIntentId}: no appointment matched (email: ${payment.email || 'none'})`);
      }

      // Email the client a payment confirmation (non-fatal).
      if (sendConfirmation) {
        await sendFnhPaymentConfirmation(payment.email, payment.name, payment.amountCents, payment.currency);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error(`[stripe-webhook] Critical Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
})