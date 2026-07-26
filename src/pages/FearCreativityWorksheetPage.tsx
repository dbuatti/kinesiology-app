import React, { useState } from 'react';
import AppLayout from '@/components/crm/AppLayout';
import FearCreativityWorksheet from '@/components/worksheets/FearCreativityWorksheet';

const FearCreativityWorksheetPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <FearCreativityWorksheet 
          submissionId={selectedId} 
          onComplete={() => {}} 
          onBack={() => { setSelectedId(null); }} 
        />
      </div>
    </AppLayout>
  );
};

export default FearCreativityWorksheetPage;