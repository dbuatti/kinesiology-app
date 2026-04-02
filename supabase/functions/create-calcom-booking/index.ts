// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`--- [create-calcom-booking] v1.3 Request Received: ${req.method} ---`);

  try {
    // 1. Check Environment Variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables.");
    }
    if (!CALCOM_KEY) {
      throw new Error("Missing CALCOM_API_KEY in Supabase Edge Function secrets.");
    }

    // 2. Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Invalid JSON in request body.");
    }

    const { clientId, startTime, eventTypeId } = body;
    
    console.log("Request Body:", { clientId, startTime, eventTypeId });

    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields: clientId, startTime, or eventTypeId.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Fetch Client Details from your 'clients' table
    console.log(`Fetching client details for ID: ${clientId}`);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error("Client Fetch Error:", clientError);
      throw new Error("Client not found in CRM.");
    }
    
    if (!client.email) {
      throw new Error(`Client '${client.name || 'Unknown'}' must have an email address to book via Cal.com.`);
    }

    // 4. Prepare payload for Cal.com v2 API
    const bookingPayload = {
      start: startTime,                    // Must be ISO 8601 in UTC (e.g. "2026-04-10T09:00:00Z")
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name || "Client",
        email: client.email,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: "en"
      },
      metadata: {
        source: "Antigravity CRM"
      }
      // Optional: add "title", "bookingFieldsResponses", "guests", etc. if your event type requires them
    };

    console.log(`Attempting Cal.com booking for ${client.email} (eventTypeId: ${eventTypeId})...`);

    const response = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${CALCOM_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    });

    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { raw: await response.text() };
    }

    if (!response.ok) {
      console.error("Cal.com API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: result
      });
      
      // Common 401 causes: wrong key, key without proper prefix (cal_ or cal_live_), revoked key
      if (response.status === 401) {
        throw new Error(`Cal.com Authentication failed (401). Check that CALCOM_API_KEY is valid and starts with 'cal_' or 'cal_live_'.`);
      }
      
      throw new Error(result.message || result.error?.message || `Cal.com API Error: ${response.status}`);
    }

    console.log(`✅ Successfully created Cal.com booking: ${result.data?.id || 'unknown'}`);

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data?.id,
      uid: result.data?.uid,
      data: result.data
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("❌ Critical Error:", error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})