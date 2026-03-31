"use client";

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Heart, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import PublicOnboardingForm from "@/components/crm/PublicOnboardingForm";
import { cn } from "@/lib/utils";

const OnboardingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, phone, pronouns, born, suburbs, occupation, marital_status, children')
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-bounce mb-6">
          A
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
          <Loader2 className="animate-spin" size={14} /> Preparing Your Form
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
            <Sparkles size={32} />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Link Expired or Invalid</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium mb-8">{error}</p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl h-12 px-8 font-bold w-full md:w-auto">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-6">
        <Card className="max-w-lg w-full border-none shadow-2xl rounded-2xl md:rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-emerald-600 p-8 md:p-12 text-center text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 hidden md:block"><Sparkles size={120} /></div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/20">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">All Set, {client.name.split(' ')[0]}!</h2>
            <p className="text-emerald-100 font-medium text-base md:text-lg">Your information has been securely updated.</p>
          </div>
          <CardContent className="p-6 md:p-10 text-center space-y-6">
            <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
              Thank you for taking the time to complete your onboarding. This helps us prepare for your upcoming sessions and ensures we have the most accurate context for your healing journey.
            </p>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" /> Securely Encrypted
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:py-20 md:px-6">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-2xl mx-auto mb-4 md:mb-6">
            A
          </div>
          <Badge className="bg-indigo-100 text-indigo-600 border-none font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] px-4 py-1">
            Client Onboarding
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Welcome, {client.name}</h1>
          <p className="text-sm md:text-lg text-slate-500 font-medium max-w-xl mx-auto">
            Please take a moment to review and complete your profile details before our next session.
          </p>
        </div>

        <Card className="border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-6 md:p-10 pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Heart size={20} className="fill-current" />
                </div>
                <CardTitle className="text-lg md:text-xl font-black">Personal Details</CardTitle>
              </div>
              <div className="flex flex-col md:items-end gap-1">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1 of 1</p>
                <div className="w-full md:w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-full" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-10 pt-2 md:pt-6">
            <PublicOnboardingForm 
              clientId={client.id} 
              initialData={client} 
              onSuccess={() => setSubmitted(true)} 
            />
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">SSL Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;