"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, ChevronDown, AlertCircle, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import BoltTimer from "./BoltTimer";
import BoltResourcesModal from "./BoltResourcesModal";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface BoltTestSectionProps {
  appointmentId: string;
  initialBoltScore: number | null | undefined;
  onUpdate: () => void;
}

const BoltTestSection = ({ appointmentId, initialBoltScore, onUpdate }: BoltTestSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const handleSaveScore = async (score: number) => {
    setLoading(true);

    try {
      console.log("[BoltTestSection] Starting to save BOLT score:", score);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      console.log("[BoltTestSection] User ID:", user.id);

      const { data: existingAppointment, error: fetchError } = await supabase
        .from("appointments")
        .select("bolt_score, user_id")
        .eq("id", appointmentId)
        .single();

      if (fetchError) {
        console.error("[BoltTestSection] Error fetching appointment:", fetchError);
        throw fetchError;
      }

      const isNewScore = !existingAppointment?.bolt_score;
      console.log("[BoltTestSection] Is new score:", isNewScore);
      console.log("[BoltTestSection] Existing score:", existingAppointment?.bolt_score);

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ bolt_score: score })
        .eq("id", appointmentId);

      if (updateError) {
        console.error("[BoltTestSection] Error updating appointment:", updateError);
        throw updateError;
      }

      console.log("[BoltTestSection] BOLT score saved successfully");

      const { data: procedures, error: procError } = await supabase
        .from("procedures")
        .select("*")
        .eq("user_id", user.id)
        .ilike("name", "%bolt%");

      if (procError) {
        console.error("[BoltTestSection] Error fetching procedures:", procError);
      } else {
        console.log("[BoltTestSection] BOLT procedures found:", procedures);
      }

      showSuccess(
        isNewScore 
          ? "BOLT score saved! Check Procedures page to see your progress." 
          : "BOLT score updated successfully!"
      );
      
      onUpdate();
    } catch (error: any) {
      console.error("[BoltTestSection] Error in handleSaveScore:", error);
      showError(error.message || "Failed to update BOLT score.");
    } finally {
      setLoading(false);
    }
  };

  const needsImprovement = initialBoltScore !== null && initialBoltScore !== undefined && initialBoltScore < 25;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <FlaskConical size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">BOLT Test</CardTitle>
                    <CardDescription className="text-slate-600">Body Oxygen Level Test</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {initialBoltScore !== null && initialBoltScore !== undefined && (
                    <Badge className={cn(
                      "px-4 py-2 text-sm font-bold shadow-sm",
                      initialBoltScore >= 40 ? "bg-emerald-500 text-white hover:bg-emerald-600" :
                      initialBoltScore >= 25 ? "bg-blue-500 text-white hover:bg-blue-600" :
                      "bg-amber-500 text-white hover:bg-amber-600"
                    )}>
                      Current: {initialBoltScore}s
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-600", isOpen && "rotate-180")} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="p-6 space-y-6">
              {needsImprovement && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900 mb-1">Score Below Target</p>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          This client would benefit from breathing exercises to improve their BOLT score to 25s or higher.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setResourcesOpen(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0"
                      size="sm"
                    >
                      <BookOpen size={16} className="mr-2" />
                      View Resources
                    </Button>
                  </div>
                </div>
              )}

              <BoltTimer 
                initialScore={initialBoltScore}
                onScoreRecorded={handleSaveScore}
                isSaving={loading}
              />

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setResourcesOpen(true)}
                  className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <BookOpen size={18} className="mr-2" />
                  Client Resources & Exercises
                </Button>
              </div>

              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between hover:bg-slate-50 rounded-xl h-12"
                  >
                    <span className="font-semibold text-slate-700">View Full Test Instructions</span>
                    <ChevronDown className={cn("h-5 w-5 transition-transform", detailsOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-6 pt-4">
                  <div className="space-y-4 text-sm">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <FlaskConical size={16} className="text-indigo-500" />
                        What is the BOLT Test?
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        The BOLT test measures a client's CO2 tolerance and their ability to cope without oxygen.
                        Poor breathing can constantly trigger the sympathetic nervous system (fight/flight response)
                        and affect the body's acid-alkaline balance.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        Test Instructions
                      </h4>
                      <ul className="space-y-2 ml-8">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">Ensure the client is in a relaxed state before beginning</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">Perform during the initial session to establish a baseline</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">Have client breathe normally, then hold breath after a normal exhalation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">Stop timing at the first definite desire to breathe (not maximum hold)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700">Re-assess session-by-session to track progress</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        Scoring Guidelines
                      </h4>
                      <div className="grid gap-3 ml-8">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            40+
                          </div>
                          <div>
                            <p className="font-bold text-emerald-900">Optimal Score</p>
                            <p className="text-xs text-emerald-700">Excellent CO2 tolerance and breathing efficiency</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            25+
                          </div>
                          <div>
                            <p className="font-bold text-blue-900">Functional Score</p>
                            <p className="text-xs text-blue-700">Acceptable breathing patterns, room for improvement</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {'<25'}
                          </div>
                          <div>
                            <p className="font-bold text-amber-900">Below Target</p>
                            <p className="text-xs text-amber-700">Recommend breathing exercises and nasal breathing practice</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl">
                      <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600" />
                        Clinical Precautions
                      </h4>
                      <ul className="space-y-2 text-sm text-red-800">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Breathing exercises can be stressful or triggering for a client's nervous system</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>If stress occurs, use the Nociceptive Threat Assessment to clear the nervous system's negative response before continuing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Never force a client to continue if they show signs of distress</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <BoltResourcesModal 
        open={resourcesOpen}
        onOpenChange={setResourcesOpen}
        currentScore={initialBoltScore}
      />
    </>
  );
};

export default BoltTestSection;