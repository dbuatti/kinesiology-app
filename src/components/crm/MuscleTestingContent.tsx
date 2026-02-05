"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";
import MuscleTestingTab from "@/components/crm/MuscleTestingTab";
import { AppointmentWithClient } from "@/pages/AppointmentDetailPage"; // Assuming this type is available

interface MuscleTestingContentProps {
  appointment: AppointmentWithClient;
}

const MuscleTestingContent = ({ appointment }: MuscleTestingContentProps) => {
  return (
    <div className="space-y-8">
      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-2xl">
          <CardTitle className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Dumbbell size={24} className="text-indigo-600" /> Muscle Testing Log
          </CardTitle>
          <CardDescription>
            Logging muscle test results for {appointment.clients.name}
          </CardDescription>
        </CardHeader>
      </Card>

      <MuscleTestingTab appointmentId={appointment.id} />
    </div>
  );
};

export default MuscleTestingContent;