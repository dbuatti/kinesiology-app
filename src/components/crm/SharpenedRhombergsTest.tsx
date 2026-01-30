"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Scale, Info, Save, Loader2, RotateCcw, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SharpenedRhombergsTestProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onUpdate: () => void;
}

const SharpenedRhombergsTest = ({ 
  appointmentId, 
  initialNotes,
  onUpdate 
}: SharpenedRhombergsTestProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [imageError, setImageError] = useState(false);

  const imagePath = "/images/sharpened-rhombergs-test.png";

  const handleSave = async () => {
    setLoading(true);

    try {
      console.log("[SharpenedRhombergsTest] Starting to save notes");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: existingAppointment, error: fetchError } = await supabase
        .from("appointments")
        .select("sharpened_rhombergs_notes, user_id")
        .eq("id", appointmentId)
        .single();

      if (fetchError) {
        console.error("[SharpenedRhombergsTest] Error fetching appointment:", fetchError);
        throw fetchError;
      }

      const isNewAssessment = !existingAppointment?.sharpened_rhombergs_notes;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          sharpened_rhombergs_notes: notes || null,
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("[SharpenedRhombergsTest] Error updating appointment:", error);
        throw error;
      }

      showSuccess(
        isNewAssessment 
          ? "Sharpened Rhombergs Test assessment saved! Check Procedures page to see your progress." 
          : "Sharpened Rhombergs Test assessment updated successfully!"
      );
      
      onUpdate();
    } catch (error: any) {
      console.error("[SharpenedRhombergsTest] Error in handleSave:", error);
      showError(error.message || "Failed to save Sharpened Rhombergs Test assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the Sharpened Rhombergs Test notes for this session?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          sharpened_rhombergs_notes: null,
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Sharpened Rhombergs Test notes reset successfully.");
      
      // Reset local state immediately
      setNotes('');
      
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset Sharpened Rhombergs Test assessment.");
    } finally {
      setLoading(false);
    }
  };

  const hasSavedNotes = initialNotes;

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Assessment Guide:</strong> This test assesses for imbalances in the midline cerebellum and proprioceptive activity in the feet.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions/Diagram */}
        <div className="space-y-4">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Scale size={20} className="text-purple-600" />
              Test Protocol
            </h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              {!imageError ? (
                <img 
                  src={imagePath} 
                  alt="Sharpened Rhombergs Test Reference"
                  className="w-full h-auto rounded-lg object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ImageOff size={40} className="mb-2" />
                  <p className="text-xs">Diagram not available</p>
                </div>
              )}
            </div>
            <ol className="space-y-2 text-sm text-purple-900 list-decimal list-inside">
              <li>Client places feet together with toes pointing forward (heel-to-toe stance).</li>
              <li>Instruct client to lengthen through the spine.</li>
              <li>Fixate on a target with the eyes.</li>
              <li>Raise arms to shoulder height.</li>
              <li>Close the eyes.</li>
              <li>Maintain posture for a minimum of 20 seconds.</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
            <h4 className="font-bold text-amber-900 mb-2">Interpretation</h4>
            <ul className="space-y-1.5 text-sm text-amber-800 list-disc list-inside">
              <li>Observe for pattern of sway, especially the initial deviation.</li>
              <li>Client will sway to the side of weakness/dysfunction.</li>
              <li>Inability to maintain posture for 20 seconds indicates significant imbalance.</li>
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="rhombergsNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Sharpened Rhombergs Test Notes:
          </Label>
          <Textarea
            id="rhombergsNotes"
            placeholder="Document observations: e.g., Significant sway to the right, unable to hold for 20 seconds. Initial deviation was posterior."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[400px] resize-none"
          />
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 text-base font-semibold rounded-xl shadow-lg shadow-purple-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Notes...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Rhombergs Notes
                </>
              )}
            </Button>
            {hasSavedNotes && (
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={loading}
                className="h-12 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              >
                <RotateCcw size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharpenedRhombergsTest;