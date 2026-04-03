"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";

const OnboardingLookupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const emailParam = searchParams.get("email");

  const performLookup = async (emailToLookup: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use .select().eq().order() instead of maybeSingle to handle edge cases
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', emailToLookup.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        navigate(`/onboarding/${data[0].id}`, { replace: true });
      } else {
        setError("We couldn't find a booking with that email. Please ensure it's the same email you used on Cal.com.");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("An error occurred while finding your record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailParam) {
      performLookup(emailParam);
    }
  }, [emailParam]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail) return;
    performLookup(manualEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20">
            <CheckCircle2 size={32} />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Welcome to FNH</CardTitle>
          <p className="text-indigo-100 text-sm font-medium mt-1">Let's find your clinical history form.</p>
        </div>

        <CardContent className="p-8">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
                Searching Database...
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Enter your booking email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    type="email"
                    placeholder="email@example.com"
                    className="h-14 pl-12 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 transition-all text-lg font-medium"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <Button 
                type="submit"
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-xl shadow-indigo-100"
              >
                Access My Form <ArrowRight size={20} className="ml-2" />
              </Button>

              <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
                Note: Your form is created automatically when you book. If you just booked, it may take a few seconds to appear.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingLookupPage;