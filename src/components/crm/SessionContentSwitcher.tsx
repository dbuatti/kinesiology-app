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
  ChevronDown,
  X,
  BookOpen,
  Brain,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { AppointmentWithClient } from '@/types/crm';
import BaselineTab from './session-tabs/BaselineTab';
import SympatheticTab from './session-tabs/SympatheticTab';
import EmbedTab from './session-tabs/EmbedTab';
import RecheckTab from './session-tabs/RecheckTab';
import ClientContextTab from './session-tabs/ClientContextTab';
import JournalTab from './session-tabs/JournalTab';
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
  DialogDescription,
} from "@/components/ui/dialog";

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous' | 'context' | 'journal' | 'recheck';

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
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary', icon: Activity, color: 'text-indigo-600' },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease', icon: Zap, color: 'text-rose-600' },
  { id: 'pathway', label: 'A', fullLabel: 'Align', icon: GitBranch, color: 'text-amber-600' },
  { id: 'calibration', label: 'C', fullLabel: 'Correct', icon: Target, color: 'text-emerald-600' },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed', icon: ClipboardCheck, color: 'text-blue-600' }
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
  const navigate = useNavigate();
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
        "h-10 px-5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shrink-0",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-md border border-slate-100" 
          : "text-slate-500 hover:bg-white/50"
      )}
    >
      <Icon size={16} className="mr-2" />
      {label}
    </Button>
  );

  const TabFooter = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        {tabStatus[activeTab as keyof typeof tabStatus] ? (
          <span className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 size={14} /> Section Complete
          </span>
        ) : (
          <span className="flex items-center gap-2 opacity-40">
            <Activity size={14} /> In Progress
          </span>
        )}
      </div>
      {nextLabel && (
        <Button 
          onClick={handleNextTab}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
        >
          Next: {nextLabel} <ArrowRight size={18} className="ml-2" />
        </Button>
      )}
    </div>
  );

  const renderHomeView = () => (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (v === 'calibration') scrollToWizard();
      }} className="w-full">
        <div className="overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
          <TabsList className="flex w-full h-auto bg-transparent p-0 gap-8 border-b border-slate-100 rounded-none">
            {TABS.map((tab) => {
              const isCompleted = (tabStatus as any)[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className={cn(
                    "flex flex-col items-center gap-2 pb-5 px-2 rounded-none border-b-2 transition-all duration-300 relative group",
                    isActive 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    isCompleted ? "text-emerald-500" : cn(isActive ? "text-indigo-600" : "text-slate-300")
                  )}>
                    {isCompleted ? <CheckCircle2 size={22} /> : <tab.icon size={22} />}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tighter">{tab.label}</span>
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest opacity-60">
                      {tab.fullLabel}
                    </span>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
            <EmbedTab 
              appointment={appointment} 
              onUpdate={onUpdate} 
              saveField={saveField} 
              updatePriorityPattern={updatePriorityPattern} 
            />
            <TabFooter />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context', 'journal', 'recheck'].includes(activeView);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-100/60 backdrop-blur-md p-2 rounded-[2.5rem] border border-slate-200/50 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-2">
          <NavItem view="home" label="PEACE" Icon={LayoutGrid} />
          
          <Button
            variant="ghost"
            onClick={() => navigate(`/appointments/${appointment.id}/protocols`)}
            className="h-10 px-5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shrink-0 text-slate-500 hover:bg-white/50"
          >
            <Brain size={16} className="mr-2 text-purple-500" />
            Protocols
          </Button>

          <NavItem view="recheck" label="Recheck" Icon={RefreshCw} />
          <NavItem view="previous" label="History" Icon={History} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "h-10 px-5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shrink-0 flex items-center gap-2",
                  isToolActive ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50"
                )}
              >
                <Wrench size={16} />
                Tools
                <ChevronDown size={14} className="opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-2 rounded-[2rem] border-none shadow-3xl bg-card">
              <DropdownMenuItem onClick={() => setActiveView('context')} className="rounded-xl py-4 px-5 cursor-pointer">
                <UserCircle size={18} className="mr-4 text-indigo-500" /> Client Context
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('journal')} className="rounded-xl py-4 px-5 cursor-pointer">
                <BookOpen size={18} className="mr-4 text-amber-500" /> Session Journal
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setActiveView('kinesiology')} className="rounded-xl py-4 px-5 cursor-pointer">
                <Heart size={18} className="mr-4 text-rose-500" /> Kinesiology Tools
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('muscles')} className="rounded-xl py-4 px-5 cursor-pointer">
                <Dumbbell size={18} className="mr-4 text-indigo-500" /> Muscle Log
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('gait')} className="rounded-xl py-4 px-5 cursor-pointer">
                <Footprints size={18} className="mr-4 text-emerald-500" /> Gait Integration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end px-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white"
            onClick={() => setNoteDialogOpen(true)}
          >
            <StickyNote size={16} className="mr-2" />
            <span className="hidden sm:inline">Quick Note</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-10 px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all",
              showSidebar ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white border-slate-200 text-slate-600"
            )}
            onClick={onToggleSidebar}
          >
            {showSidebar ? <PanelRightClose size={16} className="mr-2" /> : <PanelRightOpen size={16} className="mr-2" />}
            <span className="hidden sm:inline">Sidebar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-slate-200">
                <MoreHorizontal size={22} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-3xl border-none bg-card">
              <DropdownMenuItem className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4" onClick={onClonePrevious} disabled={isCloning}>
                {isCloning ? <Loader2 size={18} className="animate-spin" /> : <History size={18} className="text-indigo-50" />} Clone Previous
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4" onClick={onPrint}>
                <Printer size={18} className="text-slate-500" /> Print Report
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4" onClick={onCopySummary}>
                {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-indigo-50" />} Copy Summary
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem className="text-destructive focus:text-destructive rounded-xl py-3 px-5 cursor-pointer flex items-center gap-4" onClick={onDelete}>
                <Trash2 size={18} /> Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeView === 'home' && renderHomeView()}
        {activeView === 'recheck' && (
          <RecheckTab 
            appointment={appointment} 
            history={history} 
            onUpdate={onUpdate} 
            saveField={saveField} 
            updatePriorityPattern={updatePriorityPattern} 
          />
        )}
        {activeView === 'context' && <ClientContextTab appointment={appointment} />}
        {activeView === 'journal' && <JournalTab appointmentId={appointment.id} clientName={appointment.clients.name} />}
        {activeView === 'kinesiology' && (
          <div className="space-y-8">
            <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
            <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
          </div>
        )}
        {activeView === 'muscles' && (
          <div className="bg-card rounded-[3rem] border border-border shadow-xl p-10">
            <MuscleTestingTab appointmentId={appointment.id} />
          </div>
        )}
        {activeView === 'gait' && (
          <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />
        )}
        {activeView === 'previous' && (
          <div className="space-y-16">
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <History size={20} />
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Neurological Evolution</h2>
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
        <DialogContent className="w-[95vw] max-w-5xl rounded-[3rem] p-0 overflow-visible border-none shadow-3xl bg-white dark:bg-slate-950">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Session Note</DialogTitle>
            <DialogDescription>Capture observations and insights in real-time.</DialogDescription>
          </DialogHeader>
          <div className="p-12 md:p-16 relative flex flex-col h-[85vh] overflow-visible">
            <div className="absolute top-8 right-8 z-50">
              <Button variant="ghost" size="icon" onClick={() => setNoteDialogOpen(false)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full">
                <X size={24} />
              </Button>
            </div>
            
            <div className="flex items-center gap-6 mb-10 shrink-0">
              <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/20">
                <StickyNote size={32} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Quick Session Note</h2>
                <p className="text-slate-500 font-medium text-lg mt-1">Capture observations and insights in real-time.</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-visible">
              <EditableField 
                field="notes" 
                label="General Session Notes" 
                value={appointment.notes} 
                multiline 
                placeholder="Start typing your observations here..." 
                onSave={saveField} 
                className="bg-transparent border-none shadow-none p-0 h-full w-full min-h-full"
              />
            </div>

            <div className="mt-12 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                <CheckCircle2 size={14} className="text-emerald-500" /> Auto-saving to client record
              </div>
              <Button 
                onClick={() => setNoteDialogOpen(false)} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100"
              >
                Finish Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionContentSwitcher;