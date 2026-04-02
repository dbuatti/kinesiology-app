// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [v2.0] CREATE-CALCOM-BOOKING START ---");
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const apiKeyHeader = req.headers.get('apikey');
    console.log(`Auth Check: Authorization=${!!authHeader}, apikey=${!!apiKeyHeader}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');

    if (!CALCOM_KEY) {
      console.error("❌ Missing CALCOM_API_KEY secret.");
      throw new Error("Cal.com API key is not configured in Supabase secrets.");
    }

    const body = await req.json();
    const { clientId, startTime, eventTypeId } = body;
    
    console.log(`Booking Request: Client=${clientId}, Time=${startTime}, Event=${eventTypeId}`);

    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields: clientId, startTime, or eventTypeId.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Client
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
      const errorMsg = result.message || result.error?.message || `Cal.com API Error (${response.status})`;
      
      // Return a 400 with the specific Cal.com error so the frontend can show it
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMsg,
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
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})