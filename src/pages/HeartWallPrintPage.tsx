
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';
import HeartWallPrintable from '@/components/crm/HeartWallPrintable';

const HeartWallPrintPage = () => {
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
        
        <Button 
          onClick={() => window.print()}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg font-bold"
        >
          <Printer size={18} className="mr-2" /> Print Reference
        </Button>
      </div>

      <div className="bg-white shadow-2xl print:shadow-none min-h-[297mm] w-full">
        <HeartWallPrintable />
      </div>
    </div>
  );
};

export default HeartWallPrintPage;