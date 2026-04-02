// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("--- [v2.5] CREATE-CALCOM-BOOKING START ---");
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    
    if (!CALCOM_KEY) {
      console.error("❌ Missing CALCOM_API_KEY secret.");
      return new Response(JSON.stringify({ error: "Cal.com API key not set in Supabase secrets." }), { 
        status: 418, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json().catch(e => {
      console.error("❌ JSON Parse Error:", e.message);
      return null;
    });

    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid or empty JSON body" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { clientId, startTime, eventTypeId, title, notes } = body;
    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields: clientId, startTime, or eventTypeId.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error("❌ Client lookup failed:", clientError);
      return new Response(JSON.stringify({ error: `Client not found: ${clientError?.message}` }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!client.email) {
      throw new Error(`Client '${client.name}' has no email address.`);
    }

    // Cal.com v2 Booking Payload
    // Note: 'responses' was rejected in v2.4, so we are removing it.
    // We'll pass the title/notes in metadata for reference if allowed.
    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: "Australia/Melbourne",
        language: "en"
      },
      metadata: { 
        source: "Antigravity CRM",
        session_title: title || "Kinesiology Session",
        session_notes: notes || ""
      }
    };

    console.log(`Calling Cal.com API for ${client.email}...`);

    const response = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${CALCOM_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Cal.com API Error (${response.status}):`, JSON.stringify(result));
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.message || result.error?.message || "Cal.com API Error",
        details: result
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`✅ Success: Booking ${result.data?.id} created.`);

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data?.id,
      uid: result.data?.uid
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("❌ Critical Function Error:", error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})