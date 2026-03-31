// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log("--- NOTION TO CAL.COM SYNC START ---");

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    const CALCOM_KEY = Deno.env.get('CALCOM_API_KEY')

    if (!CALCOM_KEY) throw new Error("Missing CALCOM_API_KEY in Supabase secrets.");

    // Notion Automations send the page ID in the payload
    const body = await req.json();
    const notionPageId = body.data?.id || body.id;

    if (!notionPageId) throw new Error("No Notion Page ID provided in webhook payload.");

    console.log(`Searching for appointment linked to Notion Page: ${notionPageId}`);

    // 1. Find the appointment in Supabase to get the Cal.com ID
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, calcom_booking_id, status')
      .eq('notion_page_id', notionPageId)
      .single();

    if (fetchError || !appointment) {
      console.log("No matching appointment found in Supabase. It might have been created manually in Notion.");
      return new Response(JSON.stringify({ message: "No matching record" }), { status: 200, headers: corsHeaders });
    }

    if (!appointment.calcom_booking_id) {
      console.log("Appointment found, but has no Cal.com booking ID to cancel.");
      return new Response(JSON.stringify({ message: "No Cal.com ID" }), { status: 200, headers: corsHeaders });
    }

    // 2. Cancel on Cal.com
    console.log(`Cancelling Cal.com booking: ${appointment.calcom_booking_id}`);
    const calResponse = await fetch(`https://api.cal.com/v1/bookings/${appointment.calcom_booking_id}/cancel?apiKey=${CALCOM_KEY}`, {
      method: 'DELETE'
    });

    if (!calResponse.ok) {
      const errorData = await calResponse.json();
      console.error("Cal.com API Error:", errorData);
      // We continue anyway to update the local DB status
    }

    // 3. Update Supabase Status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'Cancelled' })
      .eq('id', appointment.id);

    if (updateError) throw updateError;

    console.log("SUCCESS: Cal.com cancelled and CRM updated.");
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})