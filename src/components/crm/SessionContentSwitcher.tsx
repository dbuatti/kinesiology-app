"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Heart, 
  Dumbbell, 
  Footprints, 
  History, 
  GitBranch,
  Activity,
  Zap,
  Target,
  RefreshCw,
  ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import EditableField from './EditableField';
import LuscherColourAssessment from './LuscherColourAssessment';
import MuscleTestingTab from './MuscleTestingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmotionAssessment from './EmotionAssessment';
import PreviousSessionSummary from './PreviousSessionSummary';
import GaitReflexAssessment from './GaitReflexAssessment';
import PathwayAssessment from './PathwayAssessment';
import PathwayLogicWizard from './PathwayLogicWizard';

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
}

const SessionContentSwitcher = ({ appointment, onUpdate, saveField }: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  
  const tabStatus = useMemo(() => ({
    baseline: !!(appointment.bolt_score || appointment.coherence_score || appointment.sagittal_plane_notes || appointment.fakuda_notes || appointment.lymphatic_priority_zone),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.additional_notes),
    pathway: !!appointment.priority_pattern,
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  }), [appointment]);

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => setActiveView(view)}
      className={cn(
        "h-11 px-5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
        activeView === view 
          ? "bg-card text-indigo-600 shadow-sm border border-border" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon size={16} className="mr-2" />
      {label}
    </Button>
  );

  const renderHomeView = () => (
    <div className="space-y-10">
      <Tabs defaultValue="baseline" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-16 bg-muted/50 p-1.5 rounded-[1.5rem]">
          {[
            { id: 'baseline', label: 'Baseline', icon: Activity },
            { id: 'sympathetic', label: 'SNS Reset', icon: Zap },
            { id: 'pathway', label: 'Pathway', icon: GitBranch },
            { id: 'calibration', label: 'Calibrate', icon: Target },
            { id: 'reassessment', label: 'Review', icon: ClipboardCheck }
          ].map((tab, i) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-13 text-[10px] font-black uppercase tracking-wider relative transition-all"
            >
              <tab.icon size={14} className={cn((tabStatus as any)[tab.id] ? "text-indigo-500" : "text-muted-foreground")} />
              <span className="hidden sm:inline">{i + 1}. {tab.label}</span>
              <span className="sm:hidden">{i + 1}</span>
              {(tabStatus as any)[tab.id] && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <TabsContent value="baseline" className="focus-visible:ring-0">
            <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
          </TabsContent>

          <TabsContent value="sympathetic" className="focus-visible:ring-0">
            <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
          </TabsContent>

          <TabsContent value="pathway" className="focus-visible:ring-0">
            <PathwayAssessment 
              initialValue={appointment.priority_pattern || undefined} 
              onSave={(s) => saveField('priority_pattern', s)} 
            />
          </TabsContent>

          <TabsContent value="calibration" className="focus-visible:ring-0">
            <PathwayLogicWizard
              onSave={(summary) => saveField('modes_balances', summary)}
              priorityPattern={appointment.priority_pattern}
            />
          </TabsContent>

          <TabsContent value="reassessment" className="focus-visible:ring-0">
            <EditableField 
              field="session_north_star" 
              label="Re-Assessment & Home Reinforcement" 
              value={appointment.session_north_star} 
              multiline 
              placeholder="Document re-test results and prescribed homework..." 
              onSave={saveField} 
              className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm min-h-[400px]" 
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 bg-muted/30 p-2 rounded-2xl border border-border/50 no-scrollbar">
        <NavItem view="home" label="Session Flow" Icon={Home} />
        <NavItem view="kinesiology" label="Kinesiology Tools" Icon={Heart} />
        <NavItem view="muscles" label="Muscle Log" Icon={Dumbbell} />
        <NavItem view="gait" label="Gait Integration" Icon={Footprints} />
        <NavItem view="previous" label="Previous Session" Icon={History} />
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'kinesiology' && (
          <div className="space-y-8">
            <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
            <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
          </div>
        )}
        {activeView === 'muscles' && (
          <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8">
            <MuscleTestingTab appointmentId={appointment.id} />
          </div>
        )}
        {activeView === 'gait' && (
          <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />
        )}
        {activeView === 'previous' && (
          <PreviousSessionSummary clientId={appointment.clients.id} currentAppointmentId={appointment.id} />
        )}
      </div>
    </div>
  );
};

export default SessionContentSwitcher;