// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function syncCalcomVoicePayment(calcomBookingId: string) {
  const CALCOM_KEY = Deno.env.get("CALCOM_API_KEY");
  if (!CALCOM_KEY) {
    console.log(`[voice-stripe-webhook] Skipping cal.com sync: CALCOM_API_KEY not set`);
    return;
  }

  const headers = {
    "Authorization": `Bearer ${CALCOM_KEY}`,
    "cal-api-version": "2024-08-13",
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}/confirm`, {
      method: "POST",
      headers,
    });

    if (res.ok) {
      console.log(`[voice-stripe-webhook] Cal.com sync: Booking ${calcomBookingId} confirmed as paid`);

      await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ metadata: { is_paid: "true" } }),
      }).catch(() => {});
    } else {
      const err = await res.json();
      console.error(`[voice-stripe-webhook] Cal.com confirm failed: ${res.status}`, JSON.stringify(err).slice(0, 200));

      const metaRes = await fetch(`https://api.cal.com/v2/bookings/${calcomBookingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ metadata: { is_paid: "true" } }),
      });

      if (metaRes.ok) {
        console.log(`[voice-stripe-webhook] Cal.com sync (metadata): Booking ${calcomBookingId} marked as paid`);
      } else {
        const metaErr = await metaRes.json();
        console.error(`[voice-stripe-webhook] Cal.com sync (metadata) failed: ${metaRes.status}`, JSON.stringify(metaErr).slice(0, 200));
      }
    }
  } catch (err) {
    console.error(`[voice-stripe-webhook] Cal.com sync error:`, err.message);
  }
}

serve(async (req) => {
  const functionName = "voice-stripe-webhook";

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET_VOICE");
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    let event;

    if (WEBHOOK_SECRET && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
    } else {
      event = JSON.parse(body);
    }

    console.log(`[${functionName}] Processing event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      let lessonId = session.metadata?.lesson_id || session.metadata?.lessonId;
      let calcomBookingId = null;
      const customerEmail = session.customer_details?.email || session.customer_email;

      console.log(`[${functionName}] Session ${session.id}, lessonId: "${lessonId}", email: ${customerEmail || "none"}`);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // If no lesson_id in metadata, find the booking by customer email
      if (!lessonId && customerEmail) {
        console.log(`[${functionName}] No lesson_id, looking up booking by email: ${customerEmail}`);
        const { data: booking } = await supabase
          .from("voice_bookings")
          .select("notion_lesson_id_1, id, calcom_booking_id")
          .eq("student_email", customerEmail)
          .eq("status", "scheduled")
          .order("lesson_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (booking?.notion_lesson_id_1) {
          lessonId = booking.notion_lesson_id_1;
          calcomBookingId = booking.calcom_booking_id;
          console.log(`[${functionName}] Resolved lesson_id ${lessonId} from booking ${booking.id}`);
        } else {
          console.log(`[${functionName}] No matching scheduled booking found for ${customerEmail}`);
        }
      }

      // Update voice_bookings status to paid
      if (lessonId) {
        const { error: bookingError } = await supabase
          .from("voice_bookings")
          .update({ status: "paid" })
          .eq("notion_lesson_id_1", lessonId);

        if (bookingError) {
          console.error(`[${functionName}] Failed to update voice_bookings:`, bookingError.message);
        } else {
          console.log(`[${functionName}] Updated voice_bookings for lesson ${lessonId}`);
        }
      } else {
        console.log(`[${functionName}] Could not resolve lessonId, skipping voice_bookings update`);
      }

      // Sync payment status back to cal.com
      if (calcomBookingId) {
        await syncCalcomVoicePayment(calcomBookingId);
      }

      // Update Notion payment status
      if (lessonId) {
        const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY") || "";
        if (NOTION_API_KEY) {
          console.log(`[${functionName}] Marking lesson ${lessonId} as paid in Notion`);

          const notionRes = await fetch(`https://api.notion.com/v1/pages/${lessonId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${NOTION_API_KEY}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28",
            },
            body: JSON.stringify({
              properties: {
                Payment: {
                  select: { name: "Paid (Stripe)" },
                },
              },
            }),
          });

          if (!notionRes.ok) {
            const err = await notionRes.json();
            console.error(`[${functionName}] Failed to update Notion:`, JSON.stringify(err));
          } else {
            console.log(`[${functionName}] Updated Notion lesson ${lessonId} to Paid (Stripe)`);
          }
        }
      }

      // If we still couldn't find the booking, try creating one from session data
      if (!lessonId && customerEmail) {
        console.log(`[${functionName}] Creating voice_bookings record from session data`);
        const { error: insertError } = await supabase
          .from("voice_bookings")
          .insert({
            student_email: customerEmail,
            student_name: session.customer_details?.name || customerEmail,
            lesson_date: new Date().toISOString().split("T")[0],
            status: "paid",
            cost: session.amount_total ? session.amount_total / 100 : null,
          });

        if (insertError) {
          console.error(`[${functionName}] Failed to insert booking from session:`, insertError.message);
        } else {
          console.log(`[${functionName}] Inserted new paid booking for ${customerEmail}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
