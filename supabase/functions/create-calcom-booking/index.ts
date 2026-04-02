// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("--- [v2.3] CREATE-CALCOM-BOOKING START ---");
  
  try {
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');

    // Log configuration state (safe check)
    console.log(`Config Check: CALCOM_KEY=${!!CALCOM_KEY}, URL=${!!supabaseUrl}, ROLE_KEY=${!!supabaseKey}, AuthHeader=${!!authHeader}`);

    if (!CALCOM_KEY) {
      console.error("❌ CRITICAL: CALCOM_API_KEY is not set in Supabase secrets.");
      return new Response(JSON.stringify({ 
        error: "Missing API Key", 
        message: "CALCOM_API_KEY not found in Supabase secrets." 
      }), { 
        status: 418, // Teapot: Identifies missing secret
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json().catch(e => {
      console.error("❌ Request Body Parse Error:", e.message);
      return null;
    });

    if (!body) {
      throw new Error("Invalid request: No JSON body provided.");
    }

    const { clientId, startTime, eventTypeId } = body;
    console.log(`Processing: Client=${clientId}, Time=${startTime}, Event=${eventTypeId}`);

    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields: clientId, startTime, or eventTypeId.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Client Details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error("❌ Client Lookup Error:", clientError);
      throw new Error(`Client not found: ${clientError?.message || 'Unknown error'}`);
    }
    
    if (!client.email) {
      throw new Error(`Client '${client.name}' has no email address. Cannot book on Cal.com.`);
    }

    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: "Australia/Melbourne",
        language: "en"
      },
      metadata: { source: "Antigravity CRM" }
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
      // If Cal.com returns 401, it means the CALCOM_API_KEY is invalid
      const status = response.status === 401 ? 418 : 400;
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.message || result.error?.message || "Cal.com API Error",
        details: result
      }), { 
        status: status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`✅ SUCCESS: Booking ${result.data?.id} created.`);

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data?.id,
      uid: result.data?.uid
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})