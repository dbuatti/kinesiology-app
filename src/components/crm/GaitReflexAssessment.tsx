"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Footprints, Info, Zap, Eye, Move, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";
import { Badge } from "@/components/ui/badge";

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

  const correctionMatrix = [
    { diagnosis: "Eyes UP", fix: "Head DOWN" },
    { diagnosis: "Eyes DOWN", fix: "Head UP/BACK" },
    { diagnosis: "Eyes RIGHT", fix: "Rotate LEFT + Tilt RIGHT" },
    { diagnosis: "Eyes LEFT", fix: "Rotate RIGHT + Tilt LEFT" },
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
                <CardDescription className="text-slate-600">Locomotion System Calibration</CardDescription>
              </div>
            </div>
            {initialNotes && (
              <Badge className="bg-emerald-500 text-white">Integrated</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-900">
                <strong>Clinical Timing:</strong> Perform at the end of session. Lying/seated corrections can be disorienting once standing; this re-integrates the nervous system with the floor.
              </AlertDescription>
            </Alert>
            <div className="bg-slate-900 rounded-xl p-4 text-white flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Gait is managed by <strong>Central Pattern Generators</strong> in the spinal cord. This process integrates visual, vestibular, and mechanoreceptive systems.
              </p>
            </div>
          </div>

          {/* 1. Testing Patterns */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye size={20} className="text-emerald-600" />
              1. Diagnosis (Reciprocal Inhibition)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Foot Forward */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Left Foot Forward</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Facilitate</p>
                    <p className="text-xs font-medium text-slate-700">R Arm Flexors</p>
                    <p className="text-xs font-medium text-slate-700">L Arm Extensors</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-rose-500 uppercase">Inhibit</p>
                    <p className="text-xs font-medium text-slate-700">L Arm Flexors</p>
                    <p className="text-xs font-medium text-slate-700">R Arm Extensors</p>
                  </div>
                </div>
              </div>

              {/* Right Foot Forward */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Right Foot Forward</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Facilitate</p>
                    <p className="text-xs font-medium text-slate-700">L Arm Flexors</p>
                    <p className="text-xs font-medium text-slate-700">R Arm Extensors</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-rose-500 uppercase">Inhibit</p>
                    <p className="text-xs font-medium text-slate-700">R Arm Flexors</p>
                    <p className="text-xs font-medium text-slate-700">L Arm Extensors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Correction Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              2. Correction (If Out of Sync)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick VOR Fix */}
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-3">
                <p className="text-sm font-bold text-amber-900">Option A: Quick VOR Fix</p>
                <div className="grid gap-1.5">
                  {correctionMatrix.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white/60 rounded-lg text-[11px]">
                      <span className="font-bold text-slate-500">{item.diagnosis}</span>
                      <Move size={10} className="text-amber-400" />
                      <span className="font-bold text-emerald-700">{item.fix}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-amber-800 italic pt-1">Hold failing gait position + Head fix + Nasal breathing (30s) + Cross Crawls.</p>
              </div>

              {/* Standard Pathway Fix */}
              <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-200 space-y-3">
                <p className="text-sm font-bold text-indigo-900">Option B: Standard Pathway</p>
                <div className="flex flex-col gap-2">
                  {[
                    "Move back to neutral standing",
                    "Follow normal pathway assessment",
                    "Identify: Brain, Vestibular, or Body",
                    "Correct (Afferent/Efferent etc)",
                    "Re-assess Gait Reflex"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-indigo-800">
                      <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold shrink-0">{i+1}</div>
                      <span>{step}</span>
                    </div>
                  ))}
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
              placeholder="Document failing pathways and client response..."
              onSave={onSaveField}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GaitReflexAssessment;