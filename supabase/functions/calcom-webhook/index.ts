// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Only process these specific clinical event types
const ALLOWED_EVENT_IDS = [4279898, 5302336, 5927215];

serve(async (req) => {
  const functionName = "calcom-webhook";
  console.log(`[${functionName}] Webhook received`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase environment variables.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: profileData } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    const PRACTITIONER_ID = profileData?.id;

    const body = await req.json();
    const triggerEvent = body.triggerEvent || body.type;
    
    console.log(`[${functionName}] Event Type: ${triggerEvent}`);

    if (triggerEvent === 'PING') {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    const payload = body.payload || body.data || body;
    const calcomId = String(payload.uid || payload.bookingId || payload.id);

    // For rescheduled bookings, grab the old booking UID so we can update
    // the existing row instead of creating a duplicate (Cal.com cancels the
    // old booking and creates a new one with a different UID on reschedule).
    const oldBookingUid = triggerEvent === 'BOOKING_RESCHEDULED'
      ? (payload.rescheduleUid || payload.oldBookingUid || payload.oldUid || null)
      : null;

    if (triggerEvent === 'BOOKING_CANCELLED') {
      console.log(`[${functionName}] Deleting cancelled booking: ${calcomId}`);

      // Archive the linked Notion page(s) before deleting the appointment row, so a
      // cancellation on Cal.com is removed from Notion too (not just Supabase).
      const NOTION_KEY = Deno.env.get('NOTION_API_KEY');
      if (NOTION_KEY) {
        const { data: toCancel } = await supabase
          .from('appointments')
          .select('notion_page_id, notion_planner_id')
          .eq('calcom_booking_id', calcomId)
          .maybeSingle();
        for (const pageId of [toCancel?.notion_page_id, toCancel?.notion_planner_id].filter(Boolean)) {
          await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${NOTION_KEY}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
            body: JSON.stringify({ archived: true }),
          }).catch((e) => console.error(`[${functionName}] Notion archive failed for ${pageId}:`, e.message));
        }
      }

      // IMPORTANT: We preserve the appointment row (clinical data survives),
      // only unlink from Cal.com and mark as Cancelled. Notion pages are
      // archived above so they don't clutter the DB view.
      const { error } = await supabase.from('appointments')
        .update({ calcom_booking_id: null, status: 'Cancelled' })
        .eq('calcom_booking_id', calcomId);
      
      // Also try to match by time window if calcom_booking_id didn't match
      if (!error) {
        const attendee = (payload.attendees && payload.attendees[0]) || 
                         (payload.responses && { name: payload.responses.name, email: payload.responses.email });
        const startTime = payload.startTime || payload.start;
        
        if (attendee?.email && startTime) {
          const email = String(attendee.email).toLowerCase().trim();
          const { data: client } = await supabase.from('clients').select('id').eq('email', email).maybeSingle();
          if (client) {
            const startDate = new Date(startTime);
            const wStart = new Date(startDate.getTime() - 300000).toISOString();
            const wEnd = new Date(startDate.getTime() + 300000).toISOString();
            await supabase.from('appointments').update({ calcom_booking_id: null, status: 'Cancelled' })
              .eq('client_id', client.id)
              .gte('date', wStart)
              .lte('date', wEnd);
          }
        }
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    // SECURITY FILTER: Check if this is a clinical event (creation/reschedule only)
    const eventTypeId = parseInt(payload.eventTypeId);
    if (eventTypeId && !ALLOWED_EVENT_IDS.includes(eventTypeId)) {
      console.log(`[${functionName}] Skipping non-clinical event type: ${eventTypeId}`);
      return new Response(JSON.stringify({ success: true, message: "Skipped: Non-clinical event type" }), { status: 200, headers: corsHeaders });
    }

    const attendee = (payload.attendees && payload.attendees[0]) || 
                     (payload.responses && { name: payload.responses.name, email: payload.responses.email });
    
    if (!attendee || !attendee.email) {
      console.warn(`[${functionName}] Skipping: No attendee email found in payload.`);
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), { status: 200, headers: corsHeaders });
    }

    const name = String(attendee.name || "Unknown Client").trim();
    const email = String(attendee.email || "").toLowerCase().trim();
    const startTime = payload.startTime || payload.start;

    // Find existing client by email to avoid unique constraint issues
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let dbClient;
    if (existingClient) {
      const { data: updatedClient, error: clientError } = await supabase
        .from('clients')
        .update({ name })
        .eq('id', existingClient.id)
        .select('*')
        .single();
      
      if (clientError) throw clientError;
      dbClient = updatedClient;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ user_id: PRACTITIONER_ID, name, email })
        .select('*')
        .single();

      if (clientError) throw clientError;
      dbClient = newClient;
    }

    const isCreationEvent = ['BOOKING_CREATED', 'BOOKING_RESCHEDULED'].includes(triggerEvent);
    
    // 1. Check for existing record by Calcom ID
    const { data: existingApp } = await supabase
      .from('appointments')
      .select('id')
      .eq('calcom_booking_id', calcomId)
      .maybeSingle();

    if (!existingApp && !isCreationEvent) {
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), { status: 200, headers: corsHeaders });
    }

    let targetId = existingApp?.id;

    // 2. If not found by ID, check for ANY appointment for this client within a 1-minute window
    if (!targetId && isCreationEvent) {
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
        console.log(`[${functionName}] Found existing appointment by time window. Linking to Cal.com ID: ${calcomId}`);
        targetId = timeMatch.id;
      }
    }

    // 2b. For rescheduled bookings: try to find the old row by its previous
    // Cal.com UID so we update it with the new date + UID instead of duping.
    if (!targetId && triggerEvent === 'BOOKING_RESCHEDULED' && oldBookingUid) {
      const { data: oldMatch } = await supabase
        .from('appointments')
        .select('id')
        .eq('calcom_booking_id', oldBookingUid)
        .maybeSingle();
      if (oldMatch) {
        console.log(`[${functionName}] Found appointment by old Cal.com UID: ${oldBookingUid}. Replacing with new UID: ${calcomId}`);
        targetId = oldMatch.id;
      }
    }

    let priceAmount = 0;
    if (String(eventTypeId) === "4279898") priceAmount = 70;
    else if (String(eventTypeId) === "5927215") priceAmount = 0;
    else if (String(eventTypeId) === "5302336") priceAmount = 100;
    if (payload.payment && payload.payment[0]) priceAmount = payload.payment[0].amount / 100;

    const { error: appError } = await supabase
      .from('appointments')
      .upsert({
        ...(targetId ? { id: targetId } : {}),
        user_id: PRACTITIONER_ID,
        client_id: dbClient.id,
        date: startTime,
        calcom_booking_id: calcomId,
        status: triggerEvent === 'BOOKING_RESCHEDULED' ? 'Scheduled' : 'Scheduled',
        is_paid: payload.metadata?.is_paid === "true" || !!payload.payment?.[0],
        price_amount: priceAmount,
        price_currency: 'AUD'
      }, { 
        onConflict: targetId ? 'id' : 'calcom_booking_id' 
      });

    if (appError) throw appError;

    // Send the intake/confirmation email for NEW bookings that came in through the
    // Cal.com website embed (app-initiated bookings already call send-manual-onboarding
    // themselves). Without this, externally-booked clients like Lesley never receive
    // the intake form. Reschedules are skipped to avoid re-spamming existing clients.
    //
    // IDEMPOTENCY: only send when this booking's row did NOT already exist
    // (`!existingApp`, matched by calcom_booking_id). Cal.com re-delivers webhooks
    // (retries) and the reconcile replay can re-POST the same event — every repeat
    // finds the row already saved and skips, so a client is never emailed twice.
    if (triggerEvent === 'BOOKING_CREATED' && !existingApp) {
      try {
        // Resolve the appointment id we just wrote so onboarding attaches the right session.
        let onboardAppointmentId = targetId;
        if (!onboardAppointmentId) {
          const { data: justSaved } = await supabase
            .from('appointments')
            .select('id')
            .eq('calcom_booking_id', calcomId)
            .maybeSingle();
          onboardAppointmentId = justSaved?.id;
        }

        const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-manual-onboarding`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId: dbClient.id, appointmentId: onboardAppointmentId }),
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          console.error(`[${functionName}] Onboarding email call failed (${resp.status}): ${errText}`);
          await supabase.from('webhook_failures').insert({
            source: functionName,
            event_type: 'onboarding-email',
            reference: calcomId,
            detail: `Onboarding email failed for ${email} (${resp.status}): ${errText}`.slice(0, 500),
          }).catch(() => {});
        } else {
          console.log(`[${functionName}] Onboarding email dispatched for ${email}`);
        }
      } catch (e) {
        // Never let a mail hiccup fail the booking sync — surface it instead.
        console.error(`[${functionName}] Onboarding email error (non-fatal):`, e.message);
        await supabase.from('webhook_failures').insert({
          source: functionName,
          event_type: 'onboarding-email',
          reference: calcomId,
          detail: `Onboarding email error for ${email}: ${e.message}`.slice(0, 500),
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(`[${functionName}] CRITICAL FAILURE:`, error.message);
    // Surface failed Cal.com syncs in the Unmatched Payments / webhook_failures view.
    try {
      const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      await sb.from('webhook_failures').insert({ source: functionName, event_type: 'calcom-webhook', detail: error.message });
    } catch (_e) { /* non-fatal */ }
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
})