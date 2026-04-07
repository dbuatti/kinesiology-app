// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("[create-calcom-booking] Function invoked");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    
    if (!CALCOM_KEY) {
      console.error("[create-calcom-booking] Missing CALCOM_API_KEY secret.");
      return new Response(JSON.stringify({ error: "Cal.com API key not configured in Supabase secrets." }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const body = await req.json().catch(e => {
      console.error("[create-calcom-booking] JSON Parse Error:", e.message);
      return null;
    });

    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { clientId, startTime, eventTypeId, title, notes, is_paid } = body;
    console.log("[create-calcom-booking] Request params:", { clientId, startTime, eventTypeId, is_paid });

    if (!clientId || !startTime || !eventTypeId) {
      return new Response(JSON.stringify({ error: "Missing required fields: clientId, startTime, or eventTypeId." }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email, phone')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error("[create-calcom-booking] Client lookup failed:", clientError);
      return new Response(JSON.stringify({ error: "Client not found in database." }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!client.email) {
      return new Response(JSON.stringify({ error: "Client is missing an email address. Cal.com requires an email to book." }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Cal.com v2 Booking Payload
    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: "Australia/Melbourne",
        language: "en"
      },
      // Correct key for v2 API custom fields
      bookingFieldsResponses: {
        is_paid: !!is_paid // Changed from string "yes"/"no" to boolean to match Cal.com API requirements
      },
      metadata: { 
        crm_title: title || "Kinesiology Session",
        crm_notes: notes || "",
        source: "Antigravity CRM",
        is_paid: String(is_paid || false)
      }
    };

    console.log("[create-calcom-booking] Sending payload to Cal.com:", JSON.stringify(bookingPayload));

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
      console.error(`[create-calcom-booking] Cal.com API Error (${response.status}):`, JSON.stringify(result));
      const errorMessage = result.error?.message || result.message || "Cal.com API Error";
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: result 
      }), { 
        status: response.status === 401 ? 401 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[create-calcom-booking] Success: Booking ${result.data.id} created.`);

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data.id,
      uid: result.data.uid,
      status: result.data.status
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("[create-calcom-booking] Critical Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})