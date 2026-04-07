// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    if (triggerEvent === 'PING') return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid);

    if (triggerEvent === 'BOOKING_CANCELLED') {
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;

    const { data: dbClient } = await supabase
      .from('clients')
      .upsert({ user_id: PRACTITIONER_ID, name, email }, { onConflict: 'email' })
      .select('*')
      .single();

    if (!dbClient) return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    // Smart Match check
    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', dbClient.id)
      .eq('date', startTime)
      .maybeSingle();

    if (existingApp) {
      await supabase
        .from('appointments')
        .update({ 
          calcom_booking_id: calcomId,
          is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0]
        })
        .eq('id', existingApp.id);
    } else {
      await supabase
        .from('appointments')
        .upsert({
          user_id: PRACTITIONER_ID,
          client_id: dbClient.id,
          date: startTime,
          tag: "Kinesiology",
          status: "Scheduled",
          calcom_booking_id: calcomId,
          is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0]
        }, { onConflict: 'calcom_booking_id' });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})