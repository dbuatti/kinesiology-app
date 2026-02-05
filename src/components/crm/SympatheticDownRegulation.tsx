"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, Info, Zap, Target, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";

interface SympatheticDownRegulationProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const SympatheticDownRegulation = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField 
}: SympatheticDownRegulationProps) => {
  
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Purpose:</strong> Use Harmonic Rocking to shift the nervous system from a threatened (SNS/Dorsal Vagal) state back to a receptive (Socially Engaged) state.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-red-200 shadow-none rounded-2xl bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
            <Heart size={20} className="text-red-600" /> Harmonic Rocking Protocol
          </CardTitle>
          <CardDescription className="text-red-800">
            Use this technique before starting corrections or in between corrections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-red-900 flex items-center gap-2">
              <Zap size={16} className="text-red-600" />
              NS Down Regulation Process:
            </h4>
            <ol className="space-y-3 text-sm text-red-800 list-decimal list-inside ml-4">
              <li className="font-semibold">State: Permission to correct</li>
              <li>
                If No: perform gentle rocking motion with one hand on the belly button and the other hands/fingers on Kidney 27 Acupoint at the Sternocostal Joint below the neck.
              </li>
              <li>
                Can ask how many minutes to perform (usually 3 x mins) or look/feel/observe client dropping into a Safe physiological state.
              </li>
              <li>
                <span className="font-semibold">Signs of Shift:</span> Diaphragmatic breathing may improve, they may sigh, yawn or you just feel them relax and drop in.
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SympatheticDownRegulation;