"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, Zap, ListChecks, Wind } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "./EditableField";

interface DiaphragmResetProps {
  appointmentId: string;
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | null) => Promise<void>;
}

const DiaphragmReset = ({ 
  appointmentId, 
  initialNotes, 
  onSaveField 
}: DiaphragmResetProps) => {
  
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Purpose:</strong> The Phrenic Nerve is the sole motor innervation to the diaphragm. This reset aims to clear neurological interference and restore optimal breathing mechanics.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-indigo-200 shadow-none rounded-2xl bg-indigo-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Wind size={20} className="text-indigo-600" /> Manual Reset of the Diaphragm (Phrenic Nerve)
          </CardTitle>
          <CardDescription className="text-indigo-800">
            Crucial for breathing and nervous system regulation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
              <ListChecks size={16} className="text-indigo-600" />
              Procedure:
            </h4>
            <ol className="space-y-3 text-sm text-indigo-800 list-decimal list-inside ml-4">
              <li className="font-semibold">Challenge Tender Points either side of sternum and test IM.</li>
              <li>If indicated, palpate tender point each side. One side will be more tender than the other.</li>
              <li>Also palpate the muscle in the neck at C4 level. One side will be tender and usually opposite to the tender point in the sternum.</li>
              <li>Treatment: With one hand gently on the tender point and other hand at neck (C4), purposefully but gently move the ribcage up towards the neck and hold for 45-90 secs. Release very slowly and ask client to breathe again.</li>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default DiaphragmReset;