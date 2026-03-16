"use client";

import React from 'react';
import FearCreativityWorksheet from '@/components/worksheets/FearCreativityWorksheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/crm/AppLayout';

const FearCreativityWorksheetPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto pt-6 print:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Resources
        </Button>
      </div>
      <FearCreativityWorksheet />
    </AppLayout>
  );
};

export default FearCreativityWorksheetPage;