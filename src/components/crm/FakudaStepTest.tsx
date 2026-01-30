"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Footprints, Info, Save, Loader2, RotateCcw, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FakudaStepTestProps {
  appointmentId: string;
  initialFakudaNotes: string | null | undefined;
  onUpdate: () => void;
}

const FakudaStepTest = ({ 
  appointmentId, 
  initialFakudaNotes,
  onUpdate 
}: FakudaStepTestProps) => {
  const [loading, setLoading] = useState(false);
  const [fakudaNotes, setFakudaNotes] = useState(initialFakudaNotes || '');
  const [imageError, setImageError] = useState(false);

  const imagePath = "/images/fakuda-step-test.png";

  const handleSave = async () => {
    setLoading(true);

    try {
      console.log("[FakudaStepTest] Starting to save Fakuda notes");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: existingAppointment, error: fetchError } = await supabase
        .from("appointments")
        .select("fakuda_notes, user_id")
        .eq("id", appointmentId)
        .single();

      if (fetchError) {
        console.error("[FakudaStepTest] Error fetching appointment:", fetchError);
        throw fetchError;
      }

      const isNewAssessment = !existingAppointment?.fakuda_notes;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          fakuda_notes: fakudaNotes || null,
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("[FakudaStepTest] Error updating appointment:", error);
        throw error;
      }

      showSuccess(
        isNewAssessment 
          ? "Fakuda Step Test assessment saved! Check Procedures page to see your progress." 
          : "Fakuda Step Test assessment updated successfully!"
      );
      
      onUpdate();
    } catch (error: any) {
      console.error("[FakudaStepTest] Error in handleSave:", error);
      showError(error.message || "Failed to save Fakuda Step Test assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the Fakuda Step Test notes for this session?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          fakuda_notes: null,
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showSuccess("Fakuda Step Test notes reset successfully.");
      
      // Reset local state immediately
      setFakudaNotes('');
      
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset Fakuda Step Test assessment.");
    } finally {
      setLoading(false);
    }
  };

  const hasSavedNotes = initialFakudaNotes;

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Assessment Guide:</strong> This test assesses for imbalances in the midline or vestibule cerebellum. Observe rotation and movement patterns.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions/Diagram */}
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
              <Footprints size={20} className="text-green-600" />
              Test Protocol
            </h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              {!imageError ? (
                <img 
                  src={imagePath} 
                  alt="Fakuda Step Test Reference"
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
            <ol className="space-y-2 text-sm text-green-900 list-decimal list-inside">
              <li>Client stands with eyes closed and shoulders flexed to 90 degrees (arms straight out).</li>
              <li>Instruct the client to march on the spot for 30-60 seconds.</li>
              <li>Observe the client's final position relative to their start position.</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
            <h4 className="font-bold text-amber-900 mb-2">Interpretation</h4>
            <ul className="space-y-1.5 text-sm text-amber-800 list-disc list-inside">
              <li><strong>Central:</strong> No imbalances.</li>
              <li><strong>Rotation Right:</strong> Indicates weakness/dysfunction on the right side.</li>
              <li><strong>Rotation Left:</strong> Indicates weakness/dysfunction on the left side.</li>
              <li><strong>Move Forward:</strong> May indicate flexor dominance and extensor weakness.</li>
            </ul>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="fakudaNotes" className="text-base font-bold text-slate-900 mb-2 block">
            Fakuda Step Test Notes:
          </Label>
          <Textarea
            id="fakudaNotes"
            placeholder="Document observations: e.g., Rotated 45 degrees to the left, indicating left cerebellar weakness. Also moved slightly forward."
            value={fakudaNotes}
            onChange={(e) => setFakudaNotes(e.target.value)}
            className="min-h-[400px] resize-none"
          />
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base font-semibold rounded-xl shadow-lg shadow-green-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Notes...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Fakuda Step Test Notes
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

export default FakudaStepTest;