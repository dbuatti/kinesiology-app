"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import { Nuclei } from '@/utils/brainstem-logic';

// Tab Content Components
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import EmbedTab from './session-tabs/EmbedTab';
import PathwayAssessment from './PathwayAssessment';
import PathwayLogicWizard from './PathwayLogicWizard';

const TABS = [
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary' },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease' },
  { id: 'pathway', label: 'A', fullLabel: 'Align' },
  { id: 'calibration', label: 'C', fullLabel: 'Correct' },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed' }
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
  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="h-11 border-b border-border bg-muted/30 px-4">
        <TabsList className="flex w-full h-full bg-transparent p-0 gap-8 justify-start">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className={cn(
                  "h-full px-0 bg-transparent border-none shadow-none transition-all gap-2 group",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isActive ? "bg-primary scale-125" : "bg-slate-300 group-hover:bg-slate-400"
                )} />
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-widest",
                  isActive && "font-black"
                )}>
                  {tab.fullLabel}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
        <TabsContent value="baseline" className="mt-0 focus-visible:ring-0">
          <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
        </TabsContent>

        <TabsContent value="sympathetic" className="mt-0 focus-visible:ring-0">
          <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
        </TabsContent>

        <TabsContent value="pathway" className="mt-0 focus-visible:ring-0">
          <PathwayAssessment 
            appointmentId={appointment.id}
            initialValue={appointment.priority_pattern || undefined} 
            previousValue={history.length > 1 ? history[1]?.priority_pattern : undefined}
            history={history}
            onSave={(s) => saveField('priority_pattern', s)} 
            onUpdateItem={(cat, item, status, side) => updatePriorityPattern(cat, side ? `${item} (${side})` : item, status)}
            onJumpToCalibrate={() => onTabChange('calibration')}
            nucleiFilter={nucleiFilter}
          />
        </TabsContent>

        <TabsContent value="calibration" className="mt-0 focus-visible:ring-0">
          <div ref={wizardRef}>
            <PathwayLogicWizard
              onSave={(summary) => saveField('modes_balances', summary)}
              onClearItem={onClearItem}
              priorityPattern={appointment.priority_pattern}
              initialFinding={preselectedFinding}
              appointmentId={appointment.id}
            />
          </div>
        </TabsContent>

        <TabsContent value="reassessment" className="mt-0 focus-visible:ring-0">
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