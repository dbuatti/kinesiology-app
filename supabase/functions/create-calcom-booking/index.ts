// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- [create-calcom-booking] v1.8 START ---");

  const authHeader = req.headers.get('Authorization');
  console.log(`Auth header present: ${!!authHeader}`);
  if (authHeader) console.log(`Auth starts with: ${authHeader.substring(0, 20)}...`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');

    if (!CALCOM_KEY) throw new Error("CALCOM_API_KEY missing in Supabase Secrets.");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase env vars missing.");

    const body = await req.json();
    const { clientId, startTime, eventTypeId } = body;

    console.log(`Request body: clientId=${clientId}, startTime=${startTime}, eventTypeId=${eventTypeId}`);

    if (!clientId || !startTime || !eventTypeId) {
      throw new Error("Missing required fields.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError || !client) throw new Error("Client not found.");
    if (!client.email) throw new Error("Client has no email address.");

    // Cal.com payload
    const bookingPayload = {
      start: startTime,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name: client.name || "Client",
        email: client.email,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: "en"
      },
      metadata: { source: "Antigravity CRM" }
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

    let result;
    try { result = await response.json(); } 
    catch { result = { raw: await response.text() }; }

    if (!response.ok) {
      console.error("Cal.com Error:", { status: response.status, body: result });
      throw new Error(result.message || `Cal.com API error (${response.status})`);
    }

    console.log(`✅ Cal.com booking created: ${result.data?.id}`);

    return new Response(JSON.stringify({
      success: true,
      bookingId: result.data?.id,
      uid: result.data?.uid
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error("❌ Function Error:", error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});