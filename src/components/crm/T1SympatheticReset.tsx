"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Zap, Info, ListChecks, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";

interface T1SympatheticResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const T1SympatheticReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: T1SympatheticResetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the T1 Reset notes?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ t1_reset_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("T1 Reset notes reset successfully.");
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
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Zap size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">T1 (Sympathetic Chain Reset)</CardTitle>
                  <CardDescription className="text-slate-600">Mechanical SNS integration</CardDescription>
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
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
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
                <strong>Purpose:</strong> The T1/First Rib position can mechanically irritate the Sympathetic Nervous System. This reset aims to shift the client out of a 'LOCKED ON' sympathetic state.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <ListChecks size={16} className="text-indigo-600" />
                  Protocol Steps:
                </h4>
                <ol className="space-y-3 text-sm text-indigo-800 list-decimal list-inside ml-4">
                  <li className="font-semibold">Indicator Muscle (IM) shows as priority.</li>
                  <li>Palpate bilateral anterior first rib (T1).</li>
                  <li>Identify the restricted or tender side.</li>
                  <li>Muscle test the contralateral Psoas muscle.</li>
                  <li>Monitor the tender spot and move the ipsilateral shoulder into external rotation until tenderness dissolves (45-90 seconds).</li>
                  <li>Re-assess tenderness and Psoas muscle.</li>
                </ol>
              </div>
              
              <EditableField
                field="t1_reset_notes"
                label="T1 Sympathetic Reset Notes"
                value={initialNotes}
                multiline
                placeholder="Document restricted side, psoas response, and client's shift in tone..."
                onSave={onSaveField}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default T1SympatheticReset;