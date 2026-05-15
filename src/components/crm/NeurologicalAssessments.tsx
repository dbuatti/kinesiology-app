"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Footprints, Scale, Brain, ChevronDown, Hand, CheckCircle2, Info, AlertCircle, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import FakudaStepTest from "./FakudaStepTest";
import SharpenedRhombergsTest from "./SharpenedRhombergsTest";
import FrontalLobeAssessment from "./FrontalLobeAssessment";
import RightingReflexesAssessment from "./RightingReflexesAssessment";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface NeurologicalAssessmentsProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  initialRhombergsNotes: string | null | undefined;
  initialFrontalLobeNotes: string | null | undefined;
  initialRightingReflexNotes?: string | null | undefined;
  onUpdate: () => void;
}

const NeurologicalAssessments = ({
  appointmentId,
  initialFakudaNotes,
  initialRhombergsNotes,
  initialFrontalLobeNotes,
  initialRightingReflexNotes,
  onUpdate,
}: NeurologicalAssessmentsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasAnyNotes = !!(initialFakudaNotes || initialRhombergsNotes || initialFrontalLobeNotes || initialRightingReflexNotes);

  return (
    <div className="bg-white border border-slate-100 overflow-hidden transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className={cn(
            "h-10 flex items-center justify-between px-4 cursor-pointer transition-all",
            isOpen ? "bg-slate-900 text-white" : "hover:bg-slate-50",
            hasAnyNotes && !isOpen && "bg-emerald-50"
          )}>
            <div className="flex items-center gap-3">
              <Brain size={14} className={cn(isOpen ? "text-emerald-400" : "text-primary")} />
              <span className="text-[11px] font-black uppercase tracking-widest">Neurological Global</span>
            </div>
            <div className="flex items-center gap-3">
              {hasAnyNotes && (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Assessed</span>
              )}
              <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <Tabs defaultValue="fakuda" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9 bg-slate-100 p-1 rounded-none">
                <TabsTrigger value="fakuda" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-white">Fakuda</TabsTrigger>
                <TabsTrigger value="rhombergs" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-white">Rhombergs</TabsTrigger>
                <TabsTrigger value="frontal-lobe" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-white">Frontal</TabsTrigger>
                <TabsTrigger value="righting" className="text-[9px] font-black uppercase tracking-widest rounded-none data-[state=active]:bg-white">Righting</TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <TabsContent value="fakuda" className="mt-0">
                  <FakudaStepTest appointmentId={appointmentId} initialFakudaNotes={initialFakudaNotes} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="rhombergs" className="mt-0">
                  <SharpenedRhombergsTest appointmentId={appointmentId} initialNotes={initialRhombergsNotes} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="frontal-lobe" className="mt-0">
                  <FrontalLobeAssessment appointmentId={appointmentId} initialNotes={initialFrontalLobeNotes} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="righting" className="mt-0">
                  <RightingReflexesAssessment appointmentId={appointmentId} initialNotes={initialRightingReflexNotes} onUpdate={onUpdate} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default NeurologicalAssessments;