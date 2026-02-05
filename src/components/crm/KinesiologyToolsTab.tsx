"use client";

import React from "react";
import LuscherColourAssessment from "@/components/crm/LuscherColourAssessment";
import EmotionAssessment from "@/components/crm/EmotionAssessment";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface KinesiologyToolsTabProps {
  appointmentId: string;
  // Data fields
  emotion_mode: string | null | undefined;
  emotion_primary_selection: string | null | undefined;
  emotion_secondary_selection: string[] | null | undefined;
  emotion_notes: string | null | undefined;
  luscher_color_1: string | null | undefined;
  luscher_color_2: string | null | undefined;
  // Actions
  onSaveField: (field: string, value: string | boolean | null | string[]) => Promise<void>;
  onUpdate: () => void; // Used for resetting/refetching data if needed
}

const KinesiologyToolsTab = ({
  appointmentId,
  emotion_mode,
  emotion_primary_selection,
  emotion_secondary_selection,
  emotion_notes,
  luscher_color_1,
  luscher_color_2,
  onSaveField,
  onUpdate,
}: KinesiologyToolsTabProps) => {

  const handleSaveColors = async (color1: string | null, color2: string | null) => {
    await onSaveField('luscher_color_1', color1);
    await onSaveField('luscher_color_2', color2);
  };

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Heart size={24} className="text-red-600" /> Energetic & Emotional Assessments
          </CardTitle>
          <CardDescription>
            Tools for Luscher Colour and Emotional Assessment (PS12/PS14)
          </CardDescription>
        </CardHeader>
      </Card>

      <LuscherColourAssessment
        appointmentId={appointmentId}
        initialColor1={luscher_color_1}
        initialColor2={luscher_color_2}
        onSaveColors={handleSaveColors}
      />
      
      <EmotionAssessment
        appointmentId={appointmentId}
        initialMode={emotion_mode}
        initialPrimary={emotion_primary_selection}
        initialSecondary={emotion_secondary_selection}
        initialNotes={emotion_notes}
        onSaveField={onSaveField}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default KinesiologyToolsTab;