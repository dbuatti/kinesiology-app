"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Loader2, 
  ArrowLeft, 
  FileText, 
  MoreHorizontal, 
  ChevronDown, 
  RefreshCw, 
  Sparkles, 
  Printer, 
  Link as LinkIcon,
  Activity
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
import AppointmentSidebar from "@/components/crm/AppointmentSidebar";
import SessionWorksheetTemplate from "@/components/crm/SessionWorksheetTemplate";
import SessionDocumentView from "@/components/crm/SessionDocumentView";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

import { Button } from "@/components/ui/button";
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

  // Current time for meridian calculation
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const handleCopyForAI = useCallback(() => {
    if (!appointment) return;
    const prompt = generateAICasePrompt(appointment.clients, [appointment]);
    navigator.clipboard.writeText(prompt);
    showSuccess("AI Case Prompt copied");
  }, [appointment]);

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
    if (!id || !confirm("Delete this appointment?")) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Appointment deleted");
      navigate('/appointments');
    } catch (err: any) {
      showError("Failed to delete appointment");
    }
  }, [id, navigate]);

  const handleStartSession = useCallback(async () => {
    if (!appointment) return;
    await saveField('date', new Date().toISOString());
    showSuccess("Session started");
  }, [appointment, saveField]);

  const handleCompleteSession = useCallback(async () => {
    if (!appointment) return;
    await saveField('status', 'Completed');
    showSuccess("Session completed");
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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)} className="h-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 transition-all gap-3">
                <ArrowLeft size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className={cn("text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter truncate leading-none", "privacy-mode-active:blur-sm")}>
                    {appointment.clients.name} 
                    <span className="text-slate-300 font-medium mx-2">/</span>
                    <span className="text-slate-500 font-bold">{format(appointment.date, "EEE d MMM")} · {format(appointment.date, "h:mm a")}</span>
                  </h1>
                  {isSessionToday && isOngoing && <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full animate-pulse">● LIVE</Badge>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsDocumentView(true)} className="h-12 w-[160px] gap-3 border-slate-200 bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm">
                <FileText size={16} className="text-indigo-600" /> Document View
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 w-[160px] gap-3 border-slate-200 bg-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                    <MoreHorizontal size={16} className="text-slate-400" /> Session Actions <ChevronDown size={14} className="text-slate-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-[2rem] border-none shadow-3xl bg-white dark:bg-slate-900">
                  <DropdownMenuItem onClick={handleCopyOnboardingLink} className="rounded-xl py-3 px-4 cursor-pointer"><LinkIcon size={16} className="mr-3 text-indigo-500" /> Copy Onboarding Link</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSyncToNotion} className="rounded-xl py-3 px-4 cursor-pointer"><RefreshCw size={16} className="mr-3 text-emerald-500" /> Sync to Notion</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyForAI} className="rounded-xl py-3 px-4 cursor-pointer"><Sparkles size={16} className="mr-3 text-amber-500" /> AI Case Prompt</DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={() => window.print()} className="rounded-xl py-3 px-4 cursor-pointer"><Printer size={16} className="mr-3 text-slate-400" /> Print Session Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isSessionToday && appointment.status === 'Scheduled' && (
                <Button onClick={handleStartSession} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100/20 transition-all hover:scale-105 active:scale-95">Start Session</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <WeeklyFocusBanner appointmentId={appointment.id} priorityPattern={appointment.priority_pattern} onSaveField={saveField} />
            </div>
            <div className="lg:col-span-4">
              <PreviousSessionInsightsBar clientId={appointment.clients.id} currentAppointmentId={appointment.id} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
            <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-6 transition-all duration-500")}>
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-8 md:p-12 space-y-8">
                  <AppointmentHeader appointment={appointment} onSaveField={saveField} onUpdate={refresh} />
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />
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
              <div className="bg-slate-50 dark:bg-slate-950 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 p-12 mb-20">
                <div className="max-w-4xl mx-auto">
                  <SessionWorksheetTemplate clientName={appointment.clients.name} date={appointment.date} />
                </div>
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