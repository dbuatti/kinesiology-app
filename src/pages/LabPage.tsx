
import AppLayout from "@/components/crm/AppLayout";

import SandboxPage from "./SandboxPage";
import { Compass, Target, Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

const LabPage = () => {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Identity Map"
          subtitle="Process your own identities, beliefs, and patterns to become a clearer mirror for your clients."
          icon={Compass}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
          }
        />
        
        <SandboxPage isNested={true} />

        {/* Philosophy Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-8 border-t border-border">
          <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
              <Target size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-foreground">The Goal of Identity Work</h4>
              <p className="text-muted-foreground font-medium leading-relaxed italic">
                "Identity Work is where you become your own No.1 client. By processing your own identities and beliefs, you clear the static in your own system, allowing you to be a more precise mirror for your clients."
              </p>
            </div>
          </div>

          <div className="p-5 bg-chart-emerald/5 rounded-2xl border-2 border-chart-emerald/10 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-chart-emerald text-primary-foreground flex items-center justify-center shadow-xl shrink-0">
              <Zap size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-foreground">Active Integration</h4>
              <p className="text-muted-foreground font-medium leading-relaxed">
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
