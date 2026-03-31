// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("--- CAL.COM WEBHOOK RECEIVED ---");

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { triggerEvent, payload } = body

    // We only care about new bookings
    if (triggerEvent !== 'BOOKING_CREATED') {
      console.log(`Ignoring event: ${triggerEvent}`);
      return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200, headers: corsHeaders });
    }

    const attendee = payload.attendees[0]
    const email = attendee.email
    const name = attendee.name
    const startTime = payload.startTime
    const endTime = payload.endTime
    const title = payload.title || "Cal.com Booking"
    const description = payload.description || ""
    
    // 1. Find the User ID (Practitioner)
    // In a multi-user system, we'd match by organizer email. 
    // For now, we'll assume the primary user who owns the project.
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError || !userData.users.length) throw new Error("Could not find practitioner user")
    const userId = userData.users[0].id

    console.log(`Processing booking for ${name} (${email}) at ${startTime}`);

    // 2. Upsert Client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
        user_id: userId,
        name: name,
        email: email,
        // Phone might be in responses or payload
        phone: attendee.phoneNumber || null,
      }, { onConflict: 'user_id,email' })
      .select()
      .single()

    if (clientError) throw clientError

    // 3. Create Appointment
    const { error: appError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        client_id: client.id,
        name: title,
        date: startTime,
        tag: "Kinesiology",
        status: "Scheduled",
        issue: description,
        notes: `Booked via Cal.com. UID: ${payload.uid}`
      })

    if (appError) throw appError

    console.log("Successfully synced Cal.com booking to CRM.");
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})