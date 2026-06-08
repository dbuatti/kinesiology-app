// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function syncCalcomPayment(calcomBookingId: string) {
  const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
  if (!CALCOM_KEY) {
    console.log(`[stripe-webhook] Skipping cal.com sync: CALCOM_API_KEY not set`);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${CALCOM_KEY}`,
    'cal-api-version': '2024-08-13',
    'Content-Type': 'application/json',
  };

  try {
    // Confirm the booking in cal.com (moves it from PENDING to ACCEPTED,
    // effectively marking it as paid when payment is required)
    const res = await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}/confirm`, {
      method: "POST",
      headers,
    });

    if (res.ok) {
      console.log(`[stripe-webhook] Cal.com sync: Booking ${calcomBookingId} confirmed as paid`);

      // Also update metadata so calcom-webhook picks up the is_paid flag
      await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          metadata: { is_paid: "true" },
        }),
      }).catch(() => {});
    } else {
      const err = await res.json();
      console.error(`[stripe-webhook] Cal.com confirm failed: ${res.status}`, JSON.stringify(err).slice(0, 200));

      // Fallback: try updating metadata directly
      const metaRes = await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          metadata: { is_paid: "true" },
        }),
      });

      if (metaRes.ok) {
        console.log(`[stripe-webhook] Cal.com sync (metadata): Booking ${calcomBookingId} marked as paid via metadata`);
      } else {
        const metaErr = await metaRes.json();
        console.error(`[stripe-webhook] Cal.com sync (metadata) failed: ${metaRes.status}`, JSON.stringify(metaErr).slice(0, 200));
      }
    }
  } catch (err) {
    console.error(`[stripe-webhook] Cal.com sync error:`, err.message);
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

            if (refApp.calcom_booking_id) {
              await syncCalcomPayment(refApp.calcom_booking_id);
            }
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

              // Sync payment status back to cal.com
              if (app.calcom_booking_id) {
                await syncCalcomPayment(app.calcom_booking_id);
              }
            } else {
              console.log(`[stripe-webhook] Email Fallback: No unpaid appointments found for client ${clientByEmail.id}`);
            }
          } else {
            console.log(`[stripe-webhook] Email Fallback: No CRM client found with email ${customerEmail}`);
          }
        }
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