import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import AngerFlowWorksheet from '@/components/worksheets/AngerFlowWorksheet';

const AngerFlowWorksheetPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchSubmissions = () => {};

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <AngerFlowWorksheet 
          submissionId={selectedId} 
          onComplete={() => {}} 
          onBack={() => { setSelectedId(null); setIsCreating(false); fetchSubmissions(); }} 
        />
      </div>
    </AppLayout>
  );
};

export default AngerFlowWorksheetPage;