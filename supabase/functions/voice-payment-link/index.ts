// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  const functionName = "voice-payment-link";

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

    const { amount, lessonTitle, email, lessonId, studentName } = await req.json();

    if (!amount || !lessonTitle) {
      throw new Error("Missing required fields: amount, lessonTitle");
    }

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: {
        statement_descriptor: 'VOICE COACHING',
      },
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: lessonTitle,
              description: studentName ? `Voice lesson for ${studentName}` : undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        lesson_id: lessonId || "",
        type: "voice_lesson",
      },
      ...(email ? { customer_email: email } : {}),
      success_url: `${Deno.env.get("SITE_URL") || "https://kinesiology-app.vercel.app"}/voice/paid`,
      cancel_url: `${Deno.env.get("SITE_URL") || "https://kinesiology-app.vercel.app"}/voice/calendar`,
    });

    console.log(`[${functionName}] Created checkout session: ${session.id} for ${lessonTitle}`);

    return new Response(
      JSON.stringify({ success: true, url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
