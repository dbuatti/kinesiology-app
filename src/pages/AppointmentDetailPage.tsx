"use client";

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Calendar, Clock, 
  Loader2, Trash2, User, Droplets,
  Copy, Check, History, MoreHorizontal, ChevronDown, Star, Play
} from "lucide-react";
import { format, isToday } from "date-fns";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import EditableField from "@/components/crm/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import AppLayout from "@/components/crm/AppLayout";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "@/components/crm/Breadcrumbs";
import { Button } from "@/components/ui/button";

export interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string; born?: string };
  sagittal_plane_notes?: string | null;
  frontal_plane_notes?: string | null;
  transverse_plane_notes?: string | null;
  hydrated?: boolean | null;
  hydration_notes?: string | null;
  emotion_mode?: string | null;
  emotion_primary_selection?: string | null;
  emotion_secondary_selection?: string[] | null;
  emotion_notes?: string | null;
  fakuda_notes?: string | null;
  sharpened_rhombergs_notes?: string | null;
  frontal_lobe_notes?: string | null;
  luscher_color_1?: string | null;
  luscher_color_2?: string | null;
  harmonic_rocking_notes?: string | null;
  t1_reset_notes?: string | null;
  diaphragm_reset_notes?: string | null;
  lymphatic_suture_side?: string | null;
  lymphatic_priority_zone?: string | null;
  lymphatic_notes?: string | null;
}

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFixedHeaderActive, setIsFixedHeaderActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);

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
        console.log("[Realtime] Appointment updated:", payload.new);
        setAppointment((prev) => {
          if (!prev) return prev;
          const updatedData = { ...payload.new };
          if (updatedData.date && typeof updatedData.date === 'string') {
            updatedData.date = new Date(updatedData.date);
          }
          return { ...prev, ...updatedData };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const saveField = async (field: string, value: string | boolean | null | string[]) => {
    if (!id || !appointment) return;
    
    // Handle array types (like emotion_secondary_selection) correctly for Supabase
    const normalized = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ [field]: normalized })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setAppointment(prev => prev ? { ...prev, [field]: normalized } : null);
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

  const handleClonePrevious = async () => {
    if (!appointment || !id) return;
    setCloning(true);
    try {
      const { data: previous, error } = await supabase
        .from('appointments')
        .select('goal, issue, acupoints')
        .eq('client_id', appointment.clientId)
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
          acupoints: previous.acupoints
        }).eq('id', id);
        
        showSuccess("Cloned Goal, Issue, and Acupoints from previous session.");
        fetchAppointmentData();
      }
    } catch (err: any) {
      showError("Failed to clone previous session data.");
    } finally {
      setCloning(false);
    }
  };

  const handleCopySummary = () => {
    if (!appointment) return;
    
    let summary = `
SESSION SUMMARY: ${appointment.clients.name}
Date: ${format(appointment.date, "MMMM d, yyyy")}
Goal: ${appointment.goal || 'Not set'}
Issue: ${appointment.issue || 'Not set'}

KEY ASSESSMENTS:
- BOLT Score: ${appointment.bolt_score ? `${appointment.bolt_score}s` : 'Not recorded'}
- Coherence: ${appointment.coherence_score ? appointment.coherence_score.toFixed(2) : 'Not recorded'}
- Hydration: ${appointment.hydrated ? 'Passed' : 'Needs attention'}
`;

    if (appointment.sagittal_plane_notes || appointment.frontal_plane_notes || appointment.transverse_plane_notes) {
      summary += `\nRANGE OF MOTION (COGS):\n`;
      if (appointment.sagittal_plane_notes) summary += `- Sagittal: ${appointment.sagittal_plane_notes}\n`;
      if (appointment.frontal_plane_notes) summary += `- Frontal: ${appointment.frontal_plane_notes}\n`;
      if (appointment.transverse_plane_notes) summary += `- Transverse: ${appointment.transverse_plane_notes}\n`;
    }

    if (appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes) {
      summary += `\nNEUROLOGICAL FINDINGS:\n`;
      if (appointment.fakuda_notes) summary += `- Fakuda: ${appointment.fakuda_notes}\n`;
      if (appointment.sharpened_rhombergs_notes) summary += `- Rhombergs: ${appointment.sharpened_rhombergs_notes}\n`;
      if (appointment.frontal_lobe_notes) summary += `- Frontal Lobe: ${appointment.frontal_lobe_notes}\n`;
    }

    if (appointment.emotion_secondary_selection && appointment.emotion_secondary_selection.length > 0) {
      summary += `\nEMOTIONAL CONTEXT: ${appointment.emotion_secondary_selection.join(', ')}\n`;
    }

    summary += `\nSESSION NOTES:\n${appointment.notes || 'No general notes recorded.'}`;
    
    if (appointment.acupoints) {
      summary += `\n\nACUPOINTS USED: ${appointment.acupoints}`;
    }

    navigator.clipboard.writeText(summary.trim());
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

  const clientLink = `/clients/${appointment.clients.id}`;
  const clientBorn = appointment.clients.born ? new Date(appointment.clients.born) : null;
  const isSessionToday = isToday(appointment.date);

  return (
    <>
      <SessionTimer appointmentDate={appointment.date} status={appointment.status} onFixedHeaderChange={setIsFixedHeaderActive} />
      <AppLayout hasFixedHeader={isFixedHeaderActive}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Breadcrumbs 
              items={[
                { label: "Appointments", path: "/appointments" },
                { label: appointment.name || "Session Details" }
              ]} 
              className="mb-0"
            />
            <div className="flex items-center gap-2">
              {isSessionToday && !isFixedHeaderActive && appointment.status === 'Scheduled' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100"
                  onClick={handleStartSession}
                >
                  <Play size={16} className="mr-2 fill-current" />
                  Start Session Now
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={handleClonePrevious}
                disabled={cloning}
              >
                {cloning ? <Loader2 size={16} className="mr-2 animate-spin" /> : <History size={16} className="mr-2" />}
                Clone Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={handleCopySummary}
              >
                {copied ? <Check size={16} className="mr-2 text-emerald-500" /> : <Copy size={16} className="mr-2" />}
                {copied ? "Copied!" : "Copy Summary"}
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={20} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteAppointment}>
                          <Trash2 size={16} className="mr-2" /> Delete Appointment
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <PreviousSessionInsightsBar 
            clientId={appointment.clients.id} 
            currentAppointmentId={appointment.id} 
          />

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="font-bold bg-white border-slate-200 text-slate-600">{appointment.display_id || appointment.id.slice(0, 8)}</Badge>
                    <Badge className="bg-indigo-600 text-white border-none">{appointment.tag}</Badge>
                    <Select value={appointment.status} onValueChange={(newStatus) => saveField('status', newStatus)}>
                      <SelectTrigger className={cn("h-8 w-[130px] text-xs font-bold border-slate-200 shadow-sm bg-white", appointment.status === 'Completed' ? "text-emerald-600" : "text-indigo-600")}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>{APPOINTMENT_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{appointment.name || "Kinesiology Session"}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-indigo-400" /> {format(appointment.date, "EEEE, MMM d, yyyy")}</div>
                    <div className="flex items-center gap-1.5"><Clock size={16} className="text-indigo-400" /> {format(appointment.date, "h:mm a")}</div>
                    <Link to={clientLink} className="flex items-center gap-1.5 text-indigo-600 hover:underline font-bold">
                      <User size={16} /> {appointment.clients.name}
                    </Link>
                    {clientBorn && (
                      <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">{calculateAge(clientBorn)} yrs</span>
                        <span className="flex items-center gap-1 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                          <Star size={12} className="fill-amber-500" /> {getStarSign(clientBorn)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", appointment.hydrated ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                      <Droplets size={20} />
                    </div>
                    <div className="pr-2">
                      <Label htmlFor="hydration-toggle" className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Hydration</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{appointment.hydrated ? "Passed" : "Needs Attention"}</span>
                        <Switch id="hydration-toggle" checked={appointment.hydrated || false} onCheckedChange={(checked) => saveField('hydrated', checked)} className="data-[state=checked]:bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <EditableField key={`goal-${appointment.id}`} field="goal" label="Session Goal" value={appointment.goal} placeholder="What is the primary goal for this balance?" onSave={saveField} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" />
              <EditableField key={`issue-${appointment.id}`} field="issue" label="Main Concern / Issue" value={appointment.issue} placeholder="Describe the client's main concern..." onSave={saveField} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" />
            </div>
          </Card>

          <SessionContentSwitcher appointment={appointment} onUpdate={fetchAppointmentData} saveField={saveField} />
        </div>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;