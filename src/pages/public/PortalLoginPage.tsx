import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showError } from "@/utils/toast";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function PortalLoginPage() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (session) return <Navigate to="/portal" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/portal` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      showError(err.message || "Couldn't send the login link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-6 py-16">
      <Card className="max-w-md w-full border-none shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-chart-purple to-chart-destructive p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20">
            {sent ? <CheckCircle2 size={32} /> : <Mail size={32} />}
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Client Portal</CardTitle>
          {/* Pre-auth, so who's logging in isn't known yet — but which
              DOMAIN they arrived on is, and that's enough to avoid a voice/
              piano student seeing "Resonance Kinesiology" as the very first
              thing on the page. */}
          <p className="text-white/90 text-sm font-medium mt-1">
            {window.location.hostname === "studio.danielebuatti.com" ? "Voice Studio — Daniele Buatti" : "Resonance Kinesiology"}
          </p>
        </div>
        <CardContent className="p-8">
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-foreground font-medium">Check your inbox</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a login link to <span className="font-semibold text-foreground">{email}</span>. Click it to open your portal — no password needed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Your email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send me a login link
              </Button>
              <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                Use the same email you booked with. We'll email you a link — no account setup needed.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
