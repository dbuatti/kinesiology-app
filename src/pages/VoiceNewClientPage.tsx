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
          iconClassName="bg-rose-500 text-white dark:bg-rose-500 dark:text-white"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-10 px-4 rounded-xl border-border font-bold text-[10px] uppercase tracking-widest gap-2"
            >
              <ArrowLeft size={14} />
              Back
            </Button>
          }
        />

        <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-xl">
          <VoiceOnboardingForm onSuccess={() => navigate("/")} />
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceNewClientPage;
