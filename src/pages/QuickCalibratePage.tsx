
import AppLayout from "@/components/crm/AppLayout";

import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import { Zap, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const QuickCalibratePage = () => {
  return (
    <AppLayout>
      <div className="space-y-8 w-full">


        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md">
              <Zap size={28} className="fill-current" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quick Calibrate</h1>
          </div>
          <p className="text-muted-foreground font-medium">
            Standalone pathway logic for quick clinical checks and self-correction.
          </p>
        </div>

        <Alert className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 rounded-xl">
          <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <AlertDescription className="text-sm text-indigo-900 dark:text-indigo-100 font-medium">
            <strong>Note:</strong> This is a sandbox mode. Data generated here is not saved to any specific client record. Use this for rapid testing or personal practice.
          </AlertDescription>
        </Alert>
        
        <PathwayLogicWizard 
          onSave={(summary) => {
            // In quick mode, we just show a success message since there's no appointment to save to
            //
          }} 
        />

        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={100} />
          </div>
          <h4 className="text-lg font-black flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-emerald-400" /> Clinical Safety
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed relative z-10">
            Always ensure the system is in a receptive state before applying deep neurological corrections. If the IM remains inhibited after 3 layers, check for SNS dominance.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default QuickCalibratePage;