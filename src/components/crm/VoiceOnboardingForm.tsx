
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, UserPlus, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface VoiceOnboardingFormProps {
  onSuccess?: () => void;
}

const VoiceOnboardingForm = ({ onSuccess }: VoiceOnboardingFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("voice-onboard", {
        body: {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to create student");

      showSuccess(`${name.trim()} added to Voice Studio!`);
      setCreated(true);
    } catch (err: any) {
      showError(err.message || "Failed to onboard student");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-rose-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-foreground dark:text-primary-foreground tracking-tight">
            Student Onboarded!
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {name} has been added to the Voice Studio client database in Notion.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-rose-500 hover:bg-rose-600 h-11 rounded-2xl font-black text-xs uppercase tracking-widest gap-2"
            onClick={() => {
              setName("");
              setEmail("");
              setPhone("");
              setNotes("");
              setCreated(false);
            }}
          >
            <UserPlus size={16} />
            Add Another Student
          </Button>
          {onSuccess && (
            <Button variant="outline" className="h-11 rounded-2xl" onClick={onSuccess}>
              Done
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-foreground/80">
          Full Name <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          required
          className="h-12 rounded-2xl border-border dark:border-border bg-card dark:bg-foreground text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-foreground/80">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="h-12 rounded-2xl border-border dark:border-border bg-card dark:bg-foreground text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-foreground/80">
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+61 4XX XXX XXX"
          className="h-12 rounded-2xl border-border dark:border-border bg-card dark:bg-foreground text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-foreground/80">
          Onboarding Notes <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional context about the student..."
          className="min-h-[100px] rounded-2xl border-border dark:border-border bg-card dark:bg-foreground text-sm font-medium resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || !name.trim()}
        className={cn(
          "w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 transition-all",
          "bg-rose-500 hover:bg-rose-600 text-primary-foreground shadow-lg shadow-rose-500/20"
        )}
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Mic size={16} />
        )}
        {submitting ? "Onboarding..." : "Onboard to Voice Studio"}
      </Button>
    </form>
  );
};

export default VoiceOnboardingForm;
