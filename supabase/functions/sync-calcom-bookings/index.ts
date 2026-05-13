// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  const functionName = "sync-calcom-bookings";
  console.log(`[${functionName}] Request received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY');

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase environment variables.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);
    
    const PRACTITIONER_ID = profileData?.id;
    if (!PRACTITIONER_ID) throw new Error("No practitioner profile found. Please create a profile first.");

    const now = new Date().toISOString();
    const bookingsUrl = new URL('https://api.cal.com/v2/bookings');
    bookingsUrl.searchParams.set('status', 'upcoming');
    bookingsUrl.searchParams.set('startTime', now);

    const response = await fetch(bookingsUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALCOM_KEY}`,
        'cal-api-version': '2024-08-13',
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Cal.com API Error");

    const bookings = result.data || [];
    let syncedCount = 0;

    for (const booking of bookings) {
      const attendee = booking.attendees?.[0];
      if (!attendee || !attendee.email) continue;

      const name = String(attendee.name || "Unknown Client").trim();
      const email = String(attendee.email || "").toLowerCase().trim();
      const calcomId = String(booking.uid || booking.id);
      const startTime = booking.start;

      // 1. Upsert Client
      const { data: dbClient, error: clientError } = await supabase
        .from('clients')
        .upsert({ user_id: PRACTITIONER_ID, name, email }, { onConflict: 'email' })
        .select('id')
        .single();

      if (clientError || !dbClient) {
        console.error(`[${functionName}] Error upserting client ${email}:`, clientError);
        continue;
      }

      // 2. Check for existing record by Calcom ID
      const { data: existingApp } = await supabase
        .from('appointments')
        .select('id')
        .eq('calcom_booking_id', calcomId)
        .maybeSingle();

      let targetId = existingApp?.id;

      // 3. If not found by ID, check for ANY appointment for this client within a 1-minute window
      if (!targetId) {
        const startDate = new Date(startTime);
        const windowStart = new Date(startDate.getTime() - 60000).toISOString();
        const windowEnd = new Date(startDate.getTime() + 60000).toISOString();

        const { data: timeMatch } = await supabase
          .from('appointments')
          .select('id')
          .eq('client_id', dbClient.id)
          .gte('date', windowStart)
          .lte('date', windowEnd)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (timeMatch) {
          targetId = timeMatch.id;
        }
      }

      // 4. Upsert with the matched ID
      const { error: appError } = await supabase
        .from('appointments')
        .upsert({
          ...(targetId ? { id: targetId } : {}),
          user_id: PRACTITIONER_ID,
          client_id: dbClient.id,
          date: startTime,
          calcom_booking_id: calcomId,
          is_paid: booking.metadata?.is_paid === "true" || !!booking.payment?.[0]
        }, { 
          onConflict: targetId ? 'id' : 'calcom_booking_id' 
        });

      if (appError) {
        console.error(`[${functionName}] Error for booking ${calcomId}:`, appError);
        continue;
      }

      syncedCount++;
    }

    return new Response(JSON.stringify({ success: true, syncedCount }), { 
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