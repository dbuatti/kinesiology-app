
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      const { data, error: fetchError } = await supabase.functions.invoke('public-client-lookup', {
        body: { email: emailToLookup },
      });

      if (fetchError || data?.error) throw new Error(data?.error || fetchError?.message);

      if (data?.id) {
        navigate(`/onboarding/${data.id}`, { replace: true });
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
    const email = manualEmail.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That doesn't look like an email address — please check it and try again.");
      return;
    }
    performLookup(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <Card className="max-w-md w-full border border-border shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-amber-400 to-rose-400 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20">
            <CheckCircle2 size={32} />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Welcome to FNH</CardTitle>
          <p className="text-white/90 text-sm font-medium mt-1">Let's find your clinical history form.</p>
        </div>

        <CardContent className="p-8">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-chart-primary" size={32} />
              <p className="text-muted-foreground font-medium text-xs">
                Searching Database...
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="booking-email" className="text-xs font-medium text-muted-foreground ml-1">
                  Enter your booking email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="booking-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="email@example.com"
                    aria-invalid={!!error}
                    className="h-14 pl-12 rounded-2xl border-2 border-border focus:border-chart-primary transition-all text-lg font-medium"
                    value={manualEmail}
                    onChange={(e) => { setManualEmail(e.target.value); setError(null); }}
                    required
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="p-4 bg-destructive/5 border border-destructive/15 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="text-destructive-strong shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-destructive-strong font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <Button 
                type="submit"
                className="w-full h-14 rounded-2xl bg-chart-primary hover:bg-chart-primary/90 text-lg font-semibold shadow-xl shadow-chart-primary/20"
              >
                Access My Form <ArrowRight size={20} className="ml-2" />
              </Button>

              <p className="text-center text-[10px] text-muted-foreground font-medium leading-relaxed">
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