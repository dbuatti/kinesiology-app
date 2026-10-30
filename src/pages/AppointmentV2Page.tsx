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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Activity,
  FileText,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  User,
  BookOpen,
  Plus,
  LayoutGrid,
  Archive,
  StickyNote,
  MoreHorizontal,
  Zap,
  Brain,
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PeaceWizard, { PEACE_PHASES } from "@/components/crm/v2/PeaceWizard";
import PeaceWizardV3 from "@/components/crm/v3/PeaceWizardV3";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";
import { CorrectionDockProvider } from "@/components/crm/corrections/CorrectionDockContext";
import CorrectionDock from "@/components/crm/corrections/CorrectionDock";
import CorrectionDockButton from "@/components/crm/corrections/CorrectionDockButton";
import ImageReferenceModal from "@/components/crm/ImageReferenceModal";
import SessionReportModal from "@/components/crm/SessionReportModal";
import CorrectionDockShortcuts from "@/components/crm/corrections/CorrectionDockShortcuts";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import PathwayReflexStimGrid from "@/components/crm/PathwayReflexStimGrid";
import QuickNotesDialog from "@/components/crm/QuickNotesDialog";
import HowToSearch from "@/components/crm/HowToSearch";
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
  const [imageRefOpen, setImageRefOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(0);

  // Report → Manual navigation: deep-link a finding/pathway into the clinical workspace.
  const [pendingManualPathwayId, setPendingManualPathwayId] = useState<string | null>(null);
  const [pendingManualTab, setPendingManualTab] = useState<string | null>(null);

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

  const inhibitionPathwayState = useMemo(
    () => (metadata.inhibition_pathway_state ?? {}) as Record<string, any>,
    [metadata]
  );

  const savedInhibitionPathway = useMemo(
    () => (metadata.inhibition_pathway ?? null) as any,
    [metadata]
  );

  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const startTimer = (minutes: number) => {
    setTimerDuration(minutes);
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Start countdown - for demo, just log and set duration
    console.log(`Starting ${minutes}-minute timer`);
    // Set a brief timeout to show the timer active state
    timerRef.current = window.setTimeout(() => {
      setTimerDuration(null);
    }, minutes * 60_000);
  };

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

  const handleInhibitionPathwayChange = useCallback(
    (pathway: any, state: Record<string, any>) => {
      updateMetadata((current) => ({
        ...current,
        inhibition_pathway: pathway,
        inhibition_pathway_state: state,
      }));
    },
    [updateMetadata]
  );

  // Track current position through the process (where the practitioner is now).
  const phaseProgress = ((activePhase + 1) / 5) * 100;

  /** Session vital signs — BOLT, Coherence, COGS, Neuro — compact status strip. */
  const sessionVitals = useMemo(() => {
    const chips: { label: string; value: string; accent: string }[] = [];
    if (!appointment) return chips;
    if (appointment.bolt_score != null) chips.push({ label: "BOLT", value: `${appointment.bolt_score}s`, accent: "text-chart-emerald" });
    if (appointment.coherence_score != null) chips.push({ label: "Coherence", value: `${appointment.coherence_score}`, accent: "text-primary-strong" });
    const hasCOGS = appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes;
    const hasNeuro = appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes || appointment.righting_reflex_notes;
    if (hasCOGS) chips.push({ label: "COGS", value: "captured", accent: "text-chart-purple" });
    if (hasNeuro) chips.push({ label: "Neuro", value: "captured", accent: "text-chart-rose" });
    return chips;
  }, [appointment]);

  /** PEACE phase completion status — derived from appointment fields. */
  const phaseStatus = useMemo(() => {
    if (!appointment) return {};
    return {
      p: !!(appointment.goal && appointment.issue),
      e1: !!(appointment.lymphatic_notes || appointment.harmonic_rocking_notes ||
             appointment.t1_reset_notes || appointment.diaphragm_reset_notes || appointment.vagus_nerve_notes),
      a: !!(appointment.priority_pattern && appointment.priority_pattern !== "{}"),
      c: !!(appointment.modes_balances),
      e2: !!(appointment.session_north_star),
    };
  }, [appointment]);

  /** PEACE phase navigation — moved up from PeaceWizard/PeaceWizardV3 into the unified header. */
  const goBack = useCallback(() => {
    setActivePhase(prev => Math.max(prev - 1, 0));
  }, []);

  const goNext = useCallback(() => {
    setActivePhase(prev => Math.min(prev + 1, PEACE_PHASES.length - 1));
  }, []);

  const jumpTo = useCallback((index: number) => {
    setActivePhase(index);
  }, []);

  /** What the current PEACE phase still needs. */
  const phaseHint = useMemo(() => {
    const activeIsComplete = (phaseStatus as any)[PEACE_PHASES[activePhase].id];
    return activeIsComplete ? "" : PEACE_PHASES[activePhase].hint;
  }, [activePhase, appointment]);

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
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullScreen();
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setImageRefOpen(prev => !prev);
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setReportOpen(prev => !prev);
      }
      // Timer shortcuts: 1 = 3m, 2 = 6m, 3 = 9m
      if (e.key === '1') { e.preventDefault(); startTimer(3); }
      if (e.key === '2') { e.preventDefault(); startTimer(6); }
      if (e.key === '3') { e.preventDefault(); startTimer(9); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleFullScreen = () => {
    const next = !isFullScreen;
    if (!isDemo) localStorage.setItem('rk_v2_fullscreen', String(next));
    setIsFullScreen(next);
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
  };

  // Navigation from SessionReportModal → Grid/Manual
  const handleNavigateToPathway = useCallback((pathwayId: string) => {
    setPendingManualPathwayId(pathwayId);
    setPendingManualTab('muscles'); // Default to Muscles tab for corrections
    setReportOpen(false);
    setViewMode('grid');
  }, []);

  const handleNavigateToMuscles = useCallback(() => {
    setPendingManualTab('muscles');
    setReportOpen(false);
    setViewMode('grid');
  }, []);

  const handleNavigateToReflexes = useCallback(() => {
    setPendingManualTab('reflexes');
    setReportOpen(false);
    setViewMode('grid');
  }, []);

  // React to pending manual navigation
  useEffect(() => {
    if (pendingManualPathwayId) {
      // Navigate to the manual workspace with this pathway loaded
      console.log('[Manual] Loading pathway:', pendingManualPathwayId);
      setPendingManualPathwayId(null);
      // This will be handled by PreliminaryPhaseV3 or another mechanism
    }
  }, [pendingManualPathwayId, viewMode, setViewMode]);

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
      priorityPattern={safeParse(appointment.priority_pattern || "{}", {})}
      protocolLogs={protocolLogs}
      onLogProtocol={handleLogProtocol}
      initialInhibitionPathway={savedInhibitionPathway}
      initialInhibitionPathwayState={inhibitionPathwayState}
      onInhibitionPathwayChange={handleInhibitionPathwayChange}
    >
      <CorrectionDockShortcuts />
      <div className={cn("min-h-screen bg-background", isFullScreen && "fixed inset-0 z-50 overflow-y-auto")}>
      {/* ── Unified session dashboard strip ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        {/* Thin progress line */}
        <div className="h-[2px] w-full bg-border/20">
          <div className="h-full bg-gradient-to-r from-chart-emerald to-primary transition-all duration-500 ease-out" style={{ width: `${phaseProgress}%` }} />
        </div>

        {/* ── Top utility bar (~42px) ── */}
        <div className="flex h-[42px] shrink-0 items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Left: Back + Identity + Date/Time */}
          <div className="flex min-w-0 items-center gap-3">
            {viewMode !== 'doc' && (
              <button
                onClick={() => navigate(isDemo ? '/' : '/practice/clinical-hub')}
                title={isDemo ? "Back to home" : "Back to Clinical Hub"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div className="min-w-0 flex items-center gap-2">
              <Link
                to={`/clients/${appointment.clients?.id}`}
                className="truncate text-[13px] font-medium tracking-tight text-foreground transition-colors hover:text-primary"
                title="Open client page"
              >
                {appointment.clients?.name || "Unknown"}
              </Link>
              {isDemo && (
                <span className="shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium tracking-tight text-muted-foreground" title="Public demo — nothing is saved.">
                  Demo
                </span>
              )}
            </div>
            <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground/70 sm:flex">
              <Calendar size={11} className="shrink-0" />
              <span className="whitespace-nowrap">{format(new Date(appointment.date), "EEE, MMM d")}</span>
              <span className="text-border">·</span>
              <Clock size={11} className="shrink-0" />
              <span className="whitespace-nowrap">{format(new Date(appointment.date), "h:mm a")}</span>
            </div>
          </div>

          {/* View modes + Action icons */}
          <div className="flex items-center gap-2">
            {/* View modes — PEACE · Grid · Doc */}
            <div className="hidden items-center gap-0.5 rounded-lg bg-muted/30 p-0.5 sm:flex">
              {MODE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    title={tab.id === 'grid' ? 'Free-form pathway stimulation' : tab.id === 'doc' ? 'Document view' : 'Guided PEACE flow'}
                    aria-pressed={isActive}
                    className={cn(
                      "flex h-7 items-center gap-1 rounded-md px-2.5 text-[10.5px] font-medium transition-colors",
                      isActive
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Icon size={11} />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Action icons (muted) */}
            <div className="flex items-center gap-0.5">
            {!isDemo && (
              <button
                onClick={() => setQuickSessionOpen(true)}
                title="New session"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <Plus size={15} />
              </button>
            )}
            <button
              onClick={() => setNotesOpen(true)}
              title="Session notes (N)"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <StickyNote size={15} />
            </button>
            <CorrectionDockButton />
            <span className="hidden sm:inline-flex">
              <HowToSearch />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  aria-label="More session actions"
                >
                  <MoreHorizontal size={15} />
                </button>
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
                  {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  {isFullScreen ? "Exit fullscreen" : "Fullscreen"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </div>

        {/* ── Main progress header (~68px) — PEACE view only ── */}
        {viewMode === 'peace' && (
          <div className="flex h-[68px] shrink-0 items-center justify-between gap-6 border-t border-border/30 px-4 sm:px-6 md:px-8">
            {/* Center: Horizontal progress stepper */}
            <div className="flex-1 min-w-0 flex justify-center">
              <div className="relative flex items-center justify-between max-w-[480px] w-full">
                {/* Connecting line */}
                <div className="absolute left-[16px] right-[16px] top-[16px] h-[2px] rounded-full bg-border/40" />
                <div
                  className="absolute left-[16px] top-[16px] h-[2px] rounded-full bg-gradient-to-r from-chart-emerald to-primary transition-all duration-700 ease-out"
                  style={{ width: `${(activePhase / (PEACE_PHASES.length - 1)) * (100 - 6)}%` }}
                />

                {PEACE_PHASES.map((phase, index) => {
                  const isCompleted = (phaseStatus as any)[phase.id];
                  const isActive = activePhase === index;
                  const isPast = index < activePhase;
                  const canJump = isCompleted || isPast || index === 0 || (phaseStatus as any)[PEACE_PHASES[index - 1]?.id];

                  return (
                    <button
                      key={phase.id}
                      onClick={() => canJump && jumpTo(index)}
                      disabled={!canJump}
                      className={cn("group relative flex flex-col items-center gap-1.5 outline-none", !canJump && "cursor-not-allowed opacity-40")}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Phase ${index + 1}: ${phase.fullLabel}${isCompleted ? " (complete)" : ""}`}
                    >
                      {/* Circle */}
                      <span
                        className={cn(
                          "relative flex items-center justify-center rounded-full border-2 transition-all duration-300",
                          isActive
                            ? "h-9 w-9 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : isCompleted
                              ? "h-8 w-8 border-chart-emerald bg-chart-emerald text-white"
                              : "h-8 w-8 border-border bg-card text-muted-foreground",
                          canJump && !isActive && "group-hover:border-foreground/30 group-hover:scale-105"
                        )}
                      >
                        {isCompleted && !isActive ? (
                          <CheckCircle2 size={14} strokeWidth={2.5} />
                        ) : (
                          <span className={cn("font-serif font-medium leading-none", isActive ? "text-[13px]" : "text-[11px]")}>
                            {phase.label}
                          </span>
                        )}
                      </span>
                      {/* Label */}
                      <span
                        className={cn(
                          "text-[10px] leading-tight transition-colors",
                          isActive ? "font-semibold text-foreground" : isCompleted ? "font-medium text-chart-emerald" : "font-medium text-muted-foreground"
                        )}
                      >
                        {phase.fullLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Hint text */}
              {phaseHint && (
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  {phaseHint}
                </p>
              )}
            </div>

            {/* Right: Primary Next button */}
            {activePhase < PEACE_PHASES.length - 1 ? (
              <Button
                onClick={goNext}
                title="Next phase (→)"
                className="h-10 shrink-0 rounded-xl bg-primary px-5 text-[12px] font-medium shadow-sm hover:bg-primary/90"
              >
                Next <ChevronRight size={14} className="ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={onFinalise || onUpdate}
                className="h-10 shrink-0 rounded-xl bg-chart-emerald px-5 text-[12px] font-medium text-white shadow-sm hover:bg-chart-emerald/90"
              >
                <CheckCircle2 size={14} className="mr-1.5" /> Finalise
              </Button>
            )}
          </div>
        )}

        {/* ── Status strip (lighter) ── */}
        {sessionVitals.length > 0 && (
          <div className="flex h-[28px] shrink-0 items-center gap-3 border-t border-border/30 px-4 sm:px-6 md:px-8">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">Vitals</span>
            <div className="flex items-center gap-2">
              {sessionVitals.map((chip, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[10px] tabular-nums">
                  <span className={cn("h-1.5 w-1.5 rounded-full", chip.accent.replace("text-", "bg-"))} />
                  <span className="font-medium text-muted-foreground/70">{chip.label}</span>
                  <span className="font-medium text-foreground">{chip.value}</span>
                </span>
              ))}
            </div>
            {/* View modes moved here */}
            {/* Quick timer pills — 3 / 6 / 9 min */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40">Timer</span>
              {[3,6,9].map(min => (
                <button
                  key={min}
                  onClick={() => startTimer(min)}
                  className={cn(
                    "h-[18px] px-1.5 rounded-md text-[9px] font-medium transition-colors border",
                    timerDuration === min ? "bg-amber-500 text-white border-amber-500" : "bg-muted hover:bg-amber-50 text-muted-foreground hover:text-foreground border-border"
                  )}
                >
                  {min}m
                </button>
              ))}
            </div>
            {/* Spacer for alignment */}
            <div className="ml-auto" />
          </div>
        )}
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
                activePhase={activePhase}
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
                activePhase={activePhase}
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
      <ImageReferenceModal open={imageRefOpen} onClose={() => setImageRefOpen(false)} />
      <SessionReportModal open={reportOpen} onClose={() => setReportOpen(false)} appointment={appointment} updateMetadata={updateMetadata} />
    </CorrectionDockProvider>
  );
};

export default AppointmentV2Page;
