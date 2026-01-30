"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hand, Info, Save, Loader2, RotateCcw, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FrontalLobeAssessmentProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onUpdate: () => void;
}

const FrontalLobeAssessment = ({ 
  appointmentId, 
  initialNotes,
  onUpdate 
}: FrontalLobeAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [imageError, setImageError] = useState(false);

  const imagePath = "/images/frontal-lobe-assessment.png";

  const handleSave = async () => {
    setLoading(true);

    try {
      console.log("[FrontalLobeAssessment] Starting to save notes");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: existingAppointment, error: fetchError } = await supabase
        .from("appointments")
        .select("frontal_lobe_notes, user_id")
        .eq("id", appointmentId)
        .single();

      if (fetchError) {
        console.error("[FrontalLobeAssessment] Error fetching appointment:", fetchError);
        throw fetchError;
      }

      const isNewAssessment = !existingAppointment?.frontal_lobe_notes;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          frontal_lobe_notes: notes || null,
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("[FrontalLobeAssessment] Error updating appointment:", error);
        throw error;
      }

      showSuccess(
        isNewAssessment 
          ? "Frontal Lobe Assessment saved! Check Procedures page to see your progress." 
          : "Frontal Lobe Assessment updated successfully!"
      );
      
      onUpdate();
    } catch (error: any) {
      console.error("[FrontalLobeAssessment] Error in handleSave:", error);
      showError(error.message || "Failed to save Frontal Lobe Assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the Frontal Lobe Assessment notes for this session?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          frontal_lobe_notes: null,
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Frontal Lobe Assessment notes reset successfully.");
      
      // Reset local state immediately
      setNotes('');
      
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset Frontal Lobe Assessment.");
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
          <strong>Assessment Guide:</strong> This test assesses for asymmetry between the left and right frontal cortices via rapid hand movements.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions/Diagram */}
        <div className="space-y-4">
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Hand size={20} className="text-indigo-600" />
              Test Protocol
            </h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              {!imageError ? (
                <img 
                  src={imagePath} 
                  alt="Frontal Lobe Assessment Reference"
                  className="w-full h-auto rounded-lg object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ImageOff size={40} className="mb-2" />
                  <p className="text-xs">Diagram not available (Ensure 'frontal-lobe-assessment.png' is in public/images/)</p>
                </div>
              )}
            </div>
            <ol className="space-y-2 text-sm text-indigo-900 list-decimal list-inside">
              <li>Practitioner demonstrates the rapid open/closed hand test (10 repetitions).</li>
              <li>Client closes their eyes.</li>
              <li>Client performs the test as fast and wide as possible with the left hand.</li>
              <li>Client repeats with the right hand.</li>
              <li>Compare performance between the two hands.</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
            <h4 className="font-bold text-amber-900 mb-2">Interpretation</h4>
            <ul className="space-y-1.5 text-sm text-amber-800 list-disc list-inside">
              <li>The right frontal cortex controls the left distal extremity, and vice versa.</li>
              <li>Slower, less coordinated, or smaller movements indicate weakness/dysfunction in the contralateral frontal cortex.</li>
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="frontalLobeNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Frontal Lobe Assessment Notes:
          </Label>
          <Textarea
            id="frontalLobeNotes"
            placeholder="Document observations: e.g., Left hand was significantly slower and less coordinated than the right, indicating right frontal cortex weakness."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[400px] resize-none"
          />
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold rounded-xl shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Notes...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Frontal Lobe Notes
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

export default FrontalLobeAssessment;