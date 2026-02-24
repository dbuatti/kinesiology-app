"use client";

import React from "react";
import { Dumbbell, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MuscleTestCard from "./MuscleTestCard";
import { MuscleTestResult } from "@/types/crm";
import { MuscleStatus } from "@/data/muscle-data";

interface MuscleGroupCollapsibleProps {
  groupName: string;
  muscles: string[];
  results: Record<string, MuscleTestResult>;
  isOpen: boolean;
  onToggle: () => void;
  onStatusChange: (muscle: string, status: MuscleStatus['value']) => void;
  onClear: (muscle: string) => void;
  onShowInfo: (muscle: string) => void;
  onShowLogic?: (muscle: string, status: MuscleStatus['value']) => void;
  disabled?: boolean;
}

const MuscleGroupCollapsible = ({
  groupName,
  muscles,
  results,
  isOpen,
  onToggle,
  onStatusChange,
  onClear,
  onShowInfo,
  onShowLogic,
  disabled
}: MuscleGroupCollapsibleProps) => {
  const testedInGroup = muscles.filter(m => results[m]).length;

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={onToggle}
      className="w-full"
    >
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-slate-900 text-white p-6 cursor-pointer hover:bg-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">{groupName}</CardTitle>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {muscles.length} Muscles • {testedInGroup} Tested
                  </p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {muscles.map(muscle => (
              <MuscleTestCard
                key={muscle}
                muscle={muscle}
                currentResult={results[muscle]}
                onStatusChange={onStatusChange}
                onClear={onClear}
                onShowInfo={onShowInfo}
                onShowLogic={onShowLogic}
                disabled={disabled}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MuscleGroupCollapsible;