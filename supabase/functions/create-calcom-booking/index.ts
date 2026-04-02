// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // VERIFICATION MARKER
  console.log("--- [v1.9] CREATE-CALCOM-BOOKING START ---");
  
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request metadata for debugging 401s
    const authHeader = req.headers.get('Authorization');
    const apiKeyHeader = req.headers.get('apikey');
    console.log(`Request Headers: AuthPresent=${!!authHeader}, ApiKeyPresent=${!!apiKeyHeader}`);

    // 2. Check Environment Variables & Secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');

    if (!CALCOM_KEY) {
      console.error("❌ Missing CALCOM_API_KEY in Supabase Secrets.");
      throw new Error("System configuration error: Cal.com API key is missing.");
    }

    // 3. Parse and Validate Body
    const body = await req.json();
    const { clientId, startTime, eventTypeId } = body;
    
    console.log(`Processing booking for Client: ${clientId}, Time: ${startTime}, Event: ${eventTypeId}`);

    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields: clientId, startTime, or eventTypeId.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Fetch Client Details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error("❌ Client lookup failed:", clientError);
      throw new Error(`Client not found: ${clientError?.message || 'Unknown error'}`);
    }
    
    if (!client.email) {
      throw new Error(`Client '${client.name}' has no email address. Cal.com requires an email.`);
    }

    // 5. Create Booking in Cal.com (v2 API)
    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: "Australia/Melbourne", // Defaulting to practitioner timezone
        language: "en"
      },
      metadata: {
        source: "Antigravity CRM"
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
      console.error("❌ Cal.com API Error:", JSON.stringify(result));
      const errorMsg = result.message || result.error?.message || `Cal.com API Error (${response.status})`;
      throw new Error(errorMsg);
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
    console.error("❌ Function Error:", error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 400, // Return 400 so the frontend catch block handles it as a functional error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})