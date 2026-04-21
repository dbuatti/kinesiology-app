"use client";

import React from 'react';
import AppLayout from '@/components/crm/AppLayout';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import FractalTool from '@/components/crm/FractalTool';
import { Layers } from 'lucide-react';

const FractalToolPage = () => {
  return (
    <AppLayout variant="wide">
      <div className="space-y-8">
        <Breadcrumbs 
          items={[
            { label: "Sandbox", path: "/sandbox" },
            { label: "Fractal Analysis" }
          ]} 
        />
        
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20">
            <Layers size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Fractal Analysis</h1>
            <p className="text-muted-foreground font-medium mt-1 text-lg">Map the hierarchical structure of your internal constructs.</p>
          </div>
        </div>

        <FractalTool />
      </div>
    </AppLayout>
  );
};

export default FractalToolPage;