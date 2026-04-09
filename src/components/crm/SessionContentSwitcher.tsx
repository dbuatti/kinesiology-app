"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Dumbbell, 
  Footprints, 
  History, 
  GitBranch,
  Activity,
  Zap,
  Target,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  MoreHorizontal,
  Wrench,
  Printer,
  Copy,
  PanelRightOpen,
  PanelRightClose,
  Trash2,
  Play,
  Loader2,
  Check,
  StickyNote,
  UserCircle,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import ClientContextTab from './session-tabs/ClientContextTab';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous' | 'context';

interface SessionContentSwitcherProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  history?: any[];
  nucleiFilter?: Nuclei | null;
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
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary', icon: Activity },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease', icon: Zap },
  { id: 'pathway', label: 'A', fullLabel: 'Align', icon: GitBranch },
  { id: 'calibration', label: 'C', fullLabel: 'Correct', icon: Target },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed', icon: ClipboardCheck }
];

const SessionContentSwitcher = ({ 
  appointment, 
  onUpdate, 
  saveField, 
  updatePriorityPattern,
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
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  
  const tabStatus = useMemo(() => ({
    baseline: !!(appointment.bolt_score || appointment.coherence_score || appointment.sagittal_plane_notes || appointment.fakuda_notes || appointment.lymphatic_priority_zone),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes || appointment.additional_notes),
    pathway: !!appointment.priority_pattern,
    calibration: !!appointment.modes_balances,
    reassessment: !!appointment.session_north_star
  }), [appointment]);

  const progressPercent = useMemo(() => {
    const completed = Object.values(tabStatus).filter(Boolean).length;
    return Math.round((completed / TABS.length) * 100);
  }, [tabStatus]);

  const scrollToWizard = () => {
    setTimeout(() => {
      const element = wizardRef.current;
      const scrollContainer = document.getElementById('main-scroll-container');
      if (element && scrollContainer) {
        const offset = 100;
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const scrollPos = scrollContainer.scrollTop + relativeTop - offset;
        scrollContainer.scrollTo({ top: scrollPos, behavior: 'smooth' });
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
      if (nextTabId === 'calibration') scrollToWizard();
      else {
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleClearItem = async (itemName: string) => {
    let category = 'muscles';
    if (appointment.priority_pattern) {
      try {
        const pattern = JSON.parse(appointment.priority_pattern);
        Object.keys(pattern).forEach(cat => {
          if (pattern[cat][itemName] || pattern[cat][`${itemName} (L)`] || pattern[cat][`${itemName} (R)`]) {
            category = cat;
          }
        });
      } catch (e) {}
    }
    await updatePriorityPattern(category, itemName, 'Clear');
    onUpdate();
  };

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => setActiveView(view)}
      className={cn(
        "h-9 md:h-11 px-3 md:px-5 rounded-xl md:rounded-2xl transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest shrink-0",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-md border border-slate-100" 
          : "text-slate-500 hover:bg-white/50"
      )}
    >
      <Icon size={16} className="mr-2 md:mr-2.5" />
      {label}
    </Button>
  );

  const TabFooter = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        {tabStatus[activeTab as keyof typeof tabStatus] ? (
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            <CheckCircle2 size={12} /> Section Complete
          </span>
        ) : (
          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <Activity size={12} /> In Progress
          </span>
        )}
      </div>
      {nextLabel && (
        <Button 
          onClick={handleNextTab}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-2xl h-12 md:h-14 px-8 md:px-10 font-black text-xs uppercase tracking-widest shadow-lg"
        >
          Next: {nextLabel} <ArrowRight size={18} className="ml-2" />
        </Button>
      )}
    </div>
  );

  const renderHomeView = () => (
    <div className="space-y-6 md:space-y-10">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (v === 'calibration') scrollToWizard();
      }} className="w-full">
        <div className="overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
          <TabsList className="flex w-full h-16 md:h-24 bg-muted/50 p-1.5 md:p-2 rounded-2xl md:rounded-[2.5rem] gap-1">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex-1 flex flex-col items-center justify-center gap-1 data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg rounded-xl md:rounded-2xl h-13 md:h-20 px-2 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-wider relative transition-all duration-300"
              >
                <div className={cn(
                  "w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300",
                  (tabStatus as any)[tab.id] ? "bg-emerald-500 text-white" : "bg-white/50 text-muted-foreground"
                )}>
                  <tab.icon size={14} className="md:w-4 md:h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm md:text-lg font-black">{tab.label}</span>
                  <span className="hidden lg:inline text-[8px] opacity-50 font-bold tracking-widest">— {tab.fullLabel}</span>
                </div>
                {(tabStatus as any)[tab.id] && (
                  <span className="absolute top-2 right-2 md:top-3 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4 md:mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
              onUpdateItem={(cat, item, status, side) => updatePriorityPattern(cat, side ? `${item} (${side})` : item, status)}
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
              className="bg-card p-5 md:p-10 rounded-2xl md:rounded-[3rem] border border-border shadow-sm min-h-[300px] md:min-h-[500px]" 
            />
            <TabFooter />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context'].includes(activeView);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-100/80 backdrop-blur-md p-2 md:p-3 rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-lg gap-2 md:gap-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto px-1 py-1">
          <NavItem view="home" label="PEACE" Icon={LayoutGrid} />
          <NavItem view="previous" label="History" Icon={History} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "h-9 md:h-11 px-3 md:px-5 rounded-xl md:rounded-2xl transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest shrink-0 flex items-center gap-2",
                  isToolActive ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50"
                )}
              >
                <Wrench size={16} />
                Tools
                <ChevronDown size={12} className="opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl border-none shadow-3xl bg-card">
              <DropdownMenuItem onClick={() => setActiveView('context')} className="rounded-xl py-3 px-4 cursor-pointer">
                <UserCircle size={16} className="mr-3 text-indigo-500" /> Client Context
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('kinesiology')} className="rounded-xl py-3 px-4 cursor-pointer">
                <Heart size={16} className="mr-3 text-rose-500" /> Kinesiology Tools
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('muscles')} className="rounded-xl py-3 px-4 cursor-pointer">
                <Dumbbell size={16} className="mr-3 text-indigo-500" /> Muscle Log
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('gait')} className="rounded-xl py-3 px-4 cursor-pointer">
                <Footprints size={16} className="mr-3 text-emerald-500" /> Gait Integration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 px-3 font-bold text-[9px] uppercase tracking-widest rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white"
            onClick={() => setNoteDialogOpen(true)}
          >
            <StickyNote size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Note</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 px-3 font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all",
              showSidebar ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white border-slate-200 text-slate-600"
            )}
            onClick={onToggleSidebar}
          >
            {showSidebar ? <PanelRightClose size={14} className="mr-1.5" /> : <PanelRightOpen size={14} className="mr-1.5" />}
            <span className="hidden sm:inline">Sidebar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-200">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-3xl border-none bg-card">
              <DropdownMenuItem className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3" onClick={onClonePrevious} disabled={isCloning}>
                {isCloning ? <Loader2 size={16} className="animate-spin" /> : <History size={16} className="text-indigo-500" />} Clone Previous
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3" onClick={onPrint}>
                <Printer size={16} className="text-slate-500" /> Print Report
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3" onClick={onCopySummary}>
                {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-indigo-500" />} Copy Summary
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3" onClick={onDelete}>
                <Trash2 size={16} /> Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'context' && <ClientContextTab appointment={appointment} />}
        {activeView === 'kinesiology' && (
          <div className="space-y-6 md:space-y-10">
            <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
            <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
          </div>
        )}
        {activeView === 'muscles' && (
          <div className="bg-card rounded-2xl md:rounded-[3rem] border border-border shadow-xl p-5 md:p-10">
            <MuscleTestingTab appointmentId={appointment.id} />
          </div>
        )}
        {activeView === 'gait' && (
          <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />
        )}
        {activeView === 'previous' && (
          <div className="space-y-10 md:space-y-16">
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <History size={20} />
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-foreground tracking-tight">Neurological Evolution</h2>
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

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[550px] rounded-[2rem] p-0 overflow-hidden">
          <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-3xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xl">
                  <StickyNote size={20} />
                </div>
                Quick Session Note
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 md:py-6">
              <EditableField 
                field="notes" 
                label="General Session Notes" 
                value={appointment.notes} 
                multiline 
                placeholder="Jot down a quick observation..." 
                onSave={saveField} 
                className="bg-slate-50 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-inner"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setNoteDialogOpen(false)} className="w-full sm:w-auto rounded-xl h-11 px-8 font-black text-xs uppercase tracking-widest">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionContentSwitcher;