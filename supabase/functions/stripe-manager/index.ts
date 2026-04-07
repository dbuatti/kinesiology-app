// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.25.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("[stripe-manager] Function invoked");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_KEY) {
      console.error("[stripe-manager] Error: STRIPE_SECRET_KEY is missing from Supabase Secrets.");
      throw new Error("Missing STRIPE_SECRET_KEY in Supabase Secrets.");
    }

    // Debugging: Log the prefix and length safely
    const keyPrefix = STRIPE_KEY.substring(0, 7);
    console.log(`[stripe-manager] Key Check: Prefix="${keyPrefix}", Length=${STRIPE_KEY.length}`);

    if (!STRIPE_KEY.startsWith('sk_') && !STRIPE_KEY.startsWith('rk_')) {
      console.error(`[stripe-manager] Error: Key starts with "${keyPrefix}". This does not look like a valid Stripe Secret Key (should start with sk_live_).`);
      throw new Error(`Invalid Key Format: Your key starts with "${keyPrefix}". Please re-copy the Secret Key from Stripe.`);
    }

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { action, clientId, clientData } = await req.json();

    // ACTION: Setup the primary FNH Product
    if (action === 'setup-product') {
      console.log("[stripe-manager] Setting up FNH Clinical Assessment product...");
      
      // Check if product already exists to avoid duplicates
      const products = await stripe.products.list({ limit: 100 });
      const existing = products.data.find(p => p.name === 'FNH Clinical Assessment');

      if (existing) {
        console.log("[stripe-manager] Product already exists.");
        return new Response(JSON.stringify({ 
          success: true, 
          productId: existing.id,
          priceId: existing.default_price,
          message: "Product already exists."
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const product = await stripe.products.create({
        name: 'FNH Clinical Assessment',
        description: '75-minute functional neurology and kinesiology assessment.',
        default_price_data: {
          currency: 'aud',
          unit_amount: 5000, // $50.00
        },
      });

      console.log("[stripe-manager] Product created successfully.");
      return new Response(JSON.stringify({ 
        success: true, 
        productId: product.id,
        priceId: product.default_price 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ACTION: Create or Update Stripe Customer
    if (action === 'sync-customer') {
      console.log(`[stripe-manager] Syncing customer for client: ${clientData.name}`);
      
      let customer;
      if (clientData.stripe_customer_id) {
        customer = await stripe.customers.update(clientData.stripe_customer_id, {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          metadata: { crm_id: clientId }
        });
      } else {
        // Search by email first to avoid duplicates
        const existingCustomers = await stripe.customers.list({ email: clientData.email, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log("[stripe-manager] Found existing customer by email.");
        } else {
          customer = await stripe.customers.create({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            metadata: { crm_id: clientId }
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        stripeCustomerId: customer.id 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error(`Unsupported action: ${action}`);

  } catch (error) {
    console.error("[stripe-manager] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})