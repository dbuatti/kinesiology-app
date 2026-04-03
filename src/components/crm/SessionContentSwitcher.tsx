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
  Check,
  StickyNote,
  UserCircle,
  LayoutGrid
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

        scrollContainer.scrollTo({
          top: scrollPos,
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
        "h-11 px-5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shrink-0",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-md border border-slate-100" 
          : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
      )}
    >
      <Icon size={18} className="mr-2.5" />
      {label}
    </Button>
  );

  const TabFooter = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        {tabStatus[activeTab as keyof typeof tabStatus] ? (
          <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <CheckCircle2 size={14} /> Section Complete
          </span>
        ) : (
          <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Activity size={14} /> Section in Progress
          </span>
        )}
      </div>
      {nextLabel && (
        <Button 
          onClick={handleNextTab}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
        >
          Next: {nextLabel} <ArrowRight size={20} className="ml-2" />
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
        <div className="overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          <TabsList className="flex w-max h-24 bg-muted/50 p-2 rounded-[2rem] gap-1">
            {TABS.map((tab, i) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex flex-col items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl rounded-2xl h-20 px-6 text-[10px] font-black uppercase tracking-wider relative transition-all duration-300"
              >
                <tab.icon size={20} className={cn((tabStatus as any)[tab.id] ? "text-indigo-500" : "text-muted-foreground")} />
                <span className="text-[10px]">{tab.label.split(' — ')[0]}</span>
                <span className="hidden lg:inline text-[8px] opacity-50 font-bold tracking-widest">{tab.sub}</span>
                {(tabStatus as any)[tab.id] && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-sm" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6 md:mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              className="bg-card p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-border shadow-sm min-h-[400px] md:min-h-[500px]" 
            />
            <TabFooter />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context'].includes(activeView);

  return (
    <div className="space-y-8">
      {/* Master Session Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-100/80 backdrop-blur-md p-2.5 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-lg gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
          <NavItem view="home" label="PEACE Flow" Icon={LayoutGrid} />
          <NavItem view="previous" label="History" Icon={History} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-11 px-5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shrink-0",
                  isToolActive ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                )}
              >
                <Wrench size={18} className="mr-2.5" />
                Tools
                <ChevronDown size={14} className="ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-2.5 rounded-[2rem] border-none shadow-3xl bg-card">
              <div className="px-4 py-2.5 mb-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Specialized Tools</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setActiveView('context')}
                className={cn("rounded-2xl py-3.5 px-5 cursor-pointer transition-all", activeView === 'context' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <UserCircle size={18} className="mr-3.5 text-indigo-500" />
                Client Context
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveView('kinesiology')}
                className={cn("rounded-2xl py-3.5 px-5 cursor-pointer transition-all", activeView === 'kinesiology' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <Heart size={18} className="mr-3.5 text-rose-500" />
                Kinesiology Tools
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveView('muscles')}
                className={cn("rounded-2xl py-3.5 px-5 cursor-pointer transition-all", activeView === 'muscles' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <Dumbbell size={18} className="mr-3.5 text-indigo-500" />
                Muscle Log
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveView('gait')}
                className={cn("rounded-2xl py-3.5 px-5 cursor-pointer transition-all", activeView === 'gait' && "bg-indigo-50 text-indigo-600 font-black")}
              >
                <Footprints size={18} className="mr-3.5 text-emerald-500" />
                Gait Integration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Session Progress Indicator - Hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-4 px-6 border-x border-slate-200">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-[11px] font-black text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="w-24 lg:w-32 h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-lg" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 px-3 md:px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white"
            onClick={() => setNoteDialogOpen(true)}
          >
            <StickyNote size={16} className="md:mr-2" />
            <span className="hidden md:inline">Quick Note</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-10 px-3 md:px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all",
              showSidebar ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            onClick={onToggleSidebar}
          >
            {showSidebar ? <PanelRightClose size={16} className="md:mr-2" /> : <PanelRightOpen size={16} className="md:mr-2" />}
            <span className="hidden md:inline">Sidebar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200">
                <MoreHorizontal size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[1.5rem] p-2.5 shadow-3xl border-none bg-card">
              <DropdownMenuItem 
                className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-3.5"
                onClick={onClonePrevious}
                disabled={isCloning}
              >
                {isCloning ? <Loader2 size={18} className="animate-spin" /> : <History size={18} className="text-indigo-500" />}
                Clone Previous Data
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-3.5"
                onClick={onPrint}
              >
                <Printer size={18} className="text-slate-500" />
                Print Session Report
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-3.5"
                onClick={onCopySummary}
              >
                {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-indigo-500" />}
                Copy Full Summary
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive rounded-xl py-3 px-5 cursor-pointer flex items-center gap-3.5"
                onClick={onDelete}
              >
                <Trash2 size={18} /> Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'context' && <ClientContextTab appointment={appointment} />}
        {activeView === 'kinesiology' && (
          <div className="space-y-10">
            <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
            <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
          </div>
        )}
        {activeView === 'muscles' && (
          <div className="bg-card rounded-[2rem] md:rounded-[3rem] border border-border shadow-xl p-6 md:p-10">
            <MuscleTestingTab appointmentId={appointment.id} />
          </div>
        )}
        {activeView === 'gait' && (
          <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />
        )}
        {activeView === 'previous' && (
          <div className="space-y-16">
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                        <History size={24} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Neurological Evolution</h2>
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
              <DialogTitle className="text-2xl md:text-3xl font-black flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xl">
                  <StickyNote size={24} />
                </div>
                Quick Session Note
              </DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <EditableField 
                field="notes" 
                label="General Session Notes" 
                value={appointment.notes} 
                multiline 
                placeholder="Jot down a quick observation..." 
                onSave={saveField} 
                className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-inner"
              />
              <p className="text-[11px] text-slate-400 mt-6 text-center italic font-medium">
                This note is saved to the general session notes field.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setNoteDialogOpen(false)} className="w-full sm:w-auto rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionContentSwitcher;