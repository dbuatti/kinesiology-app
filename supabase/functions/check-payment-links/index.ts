// @ts-nocheck
/**
 * Payment-link health check.
 *
 * Emailed payment links used to be Stripe Checkout Sessions, which Stripe
 * expires after 24 hours. This scans unpaid, upcoming appointments, asks
 * Stripe what happened to each link, and records the dead ones in
 * `webhook_failures` (source = "payment-link-check") so Settings can surface
 * them instead of the client discovering it at checkout.
 *
 * Payment Links (buy.stripe.com/…) never expire, so they are skipped.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.25.0";
import { requirePractitioner } from "../_shared/auth.ts";
import { stripeObjectIdFromPaymentLink } from "../_shared/stripe-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SOURCE = "payment-link-check";

serve(async (req) => {
  const functionName = "check-payment-links";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authErr = await requirePractitioner(req, corsHeaders);
    if (authErr) return authErr;

    const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const stripe = new Stripe(STRIPE_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let sinceDays = 60;
    try {
      const body = await req.json();
      if (Number(body?.sinceDays) > 0) sinceDays = Math.min(Number(body.sinceDays), 365);
    } catch {
      // no body — defaults are fine
    }

    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, date, payment_link, status, clients(name, email)")
      .not("payment_link", "is", null)
      .eq("payment_received", false)
      .neq("status", "Cancelled")
      .gte("date", since);

    if (error) throw error;

    // Don't re-log the same dead link on every run.
    const { data: existing } = await supabase
      .from("webhook_failures")
      .select("reference")
      .eq("source", SOURCE)
      .eq("resolved", false);
    const alreadyFlagged = new Set((existing || []).map((r) => r.reference));

    let checkoutChecked = 0;
    let paymentLinksSkipped = 0;
    let flagged = 0;
    const problems = [];

    for (const appt of appointments || []) {
      const ref = stripeObjectIdFromPaymentLink(appt.payment_link);
      if (!ref || ref.type !== "checkout_session") {
        // Payment Links and unrecognised links don't expire — nothing to check.
        paymentLinksSkipped++;
        continue;
      }

      checkoutChecked++;
      let reason = null;
      try {
        const session = await stripe.checkout.sessions.retrieve(ref.id);
        if (session.status === "expired") reason = "expired";
        else if (session.status === "complete" && session.payment_status === "paid") continue; // paid, webhook just hasn't landed
      } catch (e) {
        reason = /No such|not found|does not exist/i.test(String(e?.message || e)) ? "missing" : "error";
      }

      if (!reason) continue;

      flagged++;
      const client = Array.isArray(appt.clients) ? appt.clients[0] : appt.clients;
      const who = client?.name || appt.id;
      problems.push({
        id: appt.id,
        name: who,
        email: client?.email || null,
        date: appt.date,
        reason,
        payment_link: appt.payment_link,
      });

      if (!alreadyFlagged.has(appt.id)) {
        await supabase.from("webhook_failures").insert({
          source: SOURCE,
          event_type: reason === "expired" ? "expired_payment_link" : "broken_payment_link",
          reference: appt.id,
          detail: `Payment link for ${who} (${String(appt.date).slice(0, 10)}) is ${reason}. Send a fresh link before the appointment.`,
        });
      }
    }

    console.log(`[${functionName}] checked=${checkoutChecked} flagged=${flagged} skipped=${paymentLinksSkipped}`);
    return new Response(
      JSON.stringify({ success: true, checked: checkoutChecked, flagged, skipped: paymentLinksSkipped, problems }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(`[${functionName}] Error:`, e.message);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});