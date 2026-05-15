"use client";

import React, { useState } from 'react';
import { Brain, Activity, History, Target, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  currentPeakMeridian,
  onSaveField
}: AppointmentSidebarProps) => {
  const [activeSection, setActiveSection] = useState<'tone' | 'context' | 'history'>('tone');

  const SidebarSection = ({ id, title, icon: Icon, children }: any) => {
    const isActive = activeSection === id;
    return (
      <div className="flex flex-col border-b border-border last:border-b-0">
        <button
          onClick={() => setActiveSection(isActive ? null : id)}
          className={cn(
            "h-8 px-4 flex items-center justify-between transition-colors",
            isActive ? "bg-primary text-white" : "bg-muted/30 text-slate-500 hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
          </div>
          {isActive ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {isActive && (
          <div className="p-3 animate-in fade-in slide-in-from-top-1 duration-200 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-[240px] border-l border-border bg-white h-full flex flex-col shrink-0 print:hidden">
      <SidebarSection id="tone" title="Neural Tone" icon={Brain}>
        <BrainstemToneMap
          priorityPattern={appointment.priority_pattern || null}
          activeFilter={nucleiFilter}
          onSelectNuclei={onSelectNuclei}
        />
      </SidebarSection>

      <SidebarSection id="context" title="Session Context" icon={Target}>
        <AppointmentContextCards
          appointment={appointment}
          currentPeakMeridian={currentPeakMeridian}
          onSaveField={onSaveField}
        />
      </SidebarSection>

      <SidebarSection id="history" title="Clinical History" icon={History}>
        <div className="space-y-4 p-2">
          <p className="text-[10px] text-slate-400 italic text-center py-8">History module compressed.</p>
        </div>
      </SidebarSection>
      
      <div className="mt-auto p-4 border-t border-border">
        <Badge variant="outline" className="w-full justify-center rounded-none border-slate-100 text-slate-300 font-black text-[8px] uppercase tracking-[0.3em]">
          Clinical Rail v2.4
        </Badge>
      </div>
    </aside>
  );
};

export default AppointmentSidebar;