"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const OnboardingLookupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const email = searchParams.get("email");

  useEffect(() => {
    const lookupClient = async () => {
      if (!email) {
        setError("No email provided. Please use the link provided by your practitioner.");
        return;
      }

      try {
        // We wait a moment to ensure the webhook has finished creating the client
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          navigate(`/onboarding/${data.id}`, { replace: true });
        } else {
          // If not found immediately, retry once after 2 seconds (webhook lag)
          setTimeout(async () => {
            const { data: retryData } = await supabase
              .from('clients')
              .select('id')
              .eq('email', email.toLowerCase().trim())
              .maybeSingle();
            
            if (retryData) {
              navigate(`/onboarding/${retryData.id}`, { replace: true });
            } else {
              setError("We couldn't find your booking record yet. Please try again in a moment or contact your practitioner.");
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Lookup error:", err);
        setError("An error occurred while finding your record.");
      }
    };

    lookupClient();
  }, [email, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] p-8 text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Something went wrong</h2>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-bounce mx-auto">
              A
            </div>
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
                Syncing your booking...
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OnboardingLookupPage;