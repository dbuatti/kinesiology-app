"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Client, Appointment } from "@/types/crm";

interface ClientWithAppointments extends Client {
  appointments: Appointment[];
  lastSeenDate: Date | null;
  preferredTimeAnalyzed: { text: string; isLowData: boolean };
  followUpStatus: "Booked" | "Needs Follow-up" | "No Future Bookings";
}

interface IdealScheduleBuilderProps {
  clients: ClientWithAppointments[];
  /** Optional data passed from TimetableVisualizer or other sources */
  scheduledData?: Record<string, any>;
}

const IdealScheduleBuilder = ({
  clients,
  scheduledData,
}: IdealScheduleBuilderProps) => {
  // Safe accessor for scheduledData to avoid the TypeError
  const safeScheduled = scheduledData ?? {};

  const idealSchedule = useMemo(() => {
    // Placeholder logic – in a real implementation this would compute an optimal schedule
    // based on client preferences, availability, and business rules.
    // For now we just return an empty array to prevent runtime errors.
    return [];
  }, [clients, safeScheduled]);

  return (
    <Card className="border-none shadow-md rounded-[2rem] bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-600">
          Ideal Schedule Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-muted-foreground">
          This component would generate an optimal 2‑week schedule based on client
          preferences, appointment regularity, and capacity constraints.
        </p>

        {/* Example user controls – these are safe because they don't reference undefined data */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Focus Area:</Label>
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Appointments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="new">New Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Optimization Goal:</Label>
            <Switch />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Max Hours per Day:</Label>
            <Slider min={2} max={10} step={1} className="w-32" />
          </div>

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10">
            Generate Ideal Schedule
          </Button>
        </div>

        {/* Example output area */}
        {idealSchedule.length > 0 && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-800">
              Ideal schedule generated (placeholder). In production this would display a visual
              timetable or list of recommended appointments.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IdealScheduleBuilder;