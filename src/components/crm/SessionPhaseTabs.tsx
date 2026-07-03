
import type { RefObject } from 'react';
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
  wizardRef: RefObject<HTMLDivElement>;
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
    sympathetic: !!(appointment.lymphatic_notes || appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes),
    pathway: !!appointment.priority_pattern && appointment.priority_pattern !== "{}",
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
        <TabsList className="grid grid-cols-5 w-full h-auto bg-transparent p-0 gap-2 md:gap-4 border-b border-border rounded-none">
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
                    ? "border-chart-primary text-chart-primary bg-chart-primary/5" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : 
                  isCompleted ? "bg-chart-emerald/10 text-chart-emerald" : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                  isPast && !isCompleted && "opacity-60"
                )}>
                  {isCompleted ? <CheckCircle2 size={24} /> : <tab.icon size={24} />}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xl font-semibold tracking-tight",
                      isPast && !isActive && "opacity-70"
                    )}>{tab.label}</span>
                    <span className={cn(
                      "hidden md:inline text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
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
          <BaselineTab appointment={appointment} history={history} onUpdate={onUpdate} saveField={saveField} />
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
            onUpdateItem={(cat, item, status, side) => updatePriorityPattern(cat, item, status, side)}
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