import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BusinessModelWorksheet } from '@/components/worksheets/BusinessModelWorksheet';

const BusinessModelWorksheetPage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <BusinessModelWorksheet submissionId={null} onComplete={() => {}} />
      </div>
    </AppLayout>
  );
};

export default BusinessModelWorksheetPage;