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

    // 1. STRICT UPDATE: If we have a UID, we MUST update it. 
    if (bookingUid && bookingUid !== "undefined" && bookingUid !== "null" && bookingUid !== "") {
      console.log(`[${functionName}] Action: UPDATE booking ${bookingUid}`);
      
      const res = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          start: cleanStartTime,
          metadata: { 
            crm_title: title, 
            crm_notes: notes, 
            is_paid: String(isPaidBool) 
          }
        }),
      });

      const result = await res.json();

      if (res.ok) {
        console.log(`[${functionName}] Update successful for ${bookingUid}`);
        return new Response(JSON.stringify({ success: true, uid: bookingUid, data: result.data }), { 
          status: 200, 
          headers: corsHeaders 
        });
      }

      if (res.status === 404) {
        console.warn(`[${functionName}] Booking ${bookingUid} not found on Cal.com. Proceeding to CREATE new.`);
      } else {
        const errorMsg = result.error?.message || result.message || "Failed to update Cal.com booking";
        // If it's an availability error during update, throw it clearly
        if (errorMsg.includes("already has booking") || errorMsg.includes("not available")) {
          throw new Error("The new time slot is not available in your calendar.");
        }
        throw new Error(errorMsg);
      }
    } 
    
    // 2. CREATE new booking
    console.log(`[${functionName}] Action: CREATE new booking`);
    const createRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        start: cleanStartTime,
        eventTypeId: parseInt(eventTypeId, 10),
        attendee: { 
          name: client.name, 
          email: client.email, 
          timeZone: "Australia/Melbourne", 
          language: "en" 
        },
        metadata: { 
          crm_title: title, 
          crm_notes: notes, 
          source: "Antigravity CRM", 
          is_paid: String(isPaidBool) 
        }
      }),
    });

    const createResult = await createRes.json();

    if (createRes.ok) {
      console.log(`[${functionName}] Create successful: ${createResult.data.uid}`);
      return new Response(JSON.stringify({ success: true, uid: createResult.data.uid }), { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // 3. CONFLICT RESOLUTION: If slot is taken, check if it's an existing booking we can adopt
    const errorMsg = createResult.error?.message || createResult.message || "";
    if (createRes.status === 400 && (errorMsg.includes("already has booking") || errorMsg.includes("not available"))) {
      console.log(`[${functionName}] Conflict detected. Searching for existing booking at ${cleanStartTime}`);
      
      // Search for bookings around this time
      const listRes = await fetch(`https://api.cal.com/v2/bookings?startTime=${cleanStartTime}&status=upcoming`, {
        method: "GET",
        headers
      });
      
      const listData = await listRes.json();
      // Find exact match
      const existing = (listData.data || []).find(b => {
        const bStart = new Date(b.start).toISOString();
        return bStart === cleanStartTime;
      });

      if (existing) {
        console.log(`[${functionName}] Found existing booking: ${existing.uid}. Repairing CRM link.`);
        return new Response(JSON.stringify({ 
          success: true, 
          uid: existing.uid,
          repaired: true,
          message: "Existing booking found and linked."
        }), { status: 200, headers: corsHeaders });
      }

      // If no booking found but still "not available", it's likely an OOO block
      throw new Error("This slot is unavailable (it may be blocked by an Out-of-Office entry or another event).");
    }

    throw new Error(errorMsg || "Cal.com Create Error");

  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})