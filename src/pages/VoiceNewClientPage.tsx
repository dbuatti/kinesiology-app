import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import VoiceOnboardingForm from "@/components/crm/VoiceOnboardingForm";
import TranscriptOnboarding from "@/components/crm/TranscriptOnboarding";
import { formatProfileNotes, type TranscriptProfile } from "@/lib/transcriptProfile";

const VoiceNewClientPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TranscriptProfile | null>(null);
  // Bumped whenever a profile arrives or is cleared, so the form remounts with the new prefill.
  const [formKey, setFormKey] = useState(0);

  const handleProfile = (next: TranscriptProfile | null) => {
    setProfile(next);
    setFormKey((k) => k + 1);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <PageHeader
          title="New student"
          subtitle="Add a voice or piano student — start from your first conversation, or fill in the details."
          icon={Mic}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-9 px-4 rounded-lg border-border font-medium text-[13px] gap-2"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          }
        />

        <TranscriptOnboarding profile={profile} onProfile={handleProfile} />

        <div className="space-y-4 border-t border-border pt-8">
          <h2 className="text-[15px] font-semibold text-foreground">Details</h2>
          <VoiceOnboardingForm
            key={formKey}
            initial={
              profile
                ? {
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    practice: profile.practice,
                    notes: formatProfileNotes(profile),
                  }
                : undefined
            }
            onSuccess={() => navigate("/clients")}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceNewClientPage;
