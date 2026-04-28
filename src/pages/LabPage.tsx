"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import SandboxPage from "./SandboxPage";
import WorksheetsHubPage from "./WorksheetsHubPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, FileText, Sparkles, LayoutGrid } from "lucide-react";

const LabPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "map";

  return (
    <AppLayout>
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Practice Lab" }, { label: "The Lab" }]} />
        
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-200/50 p-1 rounded-xl h-14 border border-slate-200">
              <TabsTrigger 
                value="map" 
                className="rounded-lg px-8 h-12 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Compass className="mr-2" size={16} />
                Identity Map
              </TabsTrigger>
              <TabsTrigger 
                value="worksheets" 
                className="rounded-lg px-8 h-12 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
              >
                <FileText className="mr-2" size={16} />
                Worksheets
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="map" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <SandboxPage />
          </TabsContent>

          <TabsContent value="worksheets" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <WorksheetsHubPage />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default LabPage;