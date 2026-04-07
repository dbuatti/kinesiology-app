// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("[create-calcom-booking] v2.1 - Fixing Payload Structure");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    
    if (!CALCOM_KEY) {
      throw new Error("Missing CALCOM_API_KEY secret.");
    }

    const body = await req.json();
    const { clientId, startTime, eventTypeId, title, notes, is_paid } = body;
    const isPaidBool = is_paid === true || is_paid === 'true';

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client?.email) {
      throw new Error("Client not found or missing email.");
    }

    // Cal.com v2 API expects custom fields in 'bookingFieldsResponses'
    // The error "property responses should not exist" often happens if the API 
    // version is mismatched or if 'responses' is sent instead.
    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: "Australia/Melbourne",
        language: "en"
      },
      // Ensure we only send valid v2 properties
      bookingFieldsResponses: {
        is_paid: isPaidBool 
      },
      metadata: { 
        crm_title: title || "Kinesiology Session",
        crm_notes: notes || "",
        source: "Antigravity CRM",
        is_paid: String(isPaidBool)
      }
    };

    console.log("[create-calcom-booking] Sending payload:", JSON.stringify(bookingPayload));

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
      console.error(`[create-calcom-booking] API Error:`, JSON.stringify(result));
      throw new Error(result.error?.message || result.message || "Cal.com API Error");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data.id,
      uid: result.data.uid 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("[create-calcom-booking] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})