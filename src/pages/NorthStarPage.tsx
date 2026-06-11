
import React from "react";
import AppLayout from "@/components/crm/AppLayout";

import InteractiveIntentionWorksheet from "@/components/crm/InteractiveIntentionWorksheet";

const NorthStarPage = () => {
  return (
    <AppLayout>
      <div className="space-y-8">


        <InteractiveIntentionWorksheet />
      </div>
    </AppLayout>
  );
};

export default NorthStarPage;