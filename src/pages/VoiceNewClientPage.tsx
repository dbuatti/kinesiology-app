import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic } from "lucide-react";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import VoiceOnboardingForm from "@/components/crm/VoiceOnboardingForm";

const VoiceNewClientPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-8">
        <PageHeader
          title="New Student"
          subtitle="Add a new voice student to the Voice Studio client database."
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

        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <VoiceOnboardingForm onSuccess={() => navigate("/voice/clients")} />
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceNewClientPage;
