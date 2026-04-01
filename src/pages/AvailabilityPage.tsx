"use client";

import React from "react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import CalcomSlotsView from "@/components/crm/CalcomSlotsView";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const AvailabilityPage = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Operations" }, { label: "Live Availability" }]} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20">
              <CalendarDays size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">Live Availability</h1>
              <p className="text-muted-foreground font-medium mt-1 text-lg">Real-time view of your Cal.com booking slots.</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-border bg-card" asChild>
            <a href="https://cal.com/dashboard" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} className="mr-2" /> Open Cal.com
            </a>
          </Button>
        </div>

        <CalcomSlotsView />
      </div>
    </AppLayout>
  );
};

export default AvailabilityPage;