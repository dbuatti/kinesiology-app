"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer, FileText } from 'lucide-react';
import CranialNerveWorksheet from '@/components/crm/CranialNerveWorksheet';

const CranialNerveWorksheetPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft size={18} className="mr-2" /> Back to Resources
        </Button>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg"
          >
            <Printer size={18} className="mr-2" /> Print Worksheet
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-2xl print:shadow-none min-h-[297mm] w-full">
        <CranialNerveWorksheet />
      </div>
    </div>
  );
};

export default CranialNerveWorksheetPage;