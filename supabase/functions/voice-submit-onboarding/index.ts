// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  const functionName = "voice-submit-onboarding";
  console.log(`[${functionName}] Request received`);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, name, mobile, goals, experienceLevel, additionalNotes } = await req.json();
    if (!email) throw new Error("Missing required field: email");

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    const { error } = await supabase
      .from('voice_onboarding')
      .update({
        name: name || null,
        mobile: mobile || null,
        goals: goals || null,
        experience_level: experienceLevel || null,
        additional_notes: additionalNotes || null,
        onboarding_completed: true,
        submitted_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) throw error;

    console.log(`[${functionName}] Onboarding saved for ${email}`);

    return new Response(JSON.stringify({ success: true }), {
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
