
import AppLayout from "@/components/crm/AppLayout";

import SandboxPage from "./SandboxPage";
import { Compass, Target, Zap } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const LabPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Identity Map"
          subtitle="Process your own identities, beliefs, and patterns to become a clearer mirror for your clients."
          icon={Compass}
        />
        
        <SandboxPage isNested={true} />

        {/* Philosophy Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-8 border-t border-border">
          <div className="p-5 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
              <Target size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-indigo-900 dark:text-indigo-100">The Goal of Identity Work</h4>
              <p className="text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed italic">
                "Identity Work is where you become your own No.1 client. By processing your own identities and beliefs, you clear the static in your own system, allowing you to be a more precise mirror for your clients."
              </p>
            </div>
          </div>

          <div className="p-5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
              <Zap size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-amber-900 dark:text-amber-100">Active Integration</h4>
              <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                Every insight extracted from your journal moves you closer to clinical mastery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LabPage;
