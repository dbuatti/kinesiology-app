import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import {
  ArrowLeft, Loader2, Activity, FileText,
  Maximize2, Minimize2, Calendar, Clock, User, BookOpen,
  Plus, LayoutGrid, Archive, StickyNote, MoreHorizontal
} from "lucide-react";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PeaceWizard from "@/components/crm/v2/PeaceWizard";
import PeaceWizardV3 from "@/components/crm/v3/PeaceWizardV3";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";
import { CorrectionDockProvider } from "@/components/crm/corrections/CorrectionDockContext";
import CorrectionDock from "@/components/crm/corrections/CorrectionDock";
import CorrectionDockButton from "@/components/crm/corrections/CorrectionDockButton";
import CorrectionDockShortcuts from "@/components/crm/corrections/CorrectionDockShortcuts";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import PathwayReflexStimGrid from "@/components/crm/PathwayReflexStimGrid";
import QuickNotesDialog from "@/components/crm/QuickNotesDialog";
import HowToSearch from "@/components/crm/HowToSearch";
import SessionClockPill from "@/components/crm/SessionClockPill";
import { parseClientJournal } from "@/utils/journal-helper";
import { safeParse } from "@/utils/safe-json";
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import type { ProtocolLog, ProtocolLogPatch } from "@/data/protocol-log";


const AppointmentV2Page = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  // The public demo route is a literal path, so there is no :id param.
  const isDemo =
    id === DEMO_APPOINTMENT_ID ||
    window.location.pathname.replace(/\/+$/, "") === "/appointments/demo";

  const {
    appointment,
    history,
    loading,
    saveField,
    updatePriorityPattern,
    updateMetadata,
    refresh
  } = useAppointment(isDemo ? DEMO_APPOINTMENT_ID : id);

  const [viewMode, setViewMode] = useState<'peace' | 'grid' | 'doc'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'doc' ? 'doc' : 'peace';
  });
  // The demo is a review surface: it should always open in the windowed app
  // shell (sidebar visible), never inherit a persisted fullscreen choice that
  // hides the chrome and reads as a different, older page.
  const [isFullScreen, setIsFullScreen] = useState(() =>
    isDemo ? false : localStorage.getItem('rk_v2_fullscreen') === 'true'
  );
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(0);

  // Correction logs written at the table (metadata.protocol_logs).
  const metadata = useMemo<Record<string, unknown>>(() => {
    if (!appointment?.metadata) return {};
    return typeof appointment.metadata === "string"
      ? safeParse(appointment.metadata, {})
      : (appointment.metadata as Record<string, unknown>);
  }, [appointment?.metadata]);

  const protocolLogs = useMemo(
    () => (metadata.protocol_logs ?? {}) as Record<string, ProtocolLog>,
    [metadata]
  );

  const handleLogProtocol = useCallback(
    (processId: string, patch: ProtocolLogPatch) => {
      updateMetadata((current) => {
        const logs = { ...((current.protocol_logs as Record<string, ProtocolLog>) ?? {}) };
        const previous = logs[processId] ?? {};
        const resolved = typeof patch === "function" ? patch(previous) : patch;
        logs[processId] = {
          ...previous,
          ...resolved,
          updatedAt: new Date().toISOString(),
        };
        return { ...current, protocol_logs: logs };
      });
    },
    [updateMetadata]
  );

  const phaseStatus = useMemo(() => ({
    p: !!(appointment?.goal && appointment?.issue),
    e1: !!(appointment?.lymphatic_notes || appointment?.harmonic_rocking_notes ||
           appointment?.t1_reset_notes || appointment?.diaphragm_reset_notes || appointment?.vagus_nerve_notes),
    a: !!(appointment?.priority_pattern && appointment?.priority_pattern !== "{}"),
    c: !!(appointment?.modes_balances),
    e2: !!(appointment?.session_north_star),
  }), [appointment]);
  // Track current position through the process (where the practitioner is now).
  const phaseProgress = ((activePhase + 1) / 5) * 100;

  useEffect(() => {
    const handler = () => setIsFullScreen(localStorage.getItem('rk_v2_fullscreen') === 'true');
    window.addEventListener('antigravity_fullscreen_change', handler);
    return () => window.removeEventListener('antigravity_fullscreen_change', handler);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNotesOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleFullScreen = () => {
    const next = !isFullScreen;
    // The demo keeps its fullscreen choice local to the session — it must not
    // change what the practitioner's real appointment pages open into.
    if (!isDemo) localStorage.setItem('rk_v2_fullscreen', String(next));
    setIsFullScreen(next);
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
        <p className="text-muted-foreground font-medium">Session not found.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/practice/clinical-hub"><ArrowLeft size={16} className="mr-2" /> Back to Hub</Link>
        </Button>
      </div>
    );
  }

  if (!session && !isDemo) {
    navigate("/login");
    return null;
  }

  const MODE_TABS = [
    { id: 'peace' as const, label: 'PEACE', icon: Activity },
    { id: 'grid' as const, label: 'Grid', icon: LayoutGrid },
    { id: 'doc' as const, label: 'Doc', icon: FileText },
  ];

  return (
    <CorrectionDockProvider
      appointmentId={appointment.id}
      protocolLogs={protocolLogs}
      onLogProtocol={handleLogProtocol}
    >
      <CorrectionDockShortcuts />
      <div className={cn("min-h-screen bg-background", isFullScreen && "fixed inset-0 z-50 overflow-y-auto")}>
      {/* Session bar — one row: identity, live clock, view switch, session
          actions. It replaces the old timer strip + header + demo banner stack,
          which put four rows of chrome above every phase. */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="h-0.5 w-full bg-border/40">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${phaseProgress}%` }} />
        </div>
        <div className="flex h-14 items-center gap-1.5 px-3 sm:gap-2 sm:px-4 md:gap-3 md:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isDemo ? '/' : '/practice/clinical-hub')}
            title={isDemo ? "Back to home" : "Back to Clinical Hub"}
            className="-ml-2 h-9 shrink-0 rounded-lg px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            <span className="ml-1 hidden text-xs font-medium lg:inline">Back</span>
          </Button>

          <div className="flex min-w-0 items-center gap-2.5">
            {/* The avatar is decoration; on a phone its 42px buy a readable
                client name instead. */}
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:flex">
              <User size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/clients/${appointment.clients?.id}`}
                  className="truncate text-sm font-semibold text-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
                  title="Open client page"
                >
                  {appointment.clients?.name || "Unknown"}
                </Link>
                {(() => {
                  const notes = appointment.clients?.journal ? parseClientJournal(appointment.clients.journal).notes : null;
                  if (!notes) return null;
                  return (
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <button className="hidden shrink-0 text-amber-500 transition-colors hover:text-amber-600 sm:block" title="View practitioner notes">
                          <BookOpen size={14} />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent side="bottom" align="start" className="w-80 rounded-xl border-border p-4">
                        <p className="whitespace-pre-wrap text-xs italic leading-relaxed text-muted-foreground">
                          "{notes}"
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })()}
                {isDemo && (
                  <span
                    className="shrink-0 rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                    title="Public demo — nothing is saved. The side menu needs a practitioner sign-in."
                  >
                    Demo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap text-[11px] text-muted-foreground">
                <span className="hidden items-center gap-1 min-[700px]:flex">
                  <Calendar size={10} />
                  <span>{format(new Date(appointment.date), "EEE, MMM d")}</span>
                  <span className="px-0.5 text-border">·</span>
                </span>
                <Clock size={10} />
                <span>{format(new Date(appointment.date), "h:mm a")}</span>
                {/* Phones have no room for the clock in the bar, so it rides
                    here — right next to the time the session started. */}
                <SessionClockPill
                  appointmentDate={appointment.date}
                  status={appointment.status}
                  className="ml-1 sm:hidden"
                />
              </div>
            </div>
          </div>

          <SessionClockPill
            appointmentDate={appointment.date}
            status={appointment.status}
            className="ml-0.5 hidden sm:inline-flex md:ml-1"
          />

          <div className="ml-auto flex min-w-0 items-center gap-1">
            <div className="mr-1 flex min-w-0 items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5 whitespace-nowrap">
              {MODE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    title={tab.id === 'grid' ? 'Free-form pathway stimulation (iPad-friendly notepad)' : tab.id === 'doc' ? 'Document view of the session' : 'Guided PEACE flow'}
                    aria-pressed={isActive}
                    className={cn(
                      "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors xl:px-2.5",
                      isActive
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={14} className={cn(isActive && "text-primary")} />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {!isDemo && (
              <button
                onClick={() => setQuickSessionOpen(true)}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2 text-[12px] font-medium whitespace-nowrap shadow-xs hover:bg-muted md:px-2.5"
                title="FILE > NEW — Create a new session"
              >
                <Plus size={13} /> <span className="hidden md:inline">New</span>
              </button>
            )}
            <button
              onClick={() => setNotesOpen(true)}
              className="hidden h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2 text-[12px] font-medium whitespace-nowrap shadow-xs hover:bg-muted sm:inline-flex md:px-2.5"
              title="Quick notes — open a notes box from anywhere (N)"
            >
              <StickyNote size={13} /> <span className="hidden xl:inline">Notes</span>
            </button>
            <div className="mx-0.5 hidden h-6 w-px shrink-0 bg-border sm:block" />
            <CorrectionDockButton />
            <span className="hidden sm:inline-flex">
              <HowToSearch />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground" aria-label="More session actions">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {isDemo && !session && (
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="flex items-center gap-2">
                      <User size={14} /> Sign in to the full app
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to={`/appointments/${id}/archive`} className="flex items-center gap-2">
                    <Archive size={14} /> Archived (legacy) view
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleFullScreen} className="flex items-center gap-2">
                  {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content + dock — the manual sits beside the finding, never on top of it. */}
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
      {viewMode === 'peace' && (
        <div className="mx-auto w-full max-w-[1120px] px-4 py-5 md:px-8">
          <ErrorBoundary>
            {isDemo ? (
              <PeaceWizardV3
                appointment={appointment}
                history={history}
                onUpdate={refresh}
                saveField={saveField}
                updatePriorityPattern={updatePriorityPattern}
                onPhaseChange={setActivePhase}
                onFinalise={() => showSuccess("Demo session — nothing was saved.")}
              />
            ) : (
              <PeaceWizard
                appointment={appointment}
                history={history}
                onUpdate={refresh}
                saveField={saveField}
                updatePriorityPattern={updatePriorityPattern}
                onPhaseChange={setActivePhase}
                onFinalise={async () => {
                  try {
                    const { error } = await supabase
                      .from('appointments')
                      .update({ status: 'Completed' })
                      .eq('id', id);
                    if (error) throw error;
                    navigate(`/appointments/${id}`);
                  } catch (err) {
                    console.error("Failed to finalise session:", err);
                    showError("Failed to complete session. Please try again.");
                  }
                }}
              />
            )}
          </ErrorBoundary>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="px-4 md:px-8 py-6 w-full">
          <ErrorBoundary>
            <PathwayReflexStimGrid
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              updatePriorityPattern={updatePriorityPattern}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
            />
          </ErrorBoundary>
        </div>
      )}

      {viewMode === 'doc' && (
        <AppointmentV2DocView
          appointment={appointment}
          history={history}
          onBack={() => setViewMode('peace')}
          saveField={saveField}
          updatePriorityPattern={updatePriorityPattern}
        />
      )}

        </div>
        <CorrectionDock />
      </div>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />
      <QuickNotesDialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        initialValue={appointment.notes}
        onSave={saveField}
        title={`Quick Notes — ${appointment.clients?.name || "Session"}`}
        subtitle={format(new Date(appointment.date), "EEE, MMM d · h:mm a")}
        goal={appointment.goal}
        issue={appointment.issue}
      />
      </div>
    </CorrectionDockProvider>
  );
};

export default AppointmentV2Page;
