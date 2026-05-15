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
  AlertTriangle,
  Clock,
  Info,
  Move
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showSuccess, showError } from '@/utils/toast';
import { safeParse } from '@/utils/safe-json';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import PathwayLogicWizard from './PathwayLogicWizard';

type ActiveView = 'home' | 'kinesiology' | 'muscles' | 'gait' | 'previous' | 'context' | 'journal' | 'recheck' | 'audit';

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
  onTabChange?: (tabId: string) => void;
}

const TABS = [
  { id: 'baseline', label: 'P', fullLabel: 'Preliminary', sub: 'Intake & Vitals', icon: Activity, color: 'text-indigo-600', activeBg: 'bg-indigo-600', lightBg: 'bg-indigo-50' },
  { id: 'sympathetic', label: 'E', fullLabel: 'Ease', sub: 'SNS Reset', icon: Zap, color: 'text-rose-600', activeBg: 'bg-rose-600', lightBg: 'bg-rose-50' },
  { id: 'pathway', label: 'A', fullLabel: 'Align', sub: 'Map Hierarchy', icon: GitBranch, color: 'text-amber-600', activeBg: 'bg-amber-600', lightBg: 'bg-amber-50' },
  { id: 'calibration', label: 'C', fullLabel: 'Correct', sub: 'Calibrate Logic', icon: Target, color: 'text-emerald-600', activeBg: 'bg-emerald-600', lightBg: 'bg-emerald-50' },
  { id: 'reassessment', label: 'E', fullLabel: 'Embed', sub: 'Verify & Lock', icon: ClipboardCheck, color: 'text-blue-600', activeBg: 'bg-blue-600', lightBg: 'bg-blue-50' }
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
  onOpenDocument,
  onTabChange
}: SessionContentSwitcherProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeTab, setActiveTab] = useState('baseline');
  const [preselectedFinding, setPreselectedFinding] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  
  const tabStatus = useMemo(() => ({
    baseline: !!(appointment.goal && appointment.issue && (appointment.bolt_score || appointment.coherence_score)),
    sympathetic: !!(appointment.harmonic_rocking_notes || appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes),
    pathway: !!appointment.priority_pattern && appointment.priority_pattern !== "{}",
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
      onTabChange?.(nextTabId);
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
        "h-10 px-5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 gap-2.5",
        activeView === view 
          ? "bg-white text-indigo-600 shadow-md border border-slate-100" 
          : "text-slate-500 hover:bg-white/50"
      )}
    >
      <Icon size={16} className={cn(activeView === view ? "text-indigo-600" : "text-slate-400")} />
      {label}
    </Button>
  );

  const TabFooter = ({ nextLabel }: { nextLabel?: string }) => (
    <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-8">
      {nextLabel && (
        <Button 
          onClick={handleNextTab}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          Continue to {nextLabel} <ArrowRight size={18} className="ml-3" />
        </Button>
      )}
    </div>
  );

  const renderHomeView = () => (
    <div className="space-y-12">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        onTabChange?.(v);
        if (v === 'calibration') scrollToWizard();
      }} className="w-full">
        <div className="overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
          <TabsList className="flex w-full h-auto bg-transparent p-0 gap-2 md:gap-4 border-b border-slate-100 dark:border-slate-800 rounded-none">
            {TABS.map((tab) => {
              const isCompleted = (tabStatus as any)[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className={cn(
                    "flex-1 flex flex-col items-center gap-3 pb-6 px-4 rounded-t-2xl border-b-4 transition-all duration-500 relative group min-w-[100px]",
                    isActive 
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    isActive ? cn("text-white shadow-xl", tab.activeBg) : 
                    isCompleted ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100"
                  )}>
                    {isCompleted && !isActive ? <CheckCircle2 size={24} /> : <tab.icon size={24} />}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tighter">{tab.label}</span>
                      <span className="hidden md:inline text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
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
            <BaselineTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="Ease" />
          </TabsContent>

          <TabsContent value="sympathetic" className="focus-visible:ring-0">
            <SympatheticTab appointment={appointment} onUpdate={onUpdate} saveField={saveField} />
            <TabFooter nextLabel="Align" />
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
                setPreselectedFinding(itemName);
                setActiveTab('calibration');
                scrollToWizard();
              }}
              nucleiFilter={nucleiFilter}
            />
            <TabFooter nextLabel="Correct" />
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
            <TabFooter nextLabel="Embed" />
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

  const isToolActive = ['kinesiology', 'muscles', 'gait', 'context', 'journal', 'recheck', 'audit'].includes(activeView);

  return (
    <ErrorBoundary>
      <div className="space-y-10">
        {/* NAVIGATION BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
            <NavItem view="home" label="PHASES" Icon={LayoutGrid} />
            
            <Button
              variant="ghost"
              asChild
              className={cn(
                "h-10 px-5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 gap-2.5",
                location.pathname.includes('/protocols') ? "bg-white text-purple-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50"
              )}
            >
              <Link to={`/appointments/${appointment.id}/protocols`}>
                <Brain size={16} className={cn(location.pathname.includes('/protocols') ? "text-purple-600" : "text-purple-400")} />
                Protocols
              </Link>
            </Button>

            <NavItem view="recheck" label="Recheck" Icon={RefreshCw} />
            <NavItem view="previous" label="History" Icon={History} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "h-10 px-5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest shrink-0 flex items-center gap-2.5",
                    isToolActive ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500 hover:bg-white/50"
                  )}
                >
                  <Wrench size={16} className={cn(isToolActive ? "text-indigo-600" : "text-slate-400")} />
                  Tools
                  <ChevronDown size={12} className="opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2 rounded-2xl border-none shadow-3xl bg-white dark:bg-slate-900">
                <div className="px-4 py-2 mb-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Utilities</p>
                </div>
                <DropdownMenuItem onClick={() => setActiveView('context')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <UserCircle size={18} className="mr-3 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Client Context</span>
                    <span className="text-[9px] text-slate-400 font-medium">History & Background</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('journal')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <BookOpen size={18} className="mr-3 text-amber-500 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Session Journal</span>
                    <span className="text-[9px] text-slate-400 font-medium">Practitioner Reflections</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                <DropdownMenuItem onClick={() => setActiveView('kinesiology')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Heart size={18} className="mr-3 text-rose-500 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Kinesiology Tools</span>
                    <span className="text-[9px] text-slate-400 font-medium">Luscher & Emotions</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('muscles')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Dumbbell size={18} className="mr-3 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Muscle Log</span>
                    <span className="text-[9px] text-slate-400 font-medium">Detailed Testing</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('gait')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Footprints size={18} className="mr-3 text-emerald-500 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Gait Integration</span>
                    <span className="text-[9px] text-slate-400 font-medium">Movement Patterns</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                
                <DropdownMenuItem onClick={() => setActiveView('audit')} className="rounded-xl py-3 px-4 cursor-pointer group">
                  <Clock size={18} className="mr-3 text-slate-400 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Session Audit Log</span>
                    <span className="text-[9px] text-slate-400 font-medium">Timestamped Findings</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onOpenDocument} className="rounded-xl py-3 px-4 cursor-pointer group bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                  <FileText size={18} className="mr-3 group-hover:scale-110 transition-transform" /> 
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">Document View</span>
                    <span className="text-[9px] text-indigo-400 font-medium">Full Session Report</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end px-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white transition-all gap-2.5"
              onClick={() => setNoteDialogOpen(true)}
            >
              <StickyNote size={16} className="text-amber-500" />
              <span className="hidden sm:inline">Quick Note</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-10 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all gap-2.5",
                showSidebar ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white border-slate-200 text-slate-600"
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
              <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl border-none shadow-3xl bg-white dark:bg-slate-900">
                <DropdownMenuItem className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={onPrint}>
                  <Printer size={16} className="text-slate-500 group-hover:scale-110 transition-transform" /> 
                  <span className="font-bold text-xs">Print Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={onCopySummary}>
                  {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />} 
                  <span className="font-bold text-xs">Copy Summary</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                
                <DropdownMenuItem className="rounded-xl py-3 px-4 cursor-pointer flex items-center gap-3 group" onClick={() => setCloneDialogOpen(true)} disabled={isCloning}>
                  {isCloning ? <Loader2 size={16} className="animate-spin" /> : <History size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />} 
                  <span className="font-bold text-xs">Clone Previous</span>
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
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Session Recheck</h2>
                  <p className="text-slate-500 font-medium">Verify findings and ensure integration.</p>
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
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <UserCircle size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Client Context</h2>
                  <p className="text-slate-500 font-medium">Historical data and clinical background.</p>
                </div>
              </div>
              <ClientContextTab appointment={appointment} />
            </div>
          )}
          {activeView === 'journal' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Session Journal</h2>
                  <p className="text-slate-500 font-medium">Capture your clinical reflections.</p>
                </div>
              </div>
              <JournalTab appointmentId={appointment.id} clientName={appointment.clients.name} />
            </div>
          )}
          {activeView === 'kinesiology' && (
            <div className="space-y-12">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-white flex items-center justify-center shadow-xl">
                  <Heart size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Kinesiology Tools</h2>
                  <p className="text-slate-500 font-medium">Emotional and energetic assessments.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-12">
                <LuscherColourAssessment appointmentId={appointment.id} initialColor1={appointment.luscher_color_1} initialColor2={appointment.luscher_color_2} onSaveColors={(c1, c2) => { saveField('luscher_color_1', c1); return saveField('luscher_color_2', c2); }} />
                <EmotionAssessment appointmentId={appointment.id} initialMode={appointment.emotion_mode} initialPrimary={appointment.emotion_primary_selection} initialSecondary={appointment.emotion_secondary_selection} initialNotes={appointment.emotion_notes} onSaveField={saveField} onUpdate={onUpdate} />
              </div>
            </div>
          )}
          {activeView === 'muscles' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <Dumbbell size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Muscle Log</h2>
                  <p className="text-slate-500 font-medium">Detailed proficiency and testing records.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none p-10">
                <MuscleTestingTab appointmentId={appointment.id} />
              </div>
            </div>
          )}
          {activeView === 'gait' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-white flex items-center justify-center shadow-xl">
                  <Footprints size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Gait Integration</h2>
                  <p className="text-slate-500 font-medium">Assess and correct movement patterns.</p>
                </div>
              </div>
              <GaitReflexAssessment appointmentId={appointment.id} initialNotes={appointment.gait_notes} onSaveField={saveField} />
            </div>
          )}
          {activeView === 'previous' && (
            <div className="space-y-20">
              <div className="space-y-8">
                  <div className="flex items-center gap-6 px-4">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                          <History size={32} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Neurological Evolution</h2>
                        <p className="text-lg text-slate-500 font-medium">Tracking progress across multiple sessions.</p>
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
          {activeView === 'audit' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Session Audit Log</h2>
                  <p className="text-slate-500 font-medium">Timestamped record of all findings this session.</p>
                </div>
              </div>
              <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <Info size={18} className="text-indigo-600" />
                    <p className="text-xs text-indigo-900 font-medium">This log tracks every change made during the active session for error recovery and clinical review.</p>
                  </div>
                  <div className="text-center py-20 text-slate-300">
                    <History size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Audit log feature coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* CLONE PREVIEW DIALOG */}
        <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white">
            <div className="p-10 space-y-8">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                    <History size={28} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">Clone Previous Session?</DialogTitle>
                    <DialogDescription className="text-base font-medium">Inherit findings from the last recorded session.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">What will be cloned:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "BOLT & Coherence Scores", icon: Activity, color: "text-emerald-500" },
                      { label: "ROM (Cogs) Readings", icon: Move, color: "text-blue-500" },
                      { label: "Pathway Priorities (Inhibitions)", icon: GitBranch, color: "text-amber-500" },
                      { label: "Acupoint Selections", icon: Target, color: "text-indigo-500" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <item.icon size={16} className={item.color} />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400">What will NOT be cloned:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "Session Goal", icon: Target },
                      { label: "Primary Concern / Issue", icon: ClipboardCheck },
                      { label: "Practitioner Notes & Journal", icon: StickyNote }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold text-rose-700">
                        <item.icon size={16} className="text-rose-400" />
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-900 font-medium leading-relaxed">
                    Cloning is a high-risk operation. Ensure the previous findings are still relevant before proceeding.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setCloneDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</Button>
                <Button 
                  onClick={() => { onClonePrevious(); setCloneDialogOpen(false); }}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                >
                  Confirm Clone
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* QUICK NOTE DIALOG */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-5xl rounded-[3.5rem] p-0 overflow-visible border-none shadow-3xl bg-white dark:bg-slate-950">
            <DialogHeader className="sr-only">
              <DialogTitle>Quick Session Note</DialogTitle>
              <DialogDescription>Capture observations and insights in real-time.</DialogDescription>
            </DialogHeader>
            <div className="p-12 md:p-20 relative flex flex-col h-[85vh] overflow-visible">
              <div className="absolute top-10 right-10 z-50">
                <Button variant="ghost" size="icon" onClick={() => setNoteDialogOpen(false)} className="h-12 w-12 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                  <X size={28} />
                </Button>
              </div>
              
              <div className="flex items-center gap-8 mb-12 shrink-0">
                <div className="w-20 h-20 rounded-[2rem] bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/30">
                  <StickyNote size={40} />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Quick Session Note</h2>
                  <p className="text-slate-500 font-medium text-xl mt-2">Capture observations and insights in real-time.</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-visible bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800">
                <EditableField 
                  field="notes" 
                  label="General Session Notes" 
                  value={appointment.notes} 
                  multiline 
                  placeholder="Start typing your observations here..." 
                  onSave={saveField} 
                  className="bg-transparent border-none shadow-none p-0 h-full w-full min-h-full text-xl leading-relaxed"
                />
              </div>

              <div className="mt-12 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Auto-saving to client record
                </div>
                <Button 
                  onClick={() => setNoteDialogOpen(false)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 px-12 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
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