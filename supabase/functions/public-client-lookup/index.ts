// @ts-nocheck
// Public (no login) endpoint for OnboardingLookupPage.tsx: given an email,
// return just the matching client id. Replaces a direct anon `clients` table
// query that used to run under a blanket "USING (true)" SELECT/UPDATE policy —
// this function uses the service role internally and only ever returns a
// single id for an exact email match, never a listing of other rows.
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

    const { data, error } = await supabase
      .from("clients")
      .select("id")
      .eq("email", String(email).toLowerCase().trim())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    return new Response(JSON.stringify({ id: data?.[0]?.id || null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[public-client-lookup] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
