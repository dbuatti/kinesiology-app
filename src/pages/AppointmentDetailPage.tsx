"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Trash2, MoreHorizontal, History, Printer, Copy, Check, Play,
  FileText, Zap, Activity, Target, ClipboardList, PanelRightOpen, PanelRightClose,
  Brain, ShieldCheck, Sparkles, Share, Link as LinkIcon, ChevronRight, ExternalLink, DollarSign, AlertCircle
} from "lucide-react";
import { format, isToday } from "date-fns";
import { AppointmentWithClient } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import EditableField from "@/components/shared/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import AppLayout from "@/components/crm/AppLayout";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import AppointmentHeader from "@/components/crm/AppointmentHeader";
import AppointmentContextCards from "@/components/crm/AppointmentContextCards";
import BrainstemToneMap from "@/components/crm/BrainstemToneMap";
import SessionWorksheetTemplate from "@/components/crm/SessionWorksheetTemplate";
import PathwayFindingsList from "@/components/crm/PathwayFindingsList";
import WeeklyFocusBanner from "@/components/crm/WeeklyFocusBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { generateSessionSummary, generateAICasePrompt, formatAppointmentQuickInfo } from "@/utils/summary-generator";
import { Badge } from "@/components/ui/badge";
import { Nuclei } from "@/utils/brainstem-logic";
import { useAppointment } from "@/hooks/useAppointment";

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, history, loading, saveField, updatePriorityPattern, refresh } = useAppointment(id);
  
  const [isFixedHeaderActive, setIsFixedHeaderActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopying, setLinkCopying] = useState(false);
  const [aiCopying, setAiCopying] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [syncingNotion, setSyncingNotion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(true); 
  const [nucleiFilter, setNucleiFilter] = useState<Nuclei | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentPeakMeridian = useMemo(() => {
    const hour = currentTime.getHours();
    return TCM_CHANNELS.find(c => {
      if (c.peakTime === 'None') return false;
      const parts = c.peakTime.toLowerCase().split('-').map(p => p.trim());
      const parseHour = (s: string) => {
        const h = parseInt(s);
        if (s.includes('pm') && h !== 12) return h + 12;
        if (s.includes('am') && h === 12) return 0;
        return h;
      };
      const start = parseHour(parts[0]);
      const end = parseHour(parts[1]);
      if (start > end) return hour >= start || hour < end;
      return hour >= start && hour < end;
    });
  }, [currentTime]);

  const handleSyncToNotion = async () => {
    if (!appointment) return;
    setSyncingNotion(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-notion', {
        body: { appointment }
      });

      if (error) throw error;
      
      const updates: any = {};
      if (data.id && !appointment.notion_page_id) updates.notion_page_id = data.id;
      if (data.plannerId && !appointment.notion_planner_id) updates.notion_planner_id = data.plannerId;

      if (Object.keys(updates).length > 0) {
        await saveField('notion_page_id', updates.notion_page_id);
        if (updates.notion_planner_id) await saveField('notion_planner_id', updates.notion_planner_id);
      }
      
      showSuccess("Session synced to Notion!");
    } catch (err: any) {
      showError(err.message || "Failed to sync to Notion.");
    } finally {
      setSyncingNotion(false);
    }
  };

  const handleCopyOnboardingLink = () => {
    if (!appointment) return;
    setLinkCopying(true);
    const url = `${window.location.origin}/onboarding/${appointment.clients.id}`;
    navigator.clipboard.writeText(url);
    showSuccess("Onboarding link copied!");
    setTimeout(() => setLinkCopying(false), 2000);
  };

  const handleJumpToCalibrate = (itemName: string) => {
    const event = new CustomEvent('jump-to-calibrate', { detail: { itemName } });
    window.dispatchEvent(event);
  };

  const handleStartSession = async () => {
    if (!appointment) return;
    const now = new Date();
    await saveField('date', now.toISOString());
    showSuccess("Session started!");
  };

  const handleCompleteSession = async () => {
    if (!appointment) return;
    await saveField('status', 'Completed');
    showSuccess("Session marked as Completed!");
  };

  const handleClonePrevious = async () => {
    if (!appointment || !id) return;
    setCloning(true);
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
          showError("No previous sessions found.");
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
          saveField('priority_pattern', previous.priority_pattern)
        ]);
        
        showSuccess("Cloned data from previous session.");
        refresh();
      }
    } catch (err: any) {
      showError("Failed to clone previous session data.");
    } finally {
      setCloning(false);
    }
  };

  const handleCopySummary = () => {
    if (!appointment) return;
    const summary = generateSessionSummary(appointment);
    navigator.clipboard.writeText(summary);
    setCopied(true);
    showSuccess("Summary copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyForAI = () => {
    if (!appointment) return;
    const prompt = generateAICasePrompt(appointment.clients, [appointment]);
    navigator.clipboard.writeText(prompt);
    setAiCopying(true);
    showSuccess("AI Case Prompt copied!");
    setTimeout(() => setAiCopying(false), 3000);
  };

  const handleDeleteAppointment = async () => {
    if (!id || !appointment || !confirm("Are you sure you want to delete this appointment?")) return;
    
    setDeleting(true);
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

      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;

      showSuccess("Appointment deleted.");
      navigate('/appointments');
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  if (!appointment) return <div className="p-12 text-center">Appointment not found</div>;

  const isSessionToday = isToday(appointment.date);

  return (
    <>
      <SessionTimer 
        appointmentDate={appointment.date} 
        status={appointment.status} 
        onFixedHeaderChange={setIsFixedHeaderActive} 
        onCompleteSession={handleCompleteSession}
      />
      <AppLayout variant="wide" hasFixedHeader={isFixedHeaderActive}>
        <div className="flex flex-col gap-6 print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <Breadcrumbs 
              items={[
                { label: "Appointments", path: "/appointments" },
                { label: appointment.name || "Session Details" }
              ]} 
              className="mb-0"
            />
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold h-10 px-4"
                onClick={handleCopyOnboardingLink}
              >
                {linkCopying ? <Check size={16} className="mr-2" /> : <LinkIcon size={16} className="mr-2" />}
                Onboarding Link
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold h-10 px-4"
                onClick={handleSyncToNotion}
                disabled={syncingNotion}
              >
                {syncingNotion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share size={16} className="mr-2" />}
                Sync to Notion
              </Button>
              {isSessionToday && !isFixedHeaderActive && appointment.status === 'Scheduled' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100 h-10 px-6 font-black text-[10px] uppercase tracking-widest"
                  onClick={handleStartSession}
                >
                  <Play size={16} className="mr-2 fill-current" />
                  Start Session
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 print:hidden">
            <WeeklyFocusBanner 
              appointmentId={appointment.id}
              priorityPattern={appointment.priority_pattern}
              onSaveField={saveField}
              onJumpToCalibrate={handleJumpToCalibrate}
            />

            <PreviousSessionInsightsBar 
              clientId={appointment.clients.id} 
              currentAppointmentId={appointment.id} 
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-12 transition-all duration-500")}>
              <div className="space-y-10">
                <AppointmentHeader appointment={appointment} onSaveField={saveField} onUpdate={refresh} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Target size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Intake</span>
                    </div>
                    <EditableField 
                      key={`goal-${appointment.id}`} 
                      field="goal" 
                      label="Session Goal" 
                      value={appointment.goal} 
                      placeholder="What is the primary goal?" 
                      onSave={saveField} 
                      className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <ClipboardList size={14} className="text-rose-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Concern</span>
                    </div>
                    <EditableField 
                      key={`issue-${appointment.id}`} 
                      field="issue" 
                      label="Main Concern / Issue" 
                      value={appointment.issue} 
                      placeholder="Describe the main concern..." 
                      onSave={saveField} 
                      className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800" 
                    />
                  </div>
                </div>
              </div>

              <div className="print:hidden">
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
                  onStartSession={handleStartSession}
                  isCloning={cloning}
                  isCopied={copied}
                />
              </div>
            </div>

            {showSidebar && (
              <div className="xl:col-span-4 space-y-12 print:hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Brain size={18} className="text-indigo-600" />
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Brainstem Tone Map</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)} className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-900">
                      <PanelRightClose size={18} />
                    </Button>
                  </div>
                  <BrainstemToneMap 
                    priorityPattern={appointment.priority_pattern} 
                    activeFilter={nucleiFilter}
                    onSelectNuclei={setNucleiFilter}
                  />
                </div>

                <AppointmentContextCards appointment={appointment} currentPeakMeridian={currentPeakMeridian} onSaveField={saveField} />
              </div>
            )}
          </div>
          
          <SessionWorksheetTemplate clientName={appointment.clients.name} date={appointment.date} />
        </div>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;