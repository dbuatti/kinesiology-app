"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Footprints, Scale, Brain, ChevronDown } from "lucide-react";
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
          <div className="p-6 space-y-6">
            {/* Fakuda Step Test Card */}
            <Card className="border-2 border-green-200 shadow-none rounded-2xl bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <Footprints size={20} className="text-green-600" /> Fakuda Step Test
                </CardTitle>
                <CardDescription>Assess midline/vestibule cerebellum imbalances</CardDescription>
              </CardHeader>
              <CardContent>
                <FakudaStepTest
                  appointmentId={appointmentId}
                  initialFakudaNotes={initialFakudaNotes}
                  onUpdate={onUpdate}
                />
              </CardContent>
            </Card>

            {/* Sharpened Rhombergs Test Card */}
            <Card className="border-2 border-purple-200 shadow-none rounded-2xl bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                  <Scale size={20} className="text-purple-600" /> Sharpened Rhombergs Test
                </CardTitle>
                <CardDescription>Assess midline cerebellum and proprioception</CardDescription>
              </CardHeader>
              <CardContent>
                <SharpenedRhombergsTest
                  appointmentId={appointmentId}
                  initialNotes={initialRhombergsNotes}
                  onUpdate={onUpdate}
                />
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default NeurologicalAssessments;