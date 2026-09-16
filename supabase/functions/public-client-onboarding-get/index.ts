// @ts-nocheck
// Public (no login) endpoint for OnboardingPage.tsx: given a client id from
// the onboarding link, return only the intake-form-relevant fields for that
// one row. Replaces a direct anon `clients` table query that used to run
// under a blanket "USING (true)" SELECT policy (any anon caller could list
// every client, not just look up one by id) — this function uses the
// service role internally, selects an explicit column list (never `select
// *`), and returns exactly one row for an exact id match.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Exactly the column list OnboardingPage.tsx used to select directly.
const INTAKE_COLUMNS = "id, name, email, phone, pronouns, born, suburbs, occupation, marital_status, children, medical_history, emergency_contact_name, emergency_contact_phone, referral_source, current_stress_level, sleep_quality, digestive_health, medications_supplements, stripe_customer_id, home_address, emergency_contact_relationship, change_one_thing, never_been_same_since, chief_complaint, health_problem_severity, seen_medical_doctor, symptoms_worse_stress, symptoms_worse_fatigue, pain_movement, therapies_used, therapies_other, therapies_success, specific_illnesses, covid_vaccinated, covid_shots, allergies_asthma, energy_worse_time, family_medical_history, alcohol_frequency, sleep_schedule, sleep_quality_details, concussion_history, concussion_details, birthing_experience, avoided_emotion, craved_emotion, stress_response, most_craved_human_need, startled_by_loud_noises, emotional_regulation_time, additional_notes";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { id } = await req.json();
    if (!id) throw new Error("Missing client id.");

    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

    const { data, error } = await supabase
      .from("clients")
      .select(INTAKE_COLUMNS)
      .eq("id", id)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ client: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[public-client-onboarding-get] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
