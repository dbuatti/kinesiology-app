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
    `From: ${from}`, `To: ${to}`, `Bcc: daniele.buatti@gmail.com`,
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
    await sendGmail(token, SENDER, to, "Payment received — Your FNH session is confirmed", html);
    console.log(`[stripe-webhook] Confirmation email sent to ${to}`);
  } catch (e) {
    console.error("[stripe-webhook] Confirmation email failed (non-fatal):", e.message);
  }
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

    if (WEBHOOK_SECRET && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body);
    }

    console.log(`[stripe-webhook] Processing event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
      const data = event.data.object;
      const customerId = data.customer;
      const appointmentId = data.metadata?.appointment_id;

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      let matched = false;

      if (appointmentId) {
        console.log(`[stripe-webhook] Success: Updating appointment ${appointmentId} via metadata`);
        await supabase
          .from('appointments')
          .update({ payment_received: true, payment_method: 'Stripe' })
          .eq('id', appointmentId);
        matched = true;
      }

      // Match by client_reference_id (UUID passed when creating the Checkout Session)
      if (!matched && data.client_reference_id) {
        const refId = data.client_reference_id;
        console.log(`[stripe-webhook] client_reference_id: Looking up client ${refId}`);
        const { data: refClient } = await supabase
          .from('clients')
          .select('id')
          .eq('id', refId)
          .maybeSingle();

        if (refClient) {
          const { data: refApp } = await supabase
            .from('appointments')
            .select('id, calcom_booking_id')
            .eq('client_id', refClient.id)
            .eq('payment_received', false)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (refApp) {
            console.log(`[stripe-webhook] client_reference_id Match: Updating appointment ${refApp.id}`);
            await supabase
              .from('appointments')
              .update({ payment_received: true, payment_method: 'Stripe' })
              .eq('id', refApp.id);
            matched = true;
          }
        }
      }

      if (!matched && customerId) {
        console.log(`[stripe-webhook] Smart Match: Searching for latest unpaid for customer ${customerId}`);
        
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (client) {
          const { data: app } = await supabase
            .from('appointments')
            .select('id')
            .eq('client_id', client.id)
            .eq('payment_received', false)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (app) {
            console.log(`[stripe-webhook] Match Found (stripe_customer_id): Updating appointment ${app.id}`);
            await supabase
              .from('appointments')
              .update({ payment_received: true, payment_method: 'Stripe (Mobile App)' })
              .eq('id', app.id);
            matched = true;
          } else {
            console.log(`[stripe-webhook] No unpaid appointments found for client ${client.id}`);
          }
        } else {
          console.log(`[stripe-webhook] No CRM client found for Stripe Customer ${customerId} — will try email fallback`);
        }
      }

      // Fallback: match by customer email (handles cal.com bookings where
      // stripe_customer_id isn't stored in the CRM)
      if (!matched) {
        let customerEmail: string | null = null;
        if (event.type === 'checkout.session.completed') {
          customerEmail = data.customer_details?.email || data.customer_email || null;
        } else if (event.type === 'payment_intent.succeeded') {
          customerEmail = data.receipt_email || null;
          if (!customerEmail && data.customer) {
            try {
              const customer = await stripe.customers.retrieve(data.customer);
              if (!customer.deleted) customerEmail = customer.email;
            } catch (e) {
              console.log(`[stripe-webhook] Failed to retrieve customer ${data.customer}: ${e.message}`);
            }
          }
        }

        if (customerEmail) {
          console.log(`[stripe-webhook] Email Fallback: Searching for client with email ${customerEmail}`);
          const { data: clientByEmail } = await supabase
            .from('clients')
            .select('id')
            .eq('email', customerEmail.toLowerCase().trim())
            .maybeSingle();

          if (clientByEmail) {
            const { data: app } = await supabase
              .from('appointments')
              .select('id, calcom_booking_id')
              .eq('client_id', clientByEmail.id)
              .eq('payment_received', false)
              .order('date', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (app) {
              console.log(`[stripe-webhook] Email Fallback Match: Updating appointment ${app.id}`);
              await supabase
                .from('appointments')
                .update({ payment_received: true, payment_method: 'Stripe' })
                .eq('id', app.id);
              matched = true;
            } else {
              console.log(`[stripe-webhook] Email Fallback: No unpaid appointments found for client ${clientByEmail.id}`);
            }
          } else {
            console.log(`[stripe-webhook] Email Fallback: No CRM client found with email ${customerEmail}`);
          }
        }
      }

      // Email the client a payment confirmation (non-fatal).
      const confEmail = data.customer_details?.email || data.customer_email || data.receipt_email || null;
      const confName = data.customer_details?.name || data.metadata?.student_name || null;
      const confAmount = data.amount_total ?? data.amount ?? null;
      await sendFnhPaymentConfirmation(confEmail, confName, confAmount, data.currency || "aud");
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error(`[stripe-webhook] Critical Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
})