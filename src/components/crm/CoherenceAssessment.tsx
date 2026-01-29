"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, ChevronDown, AlertCircle, Info, Heart, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CoherenceAssessmentProps {
  appointmentId: string;
  initialHeartRate: number | null | undefined;
  initialBreathRate: number | null | undefined;
  initialCoherenceScore: number | null | undefined;
  onUpdate: () => void;
}

const CoherenceAssessment = ({ 
  appointmentId, 
  initialHeartRate, 
  initialBreathRate, 
  initialCoherenceScore,
  onUpdate 
}: CoherenceAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [heartRate, setHeartRate] = useState<string>(initialHeartRate?.toString() || '');
  const [breathRate, setBreathRate] = useState<string>(initialBreathRate?.toString() || '');
  const [calculatedScore, setCalculatedScore] = useState<number | null>(initialCoherenceScore || null);

  const calculateCoherence = () => {
    const hr = parseInt(heartRate);
    const br = parseInt(breathRate);
    
    if (isNaN(hr) || isNaN(br) || br === 0) {
      showError("Please enter valid heart rate and breath rate");
      return;
    }
    
    const score = hr / br;
    setCalculatedScore(score);
  };

  const handleSave = async () => {
    if (calculatedScore === null) {
      showError("Please calculate the coherence score first");
      return;
    }

    setLoading(true);

    try {
      const hr = parseInt(heartRate);
      const br = parseInt(breathRate);

      const { error } = await supabase
        .from("appointments")
        .update({ 
          heart_rate: hr,
          breath_rate: br,
          coherence_score: calculatedScore 
        })
        .eq("id", appointmentId);

      if (error) throw error;

      showSuccess("Heart/Brain Coherence assessment saved!");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  const isWholeNumber = calculatedScore !== null && Number.isInteger(calculatedScore);
  const getScoreInterpretation = () => {
    if (calculatedScore === null) return null;
    if (isWholeNumber) {
      return {
        status: "Coherent",
        color: "emerald",
        message: "Biological oscillators are in harmony"
      };
    } else {
      return {
        status: "Discordant",
        color: "amber",
        message: "Indicates potential heart-brain disintegration and/or autonomic dysregulation"
      };
    }
  };

  const interpretation = getScoreInterpretation();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 cursor-pointer hover:from-rose-100 hover:to-pink-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                  <Activity size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Heart/Brain Coherence</CardTitle>
                  <CardDescription className="text-slate-600">Autonomic regulation assessment</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {calculatedScore !== null && (
                  <Badge className={cn(
                    "px-4 py-2 text-sm font-bold shadow-sm",
                    isWholeNumber 
                      ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  )}>
                    Score: {calculatedScore.toFixed(2)}
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
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Quick Guide:</strong> Measure pulse for 30s (×2), count breaths for 30s (×2), then divide heart rate by breath rate.
                A whole number indicates harmony; a partial number suggests dysregulation.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <Heart size={18} className="text-rose-600" />
                  </div>
                  <Label htmlFor="heartRate" className="text-base font-bold text-slate-900">Heart Rate (BPM)</Label>
                </div>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="e.g., 72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="h-12 text-lg"
                />
                <p className="text-xs text-slate-500">Count pulse for 30 seconds, then multiply by 2</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain size={18} className="text-blue-600" />
                  </div>
                  <Label htmlFor="breathRate" className="text-base font-bold text-slate-900">Breath Rate (BPM)</Label>
                </div>
                <Input
                  id="breathRate"
                  type="number"
                  placeholder="e.g., 12"
                  value={breathRate}
                  onChange={(e) => setBreathRate(e.target.value)}
                  className="h-12 text-lg"
                />
                <p className="text-xs text-slate-500">Count breaths for 30 seconds, then multiply by 2</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={calculateCoherence}
                className="flex-1 bg-rose-600 hover:bg-rose-700 h-12 text-base font-semibold rounded-xl"
                disabled={!heartRate || !breathRate}
              >
                Calculate Coherence Score
              </Button>
            </div>

            {calculatedScore !== null && interpretation && (
              <div className={cn(
                "p-6 rounded-2xl border-2",
                interpretation.color === "emerald" 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-amber-50 border-amber-200"
              )}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn(
                        "text-sm font-bold",
                        interpretation.color === "emerald"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-amber-600 hover:bg-amber-700"
                      )}>
                        {interpretation.status}
                      </Badge>
                      {isWholeNumber && <span className="text-2xl">✨</span>}
                    </div>
                    <p className={cn(
                      "text-sm font-medium leading-relaxed",
                      interpretation.color === "emerald" ? "text-emerald-900" : "text-amber-900"
                    )}>
                      {interpretation.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coherence Score</p>
                    <p className={cn(
                      "text-4xl font-black",
                      interpretation.color === "emerald" ? "text-emerald-700" : "text-amber-700"
                    )}>
                      {calculatedScore.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Heart Rate</p>
                    <p className="text-2xl font-bold text-rose-600">{heartRate}</p>
                    <p className="text-xs text-slate-400">BPM</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Breath Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{breathRate}</p>
                    <p className="text-xs text-slate-400">BPM</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 h-11 font-semibold rounded-xl"
                >
                  {loading ? "Saving..." : "Save Assessment"}
                </Button>
              </div>
            )}

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between hover:bg-slate-50 rounded-xl h-12"
                >
                  <span className="font-semibold text-slate-700">View Full Assessment Instructions</span>
                  <ChevronDown className={cn("h-5 w-5 transition-transform", detailsOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-6 pt-4">
                <div className="space-y-4 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Activity size={16} className="text-rose-500" />
                      What is Heart/Brain Coherence?
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      This assessment evaluates the synchronization between heart rate and breathing patterns,
                      indicating the level of autonomic nervous system regulation and heart-brain integration.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Step-by-Step Protocol
                    </h4>
                    <ol className="space-y-3 ml-8">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                        <div>
                          <p className="font-semibold text-slate-900">Measure Heart Rate</p>
                          <p className="text-slate-600">Take client's pulse for 30 seconds and multiply by 2</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="font-semibold text-slate-900">Observe Breathing</p>
                          <p className="text-slate-600">Watch how they breathe for 30 seconds, count breaths, multiply by 2</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="font-semibold text-slate-900">Calculate Score</p>
                          <p className="text-slate-600">Divide Heart Rate by Breath Rate</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                        <div>
                          <p className="font-semibold text-slate-900">Interpret Results</p>
                          <p className="text-slate-600">Whole number = harmony; Partial number = potential dysregulation</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      Interpretation Guidelines
                    </h4>
                    <div className="grid gap-3 ml-8">
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">Whole Number (e.g., 6.0)</p>
                          <p className="text-xs text-emerald-700">Biological oscillators are in harmony - optimal coherence</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          !
                        </div>
                        <div>
                          <p className="font-bold text-amber-900">Partial Number (e.g., 6.3)</p>
                          <p className="text-xs text-amber-700">Discordance in resonance - indicates heart-brain disintegration and/or autonomic dysregulation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Info size={18} className="text-blue-600" />
                      Clinical Applications
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Use to assess client's baseline at the start of sessions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Re-assess at the end of sessions to measure treatment effectiveness</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Teach clients to use as a biofeedback tool for stress management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Track progress over multiple sessions to monitor autonomic regulation improvements</span>
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
  );
};

export default CoherenceAssessment;