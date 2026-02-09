"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Heart, Info, Zap, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";

interface SympatheticDownRegulationProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const SympatheticDownRegulation = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: SympatheticDownRegulationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the Harmonic Rocking notes?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ harmonic_rocking_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Harmonic Rocking notes reset successfully.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset notes.");
    } finally {
      setLoading(false);
    }
  };

  const hasNotes = !!initialNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 cursor-pointer hover:from-red-100 hover:to-orange-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Heart size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Harmonic Rocking Protocol</CardTitle>
                  <CardDescription className="text-slate-600">Nervous system down-regulation</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasNotes && (
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    disabled={loading}
                    className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
                {hasNotes && (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                    Notes Recorded
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
          <CardContent className="p-6 space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Purpose:</strong> Shift the nervous system from a threatened (SNS/Dorsal Vagal) state back to a receptive (Socially Engaged) state.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-bold text-red-900 flex items-center gap-2">
                  <Zap size={16} className="text-red-600" />
                  Protocol Steps:
                </h4>
                <ol className="space-y-3 text-sm text-red-800 list-decimal list-inside ml-4">
                  <li className="font-semibold">State: Permission to correct</li>
                  <li>
                    If permission is denied: perform gentle rocking motion with one hand on the belly button and the other hands/fingers on Kidney 27 Acupoint.
                  </li>
                  <li>
                    Ask how many minutes to perform (usually 3 minutes) or observe client dropping into a safe physiological state.
                  </li>
                  <li>
                    <span className="font-semibold">Signs of Shift:</span> Diaphragmatic breathing may improve, they may sigh, yawn, or you just feel them relax.
                  </li>
                </ol>
              </div>
              
              <EditableField
                field="harmonic_rocking_notes"
                label="Harmonic Rocking Notes"
                value={initialNotes}
                multiline
                placeholder="Document duration, client response, and observed shift in nervous system state..."
                onSave={onSaveField}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default SympatheticDownRegulation;