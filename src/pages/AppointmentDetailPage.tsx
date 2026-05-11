"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Loader2, Settings2, ChevronDown, PanelRightClose, MessageSquare, Brain,
  Calendar, Clock, User, History, Copy, Check, Trash2, Printer, RefreshCw,
  Activity, Zap, Target, ClipboardCheck, Link as LinkIcon, Sparkles
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
import PageHeader from "@/components/shared/PageHeader";

import {
  Button,
} from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [showSetup, setShowSetup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [nucleiFilter, setNucleiFilter] = useState<Nuclei | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);

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

  // Memoized handlers to prevent unnecessary re-renders
  const updateActionState = useCallback((key: keyof typeof actionStates, value: boolean) => {
    setActionStates(prev => ({ ...prev, [key]: value }));
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
      // Delete external references first
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

  // Early returns
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Appointment not found</h2>
          <p className="text-muted-foreground">The requested session could not be found.</p>
        </div>
      </div>
    );
  }

  const isSessionToday = isToday(new Date(appointment.date));

  return (
    <>
      <SessionTimer
        appointmentDate={appointment.date}
        status={appointment.status}
        onFixedHeaderChange={setIsFixedHeaderActive}
        onCompleteSession={handleCompleteSession}
      />

      <AppLayout variant="full" hasFixedHeader={isFixedHeaderActive}>
        <div className="flex flex-col gap-8 print:p-0">
          <PageHeader 
            title="Session Workspace"
            subtitle="Manage clinical findings and integration protocols."
            icon={Activity}
            breadcrumbs={[
              { label: "Appointments", path: "/appointments" },
              { label: appointment.clients.name, path: `/clients/${appointment.clients.id}` },
              { label: appointment.display_id || "Details" },
            ]}
            actions={
              <div className="flex items-center gap-3">
                <Collapsible open={showSetup} onOpenChange={setShowSetup}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 gap-2">
                      <Settings2 size={16} />
                      <span className="font-medium text-xs uppercase tracking-widest">Setup</span>
                      <ChevronDown 
                        size={14} 
                        className={cn("transition-transform", showSetup && "rotate-180")} 
                      />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>

                {isSessionToday && appointment.status === 'Scheduled' && (
                  <Button 
                    onClick={handleStartSession}
                    className="h-10 px-6 font-semibold shadow-sm"
                  >
                    Start Session
                  </Button>
                )}
              </div>
            }
          />

          {/* Setup Tools */}
          <Collapsible open={showSetup}>
            <Card className="border-none shadow-sm bg-muted/30 rounded-2xl overflow-hidden mb-6">
              <CollapsibleContent className="animate-in slide-in-from-top-2">
                <div className="flex flex-wrap gap-3 p-5">
                  <Button
                    variant="outline"
                    onClick={handleCopyOnboardingLink}
                    disabled={actionStates.copyingLink}
                    className="h-10 rounded-xl border-border bg-card font-bold text-[10px] uppercase tracking-widest"
                  >
                    {actionStates.copyingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon size={14} className="mr-2" />}
                    Copy Onboarding Link
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSyncToNotion}
                    disabled={actionStates.syncingNotion}
                    className="h-10 rounded-xl border-border bg-card font-bold text-[10px] uppercase tracking-widest"
                  >
                    {actionStates.syncingNotion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw size={14} className="mr-2" />}
                    Sync to Notion
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCopyForAI}
                    disabled={actionStates.copyingAI}
                    className="h-10 rounded-xl border-border bg-card font-bold text-[10px] uppercase tracking-widest"
                  >
                    {actionStates.copyingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
                    AI Case Prompt
                  </Button>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Banners */}
          <div className="space-y-6">
            <WeeklyFocusBanner
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              onSaveField={saveField}
            />

            <PreviousSessionInsightsBar
              clientId={appointment.clients.id}
              currentAppointmentId={appointment.id}
            />
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Main Content */}
            <div className={cn(
              showSidebar ? "xl:col-span-8" : "xl:col-span-12",
              "space-y-10 transition-all duration-300"
            )}>
              <AppointmentHeader 
                appointment={appointment} 
                onSaveField={saveField} 
                onUpdate={refresh} 
              />

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
                onPrint={handlePrint}
                onCopySummary={handleCopySummary}
                onDelete={handleDeleteAppointment}
                onStartSession={handleStartSession}
                isCloning={actionStates.cloning}
                isCopied={isCopied}
              />
            </div>

            {/* Sidebar */}
            {showSidebar && (
              <div className="xl:col-span-4 space-y-10 print:hidden">
                {/* Reflections */}
                {reflections.length > 0 && (
                  <Card className="border-none shadow-sm bg-card rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-6 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="text-indigo-600" size={18} />
                          <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Practitioner Reflections</h3>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          <Link to="/practice/journal" state={{ appointmentId: id }}>
                            + Add
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                      {reflections.map((ref) => (
                        <div key={ref.id} className="p-4 bg-muted/30 rounded-2xl border border-border space-y-2">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-none bg-indigo-50 text-indigo-600">
                              {ref.category}
                            </Badge>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                              {format(new Date(ref.created_at), "MMM d")}
                            </span>
                          </div>
                          <p className="text-xs italic text-slate-600 line-clamp-3 leading-relaxed">
                            "{ref.content}"
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Brainstem Tone Map */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Brain className="text-indigo-600" size={18} />
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Brainstem Tone Map</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSidebar(false)}
                      className="h-8 w-8 rounded-xl text-slate-400"
                    >
                      <PanelRightClose size={18} />
                    </Button>
                  </div>
                  <BrainstemToneMap
                    priorityPattern={appointment.priority_pattern}
                    activeFilter={nucleiFilter}
                    onSelectNuclei={setNucleiFilter}
                  />
                </div>

                <AppointmentContextCards
                  appointment={appointment}
                  currentPeakMeridian={currentPeakMeridian}
                  onSaveField={saveField}
                />
              </div>
            )}
          </div>

          {/* Worksheet */}
          <SessionWorksheetTemplate 
            clientName={appointment.clients.name} 
            date={appointment.date} 
          />
        </div>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;