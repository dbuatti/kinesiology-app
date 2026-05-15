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
  Loader2,
  Check,
  StickyNote,
  UserCircle,
  LayoutGrid,
  ChevronDown,
  X,
  BookOpen,
  Brain,
  RefreshCw,
  FileText,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
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
import { showSuccess, showError } from '@/utils/toast';
import { safeParse } from '@/utils/safe-json';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import PathwayLogicWizard from './PathwayLogicWizard';

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
  onOpenDocument?: () => void;
}

const TABS = [
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary', sub: 'Intake', icon: Activity, color: 'text-indigo-600', activeBg: 'bg-indigo-600', lightBg: 'bg-indigo-50' },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease', sub: 'SNS Reset', icon: Zap, color: 'text-rose-600', activeBg: 'bg-rose-600', lightBg: 'bg-rose-50' },
  { id: 'pathway', label: 'A', fullLabel: 'Align', sub: 'Hierarchy', icon: GitBranch, color: 'text-amber-600', activeBg: 'bg-amber-600', lightBg: 'bg-amber-50' },
  { id: 'calibration', label: 'C', fullLabel: 'Correct', sub: 'Logic', icon: Target, color: 'text-emerald-600', activeBg: 'bg-emerald-600', lightBg: 'bg-emerald-50' },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed', sub: 'Verify', icon: ClipboardCheck, color: 'text-blue-600', activeBg: 'bg-blue-600', lightBg: 'bg-blue-50' }
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
  isCopied,
  onOpenDocument
}: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeTab, setActiveTab] = useState('baseline');
  const [preselectedFinding, setPreselectedFinding] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
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

  const handlePrevTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      const prevTabId = TABS[currentIndex - 1].id;
      setActiveTab(prevTabId);
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearItem = async (itemName: string) => {
    let category = 'muscles';
    if (appointment.priority_pattern) {
      const pattern = safeParse(appointment.priority_pattern, {});
      Object.keys(pattern).forEach(cat => {
        if (pattern[cat][itemName] || pattern[cat][`${itemName} (L)`] || pattern[cat][`${itemName} (R)`]) {
          category = cat;
        }
      });
    }
    await updatePriorityPattern(category, itemName, 'Clear');
    onUpdate();
  };

  const NavItem = ({ view, label, Icon }: { view: ActiveView, label: string, Icon: React.ElementType }) => (
    <Button
      variant="ghost"
      onClick={() => setActiveView(view)}
      className={cn(
        "h-10 px-4 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 gap-2",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/5 border border-slate-100" 
          : "text-slate-500 hover:bg-white/50"
      )}
    >
      <Icon size={14} className={cn(activeView === view ? "text-indigo-600" : "text-slate-400")} />
      {label}
    </Button>
  );

  const TabFooter = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <Button 
        variant="ghost"
        onClick={handlePrevTab}
        disabled={activeTab === TABS[0].id}
        className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 disabled:opacity-0"
      >
        <ChevronLeft size={16} className="mr-2" /> Previous
      </Button>

      {nextLabel ? (
        <Button 
          onClick={handleNextTab}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          Next: {nextLabel} <ArrowRight size={18} className="ml-3" />
        </Button>
      ) : (
        <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">
          <CheckCircle2 size={16} /> Session Complete
        </div>
      )}
    </div>
  );

  const renderHomeView = () => (
    <div className="space-y-10">
      {/* COMPACT STEPPER */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        {TABS.map((tab, index) => {
          const isCompleted = (tabStatus as any)[tab.id];
          const isActive = activeTab === tab.id;
          const isPast = TABS.findIndex(t => t.id === activeTab) > index;

          return (
            <React.Fragment key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center gap-3 p-3 rounded-2xl transition-all duration-500 group relative",
                  isActive ? "bg-slate-50 dark:bg-slate-800/50" : "hover:bg-slate-50/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                  isActive ? cn("text-white shadow-lg", tab.activeBg) : 
                  isCompleted || isPast ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-300 group-hover:bg-slate-200"
                )}>
                  {isCompleted || isPast ? <Check size={20} /> : <tab.icon size={20} />}
                </div>
                
                <div className="hidden lg:flex flex-col items-start text-left">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-slate-900 dark:text-white" : "text-slate-400"
                  )}>
                    {tab.fullLabel}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    {tab.sub}
                  </span>
                </div>

                {isActive && (
                  <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", tab.activeBg)} />
                )}
              </button>
              {index < TABS.length - 1 && (
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="baseline" className="focus-visible:ring-0 m-0">
            <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="E — Ease" />
          </TabsContent>

          <TabsContent value="sympathetic" className="focus-visible:ring-0 m-0">
            <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="A — Align" />
          </TabsContent>

          <TabsContent value="pathway" className="focus-visible:ring-0 m-0">
            <PathwayAssessment 
              appointmentId={appointment.id}
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

          <TabsContent value="calibration" className="focus-visible:ring-0 m-0">
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

          <TabsContent value="reassessment" className="focus-visible:ring-0 m-0">
            <EmbedTab 
              appointment={appointment} 
              onUpdate={onUpdate} 
              saveField={saveField} 
              updatePriorityPattern={updatePriorityPattern} 
            />
            <TabFooter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context', 'journal', 'recheck'].includes(activeView);

  return (
    <ErrorBoundary>
      <div className="space-y-10">
        {/* NAVIGATION BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
            <NavItem view="home" label="PEACE" Icon={LayoutGrid} />
            
            <Button
              variant="ghost"
              asChild
              className={cn(
                "h-10 px-4 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 gap-2",
                location.pathname.includes('/protocols') ? "bg-white text-purple-600 shadow-lg shadow-purple-500/5 border border-slate-100" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <Link to={`/appointments/${appointment.id}/protocols`}>
                <Brain size={14} className={cn(location.pathname.includes('/protocols') ? "text-purple-600" : "text-purple-400")} />
                Protocols
              </Link>
            </Button>

            <NavItem view="recheck" label="Recheck" Icon={RefreshCw} />
            <NavItem view="previous" label="History" Icon={History} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "h-10 px-4 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 flex items-center gap-2",
                    isToolActive ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/5 border border-slate-100" : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  <Wrench size={14} className={cn(isToolActive ? "text-indigo-600" : "text-slate-400")} />
                  Tools
                  <ChevronDown size={12} className="opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2 rounded-[2rem] border-none shadow-3xl bg-white dark:bg-slate-900">
                <DropdownMenuItem onClick={() => setActiveView('context')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <UserCircle size={18} className="mr-3 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Client Context</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('journal')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <BookOpen size={18} className="mr-3 text-amber-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Session Journal</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                <DropdownMenuItem onClick={() => setActiveView('kinesiology')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Heart size={18} className="mr-3 text-rose-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Kinesiology Tools</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('muscles')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Dumbbell size={18} className="mr-3 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Muscle Log</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('gait')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Footprints size={18} className="mr-3 text-emerald-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Gait Integration</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                
                <DropdownMenuItem onClick={onOpenDocument} className="rounded-xl py-3 px-4 cursor-pointer group bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                  <FileText size={18} className="mr-3 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Document View</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white transition-all gap-2"
              onClick={() => setNoteDialogOpen(true)}
            >
              <StickyNote size={16} className="text-amber-500" />
              <span className="hidden sm:inline">Note</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-10 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all gap-2",
                showSidebar ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/10" : "bg-white border-slate-200 text-slate-600"
              )}
              onClick={onToggleSidebar}
            >
              {showSidebar ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              <span className="hidden sm:inline">Sidebar</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:bg-white hover:text-indigo-600 transition-all">
                  <MoreHorizontal size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-[2rem] border-none shadow-3xl bg-white dark:bg-slate-900">
                <DropdownMenuItem className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={onClonePrevious} disabled={isCloning}>
                  {isCloning ? <Loader2 size={16} className="animate-spin" /> : <History size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />} 
                  <span className="font-bold text-xs">Clone Previous</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={onPrint}>
                  <Printer size={16} className="text-slate-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Print Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={onCopySummary}>
                  {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />} 
                  <span className="font-bold text-xs">Copy Summary</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem className="text-rose-600 focus:text-rose-600 rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={onDelete}>
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Delete Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* CONTENT AREA */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {activeView === 'home' && renderHomeView()}
          {activeView === 'recheck' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Session Recheck</h2>
                  <p className="text-slate-500 text-xs font-medium">Verify findings and ensure integration.</p>
                </div>
              </div>
              <RecheckTab 
                appointment={appointment} 
                history={history} 
                onUpdate={onUpdate} 
                saveField={saveField} 
                updatePriorityPattern={updatePriorityPattern} 
              />
            </div>
          )}
          {activeView === 'context' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <UserCircle size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Client Context</h2>
                  <p className="text-slate-500 text-xs font-medium">Historical data and clinical background.</p>
                </div>
              </div>
              <ClientContextTab appointment={appointment} />
            </div>
          )}
          {activeView === 'journal' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Session Journal</h2>
                  <p className="text-slate-500 text-xs font-medium">Capture your clinical reflections.</p>
                </div>
              </div>
              <JournalTab appointmentId={appointment.id} clientName={appointment.clients.name} />
            </div>
          )}
          {activeView === 'kinesiology' && (
            <div className="space-y-10">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg">
                  <Heart size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Kinesiology Tools</h2>
                  <p className="text-slate-500 text-xs font-medium">Emotional and energetic assessments.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-10">
                <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
                <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
              </div>
            </div>
          )}
          {activeView === 'muscles' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Muscle Log</h2>
                  <p className="text-slate-500 text-xs font-medium">Detailed proficiency and testing records.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8">
                <MuscleTestingTab appointmentId={appointment.id} />
              </div>
            </div>
          )}
          {activeView === 'gait' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                  <Footprints size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Gait Integration</h2>
                  <p className="text-slate-500 text-xs font-medium">Assess and correct movement patterns.</p>
                </div>
              </div>
              <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />
            </div>
          )}
          {activeView === 'previous' && (
            <div className="space-y-16">
              <div className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                          <History size={24} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Neurological Evolution</h2>
                        <p className="text-sm text-slate-500 font-medium">Tracking progress across multiple sessions.</p>
                      </div>
                  </div>
                  <NeurologicalHistoryTracker appointments={history.length > 0 ? history : [appointment]} />
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <PreviousSessionSummary 
                clientId={appointment.clients.id} 
                currentAppointmentId={appointment.id} 
                manualData={history.length > 1 ? history[1] : null}
              />
            </div>
          )}
        </div>

        {/* QUICK NOTE DIALOG */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-4xl rounded-[3rem] p-0 overflow-visible border-none shadow-3xl bg-white dark:bg-slate-950">
            <DialogHeader className="sr-only">
              <DialogTitle>Quick Session Note</DialogTitle>
              <DialogDescription>Capture observations and insights in real-time.</DialogDescription>
            </DialogHeader>
            <div className="p-10 md:p-16 relative flex flex-col h-[80vh] overflow-visible">
              <div className="absolute top-8 right-8 z-50">
                <Button variant="ghost" size="icon" onClick={() => setNoteDialogOpen(false)} className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                  <X size={24} />
                </Button>
              </div>
              
              <div className="flex items-center gap-6 mb-10 shrink-0">
                <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/30">
                  <StickyNote size={32} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Quick Session Note</h2>
                  <p className="text-slate-500 font-medium text-lg mt-1">Capture observations and insights in real-time.</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-visible bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                <EditableField 
                  field="notes" 
                  label="General Session Notes" 
                  value={appointment.notes} 
                  multiline 
                  placeholder="Start typing your observations here..." 
                  onSave={saveField} 
                  className="bg-transparent border-none shadow-none p-0 h-full w-full min-h-full text-lg leading-relaxed"
                />
              </div>

              <div className="mt-10 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Auto-saving
                </div>
                <Button 
                  onClick={() => setNoteDialogOpen(false)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  Finish Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default SessionContentSwitcher;