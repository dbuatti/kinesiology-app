import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Calendar, Clock, 
  Loader2, Trash2, User, Droplets, Footprints, Hand,
  Activity, Move, Heart, Scale, Brain, FlaskConical, Palette, Copy, Check, History
} from "lucide-react";
import { format } from "date-fns";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import EditableField from "@/components/crm/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import AppLayout from "@/components/crm/AppLayout";
import SessionContentSwitcher from "@/components/crm/SessionContentSwitcher";
import PreviousSessionInsightsBar from "@/components/crm/PreviousSessionInsightsBar";
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
import { MoreHorizontal } from "lucide-react";
import Breadcrumbs from "@/components/crm/Breadcrumbs";

export interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string };
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
            name
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${id}` }, (payload) => {
        setAppointment((prev) => {
          if (!prev) return prev;
          const updatedData = { ...payload.new };
          if (updatedData.date && typeof updatedData.date === 'string') updatedData.date = new Date(updatedData.date);
          return { ...prev, ...updatedData };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const saveField = async (field: string, value: string | boolean | null | string[]) => {
    if (!id || !appointment) return;
    const normalized = Array.isArray(value) ? value : (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value);
    try {
      const { error } = await supabase.from('appointments').update({ [field]: normalized }).eq('id', id);
      if (error) throw error;
      setAppointment(prev => prev ? { ...prev, [field]: normalized } : null);
    } catch (err: any) {
      console.error(`Silent save failed for ${field}:`, err);
    }
  };

  const handleClonePrevious = async () => {
    if (!appointment || !id) return;
    setCloning(true);
    try {
      // Find the most recent appointment for this client that is NOT this one
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
    
    const summary = `
SESSION SUMMARY: ${appointment.clients.name}
Date: ${format(appointment.date, "MMMM d, yyyy")}
Goal: ${appointment.goal || 'Not set'}

KEY FINDINGS:
- BOLT Score: ${appointment.bolt_score ? `${appointment.bolt_score}s` : 'Not recorded'}
- Coherence: ${appointment.coherence_score ? appointment.coherence_score.toFixed(2) : 'Not recorded'}
- Hydration: ${appointment.hydrated ? 'Passed' : 'Needs attention'}

NEUROLOGICAL NOTES:
${appointment.fakuda_notes ? `- Fakuda: ${appointment.fakuda_notes}` : ''}
${appointment.sharpened_rhombergs_notes ? `- Rhombergs: ${appointment.sharpened_rhombergs_notes}` : ''}
${appointment.frontal_lobe_notes ? `- Frontal Lobe: ${appointment.frontal_lobe_notes}` : ''}

SESSION NOTES:
${appointment.notes || 'No general notes recorded.'}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    showSuccess("Session summary copied to clipboard!");
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
  const isHydrated = appointment.hydrated === true;

  return (
    <>
      <SessionTimer appointmentDate={appointment.date} status={appointment.status} onFixedHeaderChange={setIsFixedHeaderActive} />
      <AppLayout hasFixedHeader={isFixedHeaderActive}>
        <Breadcrumbs 
          items={[
            { label: "Appointments", path: "/appointments" },
            { label: appointment.name || "Session Details" }
          ]} 
        />

        <div className="flex items-center justify-between gap-4">
          <Link to="/appointments">
            <Button variant="ghost" size="sm"><ArrowLeft size={18} className="mr-2" /> Back to Schedule</Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={handleClonePrevious}
              disabled={cloning}
            >
              {cloning ? <Loader2 size={16} className="mr-2 animate-spin" /> : <History size={16} className="mr-2" />}
              Clone Previous Info
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
                    <Button variant="ghost" size="icon"><MoreHorizontal size={20} /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteAppointment}>
                        <Trash2 size={16} className="mr-2" /> Delete Appointment
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Previous Session Insights Bar */}
        <PreviousSessionInsightsBar 
          clientId={appointment.clients.id} 
          currentAppointmentId={appointment.id} 
        />

        <Card className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{appointment.display_id || appointment.id.slice(0, 8)}</Badge>
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">{appointment.tag}</Badge>
                  <Select value={appointment.status} onValueChange={(newStatus) => saveField('status', newStatus)}>
                    <SelectTrigger className={cn("h-8 w-[120px] text-xs font-bold border-none shadow-sm", appointment.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white")}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>{APPOINTMENT_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                  </Select>
                  {appointment.hydrated !== null && (
                    <Badge className={cn("px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1", isHydrated ? "bg-blue-600 text-white" : "bg-red-500 text-white")}>
                      <Droplets size={12} /> {isHydrated ? "Hydrated" : "Dehydrated"}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-900 pt-2">{appointment.name || "Kinesiology Session"}</CardTitle>
              </div>
              <div className="text-right">
                <Link to={clientLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
                  <User size={16} /> <span className="group-hover:underline">{appointment.clients.name}</span>
                </Link>
                <p className="text-xs text-slate-400 mt-1">Client Profile</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <div className="flex items-center gap-2 text-slate-700 font-medium"><Calendar size={16} className="text-indigo-50" /> {format(appointment.date, "EEEE, MMM d, yyyy")}</div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                <div className="flex items-center gap-2 text-slate-700 font-medium"><Clock size={16} className="text-indigo-50" /> {format(appointment.date, "h:mm a")}</div>
              </div>
              <div className="space-y-1">
                <EditableField key={`goal-${appointment.id}`} field="goal" label="Goal" value={appointment.goal} placeholder="What's the goal?" onSave={saveField} />
              </div>
              <div className="space-y-1">
                <EditableField key={`issue-${appointment.id}`} field="issue" label="Issue" value={appointment.issue} placeholder="Main concern?" onSave={saveField} />
              </div>
            </div>

            <Card className="border-2 border-blue-200 bg-blue-50/50 shadow-none rounded-2xl">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2 text-blue-900"><Droplets size={18} className="text-blue-600" /> Hydration Assessment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", appointment.hydrated ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}><Droplets size={20} /></div>
                    <div><Label htmlFor="hydration-toggle" className="text-base font-bold text-slate-900 cursor-pointer">Client Hydrated</Label><p className="text-xs text-slate-500">{appointment.hydrated ? "Hydration test passed" : "Hydration test not passed"}</p></div>
                  </div>
                  <Switch id="hydration-toggle" checked={appointment.hydrated || false} onCheckedChange={(checked) => saveField('hydrated', checked)} className="data-[state=checked]:bg-emerald-500" />
                </div>
                <EditableField key={`hydration_notes-${appointment.id}`} field="hydration_notes" label="Hydration Recommendations" value={appointment.hydration_notes} multiline placeholder="e.g., Drink 500ml water before next session..." onSave={saveField} />
              </CardContent>
            </Card>

            <SessionContentSwitcher appointment={appointment} onUpdate={fetchAppointmentData} saveField={saveField} />
          </CardContent>
        </Card>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;