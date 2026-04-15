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
    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");

    const body = await req.json();
    const { clientId, startTime, eventTypeId, title, notes, is_paid, bookingUid } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: client } = await supabase.from('clients').select('name, email').eq('id', clientId).single();
    if (!client?.email) throw new Error("Client not found or missing email.");

    const cleanStartTime = new Date(startTime).toISOString();
    const isPaidBool = is_paid === true || is_paid === 'true';

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // 1. Attempt UPDATE if ID exists
    if (bookingUid && bookingUid !== "undefined" && bookingUid !== "null") {
      console.log(`[${functionName}] Attempting UPDATE for booking ${bookingUid}`);
      
      const res = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          start: cleanStartTime,
          metadata: { crm_title: title, crm_notes: notes, is_paid: String(isPaidBool) }
        }),
      });

      if (res.ok) {
        const result = await res.json();
        return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200, headers: corsHeaders });
      }

      if (res.status !== 404) {
        const err = await res.json();
        throw new Error(err.error?.message || "Cal.com Update Error");
      }
      console.warn(`[${functionName}] Booking ${bookingUid} not found. Falling back to CREATE/REPAIR.`);
    } 
    
    // 2. CREATE new booking
    console.log(`[${functionName}] Action: CREATE new booking`);
    const createRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        start: cleanStartTime,
        eventTypeId: parseInt(eventTypeId, 10),
        attendee: { name: client.name, email: client.email, timeZone: "Australia/Melbourne", language: "en" },
        metadata: { crm_title: title, crm_notes: notes, source: "Antigravity CRM", is_paid: String(isPaidBool) }
      }),
    });

    const createResult = await createRes.json();

    if (createRes.ok) {
      return new Response(JSON.stringify({ success: true, uid: createResult.data.uid }), { status: 200, headers: corsHeaders });
    }

    // 3. CONFLICT RESOLUTION: If slot is taken, find the existing booking and adopt its ID
    if (createRes.status === 400 && createResult.error?.message?.includes("already has booking")) {
      console.log(`[${functionName}] Conflict detected. Searching for existing booking at ${cleanStartTime}`);
      
      const listRes = await fetch(`https://api.cal.com/v2/bookings?startTime=${cleanStartTime}&status=upcoming`, {
        method: "GET",
        headers
      });
      
      const listData = await listRes.json();
      const existing = (listData.data || []).find(b => b.start === cleanStartTime);

      if (existing) {
        console.log(`[${functionName}] Found existing booking: ${existing.uid}. Repairing CRM link.`);
        return new Response(JSON.stringify({ 
          success: true, 
          uid: existing.uid,
          repaired: true,
          message: "Existing booking found and linked."
        }), { status: 200, headers: corsHeaders });
      }
    }

    throw new Error(createResult.error?.message || "Cal.com Create Error");

  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})