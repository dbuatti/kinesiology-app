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
  const functionName = "stripe-manager";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!STRIPE_KEY) {
      console.error(`[${functionName}] Error: STRIPE_SECRET_KEY is missing.`);
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { action, clientId, clientData } = body;
    
    console.log(`[${functionName}] Action: ${action}`, { clientId });

    if (action === 'sync-all') {
      console.log(`[${functionName}] Starting bulk sync...`);
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
        } catch (e) { 
          console.error(`[${functionName}] Failed for ${client.name}:`, e.message); 
        }
      }
      console.log(`[${functionName}] Bulk sync complete. Synced: ${count}`);
      return new Response(JSON.stringify({ success: true, syncedCount: count }), { status: 200, headers: corsHeaders });
    }

    if (action === 'setup-product') {
      console.log(`[${functionName}] Checking for FNH product...`);
      const products = await stripe.products.list({ limit: 100 });
      const existing = products.data.find(p => p.name === 'FNH Clinical Assessment');
      if (existing) {
        console.log(`[${functionName}] Product exists: ${existing.id}`);
        return new Response(JSON.stringify({ success: true, productId: existing.id }), { status: 200, headers: corsHeaders });
      }
      
      console.log(`[${functionName}] Creating new FNH product...`);
      const product = await stripe.products.create({
        name: 'FNH Clinical Assessment',
        description: '75-minute functional neurology and kinesiology assessment.',
        default_price_data: { currency: 'aud', unit_amount: 5000 },
      });
      return new Response(JSON.stringify({ success: true, productId: product.id }), { status: 200, headers: corsHeaders });
    }

    if (action === 'sync-customer') {
      console.log(`[${functionName}] Syncing customer: ${clientData.name}`);
      const customerData = { name: clientData.name, metadata: { crm_id: clientId } };
      if (clientData.email) customerData.email = clientData.email;
      
      let customer;
      if (clientData.stripe_customer_id) {
        customer = await stripe.customers.update(clientData.stripe_customer_id, customerData);
      } else {
        customer = await stripe.customers.create(customerData);
      }
      console.log(`[${functionName}] Customer synced: ${customer.id}`);
      return new Response(JSON.stringify({ success: true, stripeCustomerId: customer.id }), { status: 200, headers: corsHeaders });
    }

    throw new Error(`Unsupported action: ${action}`);
  } catch (error) {
    console.error(`[${functionName}] Critical Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})