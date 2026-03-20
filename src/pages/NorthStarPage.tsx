"use client";

import React from "react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import InteractiveIntentionWorksheet from "@/components/crm/InteractiveIntentionWorksheet";

const NorthStarPage = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <Breadcrumbs 
          items={[
            { label: "Resources", path: "/resources" },
            { label: "North Star Worksheet" }
          ]} 
        />
        
        <InteractiveIntentionWorksheet />
      </div>
    </AppLayout>
  );
};

export default NorthStarPage;