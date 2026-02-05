"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";
import LuscherColourAssessment from "@/components/crm/LuscherColourAssessment";
import EmotionAssessment from "@/components/crm/EmotionAssessment";
import { AppointmentWithClient } from "@/pages/AppointmentDetailPage"; // Assuming this type is available

interface KinesiologyToolsTabProps {
  appointment: AppointmentWithClient;
  onSaveField: (field: string, value: string | boolean | null | string[]) => Promise<void>;
  onUpdate: () => void;
}

const KinesiologyToolsTab = ({ appointment, onSaveField, onUpdate }: KinesiologyToolsTabProps) => {
  
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
            Luscher Colour and Emotional Assessment for {appointment.clients.name}
          </CardDescription>
        </CardHeader>
      </Card>

      <LuscherColourAssessment
        appointmentId={appointment.id}
        initialColor1={appointment.luscher_color_1}
        initialColor2={appointment.luscher_color_2}
        onSaveColors={handleSaveColors}
      />
      <EmotionAssessment
        appointmentId={appointment.id}
        initialMode={appointment.emotion_mode}
        initialPrimary={appointment.emotion_primary_selection}
        initialSecondary={appointment.emotion_secondary_selection}
        initialNotes={appointment.emotion_notes}
        onSaveField={onSaveField}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default KinesiologyToolsTab;