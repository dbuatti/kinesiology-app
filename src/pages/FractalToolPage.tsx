
import AppLayout from '@/components/crm/AppLayout';

import FractalTool from '@/components/crm/FractalTool';
import { Layers } from 'lucide-react';

const FractalToolPage = () => {
  return (
    <AppLayout>
      <div className="space-y-8">


        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Fractal Analysis</h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">Map the hierarchical structure of your internal constructs.</p>
          </div>
        </div>

        <FractalTool />
      </div>
    </AppLayout>
  );
};

export default FractalToolPage;