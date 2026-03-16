"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ClipboardCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import EditableField from '@/components/shared/EditableField';
import LuscherColourAssessment from './LuscherColourAssessment';
import MuscleTestingTab from './MuscleTestingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmotionAssessment from './EmotionAssessment';
import PreviousSessionSummary from './PreviousSessionSummary';
import GaitReflexAssessment from './GaitReflexAssessment';
import PathwayAssessment from './PathwayAssessment';
import PathwayLogicWizard from './PathwayLogicWizard';
import NeurologicalHistoryTracker from './NeurologicalHistoryTracker';

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  history?: any[];
}

const TABS = [
  { id: 'baseline', label: 'Baseline', icon: Activity },
  { id: 'sympathetic', label: 'SNS Reset', icon: Zap },
  { id: 'pathway', label: 'Pathway', icon: GitBranch },
  { id: 'calibration', label: 'Calibrate', icon: Target },
  { id: 'reassessment', label: 'Review', icon: ClipboardCheck }
];

const SessionContentSwitcher = ({ appointment, onUpdate, saveField, history = [] }: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeTab, setActiveTab] = useState('baseline');
  const [preselectedFinding, setPreselectedFinding] = useState<string | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);
  
  const tabStatus = useMemo(() => ({
    baseline: !!(appointment.bolt_score || appointment.coherence_score || appointment.sagittal_plane_notes || appointment.fakuda_notes || appointment.lymphatic_priority_zone),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.additional_notes),
    pathway: !!appointment.priority_pattern,
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  }), [appointment]);

  const previousSession = useMemo(() => {
    if (!history || history.length < 2) return null;
    const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const currentIndex = sorted.findIndex(s => s.id === appointment.id);
    return sorted[currentIndex + 1] || null;
  }, [history, appointment.id]);

  const scrollToWizard = () => {
    // Use a longer timeout to ensure tab transition and animations are complete
    setTimeout(() => {
      const element = wizardRef.current;
      const scrollContainer = document.getElementById('main-scroll-container');
      
      if (element && scrollContainer) {
        const offset = 120; // Account for fixed headers and padding
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        // Calculate position relative to the scroll container
        const relativeTop = elementRect.top - containerRect.top;
        const targetScrollTop = scrollContainer.scrollTop + relativeTop - offset;

        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 300);
  };

  const handleNextTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS.length - 1) {
      const nextTabId = TABS[currentIndex + 1].id;
      setActiveTab(nextTabId);
      if (nextTabId === 'calibration') {
        scrollToWizard();
      } else {
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleClearItem = async (itemName: string) => {
    if (!appointment.priority_pattern) return;
    try {
      const pattern = JSON.parse(appointment.priority_pattern);
      let updated = false;
      Object.keys(pattern).forEach(category => {
        if (pattern[category][itemName]) {
          pattern[category][itemName] = 'Clear';
          updated = true;
        }
      });
      if (updated) {
        await saveField('priority_pattern', JSON.stringify(pattern));
        onUpdate();
      }
    } catch (e) {
      console.error("Failed to update priority pattern JSON", e);
    }
  };

  const handleJumpToCalibrate = (itemName: string) => {
    setPreselectedFinding(itemName);
    setActiveTab('calibration');
    scrollToWizard();
  };

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

  const TabFooter = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        {tabStatus[activeTab as keyof typeof tabStatus] ? (
          <span className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} /> Section Complete
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Activity size={14} /> Section in Progress
          </span>
        )}
      </div>
      {nextLabel && (
        <Button 
          onClick={handleNextTab}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
        >
          Next: {nextLabel} <ArrowRight size={18} className="ml-2" />
        </Button>
      )}
    </div>
  );

  const renderHomeView = () => (
    <div className="space-y-10">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (v === 'calibration') scrollToWizard();
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-16 bg-muted/50 p-1.5 rounded-[1.5rem]">
          {TABS.map((tab, i) => (
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
            <TabFooter nextLabel="SNS Reset" />
          </TabsContent>

          <TabsContent value="sympathetic" className="focus-visible:ring-0">
            <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="Pathway Assessment" />
          </TabsContent>

          <TabsContent value="pathway" className="focus-visible:ring-0">
            <PathwayAssessment 
              initialValue={appointment.priority_pattern || undefined} 
              previousValue={previousSession?.priority_pattern || undefined}
              onSave={(s) => saveField('priority_pattern', s)} 
              onJumpToCalibrate={handleJumpToCalibrate}
            />
            <TabFooter nextLabel="Calibration Wizard" />
          </TabsContent>

          <TabsContent value="calibration" className="focus-visible:ring-0">
            <div ref={wizardRef}>
              <PathwayLogicWizard
                onSave={(summary) => saveField('modes_balances', summary)}
                onClearItem={handleClearItem}
                priorityPattern={appointment.priority_pattern}
                initialFinding={preselectedFinding}
              />
            </div>
            <TabFooter nextLabel="Session Review" />
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
            <TabFooter />
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
        <NavItem view="previous" label="History & Evolution" Icon={History} />
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
          <div className="space-y-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <History size={20} />
                    </div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Neurological Evolution</h2>
                </div>
                <NeurologicalHistoryTracker appointments={history.length > 0 ? history : [appointment]} />
            </div>
            <PreviousSessionSummary 
              clientId={appointment.clients.id} 
              currentAppointmentId={appointment.id} 
              manualData={previousSession}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionContentSwitcher;