"use client";

import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppointmentsPage from "./AppointmentsPage";
import AvailabilityPage from "./AvailabilityPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CalendarDays, List, CalendarClock } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const SchedulePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("view") || "list";

  return (
    <AppLayout variant="workspace">
      <div className="space-y-8">
        <PageHeader 
          title="Clinical Schedule"
          subtitle="Manage your upcoming sessions and live Cal.com availability."
          icon={CalendarClock}
          breadcrumbs={[{ label: "Clinical" }, { label: "Schedule" }]}
        />
        
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ view: v })} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-200/50 p-1 rounded-2xl h-14 border border-slate-200">
              <TabsTrigger 
                value="list" 
                className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
              >
                <List className="mr-2" size={16} />
                Session List
              </TabsTrigger>
              <TabsTrigger 
                value="availability" 
                className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest"
              >
                <CalendarDays className="mr-2" size={16} />
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