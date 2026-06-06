
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Printer,
  ArrowLeft,
  Loader2,
  Clock,
  ChevronRight,
  ExternalLink,
  Zap,
  ChevronDown,
  ChevronUp,
  Calendar,
  Maximize2,
  Minimize2,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSessionDocumentState } from '@/hooks/useSessionDocumentState';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Modular Sub-components
import DocumentSidebar, { OUTLINE_ITEMS } from './document-view/DocumentSidebar';
import DocumentRightSidebar from './document-view/DocumentRightSidebar';
import DocumentHeader from './document-view/DocumentHeader';
import PreliminarySection from './document-view/PreliminarySection';
import EaseSection from './document-view/EaseSection';
import AlignSection from './document-view/AlignSection';
import CorrectSection from './document-view/CorrectSection';
import EmbedSection from './document-view/EmbedSection';
import ClientHistoryDropdown from './document-view/ClientHistoryDropdown';

interface SessionDocumentViewProps {
  appointment: AppointmentWithClient;
  onUpdate: () => void;
  saveField: (field: string, value: any) => Promise<void>;
  updatePriorityPattern: (category: string, itemName: string, status: 'Clear' | 'Inhibited' | null, side?: 'L' | 'R') => Promise<void>;
  onClose: () => void;
  history?: any[];
}

const SECTION_META: Record<string, { letter: string; color: string; bg: string; focus: string }> = {
  "p-sec":  { letter: "P", color: "text-slate-700 dark:text-slate-200",  bg: "bg-slate-100 dark:bg-slate-800",   focus: "Intake vitals · BOLT score · Coherence · Zone baseline" },
  "e-sec":  { letter: "E", color: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-50 dark:bg-blue-950/40",    focus: "T1 reset · Diaphragm · Vagus nerve stimulation · Harmonic rocking" },
  "a-sec":  { letter: "A", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/40", focus: "Primitive reflexes · Cranial nerves · Muscle assessment · Pattern mapping" },
  "c-sec":  { letter: "C", color: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-50 dark:bg-amber-950/40",  focus: "LOFI calibration · Afferent / Efferent pathways · Emotional protocol" },
  "e2-sec": { letter: "E", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", focus: "Re-challenge all findings · Verify cleared · Prescribe homework" },
};

const SectionHeader = ({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) => {
  const meta = SECTION_META[id];
  return (
    <div id={id} className="mt-16 md:mt-24 mb-6 first:mt-0 scroll-mt-24">
      <div className="flex items-start gap-4 pb-3 border-b-2 border-black">
        {meta && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shrink-0 mt-0.5", meta.bg, meta.color)}>
            {meta.letter}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {meta?.focus && (
        <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed pl-14">{meta.focus}</p>
      )}
    </div>
  );
};

const SessionDocumentView = ({ 
  appointment, 
  onUpdate, 
  saveField, 
  updatePriorityPattern,
  onClose,
  history = []
}: SessionDocumentViewProps) => {
  const navigate = useNavigate();
  const {
    lastSaved,
    openGuides,
    activeSection,
    loadingMuscles,
    currentTime,
    isFullScreen,
    activeTimerDuration,
    timeLeft,
    loadingAppointments,
    toggleFullScreen,
    startQuickTimer,
    stopQuickTimer,
    formatCountdown,
    overallProgressPercent,
    metadata,
    updateMetadataFields,
    scrollTo,
    toggleGuide,
    brainZoneOptions,
    currentMuscleTests,
    unifiedPattern,
    inhibitedFindings,
    handleTogglePatternItem,
    groupedAppointments
  } = useSessionDocumentState({
    appointment,
    onUpdate,
    saveField,
    updatePriorityPattern
  });

  // Bulletproof JS-based media query to prevent sidebars from rendering on mobile/tablet
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const listener = () => setIsDesktop(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const handleSwitchAppointment = (newId: string) => {
    navigate(`/appointments/${newId}?view=document`);
  };

  // Extract all currently and historically inhibited findings from the unified pattern
  const activeInhibitedFindings = useMemo(() => {
    const list: string[] = [];
    Object.entries(unifiedPattern).forEach(([category, items]: [string, any]) => {
      Object.entries(items).forEach(([name, status]) => {
        const strStatus = status as string;
        const baseStatus = strStatus.replace('_Cleared', '');
        if (baseStatus === 'Inhibited' || baseStatus === 'Inhibition' || baseStatus === 'Hypertonic') {
          list.push(name);
        }
      });
    });
    return list.sort();
  }, [unifiedPattern]);

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-40 print:p-0 print:m-0">
      {/* Document Controls */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md print:hidden border-b border-slate-200">
        <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left Side: Exit, Client Switcher, Status */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none h-9 px-3 font-black text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all shrink-0">
                <ArrowLeft size={14} className="mr-1" /> Exit
              </Button>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Clinical Record</span>
                
                {/* Live Client Switcher Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 hover:bg-slate-100 px-1.5 py-0.5 -ml-1.5 rounded-lg transition-colors text-left group min-w-0">
                      <span className="text-xs font-black text-slate-900 truncate">{appointment.clients.name}</span>
                      <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 md:w-80 max-h-[450px] overflow-y-auto rounded-2xl p-2 shadow-3xl border-none bg-white dark:bg-slate-900 z-[100]">
                    {loadingAppointments ? (
                      <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={20} /></div>
                    ) : (
                      <>
                        {groupedAppointments.today.length > 0 && (
                          <div className="space-y-1">
                            <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Today's Schedule
                            </div>
                            {groupedAppointments.today.map(app => (
                              <DropdownMenuItem 
                                key={app.id} 
                                onClick={() => handleSwitchAppointment(app.id)}
                                className={cn(
                                  "rounded-xl py-2.5 px-4 cursor-pointer flex items-center justify-between",
                                  app.id === appointment.id ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-slate-50"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black truncate">{app.clients?.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {format(new Date(app.date), "h:mm a")} • {app.tag}
                                  </p>
                                </div>
                                <Badge className={cn(
                                  "border-none font-black text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                  app.status === 'Completed' ? "bg-emerald-50 text-white" : "bg-indigo-600 text-white"
                                )}>
                                  {app.status}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        )}

                        {groupedAppointments.upcoming.length > 0 && (
                          <div className="space-y-1 mt-3">
                            <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                              <Calendar size={10} /> Upcoming Sessions
                            </div>
                            {groupedAppointments.upcoming.slice(0, 10).map(app => (
                              <DropdownMenuItem 
                                key={app.id} 
                                onClick={() => handleSwitchAppointment(app.id)}
                                className={cn(
                                  "rounded-xl py-2.5 px-4 cursor-pointer flex items-center justify-between",
                                  app.id === appointment.id ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-slate-50"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black truncate">{app.clients?.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {format(new Date(app.date), "MMM d, h:mm a")} • {app.tag}
                                  </p>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        )}

                        {groupedAppointments.past.length > 0 && (
                          <div className="space-y-1 mt-3">
                            <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                              <Clock size={10} /> Recent Past Sessions
                            </div>
                            {groupedAppointments.past.map(app => (
                              <DropdownMenuItem 
                                key={app.id} 
                                onClick={() => handleSwitchAppointment(app.id)}
                                className={cn(
                                  "rounded-xl py-2.5 px-4 cursor-pointer flex items-center justify-between",
                                  app.id === appointment.id ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-slate-50"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black truncate">{app.clients?.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {format(new Date(app.date), "MMM d, yyyy")} • {app.tag}
                                  </p>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Editable Status Dropdown */}
            <Select value={appointment.status} onValueChange={(newStatus) => saveField('status', newStatus)}>
              <SelectTrigger className="h-8 w-auto min-w-[90px] text-[8px] font-black uppercase tracking-widest border border-black rounded-none bg-white px-2 py-0.5 focus:ring-0 focus:ring-offset-0 shrink-0">
                <SelectValue placeholder={appointment.status} />
              </SelectTrigger>
              <SelectContent className="rounded-none border border-black shadow-2xl bg-white">
                {["Scheduled", "Completed", "Cancelled", "No Show"].map(status => (
                  <SelectItem key={status} value={status} className="rounded-none text-[8px] font-black uppercase tracking-widest py-2 px-4 cursor-pointer">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right Side: Sync, Notion, Full Screen */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-slate-100 pt-2 sm:pt-0 sm:border-t-0">
            <div className="flex items-center gap-2 text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Sync</p>
              <p className="text-[10px] font-bold tabular-nums">{format(lastSaved, "HH:mm:ss")}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {appointment.notion_link && (
                <Button asChild variant="outline" size="sm" className="rounded-none border-black font-black text-[10px] uppercase tracking-widest h-8 px-3 hover:bg-slate-50">
                  <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} className="mr-1" /> Notion
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-none border-black font-black text-[10px] uppercase tracking-widest h-8 px-3 hover:bg-slate-50 hidden sm:inline-flex">
                <Printer size={12} className="mr-1" /> Print
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullScreen}
                className="h-8 w-8 rounded-none border-black text-black hover:bg-slate-50 shrink-0"
                title="Toggle Full Screen"
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Rainbow Progress Bar */}
        <div className="h-[3px] w-full bg-slate-100 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-rose-500 via-amber-500 to-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${overallProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Split Layout: Sidebar + Document + Right Sidebar */}
      <div className="w-full px-4 md:px-6 flex flex-col lg:flex-row gap-6 lg:gap-12 items-start justify-start pt-8 print:block print:p-0">
        
        {/* Left Sidebar: Outline & Corrections Guide (Only rendered on Desktop) */}
        {isDesktop && (
          <DocumentSidebar 
            activeSection={activeSection} 
            scrollTo={scrollTo} 
            openGuides={openGuides} 
            toggleGuide={toggleGuide} 
          />
        )}

        {/* Center: The Document */}
        <div className="flex-1 w-full max-w-[850px] mx-auto bg-white border-none md:border md:border-slate-200 md:shadow-sm p-4 sm:p-10 md:p-16 min-h-[1056px] print:border-none print:p-0">
          {/* Header */}
          <DocumentHeader 
            clientName={appointment.clients.name} 
            date={appointment.date} 
            displayId={appointment.display_id} 
            id={appointment.id} 
          />

          {/* Clinical History Dropdown */}
          <ClientHistoryDropdown history={history} currentAppointmentId={appointment.id} />

          {/* P - PRELIMINARY */}
          <section>
            <SectionHeader id="p-sec" title="P — Preliminary Assessment" subtitle="Intake & Baseline Vitals" />
            <PreliminarySection appointment={appointment} saveField={saveField} />
          </section>

          {/* E - EASE */}
          <section>
            <SectionHeader id="e-sec" title="E — Ease the System" subtitle="SNS Down-Regulation" />
            <EaseSection appointment={appointment} saveField={saveField} />
          </section>

          {/* A - ALIGN */}
          <section>
            <SectionHeader id="a-sec" title="A — Align the Hierarchy" subtitle="Neurological Findings & Patterns" />
            <AlignSection pattern={unifiedPattern} onToggle={handleTogglePatternItem} />
          </section>

          {/* C - CORRECT */}
          <section>
            <SectionHeader id="c-sec" title="C — Correct" subtitle="Calibration & Integration" />
            <CorrectSection 
              metadata={metadata} 
              acupoints={appointment.acupoints} 
              brainZoneOptions={brainZoneOptions} 
              inhibitedFindings={activeInhibitedFindings}
              updateMetadataFields={updateMetadataFields} 
              saveField={saveField} 
              onTogglePatternItem={handleTogglePatternItem}
              appointment={appointment}
            />
          </section>

          {/* E - EMBED */}
          <section>
            <SectionHeader id="e2-sec" title="E — Embed" subtitle="Re-Assessment & Homework" />
            <EmbedSection
              appointment={appointment}
              saveField={saveField}
              updatePriorityPattern={updatePriorityPattern}
              onTogglePatternItem={handleTogglePatternItem}
              onUpdate={onUpdate}
              liveUnifiedPattern={unifiedPattern}
              liveMuscleTests={currentMuscleTests}
            />
          </section>

          {/* Footer */}
          <div className="pt-32 border-t-2 border-black text-center space-y-4">
            <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Verified</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Integrated</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-black" /> Encrypted</div>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">Fractal Resolution OS • Resonance Clinical Infrastructure</p>
          </div>
        </div>

        {/* Right Sidebar: Timers + Clinical Reference (Only rendered on Desktop) */}
        {isDesktop && (
          <DocumentRightSidebar
            activeTimerDuration={activeTimerDuration}
            timeLeft={timeLeft}
            startQuickTimer={startQuickTimer}
            stopQuickTimer={stopQuickTimer}
            formatCountdown={formatCountdown}
            currentTime={currentTime}
            appointmentDate={appointment.date}
            clientName={appointment.clients.name}
          />
        )}
      </div>
    </div>
  );
};

export default SessionDocumentView;