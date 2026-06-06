
import React from 'react';
import BusinessModelWorksheet from '@/components/worksheets/BusinessModelWorksheet';
import AppLayout from '@/components/crm/AppLayout';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

const BusinessModelWorksheetPage = () => {
  return (
    <AppLayout>
      <div className="max-w-full mx-auto pt-6 print:hidden">
        <Breadcrumbs 
          items={[
            { label: "Resources", path: "/resources" },
            { label: "Worksheets", path: "/resources/worksheets" },
            { label: "Business Model" }
          ]} 
        />
      </div>
      <BusinessModelWorksheet />
    </AppLayout>
  );
};

export default BusinessModelWorksheetPage;