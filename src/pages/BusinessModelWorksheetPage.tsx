"use client";

import React from 'react';
import BusinessModelWorksheet from '@/components/worksheets/BusinessModelWorksheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/crm/AppLayout';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

const BusinessModelWorksheetPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto pt-6 print:hidden">
        <Breadcrumbs 
          items={[
            { label: "Resources", path: "/resources" },
            { label: "Worksheets", path: "/resources/worksheets" },
            { label: "Business Model" }
          ]} 
        />
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mt-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Hub
        </Button>
      </div>
      <BusinessModelWorksheet />
    </AppLayout>
  );
};

export default BusinessModelWorksheetPage;