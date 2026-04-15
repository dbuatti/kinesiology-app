// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "create-calcom-booking";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');
    if (!CALCOM_KEY) {
      throw new Error("Missing CALCOM_API_KEY secret.");
    }

    const body = await req.json();
    const { clientId, startTime, eventTypeId, title, notes, is_paid, bookingUid } = body;
    
    console.log(`[${functionName}] Incoming Payload:`, JSON.stringify(body, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client?.email) {
      throw new Error("Client not found or missing email.");
    }

    const cleanStartTime = new Date(startTime).toISOString();
    const isPaidBool = is_paid === true || is_paid === 'true';

    // 1. Attempt UPDATE if ID exists
    if (bookingUid && bookingUid !== "undefined" && bookingUid !== "null") {
      console.log(`[${functionName}] Attempting UPDATE for booking ${bookingUid}`);
      
      const updatePayload = {
        start: cleanStartTime,
        metadata: {
          crm_title: title || "Kinesiology Session",
          crm_notes: notes || "",
          is_paid: String(isPaidBool)
        }
      };

      const response = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${CALCOM_KEY}`,
          'cal-api-version': '2024-08-13',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`[${functionName}] Update successful`);
        return new Response(JSON.stringify({ success: true, data: result.data }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // If 404, the booking is gone from Cal.com, so we fall through to CREATE
      if (response.status === 404) {
        console.warn(`[${functionName}] Booking ${bookingUid} not found on Cal.com. Falling back to CREATE.`);
      } else {
        console.error(`[${functionName}] Cal.com PATCH Error:`, JSON.stringify(result));
        throw new Error(result.error?.message || result.message || "Cal.com Update Error");
      }
    } 
    
    // 2. CREATE new booking (Fallback or New)
    console.log(`[${functionName}] Action: CREATE new booking`);
    const bookingPayload = {
      start: cleanStartTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name,
        email: client.email,
        timeZone: "Australia/Melbourne",
        language: "en"
      },
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
      console.error(`[${functionName}] Cal.com POST Error:`, JSON.stringify(result));
      throw new Error(result.error?.message || result.message || "Cal.com Create Error");
    }

    console.log(`[${functionName}] Create successful: ${result.data.uid}`);

    return new Response(JSON.stringify({ 
      success: true, 
      bookingId: result.data.id,
      uid: result.data.uid 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})