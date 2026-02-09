"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Wind, Info, ListChecks, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";

interface DiaphragmResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
  onUpdate: () => void;
}

const DiaphragmReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField,
  onUpdate
}: DiaphragmResetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the Diaphragm Reset notes?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ diaphragm_reset_notes: null })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Diaphragm Reset notes reset successfully.");
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
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 cursor-pointer hover:from-blue-100 hover:to-cyan-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Wind size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Manual Reset of the Diaphragm</CardTitle>
                  <CardDescription className="text-slate-600">Phrenic Nerve integration</CardDescription>
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
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
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
                <strong>Purpose:</strong> The Phrenic Nerve is the sole motor innervation to the diaphragm. This reset aims to clear neurological interference and restore optimal breathing mechanics.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <ListChecks size={16} className="text-blue-600" />
                  Protocol Steps:
                </h4>
                <ol className="space-y-3 text-sm text-blue-800 list-decimal list-inside ml-4">
                  <li className="font-semibold">Challenge Tender Points either side of sternum and test IM.</li>
                  <li>If indicated, palpate tender point each side. One side will be more tender.</li>
                  <li>Palpate the muscle in the neck at C4 level (usually opposite to the sternum tender point).</li>
                  <li>Treatment: Move the ribcage up towards the neck and hold for 45-90 secs. Release very slowly.</li>
                </ol>
              </div>
              
              <EditableField
                field="diaphragm_reset_notes"
                label="Diaphragm Reset Notes"
                value={initialNotes}
                multiline
                placeholder="Document tender points, side of restriction, and client's breathing response..."
                onSave={onSaveField}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default DiaphragmReset;