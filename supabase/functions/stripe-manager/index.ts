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
      throw new Error("Missing STRIPE_SECRET_KEY in Supabase Secrets.");
    }

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json();
    const { action, clientId, clientData } = body;

    // ACTION: Setup the primary FNH Product
    if (action === 'setup-product') {
      console.log("[stripe-manager] Setting up FNH Clinical Assessment product...");
      const products = await stripe.products.list({ limit: 100 });
      const existing = products.data.find(p => p.name === 'FNH Clinical Assessment');

      if (existing) {
        return new Response(JSON.stringify({ success: true, productId: existing.id, message: "Product already exists." }), { 
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const product = await stripe.products.create({
        name: 'FNH Clinical Assessment',
        description: '75-minute functional neurology and kinesiology assessment.',
        default_price_data: { currency: 'aud', unit_amount: 5000 },
      });

      return new Response(JSON.stringify({ success: true, productId: product.id }), { 
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ACTION: Create or Update Stripe Customer
    if (action === 'sync-customer') {
      console.log(`[stripe-manager] Syncing customer: ${clientData.name} (${clientData.email || 'No Email'})`);
      
      const customerData = {
        name: clientData.name,
        metadata: { crm_id: clientId }
      };

      // Only add email/phone if they exist and aren't empty strings
      if (clientData.email && clientData.email.trim() !== "") {
        customerData.email = clientData.email.trim();
      }
      if (clientData.phone && clientData.phone.trim() !== "") {
        customerData.phone = clientData.phone.trim();
      }

      let customer;
      try {
        if (clientData.stripe_customer_id) {
          console.log(`[stripe-manager] Updating existing customer: ${clientData.stripe_customer_id}`);
          customer = await stripe.customers.update(clientData.stripe_customer_id, customerData);
        } else {
          // Search by email first if email exists
          if (customerData.email) {
            const existing = await stripe.customers.list({ email: customerData.email, limit: 1 });
            if (existing.data.length > 0) {
              customer = existing.data[0];
              console.log("[stripe-manager] Found existing customer by email. Updating...");
              customer = await stripe.customers.update(customer.id, customerData);
            }
          }

          if (!customer) {
            console.log("[stripe-manager] Creating new customer...");
            customer = await stripe.customers.create(customerData);
          }
        }
      } catch (stripeError) {
        console.error("[stripe-manager] Stripe API Error:", stripeError.message);
        throw new Error(`Stripe Error: ${stripeError.message}`);
      }

      return new Response(JSON.stringify({ success: true, stripeCustomerId: customer.id }), { 
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    throw new Error(`Unsupported action: ${action}`);

  } catch (error) {
    console.error("[stripe-manager] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})