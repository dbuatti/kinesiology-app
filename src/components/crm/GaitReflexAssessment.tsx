"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Footprints, Info, Zap, Eye, Move, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GaitReflexAssessmentProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const GaitReflexAssessment = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField 
}: GaitReflexAssessmentProps) => {
  const [showCorrection, setShowCorrection] = useState(false);

  const correctionMatrix = [
    { diagnosis: "Eyes UP", fix: "Head DOWN", detail: "Close eyes, chin to chest, nasal breathing" },
    { diagnosis: "Eyes DOWN", fix: "Head UP/BACK", detail: "Close eyes, tilt head back, nasal breathing" },
    { diagnosis: "Eyes RIGHT", fix: "Rotate LEFT + Tilt RIGHT", detail: "Rotate head left, then lateral tilt right" },
    { diagnosis: "Eyes LEFT", fix: "Rotate RIGHT + Tilt LEFT", detail: "Rotate head right, then lateral tilt left" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Footprints size={24} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Gait Reflex Integration</CardTitle>
                <CardDescription className="text-slate-600">Central Pattern Generator (CPG) Calibration</CardDescription>
              </div>
            </div>
            {initialNotes && (
              <Badge className="bg-emerald-500 text-white">Integrated</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Clinical Timing:</strong> Perform at the end of the session to integrate all previous corrections into the client's most complex movement pattern: walking.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Diagnosis Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye size={20} className="text-emerald-600" />
                1. Diagnosis (Testing)
              </h3>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <p className="text-sm font-semibold text-slate-700">Reciprocal Inhibition Check:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <span>Step <strong>Left Foot Forward</strong>.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <span>Test <strong>Right Arm Flexors</strong> (Should Lock/Facilitate).</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <span>Test <strong>Left Arm Flexors</strong> (Should Unlock/Inhibit).</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</div>
                    <span className="text-slate-600 italic">If a muscle fails to inhibit or facilitate correctly, use eye positions to find the threatened pathway.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Correction Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                2. Correction (The Fix)
              </h3>
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-4">
                <p className="text-sm font-bold text-amber-900">The VOR Correction Matrix:</p>
                <div className="grid gap-2">
                  {correctionMatrix.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100 text-xs">
                      <span className="font-bold text-slate-500 w-24">{item.diagnosis}</span>
                      <Move size={12} className="text-amber-400" />
                      <span className="font-bold text-emerald-700 flex-1 text-right">{item.fix}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Protocol:</strong> Hold the failing gait position → Move head to corrective position → Nasal breathing for 30s → Finish with 30s of <strong>Cross Crawls</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <EditableField
              field="gait_notes"
              label="Gait Integration Notes"
              value={initialNotes}
              multiline
              placeholder="Document failing pathways (e.g., Right leg forward, Eyes Down) and client response after cross-crawls..."
              onSave={onSaveField}
            />
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="text-emerald-400" />
              <h4 className="font-bold">Why this works</h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Gait is managed by <strong>Central Pattern Generators</strong> in the spinal cord. By placing the head in a position previously tagged as a "threat" while performing calm nasal breathing, we re-wire the nervous system to see the movement as safe, integrating the vestibular and visual systems with the physical gait cycle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GaitReflexAssessment;