"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footprints, Scale, Brain, ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import FakudaStepTest from "./FakudaStepTest";
import SharpenedRhombergsTest from "./SharpenedRhombergsTest";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NeurologicalAssessmentsProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  initialRhombergsNotes: string | null | undefined;
  onUpdate: () => void;
}

const NeurologicalAssessments = ({
  appointmentId,
  initialFakudaNotes,
  initialRhombergsNotes,
  onUpdate,
}: NeurologicalAssessmentsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("fakuda");

  const hasFakudaNotes = !!initialFakudaNotes;
  const hasRhombergsNotes = !!initialRhombergsNotes;
  const hasAnyNotes = hasFakudaNotes || hasRhombergsNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Neurological Global Assessments</CardTitle>
                  <CardDescription className="text-slate-600">Cerebellum and proprioception testing</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasAnyNotes && (
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    Assessed
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-600", isOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-xl p-1">
                <TabsTrigger 
                  value="fakuda" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 text-slate-600 font-semibold rounded-lg"
                >
                  <Footprints size={18} /> Fakuda Step Test
                </TabsTrigger>
                <TabsTrigger 
                  value="rhombergs" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 text-slate-600 font-semibold rounded-lg"
                >
                  <Scale size={18} /> Sharpened Rhombergs
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <TabsContent value="fakuda">
                  <FakudaStepTest
                    appointmentId={appointmentId}
                    initialFakudaNotes={initialFakudaNotes}
                    onUpdate={onUpdate}
                  />
                </TabsContent>
                <TabsContent value="rhombergs">
                  <SharpenedRhombergsTest
                    appointmentId={appointmentId}
                    initialNotes={initialRhombergsNotes}
                    onUpdate={onUpdate}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default NeurologicalAssessments;