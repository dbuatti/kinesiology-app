// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Gmail Auth Error: ${data.error_description || data.error}`);
  return data.access_token;
}

async function sendGmail(accessToken: string, from: string, to: string, subject: string, htmlBody: string) {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const message = [
    `From: ${from}`, `To: ${to}`, `Bcc: daniele.buatti@gmail.com`,
    `Content-Type: text/html; charset=utf-8`, `MIME-Version: 1.0`, `Subject: ${utf8Subject}`, ``, htmlBody,
  ].join("\n");
  const encoded = btoa(unescape(encodeURIComponent(message))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
}

// Sends a "payment received" confirmation to the client. Non-fatal on failure.
async function sendVoicePaymentConfirmation(session: any) {
  const to = session.customer_details?.email || session.customer_email;
  if (!to) return;
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH = Deno.env.get("GMAIL_REFRESH_TOKEN");
  const SENDER = Deno.env.get("GMAIL_USER_EMAIL");
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH || !SENDER) {
    console.log("[voice-stripe-webhook] Gmail creds missing — skipping confirmation email");
    return;
  }
  const name = (session.customer_details?.name || session.metadata?.student_name || "there").split(" ")[0];
  const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)} ${(session.currency || "AUD").toUpperCase()}` : "";
  const lessonDate = session.metadata?.lesson_date || "";
  try {
    const token = await getGmailAccessToken(CLIENT_ID, CLIENT_SECRET, REFRESH);
    const html = `
      <!DOCTYPE html><html><body style="margin:0;padding:0;font-family:sans-serif;">
        <center style="width:100%;padding:40px 0;background:#f8fafc;">
          <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:32px;overflow:hidden;">
            <tr><td style="height:6px;background:#E11D48;"></td></tr>
            <tr><td style="padding:48px 40px;text-align:center;">
              <div style="font-size:44px;">✅</div>
              <div style="color:#E11D48;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;margin-top:12px;">Payment Received</div>
              <h1 style="color:#1E293B;font-size:24px;margin:12px 0 8px;">Thank you, ${name}! 🎵</h1>
              <p style="color:#475569;font-size:15px;line-height:1.6;">Your payment${amount ? ` of <strong>${amount}</strong>` : ""} is confirmed${lessonDate ? ` for your lesson on <strong>${lessonDate}</strong>` : ""}. Your spot is locked in — I'm looking forward to working with you.</p>
              <div style="border-top:1px solid #F1F5F9;margin-top:32px;padding-top:24px;text-align:left;">
                <div style="font-weight:700;color:#1E293B;">Daniele Buatti</div>
                <div style="color:#E11D48;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Voice Coach</div>
              </div>
            </td></tr>
          </table>
        </center>
      </body></html>`;
    await sendGmail(token, SENDER, to, "Payment received 🎵 — Your lesson is confirmed", html);
    console.log(`[voice-stripe-webhook] Confirmation email sent to ${to}`);
  } catch (e) {
    console.error("[voice-stripe-webhook] Confirmation email failed (non-fatal):", e.message);
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

      // Resolve lessonId: try calcom_booking_uid metadata first, then email lookup
      if (!lessonId) {
        const calcomUid = session.metadata?.calcom_booking_uid;
        if (calcomUid) {
          console.log(`[${functionName}] Looking up by calcom_booking_uid: ${calcomUid}`);
          const { data: booking } = await supabase
            .from("voice_bookings")
            .select("notion_lesson_id_1, id, calcom_booking_id")
            .eq("calcom_booking_id", calcomUid)
            .maybeSingle();

          if (booking?.notion_lesson_id_1) {
            lessonId = booking.notion_lesson_id_1;
            calcomBookingId = booking.calcom_booking_id;
            console.log(`[${functionName}] Resolved lesson_id ${lessonId} via calcom_booking_uid`);
          }
        }
      }

      // If still no lesson_id, fall back to email lookup
      if (!lessonId && customerEmail) {
        console.log(`[${functionName}] Falling back to email lookup: ${customerEmail}`);
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

      // NOTE: No Cal.com payment sync needed. The event type no longer has "Require payment"
      // ON, so bookings already sync to the calendar on creation. Stripe's
      // checkout.session.completed is the single source of truth for "paid".

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

      // Email the client a payment confirmation (non-fatal).
      await sendVoicePaymentConfirmation(session);
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
