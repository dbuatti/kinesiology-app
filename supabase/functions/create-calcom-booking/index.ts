// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY secret.");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase environment variables.");

    const body = await req.json();
    const { clientId, startTime, eventTypeId, title, notes, is_paid, bookingUid } = body;
    
    if (!clientId) throw new Error("Missing clientId in request body.");
    if (!startTime) throw new Error("Missing startTime in request body.");

    console.log(`[${functionName}] Processing for Client: ${clientId}, Start: ${startTime}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch Client Details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error(`[${functionName}] Database error fetching client:`, clientError);
      throw new Error(`Failed to fetch client: ${clientError.message}`);
    }

    if (!client?.email) throw new Error("Client found but has no email address.");

    const cleanStartTime = new Date(startTime).toISOString();
    const isPaidBool = is_paid === true || is_paid === 'true';

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // 2. Reschedule existing booking if UID provided (Cal.com v2 uses POST /reschedule)
    if (bookingUid && bookingUid !== "undefined" && bookingUid !== "null" && bookingUid !== "") {
      console.log(`[${functionName}] Action: RESCHEDULE booking ${bookingUid} → ${cleanStartTime}`);

      const res = await fetch(`https://api.cal.com/v2/bookings/${bookingUid}/reschedule`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          start: cleanStartTime,
          reschedulingReason: "Rescheduled via Antigravity CRM",
        }),
      });

      const result = await res.json();
      console.log(`[${functionName}] Reschedule response status: ${res.status}`, JSON.stringify(result).slice(0, 300));

      if (res.ok) {
        // Cal.com creates a new booking uid for the rescheduled slot and cancels the old one
        const newUid = result.data?.uid || bookingUid;
        console.log(`[${functionName}] Reschedule successful. New uid: ${newUid}`);
        return new Response(JSON.stringify({ success: true, uid: newUid, data: result.data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404 means the stored UID is stale. Try to find the correct booking by attendee email,
      // but ONLY if the matched booking's numeric id matches the original bookingUid (the
      // original may be a v1 numeric ID while the v2 API expects a string uid).
      if (res.status === 404) {
        console.warn(`[${functionName}] Booking ${bookingUid} not found in Cal.com — attempting to locate by email`);

        const lookback = new Date();
        lookback.setDate(lookback.getDate() - 30);
        const lookahead = new Date();
        lookahead.setDate(lookahead.getDate() + 90);

        const listRes = await fetch(
          `https://api.cal.com/v2/bookings?startTime=${lookback.toISOString()}&endTime=${lookahead.toISOString()}&status=upcoming`,
          { method: "GET", headers }
        );
        const listData = await listRes.json();
        const matched = (listData.data || []).find(
          (b: any) => b.attendees?.[0]?.email?.toLowerCase() === client.email.toLowerCase()
        );

        if (matched) {
          // Safety check: confirm the matched booking is the same one the user intended
          // by comparing the original bookingUid against the matched booking's numeric id.
          const sameBooking = String(matched.id) === String(bookingUid) || String(matched.uid) === String(bookingUid);
          if (!sameBooking) {
            console.warn(`[${functionName}] Matched booking ${matched.uid} (id=${matched.id}) does not match requested ${bookingUid}. Refusing to reschedule wrong booking.`);
            throw new Error(`Booking ${bookingUid} was not found in Cal.com. The stored booking ID may be stale — please refresh and try again.`);
          }

          console.log(`[${functionName}] Found matching uid=${matched.uid} for ${client.email}. Retrying reschedule.`);

          const retryRes = await fetch(`https://api.cal.com/v2/bookings/${matched.uid}/reschedule`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              start: cleanStartTime,
              reschedulingReason: "Rescheduled via Antigravity CRM",
            }),
          });
          const retryResult = await retryRes.json();

          if (retryRes.ok) {
            const newUid = retryResult.data?.uid || matched.uid;
            console.log(`[${functionName}] Reschedule successful via email lookup. New uid: ${newUid}`);
            return new Response(JSON.stringify({ success: true, uid: newUid, data: retryResult.data, repaired: true }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          console.warn(`[${functionName}] Retry reschedule failed for matched uid=${matched.uid}: ${retryResult.error?.message}`);
        } else {
          console.warn(`[${functionName}] No future booking found for ${client.email} in Cal.com`);
        }
        // If lookup fails, fall through to create a new booking
        console.log(`[${functionName}] Falling through to create new booking`);
      } else {
        const errorMsg = result.error?.message || result.message || "Failed to reschedule Cal.com booking";
        throw new Error(`Cal.com Reschedule Error (${res.status}): ${errorMsg}`);
      }
    }
    
    // 3. Create new booking
    console.log(`[${functionName}] Action: CREATE new booking`);
    const createRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        start: cleanStartTime,
        eventTypeId: parseInt(eventTypeId, 10) || 4279898,
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 4. Handle Conflicts
    const errorMsg = createResult.error?.message || createResult.message || "";
    if (createRes.status === 400 && (errorMsg.includes("already has booking") || errorMsg.includes("not available"))) {
      console.log(`[${functionName}] Conflict detected. Searching for existing booking at ${cleanStartTime}`);
      
      const dayStart = new Date(cleanStartTime);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(cleanStartTime);
      dayEnd.setHours(23,59,59,999);

      const listRes = await fetch(`https://api.cal.com/v2/bookings?startTime=${dayStart.toISOString()}&endTime=${dayEnd.toISOString()}&status=upcoming`, {
        method: "GET",
        headers
      });
      
      const listData = await listRes.json();
      const existing = (listData.data || []).find(b => {
        const bStart = new Date(b.start).toISOString();
        const bEmail = b.attendees?.[0]?.email?.toLowerCase();
        return bStart === cleanStartTime && bEmail === client.email.toLowerCase();
      });

      if (existing) {
        console.log(`[${functionName}] Found existing booking: ${existing.uid}. Linking.`);
        return new Response(JSON.stringify({ 
          success: true, 
          uid: existing.uid,
          repaired: true,
          message: "Existing booking found and linked."
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      throw new Error("This slot is unavailable. It may be blocked by an Out-of-Office entry or another client's booking.");
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