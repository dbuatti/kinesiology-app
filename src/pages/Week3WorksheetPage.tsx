import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Week3Worksheet } from '@/components/worksheets/Week3Worksheet';

const Week3WorksheetPage = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <Week3Worksheet submissionId={null} onComplete={() => {}} />
      </div>
    </AppLayout>
  );
};

export default Week3WorksheetPage;