// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`--- [create-calcom-booking] v1.2 Request Received: ${req.method} ---`);

  try {
    // 2. Check Environment Variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables.");
    }
    if (!CALCOM_KEY) {
      throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.");
    }

    // 3. Parse Body
    const body = await req.json();
    const { clientId, startTime, eventTypeId } = body;
    
    console.log("Request Body:", { clientId, startTime, eventTypeId });

    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields: clientId, startTime, or eventTypeId.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 4. Fetch Client Details
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
      throw new Error(`Client '${client.name}' must have an email address to book via Cal.com.`);
    }

    // 5. Create Booking in Cal.com (v2 API)
    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: "en"
      },
      metadata: {
        source: "Antigravity CRM"
      }
    };

    console.log(`Attempting Cal.com API call for ${client.email}...`);

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
      console.error("Cal.com API Error Response:", JSON.stringify(result));
      throw new Error(result.message || "Cal.com API Error");
    }

    console.log(`✅ Successfully created Cal.com booking: ${result.data.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data.id,
      uid: result.data.uid
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("❌ Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})