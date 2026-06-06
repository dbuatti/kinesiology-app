
import React from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import SandboxPage from "./SandboxPage";
import WorksheetsHubPage from "./WorksheetsHubPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, FileText, Sparkles, LayoutGrid, Target, Zap } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const LabPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "map";

  return (
    <AppLayout>
      <div className="space-y-10">
        <PageHeader 
          title="Practice Lab"
          subtitle="Focus on your personal integration, practitioner state, and identity work."
          icon={Compass}
          breadcrumbs={[{ label: "Practice Lab" }, { label: "The Lab" }]}
          badge="Internal Integration"
        />
        
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl h-14 border border-slate-200">
              <TabsTrigger 
                value="map" 
                className="rounded-xl px-10 h-11 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Compass className="mr-2" size={18} />
                Identity Map
              </TabsTrigger>
              <TabsTrigger 
                value="worksheets" 
                className="rounded-xl px-10 h-11 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
              >
                <FileText className="mr-2" size={18} />
                Worksheets
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="map" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <SandboxPage isNested={true} />
          </TabsContent>

          <TabsContent value="worksheets" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <WorksheetsHubPage isNested={true} />
          </TabsContent>
        </Tabs>

        {/* Lab Philosophy Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-border">
          <div className="p-8 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2.5rem] border-2 border-indigo-100 dark:border-indigo-900/30 flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shrink-0">
              <Target size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-indigo-900 dark:text-indigo-100">The Goal of the Lab</h4>
              <p className="text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed italic">
                "The Lab is where you become your own No.1 client. By processing your own identities and beliefs, you clear the static in your own system, allowing you to be a more precise mirror for your clients."
              </p>
            </div>
          </div>

          <div className="p-8 bg-amber-50 dark:bg-amber-950/20 rounded-[2.5rem] border-2 border-amber-100 dark:border-amber-900/30 flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shrink-0">
              <Zap size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-amber-900 dark:text-amber-100">Active Integration</h4>
              <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                Use the worksheets to ground your theoretical knowledge into personal experience. Every insight extracted from your journal moves you closer to clinical mastery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LabPage;