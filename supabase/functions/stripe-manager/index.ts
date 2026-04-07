// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { action, clientId, clientData } = body;

    if (action === 'sync-all') {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email')
        .is('stripe_customer_id', null);
      
      let count = 0;
      for (const client of (clients || [])) {
        try {
          const customer = await stripe.customers.create({
            name: client.name,
            email: client.email,
            metadata: { crm_id: client.id }
          });
          await supabase.from('clients').update({ stripe_customer_id: customer.id }).eq('id', client.id);
          count++;
        } catch (e) { console.error(`Failed for ${client.name}:`, e.message); }
      }
      return new Response(JSON.stringify({ success: true, syncedCount: count }), { status: 200, headers: corsHeaders });
    }

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

    throw new Error(`Unsupported action: ${action}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})