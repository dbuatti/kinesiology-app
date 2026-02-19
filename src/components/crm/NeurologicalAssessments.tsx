"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Footprints, Scale, Brain, ChevronDown, Hand, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import FakudaStepTest from "./FakudaStepTest";
import SharpenedRhombergsTest from "./SharpenedRhombergsTest";
import FrontalLobeAssessment from "./FrontalLobeAssessment";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface NeurologicalAssessmentsProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  initialRhombergsNotes: string | null | undefined;
  initialFrontalLobeNotes: string | null | undefined;
  onUpdate: () => void;
}

const NeurologicalAssessments = ({
  appointmentId,
  initialFakudaNotes,
  initialRhombergsNotes,
  initialFrontalLobeNotes,
  onUpdate,
}: NeurologicalAssessmentsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasFakudaNotes = !!initialFakudaNotes;
  const hasRhombergsNotes = !!initialRhombergsNotes;
  const hasFrontalLobeNotes = !!initialFrontalLobeNotes;
  const hasAnyNotes = hasFakudaNotes || hasRhombergsNotes || hasFrontalLobeNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden transition-all hover:shadow-xl">
        <CollapsibleTrigger asChild>
          <div className={cn(
            "p-6 flex items-center justify-between cursor-pointer transition-all duration-500",
            isOpen ? "bg-slate-50/80" : "hover:bg-slate-50/50",
            hasAnyNotes && !isOpen && "bg-emerald-50/30"
          )}>
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-[1.25rem] bg-emerald-600 flex items-center justify-center shadow-lg transition-transform duration-500",
                isOpen ? "scale-110 -rotate-12" : ""
              )}>
                <Brain size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Neurological Global</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cerebellum & Proprioception</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasAnyNotes && (
                <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                  Assessed
                </Badge>
              )}
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-500", isOpen && "rotate-180")} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-8 border-t border-slate-100 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
            <Tabs defaultValue="fakuda" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-16 bg-slate-100 p-1.5 rounded-2xl">
                <TabsTrigger value="fakuda" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm rounded-xl h-13 font-black uppercase tracking-wider text-[10px] relative">
                  <Footprints size={16} /> Fakuda
                  {hasFakudaNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="rhombergs" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-xl h-13 font-black uppercase tracking-wider text-[10px] relative">
                  <Scale size={16} /> Rhombergs
                  {hasRhombergsNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />}
                </TabsTrigger>
                <TabsTrigger value="frontal-lobe" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-13 font-black uppercase tracking-wider text-[10px] relative">
                  <Hand size={16} /> Frontal Lobe
                  {hasFrontalLobeNotes && <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fakuda" className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900">Fakuda Step Test</h4>
                    <p className="text-xs text-slate-500 font-medium">Assess midline/vestibule cerebellum imbalances</p>
                  </div>
                  {hasFakudaNotes && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">Completed</Badge>}
                </div>
                <FakudaStepTest
                  appointmentId={appointmentId}
                  initialFakudaNotes={initialFakudaNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>
              
              <TabsContent value="rhombergs" className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900">Sharpened Rhombergs Test</h4>
                    <p className="text-xs text-slate-500 font-medium">Assess midline cerebellum and proprioception</p>
                  </div>
                  {hasRhombergsNotes && <Badge className="bg-purple-50 text-purple-600 border-purple-100 font-bold">Completed</Badge>}
                </div>
                <SharpenedRhombergsTest
                  appointmentId={appointmentId}
                  initialNotes={initialRhombergsNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="frontal-lobe" className="mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900">Frontal Lobe Assessment</h4>
                    <p className="text-xs text-slate-500 font-medium">Rapid hand drill for frontal cortex asymmetry</p>
                  </div>
                  {hasFrontalLobeNotes && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">Completed</Badge>}
                </div>
                <FrontalLobeAssessment
                  appointmentId={appointmentId}
                  initialNotes={initialFrontalLobeNotes}
                  onUpdate={onUpdate}
                />
              </TabsContent>
            </Tabs>

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Clinical Note</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Global assessments provide a baseline for the client's nervous system stability. If significant imbalances are found, prioritize <strong>SNS Down-regulation</strong> before proceeding with deep emotional or structural work.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default NeurologicalAssessments;