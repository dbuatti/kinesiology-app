"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';
import PrimitiveReflexWorksheet from '@/components/crm/PrimitiveReflexWorksheet';

const PrimitiveReflexWorksheetPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-[297mm] mx-auto mb-8 flex items-center justify-between px-2 sm:px-0 print:hidden gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-900 h-10 px-3 text-xs sm:text-sm"
        >
          <ChevronLeft size={18} className="mr-1 sm:mr-2" /> Back to Resources
        </Button>
        
        <Button 
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg font-bold h-10 px-4 text-xs sm:text-sm"
        >
          <Printer size={18} className="mr-1 sm:mr-2" /> Print Worksheet
        </Button>
      </div>

      <div className="bg-white shadow-2xl print:shadow-none min-h-[210mm] w-full">
        <PrimitiveReflexWorksheet />
      </div>
    </div>
  );
};

export default PrimitiveReflexWorksheetPage;