import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Music, Mic } from "lucide-react";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const VoiceOnboardingPage = () => {
  const { email } = useParams<{ email: string }>();
  const decodedEmail = email ? decodeURIComponent(email) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [mobile, setMobile] = useState("");
  const [goals, setGoals] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    if (!decodedEmail) return;
    const checkExisting = async () => {
      try {
        const { data } = await supabase
          .from("voice_onboarding")
          .select("name, onboarding_completed")
          .eq("email", decodedEmail)
          .single();
        if (data?.onboarding_completed) {
          setSubmitted(true);
        }
        if (data?.name) {
          setStudentName(data.name);
        }
      } catch {
        // No existing record — user can fill in fresh
      }
      setLoading(false);
    };
    checkExisting();
  }, [decodedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decodedEmail) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("voice-submit-onboarding", {
        body: {
          email: decodedEmail,
          name: studentName.trim() || null,
          mobile: mobile.trim() || null,
          goals: goals.trim() || null,
          experienceLevel: experienceLevel.trim() || null,
          additionalNotes: additionalNotes.trim() || null,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      showError(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-background">
        <Loader2 className="animate-spin text-rose-500" size={32} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-background p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-background rounded-[2.5rem] shadow-2xl p-12 border border-rose-100">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-foreground">You're all set!</h1>
          <p className="text-muted-foreground font-medium">
            Your profile has been submitted. Daniele will review it before your first lesson.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-rose-500 font-bold">
            <Music size={16} />
            See you at your lesson!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-background p-4">
      <div className="max-w-lg w-full bg-background rounded-[2.5rem] shadow-2xl border border-rose-100 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-rose-400 to-rose-600" />
        <div className="p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg">
              <Mic size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">Voice Studio</h1>
              <p className="text-sm text-muted-foreground font-medium">Complete your student profile</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground">Email</Label>
              <div className="h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center px-4 text-sm font-bold text-foreground">
                {decodedEmail}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground">
                Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Jane Smith"
                required
                className="h-12 rounded-2xl border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground">
                Mobile Number <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
              </Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 0412 345 678"
                type="tel"
                className="h-12 rounded-2xl border-border text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground">
                Goals <span className="text-muted-foreground font-normal normal-case tracking-normal">(what do you want to work on?)</span>
              </Label>
              <Textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. Improve breath support, expand vocal range, prepare for a performance..."
                className="min-h-[100px] rounded-2xl border-border text-sm font-medium resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground">Experience Level</Label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
              >
                <option value="">Select...</option>
                <option value="beginner">Beginner — Never had formal lessons</option>
                <option value="intermediate">Intermediate — Some experience</option>
                <option value="advanced">Advanced — Experienced singer</option>
                <option value="professional">Professional — Performs regularly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground">
                Additional Notes <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
              </Label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any medical considerations, preferences, or questions..."
                className="min-h-[80px] rounded-2xl border-border text-sm font-medium resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !studentName.trim()}
              className={cn(
                "w-full h-14 rounded-[1.5rem] font-black text-sm uppercase tracking-widest gap-2 transition-all",
                "bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-200"
              )}
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {submitting ? "Submitting..." : "Submit Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VoiceOnboardingPage;
