
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  CalendarPlus,
  Plus,
  Loader2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentWithClient } from '@/types/crm';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useSessionDocumentState } from '@/hooks/useSessionDocumentState';
import { QuickSessionDialog } from './QuickSessionDialog';

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
  "p-sec":  { letter: "P", color: "text-foreground",  bg: "bg-muted",   focus: "Intake vitals · BOLT score · Coherence · Zone baseline" },
  "e-sec":  { letter: "E", color: "text-chart-primary",    bg: "bg-muted",    focus: "T1 reset · Diaphragm · Vagus nerve stimulation · Harmonic rocking" },
  "a-sec":  { letter: "A", color: "text-muted-foreground", bg: "bg-muted", focus: "Primitive reflexes · Cranial nerves · Muscle assessment · Pattern mapping" },
  "c-sec":  { letter: "C", color: "text-muted-foreground",  bg: "bg-muted",  focus: "LOFI calibration · Afferent / Efferent pathways · Emotional protocol" },
  "e2-sec": { letter: "E", color: "text-chart-emerald", bg: "bg-muted", focus: "Re-challenge all findings · Verify cleared · Prescribe homework" },
};

const SectionHeader = ({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) => {
  const meta = SECTION_META[id];
  return (
    <div id={id} className="mt-16 md:mt-24 mb-6 first:mt-0 scroll-mt-24">
      <div className="flex items-start gap-4 pb-3 border-b-2 border-foreground/20">
        {meta && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xl shrink-0 mt-0.5", meta.bg, meta.color)}>
            {meta.letter}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-tighter leading-tight">{title}</h2>
          {subtitle && <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {meta?.focus && (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground/60 leading-relaxed pl-14">{meta.focus}</p>
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
  const {
    lastSaved,
    openGuides,
    activeSection,
    loadingMuscles,
    currentTime,
    activeTimerDuration,
    timeLeft,
    startQuickTimer,
    stopQuickTimer,
    formatCountdown,
    metadata,
    updateMetadataFields,
    scrollTo,
    toggleGuide,
    brainZoneOptions,
    currentMuscleTests,
    unifiedPattern,
    inhibitedFindings,
    handleTogglePatternItem
  } = useSessionDocumentState({
    appointment,
    onUpdate,
    saveField,
    updatePriorityPattern
  });

  const navigate = useNavigate();

  // Bulletproof JS-based media query to prevent sidebars from rendering on mobile/tablet
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const listener = () => setIsDesktop(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Weekend Mode — hides sidebars and toolbar clutter for focused client work
  const [weekendMode, setWeekendMode] = useState(() => localStorage.getItem('doc_weekend_mode') === 'true');
  useEffect(() => {
    localStorage.setItem('doc_weekend_mode', String(weekendMode));
  }, [weekendMode]);

  // Quick Session dialog state
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);

  // Session switcher state — shows recent appointments in chronological order
  const [sessionSearchOpen, setSessionSearchOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<{ id: string; date: string; client_name: string }[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (sessionSearchOpen && recentSessions.length === 0) {
      setLoadingSessions(true);
      supabase
        .from("appointments")
        .select("id, date, clients!inner(name)")
        .order("date", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (!error && data) {
            const mapped = data.map((a: any) => ({
              id: a.id,
              date: a.date,
              client_name: a.clients?.name || "Unknown",
            }));
            setRecentSessions(mapped);
          }
          setLoadingSessions(false);
        });
    }
  }, [sessionSearchOpen, recentSessions.length]);

  const handleSessionSelect = useCallback(async (appointmentId: string) => {
    setSessionSearchOpen(false);
    navigate(`/appointments/${appointmentId}`);
  }, [navigate]);

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
    <div className="bg-card min-h-screen text-foreground font-sans pb-40 print:p-0 print:m-0">
      {/* Document Controls */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md print:hidden border-b border-border">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-none h-9 px-3 font-medium text-[10px] uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-primary-foreground transition-all shrink-0">
              <ArrowLeft size={14} className="mr-1" /> Exit
            </Button>
            <Popover open={sessionSearchOpen} onOpenChange={setSessionSearchOpen}>
              <PopoverTrigger asChild>
                <button className="text-xs font-semibold text-foreground truncate hover:underline underline-offset-4 transition-all shrink-0">
                  {appointment.clients.name}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 max-h-[400px] overflow-y-auto" align="start">
                <div className="p-3 border-b border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent Sessions</p>
                </div>
                <div className="py-1">
                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentSessions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No sessions found
                    </div>
                  ) : (
                    recentSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSessionSelect(session.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-xs border-b border-border/50 last:border-0",
                          session.id === appointment.id && "bg-muted/60"
                        )}
                      >
                        <span className="font-medium text-foreground truncate flex-1">{session.client_name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                          {format(new Date(session.date), "MMM d, yyyy")}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 shrink-0">{appointment.status}</span>
            <button
              onClick={async () => {
                if (!appointment.is_paid) {
                  await saveField('is_paid', true);
                } else if (!appointment.payment_received) {
                  await saveField('payment_received', true);
                } else {
                  await saveField('is_paid', false);
                  await saveField('payment_received', false);
                }
              }}
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors shrink-0",
                !appointment.is_paid
                  ? "text-muted-foreground border-border hover:bg-muted/50"
                  : appointment.payment_received
                    ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                    : "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
              )}
              title="Click to cycle: Free → Due → Paid"
            >
              {!appointment.is_paid ? 'Free' : appointment.payment_received ? 'Paid' : `Due $${appointment.clients.standard_rate || appointment.price_amount || 50}`}
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider hidden sm:inline">Last Sync</p>
              <p className="text-[10px] font-medium tabular-nums">{format(lastSaved, "HH:mm:ss")}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {!weekendMode && (
                <>
                  <Button variant="outline" size="sm"
                    onClick={() => setQuickSessionOpen(true)}
                    className="rounded-none border-foreground/20 font-medium text-[10px] uppercase tracking-wider h-8 px-3 hover:bg-muted">
                    <Plus size={12} className="mr-1" /> New Session
                  </Button>
                  {appointment.clients.phone && (
                    <Button variant="outline" size="sm"
                      onClick={() => window.open(`imessage:${appointment.clients.phone}`, '_blank')}
                      className="rounded-none border-foreground/20 font-medium text-[10px] uppercase tracking-wider h-8 px-3 hover:bg-muted">
                      <MessageCircle size={12} className="mr-1" /> Message
                    </Button>
                  )}
                  {appointment.notion_link && (
                    <Button asChild variant="outline" size="sm" className="rounded-none border-foreground/20 font-medium text-[10px] uppercase tracking-wider h-8 px-3 hover:bg-muted">
                      <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={12} className="mr-1" /> Notion
                      </a>
                    </Button>
                  )}
                  <Link to={`/schedule?view=list&clientId=${appointment.clients.id}`} className="no-underline">
                    <Button variant="outline" size="sm" className="rounded-none border-foreground/20 font-medium text-[10px] uppercase tracking-wider h-8 px-3 hover:bg-muted">
                      <CalendarPlus size={12} className="mr-1" /> Book Next
                    </Button>
                  </Link>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-none border-foreground/20 font-medium text-[10px] uppercase tracking-wider h-8 px-3 hover:bg-muted">
                <Printer size={12} className="mr-1" /> Print
              </Button>
              <button
                onClick={() => setWeekendMode(v => !v)}
                className={cn(
                  "h-8 px-3 text-[10px] font-bold uppercase tracking-wider border transition-colors",
                  weekendMode
                    ? "bg-foreground text-primary-foreground border-foreground/20"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground"
                )}
                title={weekendMode ? "Exit Weekend Mode — show full interface" : "Weekend Mode — hide sidebars and focus on the session"}
              >
                <Minimize2 size={12} className={cn("transition-transform", weekendMode && "rotate-45")} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout: Sidebar + Document + Right Sidebar */}
      <div className="w-full px-4 md:px-6 flex flex-col lg:flex-row gap-6 lg:gap-12 items-start justify-start pt-8 print:block print:p-0">
        
        {/* Left Sidebar: Outline & Corrections Guide (Only rendered on Desktop) */}
        {isDesktop && !weekendMode && (
          <DocumentSidebar 
            activeSection={activeSection} 
            scrollTo={scrollTo} 
            openGuides={openGuides} 
            toggleGuide={toggleGuide} 
          />
        )}

        {/* Center: The Document */}
        <div className={cn(
          "flex-1 w-full mx-auto bg-card border-none md:border md:border-border md:shadow-sm p-3 sm:p-6 md:p-8 min-h-[900px] print:border-none print:p-0",
          weekendMode ? "max-w-[1100px]" : "max-w-[850px]"
        )}>
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
          <div className="pt-32 border-t-2 border-foreground/20 text-center space-y-4">
            <div className="flex justify-center gap-12 text-[10px] font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-foreground" /> Verified</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-foreground" /> Integrated</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-foreground" /> Encrypted</div>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Session Complete</p>
          </div>
        </div>

        {/* Right Sidebar: Timers + Clinical Reference (Only rendered on Desktop) */}
        {isDesktop && !weekendMode && (
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

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
    </div>
  );
};

export default SessionDocumentView;