"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  GitBranch, 
  Target, 
  ClipboardCheck, 
  Check
} from 'lucide-react';
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
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary', icon: Activity },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease', icon: Zap },
  { id: 'pathway', label: 'A', fullLabel: 'Align', icon: GitBranch },
  { id: 'calibration', label: 'C', fullLabel: 'Correct', icon: Target },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed', icon: ClipboardCheck }
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
      <div className="overflow-x-auto border-b border-border">
        <TabsList className="flex w-full h-auto bg-transparent p-0 gap-0 rounded-none">
          {TABS.map((tab, index) => {
            const isCompleted = (tabStatus as any)[tab.id];
            const isActive = activeTab === tab.id;

            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className={cn(
                  "flex-1 flex flex-col items-center gap-4 py-6 border-r border-border last:border-r-0 transition-colors rounded-none",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted ? "bg-success/10 text-success" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-10 h-10 border border-border flex items-center justify-center",
                  isActive ? "border-primary-foreground" : isCompleted ? "border-success" : ""
                )}>
                  {isCompleted ? <Check size={20} /> : <tab.icon size={20} />}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tighter">{tab.label}</span>
                    <span className="hidden md:inline text-[9px] font-bold uppercase tracking-widest opacity-80">
                      {tab.fullLabel}
                    </span>
                  </div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <div className="mt-12">
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
            <PathwayLogicWizard
              onSave={(summary) => saveField('modes_balances', summary)}
              onClearItem={onClearItem}
              priorityPattern={appointment.priority_pattern}
              initialFinding={preselectedFinding}
              appointmentId={appointment.id}
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