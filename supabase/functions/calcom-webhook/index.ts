// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  return data.access_token;
}

async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: daniele.buatti@gmail.com`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    ``,
    htmlBody,
  ];
  const message = messageParts.join('\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );
  return response.json();
}

serve(async (req) => {
  console.log(`[calcom-webhook] Incoming ${req.method} request`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Resolve Practitioner User ID
    // We look up the first user in the profiles table to avoid hardcoded IDs
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).single();
    const PRACTITIONER_ID = profileData?.id;

    if (!PRACTITIONER_ID) {
      console.error("[calcom-webhook] Could not resolve a practitioner user ID.");
      throw new Error("System configuration error: No practitioner found.");
    }

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    
    if (triggerEvent === 'PING') {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.bookingId || payload.id || payload.uid || (body.payload && body.payload.id));

    if (triggerEvent === 'BOOKING_CANCELLED' || triggerEvent === 'BOOKING_REJECTED') {
      console.log(`[calcom-webhook] Deleting cancelled booking: ${calcomId}`);
      await supabase.from('appointments').delete().eq('calcom_booking_id', calcomId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) {
      console.log("[calcom-webhook] Skipping: No attendee data found.");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;
    
    const isPaidSession = payload.metadata?.is_paid === "true" || Number(payload.eventTypeId) === 4279898;
    const hasPaidViaStripe = !!(payload.payment?.[0]?.amount || payload.paymentId);

    // 2. Sync Client
    let { data: dbClient } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
    if (!dbClient) {
      const { data: newDbC, error: cErr } = await supabase.from('clients').insert({ 
        user_id: PRACTITIONER_ID, 
        name, 
        email, 
        phone: attendee.phoneNumber || attendee.phone || "" 
      }).select().single();
      if (cErr) console.error("[calcom-webhook] Client creation error:", cErr);
      dbClient = newDbC;
    }

    // 3. Sync Appointment
    if (dbClient) {
      const appointmentData = {
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        calcom_booking_id: calcomId,
        is_paid: isPaidSession,
        payment_received: hasPaidViaStripe
      };
      
      const { data: newApp, error: appErr } = await supabase
        .from('appointments')
        .upsert(appointmentData, { onConflict: 'calcom_booking_id' })
        .select('id')
        .single();
        
      if (appErr) {
        console.error("[calcom-webhook] Appointment sync error:", appErr);
      } else {
        console.log(`[calcom-webhook] Appointment ${newApp?.id} synced to DB.`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[calcom-webhook] Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})