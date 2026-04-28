"use client";

import React from "react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import InteractiveIntentionWorksheet from "@/components/crm/InteractiveIntentionWorksheet";
import PageHeader from "@/components/shared/PageHeader";
import { Compass } from "lucide-react";

const NorthStarPage = () => {
  return (
    <AppLayout variant="workspace">
      <div className="space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="Setting Your North Star"
          subtitle="Define your core intention, commitment, and the version of yourself you are becoming."
          icon={Compass}
          breadcrumbs={[{ label: "Practice", path: "/lab" }, { label: "Worksheets", path: "/lab?tab=worksheets" }, { label: "North Star" }]}
        />
        
        <InteractiveIntentionWorksheet />
      </div>
    </AppLayout>
  );
};

export default NorthStarPage;