// @ts-nocheck
// Public (no login) endpoint for PublicIntakeForm.tsx: writes a client's
// self-submitted intake form back to their own row, identified by id. Replaces
// a direct anon `clients` table UPDATE that used to run under a blanket
// "USING (true) WITH CHECK (true)" policy — any anon caller could update ANY
// client row with ANY values, not just their own. This function uses the
// service role internally, only ever updates a single row by exact id match,
// and strips the incoming payload down to an explicit allowlist of intake
// columns so a crafted request body can't touch anything else (e.g. status
// fields, user_id, stripe ids) beyond what the intake form itself writes.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Exactly the keys PublicIntakeForm.tsx's clientPayload builds, plus the two
// fields it sets on submit (intake_submitted_at, status). Anything else in
// the incoming payload is silently dropped.
const ALLOWED_FIELDS = [
  "name", "email", "phone", "born", "home_address", "referral_source",
  "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship",
  "occupation", "children", "change_one_thing", "never_been_same_since", "chief_complaint",
  "health_problem_severity", "seen_medical_doctor", "symptoms_worse_stress", "symptoms_worse_fatigue",
  "pain_movement", "current_stress_level", "therapies_used", "therapies_other", "therapies_success",
  "specific_illnesses", "covid_vaccinated", "covid_shots", "allergies_asthma", "energy_worse_time",
  "family_medical_history", "alcohol_frequency", "sleep_schedule", "sleep_quality_details",
  "concussion_history", "concussion_details", "birthing_experience", "avoided_emotion", "craved_emotion",
  "stress_response", "most_craved_human_need", "startled_by_loud_noises", "emotional_regulation_time",
  "goal_working", "goal_12_sessions", "goal_safe_feeling", "additional_notes",
  "intake_submitted_at", "status",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { id, payload } = await req.json();
    if (!id) throw new Error("Missing client id.");
    if (!payload || typeof payload !== "object") throw new Error("Missing intake payload.");

    const safePayload: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in payload) safePayload[key] = payload[key];
    }
    if (Object.keys(safePayload).length === 0) throw new Error("No recognised intake fields in payload.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

    const { error } = await supabase.from("clients").update(safePayload).eq("id", id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[public-client-intake-update] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
