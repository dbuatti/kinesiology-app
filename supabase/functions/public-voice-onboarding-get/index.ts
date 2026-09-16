// @ts-nocheck
// Public (no login) endpoint for VoiceOnboardingPage.tsx: lets a student
// resume a previous submission by email. The frontend used to query
// `voice_onboarding` directly with the anon key — the live RLS policy
// actually only grants SELECT to `authenticated` (not `anon`), so this was
// silently failing (caught and swallowed) rather than leaking data, but it
// meant "resume where you left off" never actually worked for a real
// anonymous visitor. This function restores that behaviour safely: service
// role internally, scoped to an exact email match, only two non-sensitive
// fields returned.
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
    const { email } = await req.json();
    if (!email) throw new Error("Missing email.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

    const { data } = await supabase
      .from("voice_onboarding")
      .select("name, onboarding_completed")
      .eq("email", email)
      .maybeSingle();

    return new Response(JSON.stringify({ name: data?.name || null, onboarding_completed: !!data?.onboarding_completed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[public-voice-onboarding-get] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
