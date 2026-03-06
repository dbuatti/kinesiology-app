"use client";

import React from "react";
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import PathwayLogicWizard from "@/components/crm/PathwayLogicWizard";
import { Zap, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MadeWithDyad } from "@/components/made-with-dyad";

const QuickCalibratePage = () => {
  return (
    <AppLayout fullWidth>
      <div className="space-y-8 w-full">
        <Breadcrumbs 
          items={[
            { label: "Quick Tools" },
            { label: "Calibration Wizard" }
          ]} 
        />
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Zap size={28} className="fill-current" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Quick Calibrate</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Standalone pathway logic for quick clinical checks and self-correction.
          </p>
        </div>

        <Alert className="bg-indigo-50 border-indigo-100 rounded-2xl">
          <Info className="h-5 w-5 text-indigo-600" />
          <AlertDescription className="text-sm text-indigo-900 font-medium">
            <strong>Note:</strong> This is a sandbox mode. Data generated here is not saved to any specific client record. Use this for rapid testing or personal practice.
          </AlertDescription>
        </Alert>
        
        <PathwayLogicWizard 
          onSave={(summary) => {
            // In quick mode, we just show a success message since there's no appointment to save to
            console.log("Quick Calibration Result:", summary);
          }} 
        />

        <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={100} />
          </div>
          <h4 className="text-lg font-black flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-emerald-400" /> Clinical Safety
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed relative z-10">
            Always ensure the system is in a receptive state before applying deep neurological corrections. If the IM remains inhibited after 3 layers, check for SNS dominance.
          </p>
        </div>
        
        <MadeWithDyad />
      </div>
    </AppLayout>
  );
};

export default QuickCalibratePage;