
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
  ChevronDown, ChevronUp, AlertCircle, Plus, Droplets, CreditCard, ShieldAlert, MessageCircle
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

import WeeklyFocusBanner from "@/components/crm/WeeklyFocusBanner";
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
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import { calculateNeuralLoad } from "@/utils/brainstem-logic";
import { generateSessionSummary, generateAICasePrompt } from "@/utils/summary-generator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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
  const [medicalHistoryEditing, setMedicalHistoryEditing] = useState(false);
  const [medicalHistoryValue, setMedicalHistoryValue] = useState("");

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

  const saveClientField = useCallback(async (field: string, value: any) => {
    if (!appointment?.clients?.id) return;
    try {
      const { error } = await supabase
        .from('clients')
        .update({ [field]: value })
        .eq('id', appointment.clients.id);
      if (error) throw error;
      refresh();
    } catch (err: any) {
      showError(err.message || "Failed to save");
    }
  }, [appointment, refresh]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Initializing Workspace</p>
      </div>
    </div>
  );

  if (!appointment) {
    const isInvalidId = id && !loading;
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center", isInvalidId ? "bg-muted" : "bg-muted")}>
            {isInvalidId ? (
              <span className="text-3xl font-semibold text-muted-foreground">?</span>
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">{isInvalidId ? "Appointment Not Found" : "Loading..."}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isInvalidId ? "The appointment you're looking for doesn't exist or was deleted." : "Fetching appointment data..."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="rounded-xl font-medium text-xs">
              <Link to="/schedule?view=list"><ArrowLeft size={14} className="mr-2" /> Back to Schedule</Link>
            </Button>
            {isInvalidId && (
              <Button asChild className="rounded-xl font-medium text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/appointments">View All Appointments</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
      <AppLayout variant="workspace" className="pb-0">
        <div className="max-w-[1600px] mx-auto space-y-4">

          {/* SESSION HEADER */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5 space-y-3">
            {/* Row 1: Back + Client name + Actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/schedule?view=list')}
                  className="h-9 w-9 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0 mt-0.5"
                >
                  <ArrowLeft size={16} />
                </Button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight truncate leading-tight privacy-mode-active:blur-sm">
                      <Link to={`/clients/${appointment.clients.id}`} className="text-foreground hover:text-primary transition-colors no-underline">
                        {appointment.clients.name}
                      </Link>
                    </h1>
                    {isSessionToday && isOngoing && (
                      <Badge className="bg-chart-emerald/10 text-chart-emerald border-none font-medium text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
                        ● LIVE
                      </Badge>
                    )}
                    {appointment.status === 'Completed' && (
                      <Badge className="bg-muted text-muted-foreground border-none font-medium text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="shrink-0" />{format(appointment.date, "E, MMM d")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0" />{format(appointment.date, "h:mm a")}
                    </span>
                    <span className="text-[11px] opacity-60">#{sessionNumber}</span>
                    <Badge variant="outline" className="text-[10px] font-medium border-border text-muted-foreground px-1.5 py-0">{appointment.tag}</Badge>
                    {currentPeakMeridian && (
                      <span className="text-[11px] opacity-60">{currentPeakMeridian.name} peak</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Select value={appointment.status} onValueChange={(v) => saveField('status', v)}>
                  <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs font-medium border-border bg-card text-foreground rounded-lg px-2.5">
                    <SelectValue placeholder={appointment.status} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-border bg-card p-1">
                    {APPOINTMENT_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="rounded-md text-xs text-foreground py-1.5 px-3">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link to="?view=document"
                  className="h-8 px-3 gap-1.5 border-border bg-card rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors inline-flex items-center border no-underline">
                  <FileText size={13} />
                  <span className="hidden md:inline ml-1.5">Doc View</span>
                </Link>
                {appointment.clients.phone && (
                  <Button variant="outline" size="sm"
                    onClick={() => window.open(`imessage:${appointment.clients.phone}`, '_blank')}
                    className="h-8 px-2.5 gap-1.5 border-border bg-card rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title={`Message ${appointment.clients.name}`}>
                    <MessageCircle size={13} />
                    <span className="hidden md:inline">Message</span>
                  </Button>
                )}
                <Button variant="outline" size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={cn(
                    "h-8 px-2.5 gap-1.5 border-border rounded-lg text-xs font-medium transition-colors",
                    showSidebar ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}>
                  {showSidebar ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm"
                      className="h-8 w-8 rounded-lg border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shrink-0">
                      <MoreHorizontal size={15} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
                    <div className="px-3 py-1.5 mb-0.5">
                      <p className="text-[10px] font-medium text-muted-foreground">Session Actions</p>
                    </div>
                    <DropdownMenuItem onClick={toggleFullScreen} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2.5">
                      {isFullScreen ? <Minimize2 size={14} className="text-muted-foreground" /> : <Maximize2 size={14} className="text-muted-foreground" />}
                      <span className="text-xs">{isFullScreen ? "Exit Full Screen" : "Full Screen (Alt+F)"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyOnboardingLink} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2.5">
                      <LinkIcon size={14} className="text-muted-foreground" />
                      <span className="text-xs">Copy Onboarding Link</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSyncToNotion} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2.5">
                      <RefreshCw size={14} className="text-muted-foreground" />
                      <span className="text-xs">Sync to Notion</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyForAI} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2.5">
                      <Sparkles size={14} className="text-muted-foreground" />
                      <span className="text-xs">Copy AI Case Prompt</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem onClick={() => window.print()} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2.5">
                      <Printer size={14} className="text-muted-foreground" />
                      <span className="text-xs">Print Session Report</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem onClick={handleDeleteAppointment} className="rounded-lg py-2 px-3 cursor-pointer flex items-center gap-2.5 text-destructive focus:text-destructive">
                      <Trash2 size={14} />
                      <span className="text-xs">Delete Appointment</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isSessionToday && appointment.status === 'Scheduled' && (
                  <Button onClick={handleStartSession}
                    className="h-8 px-4 bg-chart-primary text-white rounded-lg font-medium text-xs transition-all hover:scale-105 active:scale-95 gap-1.5">
                    <Zap size={13} className="md:hidden" />
                    <span className="hidden md:inline">Start Session</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Row 2: Condition + Weekly Focus */}
            <div className="space-y-3">
              {/* Condition Card */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Condition</span>
                  {appointment.clients.medical_history && (
                    <button
                      onClick={() => { setMedicalHistoryValue(appointment.clients.medical_history || ""); setMedicalHistoryEditing(true); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >Edit</button>
                  )}
                </div>
                {appointment.clients.medical_history ? (
                  <p className="text-sm font-medium text-foreground">
                    {appointment.clients.medical_history}
                  </p>
                ) : (
                  <button
                    onClick={() => { setMedicalHistoryValue(""); setMedicalHistoryEditing(true); }}
                    className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >+ Add condition</button>
                )}
                {medicalHistoryEditing && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setMedicalHistoryEditing(false)}>
                    <div className="w-96 p-4 rounded-xl border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        value={medicalHistoryValue}
                        onChange={(e) => setMedicalHistoryValue(e.target.value)}
                        className="w-full min-h-[80px] rounded-lg border border-border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring mb-3"
                        placeholder="e.g., Vasovagal syncope / autonomic dysfunction"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMedicalHistoryEditing(false)} className="h-7 text-xs rounded-lg">Cancel</Button>
                        <Button size="sm" onClick={async () => {
                          await saveClientField('medical_history', medicalHistoryValue || null);
                          setMedicalHistoryEditing(false);
                        }} className="h-7 text-xs rounded-lg">Save</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Focus */}
              <WeeklyFocusBanner appointmentId={appointment.id} priorityPattern={appointment.priority_pattern} onSaveField={saveField} />
            </div>

            {/* Row 3: Meta footer */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 border-t border-border">
              <button onClick={async () => {
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
                  "flex items-center gap-1 text-xs transition-colors",
                  appointment.payment_received ? "text-chart-emerald hover:text-chart-emerald/80" :
                  appointment.is_paid ? "text-chart-destructive hover:text-chart-destructive/80" :
                  "text-muted-foreground hover:text-foreground"
                )}>
                <CreditCard size={12} />
                {!appointment.is_paid ? "Free" : appointment.payment_received ? "Paid" : `$${appointment.clients.standard_rate || appointment.price_amount || 50}`}
              </button>
              <span className="text-muted-foreground/30">·</span>
              <div className="flex items-center gap-1">
                <Droplets size={12} className={cn("text-muted-foreground", !appointment.hydrated && "text-chart-destructive")} />
                <Switch checked={appointment.hydrated || false} onCheckedChange={(c) => saveField('hydrated', c)}
                  className="scale-[0.5] origin-left data-[state=checked]:bg-chart-emerald data-[state=unchecked]:bg-muted-foreground/30" />
              </div>
              {!appointment.hydrated && (
                <span className="text-[11px] text-chart-destructive">Hydration priority</span>
              )}
              <span className="text-muted-foreground/30">·</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help flex items-center gap-1">
                      <ShieldAlert size={12} />{calculateNeuralLoad(appointment.priority_pattern || null)}% load
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-lg p-2 bg-foreground text-background text-xs">Threat level based on brainstem nuclei inhibition</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-muted-foreground/30">·</span>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground/50 border-border rounded-md px-2 py-0">
                {appointment.display_id || appointment.id.slice(0,8)}
              </Badge>
              {appointment.bolt_score && appointment.bolt_score < 25 && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-[11px] text-chart-destructive flex items-center gap-1">
                    <AlertCircle size={12} />Low CO₂
                  </span>
                </>
              )}
              {appointment.notion_link && (
                <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer" className="ml-auto">
                  <ExternalLink size={13} className="text-muted-foreground hover:text-foreground transition-colors" />
                </a>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Main content grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-8 transition-all duration-500")}>
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

              {/* Printable worksheet — collapsible */}
              <div className="rounded-xl border border-dashed border-border overflow-hidden">
                <button
                  onClick={() => setShowWorksheet(v => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Printer size={15} className="text-muted-foreground" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Printable Session Worksheet</span>
                  </div>
                  {showWorksheet
                    ? <ChevronUp size={16} className="text-muted-foreground" />
                    : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>
                {showWorksheet && (
                  <div className="bg-muted/10 p-5 md:p-12 mb-8">
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" onClick={() => window.print()} className="rounded-xl font-medium text-xs">
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
