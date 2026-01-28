"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import BoltTimer from "./BoltTimer";

interface BoltTestCardProps {
  appointmentId: string;
  initialBoltScore: number | null | undefined;
  onUpdate: () => void;
}

const BoltTestCard = ({ appointmentId, initialBoltScore, onUpdate }: BoltTestCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveScore = async (score: number) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ bolt_score: score })
        .eq("id", appointmentId);

      if (error) throw error;

      showSuccess("BOLT score updated successfully!");
      onUpdate(); // Refresh data in parent component
    } catch (error: any) {
      showError(error.message || "Failed to update BOLT score.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-t-2xl">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <FlaskConical size={20} className="text-indigo-500" /> BOLT Test
              {initialBoltScore !== null && initialBoltScore !== undefined && (
                <Badge className={cn(
                  "ml-2 px-2 py-0.5 text-xs font-semibold",
                  initialBoltScore >= 25 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  Score: {initialBoltScore}s
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 border-t border-slate-100">
          <div className="space-y-4 text-sm text-slate-700">
            <BoltTimer 
              initialScore={initialBoltScore}
              onScoreRecorded={handleSaveScore}
              isSaving={loading}
            />

            <p className="leading-relaxed">
              The BOLT test measures a client's CO2 tolerance and their ability to cope without oxygen.
              Poor breathing can constantly trigger the sympathetic nervous system (fight/flight response)
              and affect the body's acid-alkaline balance.
            </p>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800">Instructions:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Ensure the client is in a relaxed state.</li>
                <li>Perform during the initial session to establish a baseline, and re-assess session-by-session.</li>
                <li>Measure how long a person can comfortably hold their breath after a normal exhalation until the first definite desire to breathe.</li>
                <li>If a client has a low score, prescribe the Breathing Recovery exercise and encourage Nasal breathing.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800">Scoring and Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><span className="font-medium">Functional Score:</span> 25 seconds or above.</li>
                <li><span className="font-medium">Optimal Goal:</span> 40 seconds and above.</li>
              </ul>
            </div>

            <div className="space-y-2 text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl">
              <h4 className="font-semibold">Clinical Precautions:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Breathing exercises can be stressful or triggering for a client's nervous system.</li>
                <li>If stress occurs, use the Nociceptive Threat Assessment to clear the nervous system's negative response before continuing.</li>
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default BoltTestCard;