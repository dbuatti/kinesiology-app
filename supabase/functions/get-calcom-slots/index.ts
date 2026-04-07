// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("--- [get-calcom-slots] v7 OVERRIDE SUPPORT ---");

  try {
    let { start, end, eventTypeId, timeZone, isOverride } = await req.json()
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase Secrets.")

    const headers = {
      'Authorization': `Bearer ${CALCOM_KEY}`,
      'cal-api-version': '2024-08-13',
      'Content-Type': 'application/json',
    };

    // 1. Fetch User Info if in Override Mode
    let username = null;
    if (isOverride) {
      const meRes = await fetch('https://api.cal.com/v2/me', { headers });
      const meData = await meRes.json();
      username = meData.data?.username;
      console.log(`[Override] Fetching slots for user: ${username}`);
    }

    // 2. Fetch Available Slots
    const slotsUrl = new URL('https://api.cal.com/v2/slots/available')
    slotsUrl.searchParams.set('startTime', start)
    slotsUrl.searchParams.set('endTime', end)
    
    if (isOverride && username) {
      slotsUrl.searchParams.set('username', username)
      // We still pass eventTypeId to help Cal.com determine the slot duration (e.g. 75m)
      if (eventTypeId) slotsUrl.searchParams.set('eventTypeId', eventTypeId)
    } else {
      slotsUrl.searchParams.set('eventTypeId', eventTypeId || "4279898")
    }
    
    if (timeZone) slotsUrl.searchParams.set('timeZone', timeZone)

    const slotsResponse = await fetch(slotsUrl.toString(), { method: 'GET', headers })
    const slotsData = await slotsResponse.json()
    
    // 3. Fetch Out-of-Office Blocks
    const oooResponse = await fetch('https://api.cal.com/v2/me/ooo', { method: 'GET', headers })
    const oooData = await oooResponse.json()

    // 4. Fetch Existing Bookings
    const bookingsUrl = new URL('https://api.cal.com/v2/bookings')
    bookingsUrl.searchParams.set('startTime', start)
    bookingsUrl.searchParams.set('endTime', end)
    bookingsUrl.searchParams.set('status', 'upcoming')

    const bookingsResponse = await fetch(bookingsUrl.toString(), { method: 'GET', headers })
    const bookingsData = await bookingsResponse.json()

    if (!slotsResponse.ok) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: slotsData.error?.message || "Cal.com Slots API Error"
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const blockedDates = (oooData.data || []).map(entry => {
      const date = new Date(entry.start);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    });

    const bookingsByDate = {};
    (bookingsData.data || []).forEach(booking => {
      const dateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(booking.start));
      
      if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
      bookingsByDate[dateKey].push({
        id: booking.id,
        uid: booking.uid,
        start: booking.start,
        attendeeName: booking.attendees?.[0]?.name || "Unknown",
        attendeeEmail: booking.attendees?.[0]?.email || "",
        title: booking.title
      });
    });

    return new Response(JSON.stringify({
      status: 'success',
      data: slotsData.data.slots,
      blockedDates: blockedDates,
      bookings: bookingsByDate
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("Slots Error:", error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})