
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';
import PathwayReflexStimSheet from '@/components/crm/PathwayReflexStimSheet';

const PathwayReflexStimPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-[297mm] mx-auto mb-8 flex items-center justify-between px-2 sm:px-0 print:hidden gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground h-10 px-3 text-xs sm:text-sm"
        >
          <ChevronLeft size={18} className="mr-1 sm:mr-2" /> Back
        </Button>

        <Button
          onClick={() => window.print()}
          className="bg-primary text-primary-foreground rounded-xl shadow-lg font-bold h-10 px-4 text-xs sm:text-sm"
        >
          <Printer size={18} className="mr-1 sm:mr-2" /> Print Sheet
        </Button>
      </div>

      <div className="bg-white shadow-2xl print:shadow-none min-h-[0] w-full">
        <PathwayReflexStimSheet />
      </div>
    </div>
  );
};

export default PathwayReflexStimPage;
