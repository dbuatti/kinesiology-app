import type { ReactNode } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer } from "lucide-react";

interface PrintLayoutProps {
  title: string;
  children: ReactNode;
}

const PrintLayout = ({ title, children }: PrintLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-[297mm] mx-auto mb-6 flex items-center justify-between px-2 sm:px-0 print:hidden gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-900 h-9 px-3 text-xs sm:text-sm"
        >
          <ChevronLeft size={16} className="mr-1 sm:mr-2" /> Back
        </Button>

        <h1 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          {title}
        </h1>

        <Button
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg font-bold h-9 px-4 text-xs sm:text-sm"
        >
          <Printer size={16} className="mr-1 sm:mr-2" /> Print
        </Button>
      </div>

      <div className="bg-white shadow-2xl print:shadow-none min-h-[210mm] w-full">
        {children}
      </div>
    </div>
  );
};

export default PrintLayout;
