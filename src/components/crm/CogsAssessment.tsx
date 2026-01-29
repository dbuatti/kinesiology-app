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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleSave = async () => {
    setLoading(true);

    try {
      console.log("[CogsAssessment] Starting to save Cogs assessment");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      console.log("[CogsAssessment] User ID:", user.id);

      // Check existing data
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
      console.log("[CogsAssessment] Is new assessment:", isNewAssessment);
      console.log("[CogsAssessment] Existing notes:", existingAppointment);

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

      console.log("[CogsAssessment] Cogs assessment saved successfully");

      // Check if procedure was created
      const { data: procedures, error: procError } = await supabase
        .from("procedures")
        .select("*")
        .eq("user_id", user.id)
        .or("name.ilike.%range of motion%,name.ilike.%cogs%");

      if (procError) {
        console.error("[CogsAssessment] Error fetching procedures:", procError);
      } else {
        console.log("[CogsAssessment] Cogs procedures found:", procedures);
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
                  <CardTitle className="text-xl font-bold text-slate-900">Range of Motion Assessment</CardTitle>
                  <CardDescription className="text-slate-600">"Cogs" - Mobility evaluation across three planes</CardDescription>
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
                <strong>Assessment Guide:</strong> Observe and document the client's range of motion across all three anatomical planes. 
                Reference diagrams help identify movement patterns and restrictions.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="sagittal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="sagittal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Sagittal Plane
                </TabsTrigger>
                <TabsTrigger value="frontal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Frontal Plane
                </TabsTrigger>
                <TabsTrigger value="transverse" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Transverse Plane
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sagittal" className="space-y-4 mt-6">
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">S</span>
                    Sagittal Plane Movements
                  </h4>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    {!sagittalImageError ? (
                      <img 
                        src="/images/cogs/sagittal-plane.png" 
                        alt="Sagittal Plane Cogs Reference"
                        className="w-full h-auto rounded-lg"
                        onError={(e) => {
                          console.error("Failed to load sagittal plane image");
                          setSagittalImageError(true);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <ImageOff size={48} className="mb-2" />
                        <p className="text-sm">Reference diagram not available</p>
                        <p className="text-xs mt-1">Place image at: public/images/cogs/sagittal-plane.png</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-orange-900">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Flexion (FX):</strong> Forward bending movements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Extension (EX):</strong> Backward bending movements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Anterior Tilt (AT):</strong> Forward tilting movements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Posterior Tilt (PT):</strong> Backward tilting movements</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="sagittalNotes" className="text-base font-bold text-slate-900 mb-2 block">
                    Sagittal Plane Observations
                  </Label>
                  <Textarea
                    id="sagittalNotes"
                    placeholder="Document flexion/extension patterns, restrictions, asymmetries..."
                    value={sagittalNotes}
                    onChange={(e) => setSagittalNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="frontal" className="space-y-4 mt-6">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                  <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs">F</span>
                    Frontal Plane Movements
                  </h4>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    {!frontalImageError ? (
                      <img 
                        src="/images/cogs/frontal-plane.png" 
                        alt="Frontal Plane Cogs Reference"
                        className="w-full h-auto rounded-lg"
                        onError={(e) => {
                          console.error("Failed to load frontal plane image");
                          setFrontalImageError(true);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <ImageOff size={48} className="mb-2" />
                        <p className="text-sm">Reference diagram not available</p>
                        <p className="text-xs mt-1">Place image at: public/images/cogs/frontal-plane.png</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-emerald-900">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Left Flexion (LFX):</strong> Side bending to the left</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Right Flexion (RFX):</strong> Side bending to the right</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Hip Hike:</strong> Elevation of the hip</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Hip Drop:</strong> Depression of the hip</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="frontalNotes" className="text-base font-bold text-slate-900 mb-2 block">
                    Frontal Plane Observations
                  </Label>
                  <Textarea
                    id="frontalNotes"
                    placeholder="Document lateral flexion patterns, hip movements, asymmetries..."
                    value={frontalNotes}
                    onChange={(e) => setFrontalNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="transverse" className="space-y-4 mt-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">T</span>
                    Transverse Plane Movements
                  </h4>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    {!transverseImageError ? (
                      <img 
                        src="/images/cogs/transverse-plane.png" 
                        alt="Transverse Plane Cogs Reference"
                        className="w-full h-auto rounded-lg"
                        onError={(e) => {
                          console.error("Failed to load transverse plane image");
                          setTransverseImageError(true);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <ImageOff size={48} className="mb-2" />
                        <p className="text-sm">Reference diagram not available</p>
                        <p className="text-xs mt-1">Place image at: public/images/cogs/transverse-plane.png</p>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Left Rotation (L ROT):</strong> Rotational movement to the left</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>Right Rotation (R ROT):</strong> Rotational movement to the right</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Assess rotation at skull, cervical/thoracic spine, ribs, and pelvis</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="transverseNotes" className="text-base font-bold text-slate-900 mb-2 block">
                    Transverse Plane Observations
                  </Label>
                  <Textarea
                    id="transverseNotes"
                    placeholder="Document rotational patterns, restrictions, asymmetries..."
                    value={transverseNotes}
                    onChange={(e) => setTransverseNotes(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base font-semibold rounded-xl shadow-lg shadow-purple-200"
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
                  variant="ghost" 
                  className="w-full justify-between hover:bg-slate-50 rounded-xl h-12"
                >
                  <span className="font-semibold text-slate-700">View Full Assessment Protocol</span>
                  <ChevronDown className={cn("h-5 w-5 transition-transform", detailsOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-6 pt-4">
                <div className="space-y-4 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Move size={16} className="text-purple-500" />
                      What is the "Cogs" Assessment?
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      The Range of Motion/Mobility Assessment (nicknamed "Cogs") evaluates movement patterns across 
                      the three anatomical planes: Sagittal (forward/backward), Frontal (side-to-side), and Transverse (rotational). 
                      This comprehensive assessment helps identify movement restrictions, asymmetries, and compensatory patterns 
                      that may be contributing to the client's presenting issues.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Assessment Protocol
                    </h4>
                    <ol className="space-y-3 ml-8">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                        <div>
                          <p className="font-semibold text-slate-900">Observe Standing Posture</p>
                          <p className="text-slate-600">Begin with the client in a neutral standing position</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                        <div>
                          <p className="font-semibold text-slate-900">Test Each Plane Systematically</p>
                          <p className="text-slate-600">Move through sagittal, frontal, and transverse planes in order</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                        <div>
                          <p className="font-semibold text-slate-900">Document Findings</p>
                          <p className="text-slate-600">Note restrictions, asymmetries, pain points, and compensatory patterns</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                        <div>
                          <p className="font-semibold text-slate-900">Compare Bilateral Movements</p>
                          <p className="text-slate-600">Always assess both left and right sides for comparison</p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-xl">
                    <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <Info size={18} className="text-purple-600" />
                      Clinical Applications
                    </h4>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Identify primary movement restrictions that may be causing compensatory patterns</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Track progress in mobility and range of motion over multiple sessions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Correlate movement patterns with muscle testing and other assessments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Use findings to guide treatment priorities and exercise prescription</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                    <h4 className="font-bold text-amber-900 mb-2">Key Observation Points</h4>
                    <ul className="space-y-2 text-sm text-amber-800">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Look for asymmetries between left and right sides</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Note any pain or discomfort during specific movements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Observe compensatory movements in other body segments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Document quality of movement, not just range</span>
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

export default CogsAssessment;