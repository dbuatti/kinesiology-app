
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';
import CranialNerveWorksheet from '@/components/crm/CranialNerveWorksheet';

const CranialNerveWorksheetPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-[297mm] mx-auto mb-8 flex items-center justify-between px-2 sm:px-0 print:hidden gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground h-10 px-3 text-xs sm:text-sm"
        >
          <ChevronLeft size={18} className="mr-1 sm:mr-2" /> Back to Resources
        </Button>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => window.print()}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg font-bold h-10 px-4 text-xs sm:text-sm"
          >
            <Printer size={18} className="mr-1 sm:mr-2" /> Print Worksheet
          </Button>
        </div>
      </div>

      <div className="bg-background shadow-2xl print:shadow-none min-h-[210mm] w-full print:min-h-0">
        <CranialNerveWorksheet />
      </div>
    </div>
  );
};

export default CranialNerveWorksheetPage;