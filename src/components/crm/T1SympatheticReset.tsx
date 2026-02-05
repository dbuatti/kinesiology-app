"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Zap, Heart, Move, ListChecks } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";

interface T1SympatheticResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const T1SympatheticReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField 
}: T1SympatheticResetProps) => {
  
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Purpose:</strong> The T1/First Rib position can mechanically irritate the Sympathetic Nervous System (SNS). This reset aims to shift the client out of a 'LOCKED ON' sympathetic state.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-indigo-200 shadow-none rounded-2xl bg-indigo-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" /> T1 (Sympathetic Chain Reset) Protocol
          </CardTitle>
          <CardDescription className="text-indigo-800">
            One of the first processes to integrate the client's nervous system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
              <ListChecks size={16} className="text-indigo-600" />
              General Steps:
            </h4>
            <ol className="space-y-3 text-sm text-indigo-800 list-decimal list-inside ml-4">
              <li className="font-semibold">IM Shows as Priority</li>
              <li>PALPATE BILATERAL ANTERIOR FIRST RIB (T1)</li>
              <li>IDENTIFY RESTRICTED OR TENDER SIDE</li>
              <li>MUSCLE TEST CONTRALATERAL PSOAS MUSCLE</li>
              <li>MONITOR TENDER SPOT AND MOVE IPSILATERAL SHOULDER INTO EXTERNAL ROTATION UNTIL TENDERNESS DISSOLVES OR PULSE IS FELT. (45-90 SECS)</li>
              <li>RE-ASSESS TENDERNESS, PSOAS MUSCLE, CLIENT'S PERCEPTION OF THEIR BODY</li>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default T1SympatheticReset;