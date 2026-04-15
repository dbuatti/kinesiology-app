// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      console.error(`[${functionName}] Error: Missing CALCOM_API_KEY secret.`);
      throw new Error("Missing CALCOM_API_KEY secret.");
    }

    const body = await req.json();
    const { clientId, startTime, eventTypeId, title, notes, is_paid, bookingUid } = body;
    
    console.log(`[${functionName}] Payload:`, { clientId, startTime, eventTypeId, bookingUid });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client?.email) {
      console.error(`[${functionName}] Error: Client not found or missing email.`, clientError);
      throw new Error("Client not found or missing email.");
    }

    const cleanStartTime = new Date(startTime).toISOString();
    const isPaidBool = is_paid === true || is_paid === 'true';

    // If bookingUid exists, we are UPDATING (Rescheduling)
    if (bookingUid) {
      console.log(`[${functionName}] Action: UPDATE booking ${bookingUid}`);
      
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
      console.log(`[${functionName}] Cal.com PATCH Response Status: ${response.status}`);

      if (!response.ok) {
        console.error(`[${functionName}] Cal.com PATCH Error:`, JSON.stringify(result));
        throw new Error(result.error?.message || result.message || "Cal.com Update Error");
      }

      return new Response(JSON.stringify({ success: true, data: result.data }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } 
    
    // Otherwise, we are CREATING
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
    console.log(`[${functionName}] Cal.com POST Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`[${functionName}] Cal.com POST Error:`, JSON.stringify(result));
      throw new Error(result.error?.message || result.message || "Cal.com Create Error");
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
    console.error(`[${functionName}] Critical Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})