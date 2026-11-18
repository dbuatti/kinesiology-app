// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0";
import { requirePractitioner } from "../_shared/auth.ts";
import { createPaymentLink } from "../_shared/stripe-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  const functionName = "voice-payment-link";

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authErr = await requirePractitioner(req, corsHeaders);
    if (authErr) return authErr;

    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY_VOICE");
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY_VOICE");

    const { amount, lessonTitle, email, lessonId, studentName } = await req.json();

    if (!amount || !lessonTitle) {
      throw new Error("Missing required fields: amount, lessonTitle");
    }

    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const url = await createPaymentLink(stripe, {
      amount: Number(amount) / 100,
      name: lessonTitle,
      description: studentName ? `Voice lesson for ${studentName}` : undefined,
      customerEmail: email || null,
      metadata: {
        lesson_id: lessonId || "",
        type: "voice_lesson",
      },
      statementDescriptor: "VOICE COACHING",
    });

    console.log(`[${functionName}] Created payment link for ${lessonTitle}`);

    return new Response(
      JSON.stringify({ success: true, url, sessionId: null }),
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
