// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ensurePerson } from "../_shared/people.ts";

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
    const normEmail = String(email).toLowerCase().trim();

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

    // Unified People: the onboarding answers also live on the person's
    // `clients` row so People, ClientSnapshot, and Notion sync see one
    // profile instead of two sources (voice_onboarding + clients).
    try {
      const personId = await ensurePerson(supabase, {
        email: normEmail,
        name: name || null,
        practice: "voice",
        notionVoiceClientId: null,
      });
      if (personId) {
        const patch: Record<string, unknown> = {
          voice_goals: goals || null,
          voice_experience_level: experienceLevel || null,
          voice_mobile: mobile || null,
          voice_additional_notes: additionalNotes || null,
          voice_onboarding_completed: true,
          voice_onboarding_submitted_at: new Date().toISOString(),
          onboarding_submitted_at: new Date().toISOString(),
        };
        if (name) patch.name = name;
        if (mobile) patch.phone = mobile;
        // Tolerate DBs where supabase_unified_people.sql hasn't run yet.
        const { error: clientErr } = await supabase.from("clients").update(patch).eq("id", personId);
        if (clientErr && String(clientErr.message || '').includes('column')) {
          const fallbackPatch: Record<string, unknown> = { onboarding_submitted_at: new Date().toISOString() };
          if (name) fallbackPatch.name = name;
          if (mobile) fallbackPatch.phone = mobile;
          const { error: retryErr } = await supabase.from("clients").update(fallbackPatch).eq("id", personId);
          if (retryErr) console.error(`[${functionName}] clients mirror failed:`, retryErr.message);
        } else if (clientErr) console.error(`[${functionName}] clients mirror failed:`, clientErr.message);
        else {
          // Keep Notion Voice Clients in sync (best-effort, never blocks).
          try {
            await supabase.functions.invoke("sync-to-notion", {
              body: { action: "sync-client", clientId: personId },
            });
          } catch (_e) { /* non-fatal */ }
        }
      }
    } catch (mirrorErr) {
      console.error(`[${functionName}] clients mirror failed (non-fatal):`, mirrorErr?.message);
    }

    console.log(`[${functionName}] Onboarding saved for ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[${functionName}] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
