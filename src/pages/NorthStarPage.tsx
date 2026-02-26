"use client";

import React from "react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import InteractiveIntentionWorksheet from "@/components/crm/InteractiveIntentionWorksheet";
import { MadeWithDyad } from "@/components/made-with-dyad";

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
        
        <MadeWithDyad />
      </div>
    </AppLayout>
  );
};

export default NorthStarPage;