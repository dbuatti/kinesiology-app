// @ts-nocheck
// Called once, right after a client completes email OTP sign-in, to link
// their new auth.users account to their existing `clients` row. Their email
// is read from their OWN verified JWT (never trusted from the request body)
// — Supabase's OTP flow already proved they control that inbox, so matching
// on it here is safe. Idempotent: safe to call on every portal page load.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user || !user.email) {
      return new Response(JSON.stringify({ error: "Not signed in." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Already linked? Return the existing client_id (idempotent).
    const { data: existing } = await supabase
      .from("client_portal_accounts")
      .select("client_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ client_id: existing.client_id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id")
      .eq("email", user.email.toLowerCase().trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (clientErr) throw clientErr;
    if (!client) {
      return new Response(JSON.stringify({ error: "No client record found for this email. Contact your practitioner." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertErr } = await supabase
      .from("client_portal_accounts")
      .insert({ client_id: client.id, auth_user_id: user.id });
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ client_id: client.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[client-portal-link-account] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
