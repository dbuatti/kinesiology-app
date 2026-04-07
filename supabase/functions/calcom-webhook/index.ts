// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    }) : null;

    // Get the practitioner profile
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    
    if (triggerEvent === 'PING') return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    if (triggerEvent === 'BOOKING_CANCELLED') {
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;

    // 1. Upsert Client in CRM
    const { data: dbClient, error: clientError } = await supabase
      .from('clients')
      .upsert({ 
        user_id: PRACTITIONER_ID, 
        name, 
        email, 
        phone: attendee.phoneNumber || attendee.phone || "" 
      }, { onConflict: 'email' })
      .select('*')
      .single();

    if (clientError) throw clientError;

    // 2. Auto-Sync to Stripe if not already synced
    if (stripe && dbClient && !dbClient.stripe_customer_id) {
      try {
        const customer = await stripe.customers.create({
          name: dbClient.name,
          email: dbClient.email,
          metadata: { crm_id: dbClient.id }
        });
        
        await supabase
          .from('clients')
          .update({ stripe_customer_id: customer.id })
          .eq('id', dbClient.id);
          
        console.log(`[calcom-webhook] Created Stripe customer: ${customer.id}`);
      } catch (stripeErr) {
        console.error("[calcom-webhook] Stripe creation failed:", stripeErr.message);
      }
    }

    // 3. Upsert Appointment
    await supabase
      .from('appointments')
      .upsert({
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0]
      }, { onConflict: 'calcom_booking_id' });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})