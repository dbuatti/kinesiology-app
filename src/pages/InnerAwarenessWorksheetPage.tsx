import React, { useState } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import InnerAwarenessWorksheet from '@/components/worksheets/InnerAwarenessWorksheet';

const InnerAwarenessWorksheetPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <InnerAwarenessWorksheet 
          submissionId={selectedId} 
          onComplete={() => {}} 
          onBack={() => { setSelectedId(null); }} 
        />
      </div>
    </AppLayout>
  );
};

export default InnerAwarenessWorksheetPage;