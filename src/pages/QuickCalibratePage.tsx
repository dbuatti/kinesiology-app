import { PageHeader } from "@/components/shared/PageHeader";

import AppLayout from "@/components/crm/AppLayout";

import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import { Zap, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function QuickCalibrateTool() {
  return (
      <div className="space-y-8 w-full">


        <PageHeader
          icon={Zap}
          title="Quick Calibrate"
          subtitle="Standalone pathway logic for quick clinical checks and self-correction."
        />

        <Alert className="bg-chart-primary/10 dark:bg-chart-primary/20 border-chart-primary/20 dark:border-chart-primary/30 rounded-xl">
          <Info className="h-5 w-5 text-chart-primary" />
          <AlertDescription className="text-sm text-foreground font-medium">
            <strong>Note:</strong> This is a sandbox mode. Data generated here is not saved to any specific client record. Use this for rapid testing or personal practice.
          </AlertDescription>
        </Alert>
        
        <PathwayLogicWizard 
          onSave={(summary) => {
            // In quick mode, we just show a success message since there's no appointment to save to
            //
          }} 
        />

        <div className="p-6 bg-card dark:bg-card text-primary-foreground rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={100} />
          </div>
          <h4 className="text-lg font-black flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-emerald-400" /> Clinical Safety
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
            Always ensure the system is in a receptive state before applying deep neurological corrections. If the IM remains inhibited after 3 layers, check for SNS dominance.
          </p>
        </div>
      </div>
  );
};

const QuickCalibratePage = () => (
  <AppLayout>
    <QuickCalibrateTool />
  </AppLayout>
);

export default QuickCalibratePage;