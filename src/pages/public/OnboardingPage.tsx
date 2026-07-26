
import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Heart, CheckCircle2, ShieldCheck } from "lucide-react";
import PublicIntakeForm from "@/components/crm/PublicIntakeForm";
import { cn } from "@/lib/utils";

const OnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appId");
  
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        setError("Invalid onboarding link. No client ID provided.");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, phone, pronouns, born, suburbs, occupation, marital_status, children, medical_history, emergency_contact_name, emergency_contact_phone, referral_source, current_stress_level, sleep_quality, digestive_health, medications_supplements, stripe_customer_id, home_address, emergency_contact_relationship, change_one_thing, never_been_same_since, chief_complaint, health_problem_severity, seen_medical_doctor, symptoms_worse_stress, symptoms_worse_fatigue, pain_movement, therapies_used, therapies_other, therapies_success, specific_illnesses, covid_vaccinated, covid_shots, allergies_asthma, energy_worse_time, family_medical_history, alcohol_frequency, sleep_schedule, sleep_quality_details, concussion_history, concussion_details, birthing_experience, avoided_emotion, craved_emotion, stress_response, most_craved_human_need, startled_by_loud_noises, emotional_regulation_time, additional_notes')
          .eq('id', id)
          .single();

        if (error) throw error;
        setClient(data);
      } catch (err) {
        console.error("Error fetching client for onboarding:", err);
        setError("Invalid onboarding link. Please check with your practitioner.");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-3xl animate-bounce mb-6">
          ✦
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={14} /> Preparing Your Form
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full border shadow-3xl rounded-[3rem] p-8 text-center bg-card">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-destructive">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Link Expired or Invalid</h2>
          <p className="text-base text-muted-foreground font-medium mb-8">{error}</p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl h-12 px-8 font-bold w-full md:w-auto">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-2xl w-full border shadow-3xl rounded-[4rem] overflow-hidden animate-in zoom-in-95 duration-700 bg-card">
          <div className="bg-emerald-600 dark:bg-emerald-700 p-12 text-center text-primary-foreground relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block"><Sparkles size={120} /></div>
            <div className="w-20 md:w-24 md:h-24 bg-card/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-primary-foreground/20">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-2">All Set, {client.name.split(' ')[0]}!</h2>
            <p className="text-emerald-100 font-medium text-lg md:text-xl">Your information has been securely updated.</p>
          </div>
          <CardContent className="p-10 md:p-16 text-center space-y-8">
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Thank you for taking the time to complete your onboarding. This helps me prepare for your upcoming sessions and ensures I have the most accurate context for your healing journey.
            </p>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <ShieldCheck size={16} className="text-emerald-500" /> Securely Encrypted & Private
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6 md:py-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-[2rem] flex items-center justify-center text-primary-foreground font-black text-2xl md:text-3xl shadow-3xl mx-auto mb-8">
            ✦
          </div>
          <Badge className="bg-muted text-foreground border-none font-black text-[10px] uppercase tracking-[0.4em] px-6 py-2 rounded-full">
            Client Onboarding
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter text-foreground">Welcome, {client.name}</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Please take a moment to review and complete your profile details before our next session.
          </p>
        </div>

        <Card className="border shadow-3xl rounded-[4rem] bg-card overflow-hidden">
          <CardHeader className="p-10 md:p-16 pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Heart size={24} className="fill-current" />
                </div>
                <CardTitle className="text-2xl font-serif font-bold text-foreground">Personal Details</CardTitle>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Clinical Intake Form</p>
                <div className="w-full md:w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 md:p-16 pt-0">
            <PublicIntakeForm 
              clientId={id!} 
              appointmentId={appointmentId}
              initialData={client} 
              onSuccess={() => setSubmitted(true)} 
            />
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-8 pt-8">
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-30 grayscale">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">SSL Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;