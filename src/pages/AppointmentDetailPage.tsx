
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { BrainZoneAssessment } from "@/components/crm/BrainZoneAssessment";
import { MuscleAssessment } from "@/components/crm/MuscleAssessment";
import EmotionsProtocolReference from "@/components/crm/EmotionsProtocolReference";
import MechanoreceptiveAssessment from "@/components/crm/MechanoreceptiveAssessment";
import HeartWallProtocol from "@/components/crm/HeartWallProtocol";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, Brain, Loader2, Zap, FileText, Heart,
  Activity, Shield, Layers, Dumbbell, RefreshCw,
  Eye, EyeOff, Save, ShieldCheck, LayoutGrid,
  ChevronRight, Settings2, Sparkles, Globe, ExternalLink,
  PanelLeftClose, PanelLeftOpen, ClipboardCheck, MoreHorizontal, Printer,
  ArrowLeft, Calendar, Clock, Link as LinkIcon, Maximize2, Minimize2, Trash2,
  ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { isToday, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Nuclei } from "@/utils/brainstem-logic";

// Layouts
import AppLayout from "@/components/crm/AppLayout";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppointmentHeader from "@/components/crm/AppointmentHeader";
import WeeklyFocusBanner from "@/components/crm/WeeklyFocusBanner";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import AppointmentSidebar from "@/components/crm/AppointmentSidebar";
import SessionWorksheetTemplate from "@/components/crm/SessionWorksheetTemplate";
import SessionDocumentView from "@/components/crm/SessionDocumentView";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { generateSessionSummary, generateAICasePrompt } from "@/utils/summary-generator";

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    appointment,
    history,
    loading,
    saveField,
    updatePriorityPattern,
    refresh
  } = useAppointment(id);

  const [showSidebar, setShowSidebar] = useState(false);
  const [nucleiFilter, setNucleiFilter] = useState<Nuclei | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState('baseline');
  const [showWorksheet, setShowWorksheet] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isFullScreen, setIsFullScreen] = useState(() => {
    return localStorage.getItem('antigravity_fullscreen') === 'true';
  });

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(localStorage.getItem('antigravity_fullscreen') === 'true');
    };
    window.addEventListener('antigravity_fullscreen_change', handleFullScreenChange);
    return () => window.removeEventListener('antigravity_fullscreen_change', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    const nextState = !isFullScreen;
    setIsFullScreen(nextState);
    localStorage.setItem('antigravity_fullscreen', String(nextState));
    window.dispatchEvent(new Event('antigravity_fullscreen_change'));
    showSuccess(nextState ? "Full Screen Mode Enabled" : "Full Screen Mode Disabled");
  };

  const isDocumentView = searchParams.get("view") === "document";
  const setIsDocumentView = (val: boolean) => {
    if (val) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set("view", "document");
        return next;
      }, { replace: true });
    } else {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("view");
        return next;
      }, { replace: true });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchReflections = async () => {
      const { data } = await supabase
        .from('practitioner_reflections')
        .select('*')
        .eq('appointment_id', id)
        .order('created_at', { ascending: false });
      setReflections(data || []);
    };
    fetchReflections();
  }, [id]);

  const currentPeakMeridian = useMemo(() => {
    const hour = currentTime.getHours();
    return TCM_CHANNELS.find((channel) => {
      if (channel.peakTime === 'None') return false;
      const parts = channel.peakTime.toLowerCase().split('-').map(p => p.trim());
      if (parts.length !== 2) return false;
      const parseHour = (timeStr: string): number => {
        let h = parseInt(timeStr);
        if (timeStr.includes('pm') && h !== 12) h += 12;
        if (timeStr.includes('am') && h === 12) h = 0;
        return h;
      };
      const start = parseHour(parts[0]);
      const end = parseHour(parts[1]);
      return start > end ? hour >= start || hour < end : hour >= start && hour < end;
    });
  }, [currentTime]);

  const handleCopyOnboardingLink = useCallback(async () => {
    if (!appointment?.clients?.id) return;
    try {
      const url = `${window.location.origin}/onboarding/${appointment.clients.id}`;
      await navigator.clipboard.writeText(url);
      showSuccess("Onboarding link copied");
    } catch {
      showError("Failed to copy link");
    }
  }, [appointment]);

  const handleSyncToNotion = useCallback(async () => {
    if (!appointment) return;
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', { body: { appointment } });
      if (error) throw error;
      showSuccess("Synced to Notion");
      refresh();
    } catch (err: any) {
      showError(err.message || "Failed to sync to Notion");
    }
  }, [appointment, refresh]);

  const handleCopyForAI = () => {
    if (!appointment) return;
    const prompt = generateAICasePrompt(appointment.clients, [appointment]);
    navigator.clipboard.writeText(prompt);
    showSuccess("AI Case Prompt copied");
  };

  const handleClonePrevious = useCallback(async () => {
    if (!appointment || !id) return;
    try {
      const { data: previous, error } = await supabase
        .from('appointments')
        .select('goal, issue, acupoints, priority_pattern')
        .eq('client_id', appointment.clients.id)
        .neq('id', id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (previous) {
        await Promise.all([
          saveField('goal', previous.goal),
          saveField('issue', previous.issue),
          saveField('acupoints', previous.acupoints),
          saveField('priority_pattern', previous.priority_pattern),
        ]);
        showSuccess("Data cloned");
        refresh();
      }
    } catch (err: any) {
      showError("Failed to clone previous session");
    }
  }, [appointment, id, saveField, refresh]);

  const handleDeleteAppointment = useCallback(async () => {
    if (!id || !appointment || !confirm("Are you sure you want to delete this appointment? It will also be removed from Notion and Cal.com if linked.")) return;
    try {
      if (appointment.notion_page_id || appointment.notion_planner_id || appointment.calcom_booking_id) {
        await supabase.functions.invoke('delete-external-appointment', {
          body: {
            notionPageId: appointment.notion_page_id,
            notionPlannerId: appointment.notion_planner_id,
            calcomBookingId: appointment.calcom_booking_id
          }
        });
      }
      const { error = null } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Appointment deleted from all platforms.");
      navigate('/appointments');
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    }
  }, [id, appointment, navigate]);

  const handleStartSession = useCallback(async () => {
    if (!appointment) return;
    await saveField('date', new Date().toISOString());
    showSuccess("Session started");
  }, [appointment, saveField]);

  const handleCopySummary = useCallback(async () => {
    if (!appointment) return;
    const summary = generateSessionSummary(appointment);
    await navigator.clipboard.writeText(summary);
    showSuccess("Summary copied");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [appointment]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Initializing Workspace</p>
      </div>
    </div>
  );

  if (!appointment) return (
    <div className="flex min-h-screen items-center justify-center p-8 text-center">
      <Button asChild><Link to="/appointments">Back to Appointments</Link></Button>
    </div>
  );

  if (isDocumentView) {
    return (
      <SessionDocumentView
        appointment={appointment}
        onUpdate={refresh}
        saveField={saveField}
        updatePriorityPattern={updatePriorityPattern}
        onClose={() => setIsDocumentView(false)}
        history={history}
      />
    );
  }

  const isSessionToday = isToday(new Date(appointment.date));
  const isOngoing = appointment.status !== 'Completed' && appointment.status !== 'Cancelled';
  const sessionNumber = (history?.length ?? 0) + 1;

  return (
    <ErrorBoundary>
      <AppLayout variant="full" className="pb-0">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* SESSION HEADER */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-card p-5 md:p-7 rounded-[2rem] border border-border shadow-md">
            <div className="flex items-start sm:items-center gap-4 md:gap-6 w-full lg:w-auto">
              <Button
                variant="ghost"
                onClick={() => navigate('/schedule?view=list')}
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all shrink-0"
              >
                <ArrowLeft size={18} />
              </Button>

              <div className="space-y-1 min-w-0 flex-1">
                {/* Client name + live badge */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-serif font-bold text-foreground tracking-tighter truncate leading-none privacy-mode-active:blur-sm">
                    {appointment.clients.name}
                  </h1>
                  {isSessionToday && isOngoing && (
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-[0.3em] px-3 py-1 rounded-full animate-pulse shadow-lg shadow-emerald-500/20 shrink-0">
                      ● LIVE
                    </Badge>
                  )}
                  {appointment.status === 'Completed' && (
                    <Badge className="bg-muted text-muted-foreground border-none font-black text-[8px] uppercase tracking-[0.3em] px-3 py-1 rounded-full shrink-0">
                      Completed
                    </Badge>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground font-bold text-xs md:text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-400 shrink-0" />
                    {format(appointment.date, "EEEE, MMMM d")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-400 shrink-0" />
                    {format(appointment.date, "h:mm a")}
                  </span>
                  <Badge variant="outline" className="bg-muted/50 border-border text-muted-foreground font-black text-[8px] uppercase tracking-widest px-2 py-0.5 shrink-0">
                    {appointment.tag}
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    Session #{sessionNumber}
                  </span>
                  {currentPeakMeridian && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      <Zap size={10} /> {currentPeakMeridian.name} peak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1">
              {appointment.notion_link && (
                <Button asChild variant="outline" size="sm"
                  className="flex-1 sm:flex-none h-10 md:h-12 px-4 md:px-6 gap-2 border-border bg-card rounded-xl font-black text-[9px] uppercase tracking-widest text-muted-foreground hover:bg-muted/50 hover:border-border transition-all shadow-sm shrink-0">
                  <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} className="text-emerald-600" />
                    <span className="hidden sm:inline">Notion</span>
                  </a>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={() => setIsDocumentView(true)}
                className="flex-1 sm:flex-none h-10 md:h-12 px-4 md:px-6 gap-2 border-border bg-card rounded-xl font-black text-[9px] uppercase tracking-widest text-muted-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all shadow-sm shrink-0">
                <FileText size={14} className="text-indigo-600" /> Doc View
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className={cn(
                  "flex-1 sm:flex-none h-10 md:h-12 px-4 md:px-6 gap-2 border-border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm shrink-0",
                  showSidebar
                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                    : "bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                {showSidebar ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span className="hidden sm:inline">Sidebar</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"
                    className="h-10 w-10 md:h-12 md:w-12 rounded-xl border-border bg-card text-muted-foreground hover:bg-muted/50 transition-all shadow-sm shrink-0">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-3 rounded-[1.5rem]">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Session Management</p>
                  </div>
                  <DropdownMenuItem onClick={toggleFullScreen} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                    {isFullScreen ? <Minimize2 size={16} className="text-indigo-500" /> : <Maximize2 size={16} className="text-indigo-500" />}
                    <span className="font-bold text-xs">{isFullScreen ? "Exit Full Screen" : "Full Screen (Alt+F)"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyOnboardingLink} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                    <LinkIcon size={16} className="text-indigo-500" />
                    <span className="font-bold text-xs">Copy Onboarding Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSyncToNotion} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                    <RefreshCw size={16} className="text-emerald-500" />
                    <span className="font-bold text-xs">Sync to Notion</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyForAI} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="font-bold text-xs">Copy AI Case Prompt</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={() => window.print()} className="rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3">
                    <Printer size={16} className="text-muted-foreground" />
                    <span className="font-bold text-xs">Print Session Report</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer flex items-center gap-3"
                    onClick={handleDeleteAppointment}
                  >
                    <Trash2 size={16} />
                    <span className="font-bold text-xs">Delete Appointment</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isSessionToday && appointment.status === 'Scheduled' && (
                <Button onClick={handleStartSession}
                  className="flex-1 sm:flex-none h-10 md:h-12 px-6 md:px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 shrink-0">
                  Start Session
                </Button>
              )}
            </div>
          </div>

          {/* Context strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <WeeklyFocusBanner appointmentId={appointment.id} priorityPattern={appointment.priority_pattern} onSaveField={saveField} />
            </div>
            <div className="lg:col-span-4">
              <PreviousSessionInsightsBar clientId={appointment.clients.id} currentAppointmentId={appointment.id} />
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-6 transition-all duration-500")}>
              {/* Clinical workspace card */}
              <div className="bg-card rounded-[2rem] md:rounded-[3rem] border border-border shadow-lg overflow-hidden">
                <div className="p-5 sm:p-8 md:p-12 space-y-10">
                  <AppointmentHeader appointment={appointment} onSaveField={saveField} onUpdate={refresh} />
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <SessionContentSwitcher
                    appointment={appointment}
                    onUpdate={refresh}
                    saveField={saveField}
                    updatePriorityPattern={updatePriorityPattern}
                    history={history}
                    nucleiFilter={nucleiFilter}
                    showSidebar={showSidebar}
                    onToggleSidebar={() => setShowSidebar(!showSidebar)}
                    onClonePrevious={handleClonePrevious}
                    onPrint={() => window.print()}
                    onCopySummary={handleCopySummary}
                    onDelete={handleDeleteAppointment}
                    isCopied={isCopied}
                    onOpenDocument={() => setIsDocumentView(true)}
                    onTabChange={setActivePhaseId}
                  />
                </div>
              </div>

              {/* Printable worksheet — collapsible */}
              <div className="rounded-[2rem] border border-dashed border-border overflow-hidden">
                <button
                  onClick={() => setShowWorksheet(v => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Printer size={15} className="text-muted-foreground" />
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Printable Session Worksheet</span>
                  </div>
                  {showWorksheet
                    ? <ChevronUp size={16} className="text-muted-foreground" />
                    : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>
                {showWorksheet && (
                  <div className="bg-muted/10 p-5 md:p-12 mb-8">
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" onClick={() => window.print()} className="rounded-xl font-bold text-xs">
                        <Printer size={14} className="mr-2" /> Print Worksheet
                      </Button>
                    </div>
                    <div className="max-w-4xl mx-auto">
                      <SessionWorksheetTemplate clientName={appointment.clients.name} date={appointment.date} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showSidebar && (
              <AppointmentSidebar
                appointment={appointment}
                nucleiFilter={nucleiFilter}
                onSelectNuclei={setNucleiFilter}
                reflections={reflections}
                onToggleSidebar={() => setShowSidebar(false)}
                currentPeakMeridian={currentPeakMeridian}
                onSaveField={saveField}
              />
            )}
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default AppointmentDetailPage;
