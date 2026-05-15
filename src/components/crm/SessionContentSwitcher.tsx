"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  History, 
  ArrowRight, 
  MoreHorizontal, 
  Printer, 
  Copy, 
  PanelRightOpen, 
  PanelRightClose, 
  Trash2, 
  Loader2, 
  Check, 
  StickyNote, 
  X, 
  Save,
  RefreshCw,
  UserCircle,
  BookOpen,
  Heart,
  Dumbbell,
  Footprints
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import RecheckTab from './session-tabs/RecheckTab';
import ClientContextTab from './session-tabs/ClientContextTab';
import JournalTab from './session-tabs/JournalTab';
import EditableField from '@/components/shared/EditableField';
import LuscherColourAssessment from './LuscherColourAssessment';
import MuscleTestingTab from './MuscleTestingTab';
import EmotionAssessment from './EmotionAssessment';
import PreviousSessionSummary from './PreviousSessionSummary';
import GaitReflexAssessment from './GaitReflexAssessment';
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
import SessionToolNavigation, { ActiveView } from './SessionToolNavigation';
import SessionPhaseTabs from './SessionPhaseTabs';

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
  isCloning?: boolean;
  isCopied?: boolean;
  onOpenDocument?: () => void;
  onTabChange?: (tabId: string) => void;
}

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

  return (
    <ErrorBoundary>
      <div className="space-y-10">
        <SessionToolNavigation 
          appointmentId={appointment.id}
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenDocument={onOpenDocument || (() => {})}
        />
        
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {activeView === 'home' && (
            <SessionPhaseTabs 
              appointment={appointment}
              onUpdate={onUpdate}
              saveField={saveField}
              updatePriorityPattern={updatePriorityPattern}
              history={history}
              nucleiFilter={nucleiFilter || null}
              activeTab={activeTab}
              onTabChange={(v) => {
                setActiveTab(v);
                onTabChange?.(v);
              }}
              preselectedFinding={preselectedFinding}
              onClearItem={handleClearItem}
              wizardRef={wizardRef}
            />
          )}
          
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
              <div className="mt-12 flex justify-end shrink-0">
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