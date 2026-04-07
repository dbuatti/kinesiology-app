// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

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

      if (appointmentId) {
        console.log(`[stripe-webhook] Success: Updating appointment ${appointmentId}`);
        await supabase
          .from('appointments')
          .update({ payment_received: true, payment_method: 'Stripe' })
          .eq('id', appointmentId);
      } else if (customerId) {
        console.log(`[stripe-webhook] Warning: No appointment_id in metadata. Searching for latest unpaid for customer ${customerId}`);
        
        const { data: app } = await supabase
          .from('appointments')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .eq('payment_received', false)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (app) {
          await supabase
            .from('appointments')
            .update({ payment_received: true, payment_method: 'Stripe (Auto-Matched)' })
            .eq('id', app.id);
        } else {
          console.error(`[stripe-webhook] Error: Could not find an unpaid appointment for customer ${customerId}`);
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