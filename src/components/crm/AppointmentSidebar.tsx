"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Brain, Activity, PanelRightClose } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import BrainstemToneMap from "./BrainstemToneMap";
import AppointmentContextCards from "./AppointmentContextCards";
import { Nuclei } from "@/utils/brainstem-logic";
import { AppointmentWithClient } from "@/types/crm";

interface AppointmentSidebarProps {
  appointment: AppointmentWithClient;
  nucleiFilter: Nuclei | null;
  onSelectNuclei: (nuclei: Nuclei | null) => void;
  reflections: any[];
  onToggleSidebar: () => void;
  currentPeakMeridian: any;
  onSaveField: (field: string, value: any) => Promise<void>;
}

const AppointmentSidebar = ({
  appointment,
  nucleiFilter,
  onSelectNuclei,
  reflections,
  onToggleSidebar,
  currentPeakMeridian,
  onSaveField
}: AppointmentSidebarProps) => {
  return (
    <div className="xl:col-span-4 space-y-8 sticky top-24 print:hidden">
      {/* BRAINSTEM TONE MAP */}
      <div className="border border-border bg-background">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <Brain size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Neural Landscape</h3>
          </div>
          <button
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <PanelRightClose size={18} />
          </button>
        </div>
        <div className="p-8">
          <BrainstemToneMap
            priorityPattern={appointment.priority_pattern || null}
            activeFilter={nucleiFilter}
            onSelectNuclei={onSelectNuclei}
          />
        </div>
      </div>

      {/* REFLECTIONS */}
      {reflections.length > 0 && (
        <div className="border border-border bg-background">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3 text-primary">
              <Activity size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Reflections</h3>
            </div>
            <Link to="/practice/journal" state={{ appointmentId: appointment.id }} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
              + Add
            </Link>
          </div>
          <div className="p-0">
            {reflections.slice(0, 3).map((ref) => (
              <div key={ref.id} className="p-6 border-b border-border last:border-b-0 hover:bg-muted transition-colors space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-bold uppercase tracking-widest bg-muted px-2 py-1">
                    {ref.category}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">
                    {format(new Date(ref.created_at), "MMM D")}
                  </span>
                </div>
                <p className="text-xs italic text-muted-foreground line-clamp-3 leading-relaxed">
                  "{ref.content}"
                </p>
              </div>
            ))}
            {reflections.length > 3 && (
              <Link to="/practice/journal" state={{ appointmentId: appointment.id }} className="block p-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                View All {reflections.length} Reflections
              </Link>
            )}
          </div>
        </div>
      )}

      {/* CONTEXT CARDS */}
      <AppointmentContextCards
        appointment={appointment}
        currentPeakMeridian={currentPeakMeridian}
        onSaveField={onSaveField}
      />
    </div>
  );
};

export default AppointmentSidebar;