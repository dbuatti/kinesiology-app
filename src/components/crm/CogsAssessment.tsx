"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Move, Info, Save, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CogsAssessmentProps {
  appointmentId: string;
  initialSagittalNotes: string | null | undefined;
  initialFrontalNotes: string | null | undefined;
  initialTransverseNotes: string | null | undefined;
  onUpdate: () => void;
}

const CogsAssessment = ({ 
  appointmentId, 
  initialSagittalNotes,
  initialFrontalNotes,
  initialTransverseNotes,
  onUpdate 
}: CogsAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [sagittalNotes, setSagittalNotes] = useState(initialSagittalNotes || '');
  const [frontalNotes, setFrontalNotes] = useState(initialFrontalNotes || '');
  const [transverseNotes, setTransverseNotes] = useState(initialTransverseNotes || '');

  const [sagittalImageError, setSagittalImageError] = useState(false);
  const [frontalImageError, setFrontalImageError] = useState(false);
  const [transverseImageError, setTransverseImageError] = useState(false);

  const sagittalImagePath = "/images/cogs/sagittal-plane.png";
  const frontalImagePath = "/images/cogs/frontal-plane.png";
  const transverseImagePath = "/images/cogs/transverse-plane.png";

  const handleSave = async () => {
    setLoading(true);

    try {
      console.log("[CogsAssessment] Starting to save Cogs assessment");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: existingAppointment, error: fetchError } = await supabase
        .from("appointments")
        .select("sagittal_plane_notes, frontal_plane_notes, transverse_plane_notes, user_id")
        .eq("id", appointmentId)
        .single();

      if (fetchError) {
        console.error("[CogsAssessment] Error fetching appointment:", fetchError);
        throw fetchError;
      }

      const isNewAssessment = !existingAppointment?.sagittal_plane_notes && 
                              !existingAppointment?.frontal_plane_notes && 
                              !existingAppointment?.transverse_plane_notes;

      const { error } = await supabase
        .from("appointments")
        .update({ 
          sagittal_plane_notes: sagittalNotes || null,
          frontal_plane_notes: frontalNotes || null,
          transverse_plane_notes: transverseNotes || null,
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("[CogsAssessment] Error updating appointment:", error);
        throw error;
      }

      showSuccess(
        isNewAssessment 
          ? "Range of Motion assessment saved! Check Procedures page to see your progress." 
          : "Range of Motion assessment updated successfully!"
      );
      
      onUpdate();
    } catch (error: any) {
      console.error("[CogsAssessment] Error in handleSave:", error);
      showError(error.message || "Failed to save Cogs assessment.");
    } finally {
      setLoading(false);
    }
  };

  const hasNotes = sagittalNotes || frontalNotes || transverseNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 cursor-pointer hover:from-purple-100 hover:to-violet-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <Move size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Range of Motion/Mobility Assessment</CardTitle>
                  <CardDescription className="text-slate-600">"Cogs" - Evaluate all three anatomical planes</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasNotes && (
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
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
                <strong>Assessment Guide:</strong> Document observations for all three anatomical planes. 
                Reference diagrams on the left show movement patterns for each plane.
              </AlertDescription>
            </Alert>

            {/* Sagittal Plane */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">S</span>
                Sagittal Plane
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    {!sagittalImageError ? (
                      <img 
                        src={sagittalImagePath} 
                        alt="Sagittal Plane Reference"
                        className="w-full h-auto rounded-lg"
                        onError={() => setSagittalImageError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <ImageOff size={40} className="mb-2" />
                        <p className="text-xs">Diagram not available</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-xs text-orange-900">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Flexion (FX):</strong> Forward bending</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Extension (EX):</strong> Backward bending</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Anterior Tilt (AT):</strong> Forward tilting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Posterior Tilt (PT):</strong> Backward tilting</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="sagittalNotes" className="text-base font-bold text-slate-900 mb-2 block">
                    Sagittal Plane Cogs Notes:
                  </Label>
                  <Textarea
                    id="sagittalNotes"
                    placeholder="Document flexion/extension patterns, restrictions, asymmetries..."
                    value={sagittalNotes}
                    onChange={(e) => setSagittalNotes(e.target.value)}
                    className="min-h-[280px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Frontal Plane */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">F</span>
                Frontal Plane
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    {!frontalImageError ? (
                      <img 
                        src={frontalImagePath} 
                        alt="Frontal Plane Reference"
                        className="w-full h-auto rounded-lg"
                        onError={() => setFrontalImageError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <ImageOff size={40} className="mb-2" />
                        <p className="text-xs">Diagram not available</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-900">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Left Flexion (LFX):</strong> Side bending left</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Right Flexion (RFX):</strong> Side bending right</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Hip Hike:</strong> Hip elevation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Hip Drop:</strong> Hip depression</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="frontalNotes" className="text-base font-bold text-slate-900 mb-2 block">
                    Frontal Plane Cogs Notes:
                  </Label>
                  <Textarea
                    id="frontalNotes"
                    placeholder="Document lateral flexion patterns, hip movements, asymmetries..."
                    value={frontalNotes}
                    onChange={(e) => setFrontalNotes(e.target.value)}
                    className="min-h-[280px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Transverse Plane */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">T</span>
                Transverse Plane
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="bg-white rounded-lg p-4 mb-3">
                    {!transverseImageError ? (
                      <img 
                        src={transverseImagePath} 
                        alt="Transverse Plane Reference"
                        className="w-full h-auto rounded-lg"
                        onError={() => setTransverseImageError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <ImageOff size={40} className="mb-2" />
                        <p className="text-xs">Diagram not available</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-xs text-blue-900">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Left Rotation (L ROT):</strong> Rotation left</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong>Right Rotation (R ROT):</strong> Rotation right</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Assess rotation at skull, cervical/thoracic spine, ribs, pelvis</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="transverseNotes" className="text-base font-bold text-slate-900 mb-2 block">
                    Transverse Plane Cogs Notes:
                  </Label>
                  <Textarea
                    id="transverseNotes"
                    placeholder="Document rotational patterns, restrictions, asymmetries..."
                    value={transverseNotes}
                    onChange={(e) => setTransverseNotes(e.target.value)}
                    className="min-h-[280px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button 
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 text-base font-semibold rounded-xl shadow-lg shadow-purple-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Assessment...
                  </>
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    Save Range of Motion Assessment
                  </>
                )}
              </Button>

              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 px-6 rounded-xl border-slate-200"
                  >
                    <Info size={18} className="mr-2" />
                    {detailsOpen ? "Hide" : "View"} Protocol
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4 text-sm bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Move size={16} className="text-purple-500" />
                        What is the "Cogs" Assessment?
                      </h4>
                      <p className="text-slate-700 leading-relaxed">
                        The Range of Motion/Mobility Assessment (nicknamed "Cogs") evaluates movement patterns across 
                        the three anatomical planes: Sagittal (forward/backward), Frontal (side-to-side), and Transverse (rotational). 
                        This comprehensive assessment helps identify movement restrictions, asymmetries, and compensatory patterns.
                      </p>
                    </div>

                    <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl">
                      <h4 className="font-bold text-purple-900 mb-2">Assessment Protocol</h4>
                      <ol className="space-y-2 text-sm text-purple-800 list-decimal list-inside">
                        <li>Observe standing posture in neutral position</li>
                        <li>Test each plane systematically (sagittal, frontal, transverse)</li>
                        <li>Document restrictions, asymmetries, pain points, and compensatory patterns</li>
                        <li>Compare bilateral movements for both left and right sides</li>
                      </ol>
                    </div>

                    <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                      <h4 className="font-bold text-amber-900 mb-2">Key Observation Points</h4>
                      <ul className="space-y-1.5 text-sm text-amber-800">
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Look for asymmetries between left and right sides</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Note any pain or discomfort during specific movements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Observe compensatory movements in other body segments</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Document quality of movement, not just range</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CogsAssessment;