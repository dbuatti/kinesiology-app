"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Loader2, PanelRightClose, Activity, Brain,
  Calendar, Clock, Copy, Check, Trash2, Printer, RefreshCw,
  Zap, Target, Link as LinkIcon, Sparkles, FileText,
  ChevronRight, PanelRightOpen, MoreHorizontal,
  ArrowLeft, ChevronDown
} from "lucide-react";
import { isToday, format } from "date-fns";

import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAppointment } from "@/hooks/useAppointment";
import { supabase } from "@/integrations/supabase/client";
import { Nuclei } from "@/utils/brainstem-logic";

import AppLayout from "@/components/crm/AppLayout";
import SessionTimer from "@/components/crm/SessionTimer";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AppointmentHeader from "@/components/crm/AppointmentHeader";
import WeeklyFocusBanner from "@/components/crm/WeeklyFocusBanner";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import AppointmentContextCards from "@/components/crm/AppointmentContextCards";
import BrainstemToneMap from "@/components/crm/BrainstemToneMap";
import SessionWorksheetTemplate from "@/components/crm/SessionWorksheetTemplate";
import SessionDocumentView from "@/components/crm/SessionDocumentView";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const { 
    appointment, 
    history, 
    loading, 
    saveField, 
    updatePriorityPattern, 
    refresh 
  } = useAppointment(id);

  // UI States
  const [isFixedHeaderActive, setIsFixedHeaderActive] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isDocumentView, setIsDocumentView] = useState(false);
  const [nucleiFilter, setNucleiFilter] = useState<Nuclei | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState('baseline');

  // Loading states for actions
  const [actionStates, setActionStates] = useState({
    syncingNotion: false,
    copyingLink: false,
    copyingAI: false,
    cloning: false,
    deleting: false,
  });

  // Current time for meridian calculation
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch practitioner reflections
  useEffect(() => {
    if (!id) return;

    const fetchReflections = async () => {
      const { data, error } = await supabase
        .from('practitioner_reflections')
        .select('*')
        .eq('appointment_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch reflections:", error);
        return;
      }
      setReflections(data || []);
    };

    fetchReflections();
  }, [id]);

  // Calculate current peak meridian
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

      return start > end 
        ? hour >= start || hour < end 
        : hour >= start && hour < end;
    });
  }, [currentTime]);

  // Memoized handlers
  const updateActionState = useCallback((key: keyof typeof actionStates, value: boolean) => {
    setActionStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  const handleCopyOnboardingLink = useCallback(async () => {
    if (!appointment?.clients?.id) return;
    
    updateActionState('copyingLink', true);
    try {
      const url = `${window.location.origin}/onboarding/${appointment.clients.id}`;
      await navigator.clipboard.writeText(url);
      showSuccess("Onboarding link copied to clipboard");
    } catch {
      showError("Failed to copy link");
    } finally {
      updateActionState('copyingLink', false);
    }
  }, [appointment, updateActionState]);

  const handleSyncToNotion = useCallback(async () => {
    if (!appointment) return;
    
    updateActionState('syncingNotion', true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { appointment }
      });

      if (error) throw error;

      const updates: Record<string, any> = {};
      if (data?.id && !appointment.notion_page_id) updates.notion_page_id = data.id;
      if (data?.plannerId && !appointment.notion_planner_id) updates.notion_planner_id = data.plannerId;

      if (Object.keys(updates).length > 0) {
        for (const [field, value] of Object.entries(updates)) {
          await saveField(field, value);
        }
      }

      showSuccess("Successfully synced to Notion");
      refresh();
    } catch (err: any) {
      showError(err.message || "Failed to sync to Notion");
    } finally {
      updateActionState('syncingNotion', false);
    }
  }, [appointment, saveField, refresh, updateActionState]);

  const handleCopyForAI = useCallback(() => {
    if (!appointment) return;
    
    updateActionState('copyingAI', true);
    try {
      const prompt = generateAICasePrompt(appointment.clients, [appointment]);
      navigator.clipboard.writeText(prompt);
      showSuccess("AI Case Prompt copied");
    } catch {
      showError("Failed to copy AI prompt");
    } finally {
      updateActionState('copyingAI', false);
    }
  }, [appointment, updateActionState]);

  const handleClonePrevious = useCallback(async () => {
    if (!appointment || !id) return;
    
    updateActionState('cloning', true);
    try {
      const { data: previous, error } = await supabase
        .from('appointments')
        .select('goal, issue, acupoints, priority_pattern')
        .eq('client_id', appointment.clients.id)
        .neq('id', id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          showError("No previous sessions found");
        } else {
          throw error;
        }
        return;
      }

      if (previous) {
        await Promise.all([
          saveField('goal', previous.goal),
          saveField('issue', previous.issue),
          saveField('acupoints', previous.acupoints),
          saveField('priority_pattern', previous.priority_pattern),
        ]);
        
        showSuccess("Previous session data cloned successfully");
        refresh();
      }
    } catch (err: any) {
      showError(err.message || "Failed to clone previous session");
    } finally {
      updateActionState('cloning', false);
    }
  }, [appointment, id, saveField, refresh, updateActionState]);

  const handleDeleteAppointment = useCallback(async () => {
    if (!id || !appointment || !confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
      return;
    }

    updateActionState('deleting', true);
    try {
      if (appointment.notion_page_id || appointment.notion_planner_id || appointment.calcom_booking_id) {
        await supabase.functions.invoke('delete-external-appointment', {
          body: {
            notionPageId: appointment.notion_page_id,
            notionPlannerId: appointment.notion_planner_id,
            calcomBookingId: appointment.calcom_booking_id,
          }
        });
      }

      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;

      showSuccess("Appointment deleted successfully");
      navigate('/appointments');
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    } finally {
      updateActionState('deleting', false);
    }
  }, [id, appointment, navigate, updateActionState]);

  const handleStartSession = useCallback(async () => {
    if (!appointment) return;
    const now = new Date();
    await saveField('date', now.toISOString());
    showSuccess("Session started");
  }, [appointment, saveField]);

  const handleCompleteSession = useCallback(async () => {
    if (!appointment) return;
    await saveField('status', 'Completed');
    showSuccess("Session marked as Completed");
  }, [appointment, saveField]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopySummary = useCallback(async () => {
    if (!appointment) return;
    try {
      const summary = generateSessionSummary(appointment);
      await navigator.clipboard.writeText(summary);
      showSuccess("Session summary copied to clipboard");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showError("Failed to copy summary");
    }
  }, [appointment]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div className="space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Activity size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Session not found</h2>
            <p className="text-slate-500 font-medium">The requested session could not be found or has been removed.</p>
          </div>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold text-xs uppercase tracking-widest">
            <Link to="/appointments">Back to Appointments</Link>
          </Button>
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
      />
    );
  }

  const isSessionToday = isToday(new Date(appointment.date));
  const isOngoing = appointment.status !== 'Completed' && appointment.status !== 'Cancelled';

  return (
    <ErrorBoundary>
      <SessionTimer
        appointmentDate={appointment.date}
        status={appointment.status}
        clientName={appointment.clients.name}
        currentPhaseName={activePhaseId}
        onFixedHeaderChange={setIsFixedHeaderActive}
        onCompleteSession={handleCompleteSession}
      />

      <AppLayout variant="full" hasFixedHeader={isFixedHeaderActive} className="pb-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* TOP NAVIGATION & ACTIONS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="h-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all gap-3"
              >
                <ArrowLeft size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className={cn(
                    "text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter truncate leading-none",
                    "privacy-mode-active:blur-sm"
                  )}>
                    {appointment.clients.name} 
                    <span className="text-slate-300 font-medium mx-2">/</span>
                    <span className="text-slate-500 font-bold">
                      {format(appointment.date, "EEE d MMM")} · {format(appointment.date, "h:mm a")}
                    </span>
                  </h1>
                  {isSessionToday && isOngoing && (
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full animate-pulse">
                      ● LIVE
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDocumentView(true)}
                className="h-12 w-[160px] gap-3 border-slate-200 bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm"
              >
                <FileText size={16} className="text-indigo-600" />
                Document View
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-12 w-[160px] gap-3 border-slate-200 bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <MoreHorizontal size={16} className="text-slate-400" />
                    Session Actions
                    <ChevronDown size={14} className="text-slate-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-[2rem] border-none shadow-3xl bg-white dark:bg-slate-900">
                  <div className="px-4 py-2 mb-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Session Setup</p>
                  </div>
                  <DropdownMenuItem onClick={handleCopyOnboardingLink} className="rounded-xl py-3 px-4 cursor-pointer">
                    <LinkIcon size={16} className="mr-3 text-indigo-50" /> Copy Onboarding Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSyncToNotion} className="rounded-xl py-3 px-4 cursor-pointer">
                    <RefreshCw size={16} className="mr-3 text-emerald-500" /> Sync to Notion
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyForAI} className="rounded-xl py-3 px-4 cursor-pointer">
                    <Sparkles size={16} className="mr-3 text-amber-500" /> AI Case Prompt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={handlePrint} className="rounded-xl py-3 px-4 cursor-pointer">
                    <Printer size={16} className="mr-3 text-slate-400" /> Print Session Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isSessionToday && appointment.status === 'Scheduled' && (
                <Button 
                  onClick={handleStartSession}
                  className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100/20 transition-all hover:scale-105 active:scale-95"
                >
                  Start Session
                </Button>
              )}
            </div>
          </div>

          {/* BANNERS & INSIGHTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <WeeklyFocusBanner
                appointmentId={appointment.id}
                priorityPattern={appointment.priority_pattern}
                onSaveField={saveField}
              />
            </div>
            <div className="lg:col-span-4">
              <PreviousSessionInsightsBar
                clientId={appointment.clients.id}
                currentAppointmentId={appointment.id}
              />
            </div>
          </div>

          {/* MAIN WORKSPACE GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
            {/* LEFT COLUMN: MAIN CONTENT */}
            <div className={cn(
              showSidebar ? "xl:col-span-8" : "xl:col-span-12",
              "space-y-6 transition-all duration-500"
            )}>
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-8 md:p-12 space-y-8">
                  <AppointmentHeader 
                    appointment={appointment} 
                    onSaveField={saveField} 
                    onUpdate={refresh} 
                  />

                  <div className="h-px bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />

                  <SessionContentSwitcher
                    appointment={appointment}
                    onUpdate={refresh}
                    saveField={saveField}
                    updatePriorityPattern={updatePriorityPattern}
                    history={history}
                    nucleiFilter={nucleiFilter}
                    showSidebar={showSidebar}
                    onToggleSidebar={handleToggleSidebar}
                    onClonePrevious={handleClonePrevious}
                    onPrint={handlePrint}
                    onCopySummary={handleCopySummary}
                    onDelete={handleDeleteAppointment}
                    onStartSession={handleStartSession}
                    isCloning={actionStates.cloning}
                    isCopied={isCopied}
                    onOpenDocument={() => setIsDocumentView(false)}
                    onTabChange={setActivePhaseId}
                  />
                </div>
              </div>

              {/* WORKSHEET SECTION */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 p-12 mb-20">
                <div className="max-w-4xl mx-auto">
                  <SessionWorksheetTemplate 
                    clientName={appointment.clients.name} 
                    date={appointment.date} 
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            {showSidebar && (
              <div className="xl:col-span-4 space-y-8 sticky top-24 print:hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {/* BRAINSTEM TONE MAP */}
                <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Brain size={20} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Neural Landscape</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleSidebar}
                        className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      >
                        <PanelRightClose size={20} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <BrainstemToneMap
                      priorityPattern={appointment.priority_pattern}
                      activeFilter={nucleiFilter}
                      onSelectNuclei={setNucleiFilter}
                    />
                  </CardContent>
                </Card>

                {/* REFLECTIONS */}
                {reflections.length > 0 && (
                  <Card className="border-none shadow-2xl shadow-amber-500/5 rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Activity size={20} />
                          </div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Reflections</h3>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                          <Link to="/practice/journal" state={{ appointmentId: id }}>
                            + Add
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-4">
                      {reflections.slice(0, 3).map((ref) => (
                        <div key={ref.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 group hover:border-amber-200 transition-all">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-none bg-amber-100 text-amber-700 px-2 py-0.5">
                              {ref.category}
                            </Badge>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                              {format(new Date(ref.created_at), "MMM d")}
                            </span>
                          </div>
                          <p className="text-xs italic text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            "{ref.content}"
                          </p>
                        </div>
                      ))}
                      {reflections.length > 3 && (
                        <Button variant="ghost" asChild className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600">
                          <Link to="/practice/journal" state={{ appointmentId: id }}>
                            View All {reflections.length} Reflections
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* CONTEXT CARDS */}
                <AppointmentContextCards
                  appointment={appointment}
                  currentPeakMeridian={currentPeakMeridian}
                  onSaveField={saveField}
                />
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default AppointmentDetailPage;