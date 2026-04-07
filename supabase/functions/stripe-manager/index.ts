// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.25.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json();
    const { action, clientId, appointmentId, clientData } = body;

    if (action === 'setup-product') {
      const products = await stripe.products.list({ limit: 100 });
      const existing = products.data.find(p => p.name === 'FNH Clinical Assessment');
      if (existing) return new Response(JSON.stringify({ success: true, productId: existing.id }), { status: 200, headers: corsHeaders });
      
      const product = await stripe.products.create({
        name: 'FNH Clinical Assessment',
        description: '75-minute functional neurology and kinesiology assessment.',
        default_price_data: { currency: 'aud', unit_amount: 5000 },
      });
      return new Response(JSON.stringify({ success: true, productId: product.id }), { status: 200, headers: corsHeaders });
    }

    if (action === 'sync-customer') {
      const customerData = { name: clientData.name, metadata: { crm_id: clientId } };
      if (clientData.email) customerData.email = clientData.email;
      
      let customer;
      if (clientData.stripe_customer_id) {
        customer = await stripe.customers.update(clientData.stripe_customer_id, customerData);
      } else {
        customer = await stripe.customers.create(customerData);
      }
      return new Response(JSON.stringify({ success: true, stripeCustomerId: customer.id }), { status: 200, headers: corsHeaders });
    }

    if (action === 'create-checkout') {
      console.log(`[stripe-manager] Creating checkout for appointment: ${appointmentId}`);
      const products = await stripe.products.list({ limit: 100 });
      const product = products.data.find(p => p.name === 'FNH Clinical Assessment');
      
      if (!product) throw new Error("FNH Product not found. Run setup first.");

      const session = await stripe.checkout.sessions.create({
        customer: clientData.stripe_customer_id,
        line_items: [{ price: product.default_price, quantity: 1 }],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/appointments/${appointmentId}?payment=success`,
        cancel_url: `${req.headers.get('origin')}/appointments/${appointmentId}`,
        metadata: { appointment_id: appointmentId, crm_id: clientId }
      });

      return new Response(JSON.stringify({ success: true, url: session.url }), { 
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error(`Unsupported action: ${action}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})