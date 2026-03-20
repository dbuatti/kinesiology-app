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
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  MoreHorizontal,
  Wrench,
  Printer,
  Copy,
  PanelRightOpen,
  PanelRightClose,
  Trash2,
  Play,
  Loader2,
  Check
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
import { Nuclei } from '@/utils/brainstem-logic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  history?: any[];
  nucleiFilter?: Nuclei | null;
  // Action Props
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onClonePrevious: () => void;
  onPrint: () => void;
  onCopySummary: () => void;
  onDelete: () => void;
  onStartSession?: () => void;
  isCloning?: boolean;
  isCopied?: boolean;
}

const TABS = [
  { id: 'baseline', label: 'P — Preliminary', icon: Activity, sub: 'Baseline & Vitals' },
  { id: 'sympathetic', label: 'E — Ease', icon: Zap, sub: 'SNS Down-regulation' },
  { id: 'pathway', label: 'A — Align', icon: GitBranch, sub: 'Pathway Assessment' },
  { id: 'calibration', label: 'C — Correct', icon: Target, sub: 'Calibration Wizard' },
  { id: 'reassessment', label: 'E — Embed', icon: ClipboardCheck, sub: 'Review & Homework' }
];

const SessionContentSwitcher = ({ 
  appointment, 
  onUpdate, 
  saveField, 
  history = [], 
  nucleiFilter,
  showSidebar,
  onToggleSidebar,
  onClonePrevious,
  onPrint,
  onCopySummary,
  onDelete,
  onStartSession,
  isCloning,
  isCopied
}: SessionContentSwitcherProps) => {
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

  const scrollToWizard = () => {
    setTimeout(() => {
      const element = wizardRef.current;
      const scrollContainer = document.getElementById('main-scroll-container');
      
      if (element && scrollContainer) {
        const offset = 100;
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        const relativeTop = elementRect.top - containerRect.top;
        const targetScrollTop = scrollContainer.scrollTop + relativeTop - offset;

        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 150);
  };

  useEffect(() => {
    const handleJump = (e: any) => {
      const { itemName } = e.detail;
      setPreselectedFinding(itemName);
      setActiveView('home');
      setActiveTab('calibration');
      scrollToWizard();
      setTimeout(() => setPreselectedFinding(null), 1000);
    };

    window.addEventListener('jump-to-calibrate', handleJump);
    return () => window.removeEventListener('jump-to-calibrate', handleJump);
  }, []);

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

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => setActiveView(view)}
      className={cn(
        "h-10 px-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
          : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
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
        <TabsList className="grid w-full grid-cols-5 h-20 bg-muted/50 p-1.5 rounded-[1.5rem]">
          {TABS.map((tab, i) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex flex-col items-center justify-center gap-1 data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-17 text-[10px] font-black uppercase tracking-wider relative transition-all"
            >
              <tab.icon size={16} className={cn((tabStatus as any)[tab.id] ? "text-indigo-500" : "text-muted-foreground")} />
              <span className="hidden sm:inline text-[9px]">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span className="hidden lg:inline text-[7px] opacity-50 font-bold">{tab.sub}</span>
              {(tabStatus as any)[tab.id] && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <TabsContent value="baseline" className="focus-visible:ring-0">
            <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="E — Ease" />
          </TabsContent>

          <TabsContent value="sympathetic" className="focus-visible:ring-0">
            <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="A — Align" />
          </TabsContent>

          <TabsContent value="pathway" className="focus-visible:ring-0">
            <PathwayAssessment 
              initialValue={appointment.priority_pattern || undefined} 
              previousValue={history.length > 1 ? history[1]?.priority_pattern : undefined}
              history={history}
              onSave={(s) => saveField('priority_pattern', s)} 
              onJumpToCalibrate={(itemName) => {
                setPreselectedFinding(itemName);
                setActiveTab('calibration');
                scrollToWizard();
              }}
              nucleiFilter={nucleiFilter}
            />
            <TabFooter nextLabel="C — Correct" />
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
            <TabFooter nextLabel="E — Embed" />
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

  const isToolActive = ['kinesiology', 'muscles', 'gait'].includes(activeView);

  return (
    <div className="space-y-8">
      {/* Master Session Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-100/80 backdrop-blur-sm p-2 rounded-[2rem] border border-slate-200 shadow-sm gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          <NavItem view="home" label="PEACE Flow" Icon={Home} />
          <NavItem view="previous" label="History & Evolution" Icon={History} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-10 px-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest",
                  isToolActive ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                )}
              >
                <Wrench size={16} className="mr-2" />
                Clinical Tools
                <ChevronDown size={12} className="ml-1.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl border-none shadow-2xl bg-card">
              <div className="px-3 py-2 mb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Specialized Tools</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setActiveView('kinesiology')}
                className={cn("rounded-xl py-3 px-4 cursor-pointer", activeView === 'kinesiology' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <Heart size={16} className="mr-3 text-rose-500" />
                Kinesiology Tools
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveView('muscles')}
                className={cn("rounded-xl py-3 px-4 cursor-pointer", activeView === 'muscles' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <Dumbbell size={16} className="mr-3 text-indigo-500" />
                Muscle Log
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveView('gait')}
                className={cn("rounded-xl py-3 px-4 cursor-pointer", activeView === 'gait' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <Footprints size={16} className="mr-3 text-emerald-500" />
                Gait Integration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 px-3 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all",
              showSidebar ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            onClick={onToggleSidebar}
          >
            {showSidebar ? <PanelRightClose size={14} className="mr-1.5" /> : <PanelRightOpen size={14} className="mr-1.5" />}
            Sidebar
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-9 px-3 font-bold text-[10px] uppercase tracking-widest"
            onClick={onClonePrevious}
            disabled={isCloning}
          >
            {isCloning ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <History size={14} className="mr-1.5" />}
            Clone
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-9 px-3 font-bold text-[10px] uppercase tracking-widest"
            onClick={onPrint}
          >
            <Printer size={14} className="mr-1.5" />
            Print
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-9 px-3 font-bold text-[10px] uppercase tracking-widest"
            onClick={onCopySummary}
          >
            {isCopied ? <Check size={14} className="mr-1.5 text-emerald-500" /> : <Copy size={14} className="mr-1.5" />}
            Copy
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-none bg-card">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                onClick={onDelete}
              >
                <Trash2 size={16} /> Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
              manualData={history.length > 1 ? history[1] : null}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionContentSwitcher;