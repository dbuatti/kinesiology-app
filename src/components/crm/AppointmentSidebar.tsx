"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="xl:col-span-4 space-y-8 sticky top-24 print:hidden animate-in fade-in slide-in-from-right-4 duration-500">
      {/* BRAINSTEM TONE MAP */}
      <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Neural Landscape</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <PanelRightClose size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <BrainstemToneMap
            priorityPattern={appointment.priority_pattern || null}
            activeFilter={nucleiFilter}
            onSelectNuclei={onSelectNuclei}
          />
        </CardContent>
      </Card>

      {/* REFLECTIONS */}
      {reflections.length > 0 && (
        <Card className="border-none shadow-2xl shadow-amber-500/5 rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Reflections</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                <Link to="/practice/journal" state={{ appointmentId: appointment.id }}>
                  + Add
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            {reflections.slice(0, 3).map((ref) => (
              <div key={ref.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 group hover:border-amber-200 transition-all">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-none bg-amber-100 text-amber-700 px-2 py-0.5">
                    {ref.category}
                  </Badge>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    {format(new Date(ref.created_at), "MMM d")}
                  </span>
                </div>
                <p className="text-xs italic text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  "{ref.content}"
                </p>
              </div>
            ))}
            {reflections.length > 3 && (
              <Button variant="ghost" asChild className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600">
                <Link to="/practice/journal" state={{ appointmentId: appointment.id }}>
                  View All {reflections.length} Reflections
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
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