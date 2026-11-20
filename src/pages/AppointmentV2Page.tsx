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
    ChevronRight,
    CheckCircle2,
    Loader2,
    Activity,
    FileText,
    Maximize2,
    Minimize2,
    User,
    Plus,
    LayoutGrid,
    Archive,
    StickyNote,
    Mail,
    MoreHorizontal,
    X,
  } from "lucide-react";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PeaceWizardV3 from "@/components/crm/v3/PeaceWizardV3";
// V3 is the canonical PEACE implementation — the demo and real appointments
// both run it. Phase metadata is taken from the v3 design system so the header
// stepper and the wizard can never disagree.
import { PHASE_SPECS as PEACE_PHASES } from "@/components/crm/v3/DesignSystem";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";
import { CorrectionDockProvider } from "@/components/crm/corrections/CorrectionDockContext";
import CorrectionDock from "@/components/crm/corrections/CorrectionDock";
import CorrectionDockButton from "@/components/crm/corrections/CorrectionDockButton";
import ImageReferenceModal from "@/components/crm/ImageReferenceModal";
import SessionReportModal from "@/components/crm/SessionReportModal";
import { SessionSummaryEmailDialog } from "@/components/crm/SessionSummaryEmailDialog";
import CorrectionDockShortcuts from "@/components/crm/corrections/CorrectionDockShortcuts";
import { QuickSessionDialog } from "@/components/crm/QuickSessionDialog";
import PathwayReflexStimGrid from "@/components/crm/PathwayReflexStimGrid";
import QuickNotesDialog from "@/components/crm/QuickNotesDialog";
import HowToSearch from "@/components/crm/HowToSearch";
import { CTMModal } from "@/components/ctm/CTMModal";
import { safeParse } from "@/utils/safe-json";
import { DEMO_APPOINTMENT_ID } from "@/data/demo-session";
import type { ProtocolLog, ProtocolLogPatch } from "@/data/protocol-log";
import ClientIntakeSummary from "@/components/crm/ClientIntakeSummary";
import ClientIntakeEditModal from "@/components/crm/ClientIntakeEditModal";
import ClientSideSheet, { SessionClientRail } from "@/components/crm/ClientSideSheet";
import type { InhibitionPathwayState } from "@/components/crm/corrections/CorrectionDockContext";

const initialsOf = (name?: string | null): string =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("") || "?";

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
    isDemo ? false : localStorage.getItem('rk_fullscreen') === 'true'
  );
  const [quickSessionOpen, setQuickSessionOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [imageRefOpen, setImageRefOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  const [ctmOpen, setCtmOpen] = useState(false);
  const [intakeEditOpen, setIntakeEditOpen] = useState(false);
  const [clientSheetOpen, setClientSheetOpen] = useState(false);
  const [clientRailOpen, setClientRailOpen] = useState(true);
  const [activePhase, setActivePhase] = useState(0);
  const [phrenicChecked, setPhrenicChecked] = useState(false);
  const [lymphChecked, setLymphChecked] = useState(false);

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
    () => (metadata.inhibition_pathway_state ?? {}) as Record<string, InhibitionPathwayState>,
    [metadata]
  );

  const savedInhibitionPathway = useMemo(
    () => (metadata.inhibition_pathway ?? null) as unknown,
    [metadata]
  );

  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(0); // seconds
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<number | null>(null);
  const timerEndsAtRef = useRef<number | null>(null);
  const timerDoneRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (timerDoneRef.current) window.clearTimeout(timerDoneRef.current);
    timerRef.current = null;
    timerDoneRef.current = null;
    timerEndsAtRef.current = null;
    setTimerDuration(null);
    setTimerRemaining(0);
    setTimerDone(false);
  }, []);

  const startTimer = useCallback((minutes: number) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (timerDoneRef.current) window.clearTimeout(timerDoneRef.current);
    setTimerDone(false);
    const totalSeconds = Math.round(minutes * 60);
    timerEndsAtRef.current = Date.now() + totalSeconds * 1000;
    setTimerDuration(minutes);
    setTimerRemaining(totalSeconds);
    // Tick on an interval and derive remaining time from a wall-clock deadline,
    // so the countdown stays accurate even if the tab is throttled.
    timerRef.current = window.setInterval(() => {
      const endsAt = timerEndsAtRef.current;
      if (!endsAt) return;
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setTimerRemaining(left);
      if (left <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        timerEndsAtRef.current = null;
        setTimerDuration(null);
        setTimerDone(true);
        // Leave the "Done" flag up long enough to notice, then clear it.
        timerDoneRef.current = window.setTimeout(() => {
          setTimerDone(false);
          timerDoneRef.current = null;
        }, 10_000);
      }
    }, 250);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (timerDoneRef.current) window.clearTimeout(timerDoneRef.current);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
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
    (pathway: unknown, state: Record<string, unknown>) => {
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

  /** How many high-priority corrections have been logged this session. */
  const correctionCount = useMemo(() => {
    let n = 0;
    for (const log of Object.values(protocolLogs)) {
      if (Array.isArray(log.entries)) n += log.entries.length;
      else if (log.values && Object.keys(log.values).length > 0) n += 1;
    }
    if (Array.isArray(metadata.corrections)) n += metadata.corrections.length;
    return n;
  }, [protocolLogs, metadata]);

  /** PEACE phase navigation — moved up from PeaceWizard/PeaceWizardV3 into the unified header. */
  const goNext = useCallback(() => {
    setActivePhase(prev => Math.min(prev + 1, PEACE_PHASES.length - 1));
  }, []);

  const jumpTo = useCallback((index: number) => {
    setActivePhase(index);
  }, []);

  /** What the current PEACE phase still needs. */
  const phaseHint = useMemo(() => {
    const activeIsComplete = (phaseStatus as Record<string, boolean>)[PEACE_PHASES[activePhase].id];
    return activeIsComplete ? "" : PEACE_PHASES[activePhase].hint;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: effect/callback is keyed on its real inputs; adding this would re-run every render
  }, [activePhase, appointment, phaseStatus]);

  useEffect(() => {
    const handler = () => setIsFullScreen(localStorage.getItem('rk_fullscreen') === 'true');
    window.addEventListener('rk_fullscreen_change', handler);
    return () => window.removeEventListener('rk_fullscreen_change', handler);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // While the CTM modal is open it owns the keyboard: 1-4 select its phases,
      // so none of the page shortcuts (timer 1/2/3, n/f/s/r/c) should fire.
      if (ctmOpen) return;
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
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setCtmOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: effect/callback is keyed on its real inputs; adding this would re-run every render
  }, [ctmOpen]);

  const toggleFullScreen = () => {
    const next = !isFullScreen;
    if (!isDemo) localStorage.setItem('rk_fullscreen', String(next));
    setIsFullScreen(next);
    window.dispatchEvent(new Event('rk_fullscreen_change'));
  };

  /** Single completion path for both the header Finalise button and the wizard. */
  const handleFinalise = useCallback(async () => {
    if (isDemo) {
      showSuccess("Demo session — nothing was saved.");
      return;
    }
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
  }, [isDemo, id, navigate]);

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
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${phaseProgress}%` }} />
        </div>

        {/* ── Top utility bar (~42px) ── */}
        <div className="flex h-[42px] shrink-0 items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Left: Back + view modes */}
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
          </div>

          {/* Right: identity (opens the client rail) + action icons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  if (window.matchMedia("(min-width: 1100px)").matches) setClientRailOpen((v) => !v);
                  else setClientSheetOpen(true);
                }}
                title={`${appointment.clients?.name || "Client"} — client overview`}
                aria-label="Client overview"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary-strong ring-1 ring-primary/20 transition-colors hover:bg-primary/15"
              >
                {initialsOf(appointment.clients?.name)}
              </button>
            </div>
            {/* Session timer — 3 / 6 / 9 min; the active pill becomes a live countdown */}
            <div className="flex items-center gap-1 shrink-0">
              {timerDone && (
                <button
                  onClick={() => setTimerDone(false)}
                  className="h-[18px] px-1.5 rounded-md border border-primary bg-primary text-[9px] font-bold text-primary-foreground"
                  title="Timer finished — tap to dismiss"
                >
                  Done
                </button>
              )}
              {[3, 6, 9].map(min => {
                const active = timerDuration === min;
                return (
                  <button
                    key={min}
                    onClick={() => (active ? stopTimer() : startTimer(min))}
                    title={active ? `${formatTimer(timerRemaining)} left — tap to stop` : `Start ${min} minute timer (key ${[3, 6, 9].indexOf(min) + 1})`}
                    className={cn(
                      "h-[18px] rounded-md transition-colors border tabular-nums",
                      active
                        ? "min-w-[44px] px-1.5 bg-amber-500 text-white border-amber-500 shadow-sm text-[10px] font-bold"
                        : "px-1.5 bg-muted text-muted-foreground hover:text-foreground border-border text-[9px] font-medium"
                    )}
                  >
                    {active ? formatTimer(timerRemaining) : `${min}m`}
                  </button>
                );
              })}
            </div>
            <span className="h-4 w-px bg-border" aria-hidden />
            {/* Action icons (muted) */}
            <div className="flex items-center gap-0.5">
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
                {!isDemo && (
                  <DropdownMenuItem onClick={() => setQuickSessionOpen(true)} className="flex items-center gap-2">
                    <Plus size={14} /> New session
                  </DropdownMenuItem>
                )}
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
                <DropdownMenuItem onClick={() => { setIntakeOpen(true); }} className="flex items-center gap-2">
                  <User size={14} /> Client Intake
                </DropdownMenuItem>
                {appointment.status === "Completed" && (
                  <DropdownMenuItem onClick={() => setSessionSummaryOpen(true)} className="flex items-center gap-2">
                    <Mail size={14} /> Session summary email
                  </DropdownMenuItem>
                )}
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
                  className="absolute left-[16px] top-[16px] h-[2px] rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${(activePhase / (PEACE_PHASES.length - 1)) * (100 - 6)}%` }}
                />

                {PEACE_PHASES.map((phase, index) => {
                  const isCompleted = (phaseStatus as Record<string, boolean>)[phase.id];
                  const isActive = activePhase === index;
                  const isPast = index < activePhase;
                  const canJump = isCompleted || isPast || index === 0 || (phaseStatus as Record<string, boolean>)[PEACE_PHASES[index - 1]?.id];

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
                            ? "h-9 w-9 border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : isCompleted
                              ? "h-8 w-8 border-primary/30 bg-primary/10 text-primary"
                              : "h-8 w-8 border-border bg-card text-muted-foreground",
                          canJump && !isActive && "group-hover:border-foreground/30 group-hover:scale-105"
                        )}
                      >
                        {isCompleted && !isActive ? (
                          <CheckCircle2 size={13} strokeWidth={2.5} />
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
                          isActive ? "font-semibold text-foreground" : isCompleted ? "font-medium text-foreground/70" : "font-medium text-muted-foreground"
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

            {/* Right: session reminders + primary next action */}
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPhrenicChecked((v) => !v)}
                title="Phrenic nerve — check every session"
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-medium transition-colors",
                  phrenicChecked
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] font-bold",
                  phrenicChecked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}>
                  {phrenicChecked ? "✓" : ""}
                </span>
                Phrenic
              </button>
              <button
                type="button"
                onClick={() => setLymphChecked((v) => !v)}
                title="Lymph — check every session"
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-medium transition-colors",
                  lymphChecked
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] font-bold",
                  lymphChecked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}>
                  {lymphChecked ? "✓" : ""}
                </span>
                Lymph
              </button>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70"
                title="High-priority corrections — the 'Less is More' target is 3–6"
              >
                <span className="font-semibold uppercase tracking-[0.12em]">Corr</span>
                <span className={cn(
                  "font-bold tabular-nums",
                  correctionCount === 0 ? "text-muted-foreground/50" :
                  correctionCount <= 6 ? "text-foreground" : "text-chart-destructive"
                )}>
                  {correctionCount}
                </span>
                <span className="text-muted-foreground/50">/ 3–6</span>
              </span>
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
                  onClick={handleFinalise}
                  className="h-10 shrink-0 rounded-xl bg-primary px-5 text-[12px] font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Finalise
                </Button>
              )}
            </div>
          </div>
        )}

      </header>

      {/* Content + dock — the manual sits beside the finding, never on top of it. */}
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
      {viewMode === 'peace' && (
        <div className="mx-auto w-full max-w-[1120px] px-4 py-5 md:px-8">
          <ErrorBoundary>
            <PeaceWizardV3
              appointment={appointment}
              history={history}
              onUpdate={refresh}
              saveField={saveField}
              updatePriorityPattern={updatePriorityPattern}
              onPhaseChange={setActivePhase}
              activePhase={activePhase}
              onFinalise={handleFinalise}
            />
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
        {clientRailOpen && (
          <SessionClientRail
          clientId={appointment.clients?.id || ""}
          clientName={appointment.clients?.name || "Client"}
          sessionDate={appointment.date}
          isDemo={isDemo}
          paymentReceived={appointment.payment_received}
          isPaidService={appointment.is_paid}
          priceAmount={appointment.price_amount ?? appointment.clients?.standard_rate ?? null}
          paymentMethod={appointment.payment_method}
          appointmentStatus={appointment.status}
          vitals={sessionVitals}
          onCollapse={() => setClientRailOpen(false)}
        />
        )}
      </div>

      <QuickSessionDialog open={quickSessionOpen} onOpenChange={setQuickSessionOpen} />

      <ClientSideSheet
        open={clientSheetOpen}
        onOpenChange={setClientSheetOpen}
        clientId={appointment.clients?.id || ""}
        clientName={appointment.clients?.name || "Client"}
        sessionDate={appointment.date}
        isDemo={isDemo}
        paymentReceived={appointment.payment_received}
        isPaidService={appointment.is_paid}
        priceAmount={appointment.price_amount ?? appointment.clients?.standard_rate ?? null}
        paymentMethod={appointment.payment_method}
        appointmentStatus={appointment.status}
      />

      {intakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="flex w-full max-w-2xl max-h-[88vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                  {appointment.clients?.name || "Client"}
                </h2>
                <p className="text-[11px] text-muted-foreground">Client Intake Summary</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => { setIntakeOpen(false); setIntakeEditOpen(true); }}
                  className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Edit
                </button>
                <button
                  onClick={() => setIntakeOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close intake summary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <ClientIntakeSummary data={(appointment.clients as unknown) as Record<string, unknown>} />
            </div>
          </div>
        </div>
      )}

      {intakeEditOpen && (
        <ClientIntakeEditModal
          clientId={appointment.clients?.id || ""}
          initialData={(appointment.clients as unknown) as Record<string, unknown>}
          onClose={() => setIntakeEditOpen(false)}
          onSave={() => { refresh(); setIntakeOpen(true); }}
        />
      )}

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
      <SessionReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        appointment={appointment}
        updateMetadata={async (metadata) => { await updateMetadata(metadata); }}
      />
      <SessionSummaryEmailDialog
        open={sessionSummaryOpen}
        onOpenChange={setSessionSummaryOpen}
        appointment={appointment}
        refresh={refresh}
      />
      <CTMModal
        open={ctmOpen}
        onOpenChange={setCtmOpen}
        inhibitionState={inhibitionPathwayState}
      />
    </CorrectionDockProvider>
  );
};

export default AppointmentV2Page;
