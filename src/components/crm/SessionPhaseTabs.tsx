"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  GitBranch, 
  Target, 
  ClipboardCheck, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AppointmentWithClient } from '@/types/crm';
import { Nuclei } from '@/utils/brainstem-logic';

// Tab Content Components
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import EmbedTab from './session-tabs/EmbedTab';
import CorrectTab from './session-tabs/CorrectTab';
import PathwayAssessment from './PathwayAssessment';

const TABS = [
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary', icon: Activity, activeBg: 'bg-indigo-600' },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease', icon: Zap, activeBg: 'bg-rose-600' },
  { id: 'pathway', label: 'A', fullLabel: 'Align', icon: GitBranch, activeBg: 'bg-amber-600' },
  { id: 'calibration', label: 'C', fullLabel: 'Correct', icon: Target, activeBg: 'bg-emerald-600' },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed', icon: ClipboardCheck, activeBg: 'bg-blue-600' }
];

interface SessionPhaseTabsProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  history: any[];
  nucleiFilter: Nuclei | null;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  preselectedFinding: string | null;
  onClearItem: (itemName: string) => void;
  wizardRef: React.RefObject<HTMLDivElement>;
}

const SessionPhaseTabs = ({
  appointment,
  onUpdate,
  saveField,
  updatePriorityPattern,
  history,
  nucleiFilter,
  activeTab,
  onTabChange,
  preselectedFinding,
  onClearItem,
  wizardRef
}: SessionPhaseTabsProps) => {
  
  const tabStatus = {
    baseline: !!(appointment.goal && appointment.issue && (appointment.bolt_score || appointment.coherence_score)),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes),
    pathway: !!appointment.priority_pattern && appointment.priority_pattern !== "{}",
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
        <TabsList className="grid grid-cols-5 w-full h-auto bg-transparent p-0 gap-2 md:gap-4 border-b border-slate-100 dark:border-slate-800 rounded-none">
          {TABS.map((tab, index) => {
            const isCompleted = (tabStatus as any)[tab.id];
            const isActive = activeTab === tab.id;
            const currentIndex = TABS.findIndex(t => t.id === activeTab);
            const isPast = index < currentIndex;

            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className={cn(
                  "flex flex-col items-center gap-3 pb-6 px-4 rounded-2xl border-b-4 transition-all duration-500 relative group min-w-0",
                  isActive 
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/30 shadow-sm" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                )}
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                  isActive ? cn("text-white shadow-xl", tab.activeBg) : 
                  isCompleted ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100",
                  isPast && !isCompleted && "opacity-60"
                )}>
                  {isCompleted ? <CheckCircle2 size={24} /> : <tab.icon size={24} />}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xl font-black tracking-tighter",
                      isPast && !isActive && "opacity-70"
                    )}>{tab.label}</span>
                    <span className={cn(
                      "hidden md:inline text-[9px] font-black uppercase tracking-[0.2em] opacity-60",
                      isPast && !isActive && "opacity-40"
                    )}>
                      {tab.fullLabel}
                    </span>
                  </div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <TabsContent value="baseline" className="focus-visible:ring-0">
          <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
        </TabsContent>

        <TabsContent value="sympathetic" className="focus-visible:ring-0">
          <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
        </TabsContent>

        <TabsContent value="pathway" className="focus-visible:ring-0">
          <PathwayAssessment 
            appointmentId={appointment.id}
            initialValue={appointment.priority_pattern || undefined} 
            previousValue={history.length > 1 ? history[1]?.priority_pattern : undefined}
            history={history}
            onSave={(s) => saveField('priority_pattern', s)} 
            onUpdateItem={(cat, item, status, side) => updatePriorityPattern(cat, side ? `${item} (${side})` : item, status)}
            onJumpToCalibrate={(itemName) => {
              onTabChange('calibration');
            }}
            nucleiFilter={nucleiFilter}
          />
        </TabsContent>

        <TabsContent value="calibration" className="focus-visible:ring-0">
          <div ref={wizardRef}>
            <CorrectTab 
              appointment={appointment}
              onUpdate={onUpdate}
              saveField={saveField}
              updatePriorityPattern={updatePriorityPattern}
            />
          </div>
        </TabsContent>

        <TabsContent value="reassessment" className="focus-visible:ring-0">
          <EmbedTab 
            appointment={appointment} 
            onUpdate={onUpdate} 
            saveField={saveField} 
            updatePriorityPattern={updatePriorityPattern} 
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default SessionPhaseTabs;