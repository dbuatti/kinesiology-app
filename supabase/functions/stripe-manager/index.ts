// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.25.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [stripe-manager] Function invoked ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY in Supabase Secrets.");

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { action, clientId, clientData } = await req.json();

    // ACTION: Setup the primary FNH Product
    if (action === 'setup-product') {
      console.log("Setting up FNH Clinical Assessment product...");
      
      const product = await stripe.products.create({
        name: 'FNH Clinical Assessment',
        description: '75-minute functional neurology and kinesiology assessment.',
        default_price_data: {
          currency: 'aud',
          unit_amount: 5000, // $50.00
        },
      });

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
      console.log(`Syncing customer for client: ${clientData.name}`);
      
      let customer;
      if (clientData.stripe_customer_id) {
        customer = await stripe.customers.update(clientData.stripe_customer_id, {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          metadata: { crm_id: clientId }
        });
      } else {
        customer = await stripe.customers.create({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          metadata: { crm_id: clientId }
        });
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
    console.error("Stripe Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})