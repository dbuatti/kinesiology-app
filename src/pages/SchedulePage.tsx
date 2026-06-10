
import React from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/crm/AppLayout";
import AppointmentsPage from "./AppointmentsPage";
import AvailabilityPage from "./AvailabilityPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, List, CalendarDays } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const SchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("view") || "list";

  return (
    <AppLayout>
      <div className="space-y-5">
        <PageHeader 
          title="Clinical Schedule"
          subtitle="Manage your upcoming sessions and live Cal.com availability."
          icon={CalendarClock}
          breadcrumbs={[{ label: "Clinical" }, { label: "Schedule" }]}
        />
        
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ view: v })} className="w-full">
          <div className="flex justify-center mb-5">
            <TabsList className="bg-slate-200/50 p-1 rounded-xl h-11 border border-slate-200">
              <TabsTrigger 
                value="list" 
                className="rounded-lg px-5 h-9 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest"
              >
                <List className="mr-1.5" size={14} />
                Session List
              </TabsTrigger>
              <TabsTrigger 
                value="availability" 
                className="rounded-lg px-5 h-9 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest"
              >
                <CalendarDays className="mr-1.5" size={14} />
                Live Availability
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <AppointmentsPage />
          </TabsContent>

          <TabsContent value="availability" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <AvailabilityPage />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SchedulePage;