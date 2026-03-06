"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, Trash2, MoreHorizontal, History, Printer, Copy, Check, Play,
  FileText, Zap, Activity, Target, ClipboardList, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { format, isToday } from "date-fns";
import { AppointmentWithClient } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import EditableField from "@/components/crm/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import AppLayout from "@/components/crm/AppLayout";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import AppointmentHeader from "@/components/crm/AppointmentHeader";
import AppointmentContextCards from "@/components/crm/AppointmentContextCards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { generateSessionSummary } from "@/utils/summary-generator";
import { Badge } from "@/components/ui/badge";

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFixedHeaderActive, setIsFixedHeaderActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentPeakMeridian = (() => {
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
  })();

  const fetchAppointmentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name,
            born
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setAppointment({
        ...data,
        date: new Date(data.date),
      } as unknown as AppointmentWithClient);

    } catch (err) {
      console.error("Error fetching appointment details:", err);
      showError("Failed to load appointment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`appointment-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'appointments', 
        filter: `id=eq.${id}` 
      }, (payload) => {
        setAppointment((prev) => {
          if (!prev) return prev;
          const updatedData = { ...payload.new };
          if (updatedData.date && typeof updatedData.date === 'string') {
            updatedData.date = new Date(updatedData.date);
          }
          return { ...prev, ...updatedData } as AppointmentWithClient;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const saveField = async (field: string, value: string | boolean | null | string[]) => {
    if (!id || !appointment) return;
    
    const normalized = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ [field]: normalized })
        .eq('id', id);

      if (error) throw error;
      
      setAppointment(prev => prev ? { ...prev, [field]: normalized } as AppointmentWithClient : null);
    } catch (err: any) {
      console.error(`Silent save failed for ${field}:`, err);
      showError(`Failed to save ${field}`);
    }
  };

  const handleStartSession = async () => {
    if (!appointment) return;
    const now = new Date();
    await saveField('date', now.toISOString());
    showSuccess("Session started! Timer is now active.");
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
          showError("No previous sessions found for this client.");
        } else {
          throw error;
        }
        return;
      }

      if (previous) {
        await supabase.from('appointments').update({
          goal: previous.goal,
          issue: previous.issue,
          acupoints: previous.acupoints,
          priority_pattern: previous.priority_pattern
        }).eq('id', id);
        
        showSuccess("Cloned data from previous session.");
        fetchAppointmentData();
      }
    } catch (err: any) {
      showError("Failed to clone previous session data.");
    } finally {
      setCloning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!appointment) return;
    const summary = generateSessionSummary(appointment);
    navigator.clipboard.writeText(summary);
    setCopied(true);
    showSuccess("Detailed session summary copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDeleteAppointment = async () => {
    if (!id || !confirm("Are you sure you want to delete this appointment?")) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Appointment deleted successfully");
      navigate('/appointments');
    } catch (err: any) {
      showError(err.message || "Failed to delete appointment");
    }
  };

  useEffect(() => { fetchAppointmentData(); }, [id]);

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
      <AppLayout hasFixedHeader={isFixedHeaderActive}>
        <div className="flex flex-col gap-8 print:p-0 max-w-[1600px] mx-auto">
          {/* Top Action Bar */}
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
                className={cn(
                  "h-10 px-4 font-bold text-xs rounded-xl transition-all",
                  showSidebar ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? <PanelRightClose size={16} className="mr-2" /> : <PanelRightOpen size={16} className="mr-2" />}
                {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
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
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-10 px-4 font-bold text-xs"
                onClick={handleClonePrevious}
                disabled={cloning}
              >
                {cloning ? <Loader2 size={16} className="mr-2 animate-spin" /> : <History size={16} className="mr-2" />}
                Clone Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-10 px-4 font-bold text-xs"
                onClick={handlePrint}
              >
                <Printer size={16} className="mr-2" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-10 px-4 font-bold text-xs"
                onClick={handleCopySummary}
              >
                {copied ? <Check size={16} className="mr-2 text-emerald-500" /> : <Copy size={16} className="mr-2" />}
                {copied ? "Copied!" : "Copy Summary"}
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10"><MoreHorizontal size={20} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-none">
                      <DropdownMenuItem className="text-destructive focus:text-destructive rounded-xl py-2.5 px-4 cursor-pointer" onClick={handleDeleteAppointment}>
                          <Trash2 size={16} className="mr-2" /> Delete Appointment
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Print Header */}
          <div className="print:block hidden mb-8">
            <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900">Session Summary</h1>
                <p className="text-slate-500 font-bold">Antigravity Kinesiology Practice</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{format(appointment.date, "MMMM d, yyyy")}</p>
                <p className="text-xs text-slate-400">ID: {appointment.display_id || appointment.id.slice(0,8)}</p>
              </div>
            </div>
          </div>

          <PreviousSessionInsightsBar 
            clientId={appointment.clients.id} 
            currentAppointmentId={appointment.id} 
          />

          {/* Main Command Center Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column: Main Session Flow */}
            <div className={cn(showSidebar ? "xl:col-span-8" : "xl:col-span-12", "space-y-8 transition-all duration-500")}>
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <AppointmentHeader appointment={appointment} onSaveField={saveField} onUpdate={fetchAppointmentData} />

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EditableField 
                    key={`goal-${appointment.id}`} 
                    field="goal" 
                    label="Session Goal" 
                    value={appointment.goal} 
                    placeholder="What is the primary goal for this balance?" 
                    onSave={saveField} 
                    className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100" 
                  />
                  <EditableField 
                    key={`issue-${appointment.id}`} 
                    field="issue" 
                    label="Main Concern / Issue" 
                    value={appointment.issue} 
                    placeholder="Describe the client's main concern..." 
                    onSave={saveField} 
                    className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100" 
                  />
                </div>
              </Card>

              <div className="print:hidden">
                <SessionContentSwitcher appointment={appointment} onUpdate={fetchAppointmentData} saveField={saveField} />
              </div>
            </div>

            {/* Right Column: Clinical Sidebar */}
            {showSidebar && (
              <div className="xl:col-span-4 space-y-8 print:hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <AppointmentContextCards 
                  appointment={appointment} 
                  currentPeakMeridian={currentPeakMeridian} 
                  onSaveField={saveField} 
                />

                {/* Live Summary Preview */}
                <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <ClipboardList size={16} className="text-indigo-500" /> Live Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase">BOLT</span>
                        <span className={cn("font-black", appointment.bolt_score ? "text-indigo-600" : "text-slate-300")}>
                          {appointment.bolt_score ? `${appointment.bolt_score}s` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase">Coherence</span>
                        <span className={cn("font-black", appointment.coherence_score ? "text-rose-600" : "text-slate-300")}>
                          {appointment.coherence_score ? appointment.coherence_score.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase">Hydration</span>
                        <Badge className={cn("border-none text-[8px] font-black", appointment.hydrated ? "bg-emerald-500" : "bg-rose-500")}>
                          {appointment.hydrated ? 'PASSED' : 'ATTENTION'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pathway Findings</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3 italic">
                        {appointment.priority_pattern || "No pathway data recorded yet."}
                      </p>
                    </div>

                    <Button 
                      variant="ghost" 
                      className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 h-9 rounded-xl"
                      onClick={handleCopySummary}
                    >
                      <Copy size={12} className="mr-2" /> Copy Full Summary
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Print Layout (Hidden on Screen) */}
          <div className="hidden print:block space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Key Assessments</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">BOLT Score</span>
                    <span className="text-lg font-black text-indigo-600">{appointment.bolt_score ? `${appointment.bolt_score}s` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Coherence Ratio</span>
                    <span className="text-lg font-black text-rose-600">{appointment.coherence_score ? appointment.coherence_score.toFixed(2) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Hydration Status</span>
                    <span className={cn("text-sm font-black", appointment.hydrated ? "text-emerald-600" : "text-rose-600")}>{appointment.hydrated ? 'PASSED' : 'NEEDS ATTENTION'}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Acupoints Used</h3>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">{appointment.acupoints || 'No specific points recorded.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Session Findings & Corrections</h3>
              <div className="p-6 border-2 border-slate-100 rounded-2xl space-y-6">
                <div>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Pathway & Patterns</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{appointment.priority_pattern || 'No specific pathway notes.'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Corrections Applied</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{appointment.modes_balances || 'No correction notes.'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Practitioner Notes & Homework</h3>
              <div className="p-6 bg-indigo-50/30 border-2 border-indigo-100 rounded-2xl">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{appointment.session_north_star || appointment.notes || 'No specific homework recorded.'}</p>
              </div>
            </div>

            <div className="pt-12 text-center border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Thank you for your commitment to your healing journey.</p>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;