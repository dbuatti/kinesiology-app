import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Calendar, Clock, Target, Zap, 
  ExternalLink, Loader2, Trash2, User, Droplets, Footprints, Hand,
  Activity, Move, Heart, Scale, Brain, FlaskConical, ListChecks, Palette, CheckCircle2, TrendingUp
} from "lucide-react";
import { format, isToday } from "date-fns";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import BoltTestSection from "@/components/crm/BoltTestSection";
import CoherenceAssessment from "@/components/crm/CoherenceAssessment";
import CogsAssessment from "@/components/crm/CogsAssessment";
import EditableField from "@/components/crm/EditableField";
import SessionTimer from "@/components/crm/SessionTimer";
import EmotionAssessment from "@/components/crm/EmotionAssessment";
import NeurologicalAssessments from "@/components/crm/NeurologicalAssessments";
import AppLayout from "@/components/crm/AppLayout";
import MuscleTestingTab from "@/components/crm/MuscleTestingTab";
import LuscherColourAssessment from "@/components/crm/LuscherColourAssessment";
import SessionHeaderActions from "@/components/crm/SessionHeaderActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPOINTMENT_STATUSES } from "@/data/appointment-data";

interface AppointmentWithClient extends Appointment {
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
}

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("baseline"); // Default to the first new tab

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

  // Setup real-time subscription for seamless sync like Notion
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`appointment-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setAppointment((prev) => {
            if (!prev) return prev;
            // Only update fields that changed, but ensure date is still a Date object if needed
            const updatedData = { ...payload.new };
            if (updatedData.date && typeof updatedData.date === 'string') {
              updatedData.date = new Date(updatedData.date);
            }
            return { ...prev, ...updatedData };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const saveField = async (field: string, value: string | boolean | null | string[]) => {
    if (!id || !appointment) return;

    const normalized = Array.isArray(value) 
      ? value 
      : (typeof value === 'string' 
        ? (value.trim() === '' ? null : value.trim()) 
        : value);

    // Silent save - no UI feedback
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ [field]: normalized })
        .eq('id', id);

      if (error) throw error;

      // Update local state optimistically/silently
      setAppointment(prev => prev ? { ...prev, [field]: normalized } : null);
    } catch (err: any) {
      console.error(`Silent save failed for ${field}:`, err);
      // Optional: silent revert or retry logic, but for now, log only
    }
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

  const handleHydrationToggle = async (checked: boolean) => {
    await saveField('hydrated', checked);
  };

  useEffect(() => {
    fetchAppointmentData();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!appointment) return <div className="p-12 text-center">Appointment not found</div>;

  const clientLink = `/clients/${appointment.clients.id}`;
  const isHydrated = appointment.hydrated === true;
  const hasNeuroNotes = appointment.fakuda_notes || appointment.sharpened_rhombergs_notes || appointment.frontal_lobe_notes;
  
  const isSessionRelevant = isToday(appointment.date) && appointment.status !== 'Completed' && appointment.status !== 'Cancelled';

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      case 'Cancelled':
      case 'No Show':
        return "bg-red-500 text-white hover:bg-red-600";
      case 'Scheduled':
      default:
        return "bg-indigo-500 text-white hover:bg-indigo-600";
    }
  };

  return (
    <>
      <SessionTimer 
        appointmentDate={appointment.date} 
        status={appointment.status} 
      />
      
      <AppLayout hasFixedHeader={isSessionRelevant}>
        <div className="flex items-center justify-between gap-4">
          <Link to="/appointments">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={18} className="mr-2" /> Back to Schedule
            </Button>
          </Link>
          <div className="flex gap-2">
            <SessionHeaderActions appointmentId={id!} />
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteAppointment}
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">
                    {appointment.display_id || appointment.id.slice(0, 8)}
                  </Badge>
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">{appointment.tag}</Badge>
                  
                  {/* Status Selector */}
                  <Select
                    value={appointment.status}
                    onValueChange={(newStatus) => saveField('status', newStatus)}
                  >
                    <SelectTrigger className={cn(
                      "h-8 w-[120px] text-xs font-bold border-none shadow-sm",
                      getStatusColorClass(appointment.status)
                    )}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* End Status Selector */}

                  {appointment.hydrated !== null && (
                    <Badge className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                      isHydrated ? "bg-blue-600 text-white" : "bg-red-500 text-white"
                    )}>
                      <Droplets size={12} />
                      {isHydrated ? "Hydrated" : "Dehydrated"}
                    </Badge>
                  )}
                  {hasNeuroNotes && (
                    <Badge className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-green-600 text-white">
                      <Footprints size={12} />
                      Neuro Assessed
                    </Badge>
                  )}
                  {(appointment.luscher_color_1 && appointment.luscher_color_2) && (
                    <Badge className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-violet-600 text-white">
                      <Palette size={12} />
                      Luscher Assessed
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-900 pt-2">
                  {appointment.name || "Kinesiology Session"}
                </CardTitle>
              </div>
              <div className="text-right">
                <Link to={clientLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
                  <User size={16} /> 
                  <span className="group-hover:underline">{appointment.clients.name}</span>
                </Link>
                <p className="text-xs text-slate-400 mt-1">Client Profile</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Calendar size={16} className="text-indigo-500" />
                  {format(appointment.date, "EEEE, MMM d, yyyy")}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Clock size={16} className="text-indigo-500" />
                  {format(appointment.date, "h:mm a")}
                </div>
              </div>
              <div className="space-y-1">
                <EditableField
                  key={`goal-${appointment.id}`}
                  field="goal"
                  label="Goal"
                  value={appointment.goal}
                  placeholder="What's the goal?"
                  onSave={saveField}
                />
              </div>
              <div className="space-y-1">
                <EditableField
                  key={`issue-${appointment.id}`}
                  field="issue"
                  label="Issue"
                  value={appointment.issue}
                  placeholder="Main concern?"
                  onSave={saveField}
                />
              </div>
            </div>

            {/* Hydration Assessment */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 shadow-none rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
                  <Droplets size={18} className="text-blue-600" /> Hydration Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      appointment.hydrated 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-slate-100 text-slate-400"
                    )}>
                      <Droplets size={20} />
                    </div>
                    <div>
                      <Label htmlFor="hydration-toggle" className="text-base font-bold text-slate-900 cursor-pointer">
                        Client Hydrated
                      </Label>
                      <p className="text-xs text-slate-500">
                        {appointment.hydrated ? "Hydration test passed" : "Hydration test not passed"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="hydration-toggle"
                    checked={appointment.hydrated || false}
                    onCheckedChange={handleHydrationToggle}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                
                <EditableField
                  key={`hydration_notes-${appointment.id}`}
                  field="hydration_notes"
                  label="Hydration Recommendations"
                  value={appointment.hydration_notes}
                  multiline
                  placeholder="e.g., Drink 500ml water before next session, increase daily intake to 2L..."
                  onSave={saveField}
                />
              </CardContent>
            </Card>

            {/* General Session Notes (Moved above tabs) */}
            <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Zap size={16} className="text-indigo-500" /> General Session Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <EditableField
                  key={`acupoints-${appointment.id}`}
                  field="acupoints"
                  label="Acupoints"
                  value={appointment.acupoints}
                  placeholder="Which acupoints were used?"
                  onSave={saveField}
                />
                <EditableField
                  key={`notes-${appointment.id}`}
                  field="notes"
                  label="Session Notes (General)"
                  value={appointment.notes}
                  multiline
                  placeholder="Session observations and notes..."
                  onSave={saveField}
                />
                <EditableField
                  key={`journal-${appointment.id}`}
                  field="journal"
                  label="Journal Entry (Practitioner Reflection)"
                  value={appointment.journal}
                  multiline
                  className="bg-amber-50/50 p-3 rounded-xl border border-amber-100"
                  placeholder="Personal reflections and insights..."
                  onSave={saveField}
                />
                {appointment.notion_link && (
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl" asChild>
                    <a href={appointment.notion_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="mr-2" /> View Notion Link
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
            {/* End General Session Notes */}

            {/* Tabs for Assessments and Notes */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-12 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="baseline" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
                  <FlaskConical size={16} /> 1 - BASELINE ASSESSMENTS
                </TabsTrigger>
                <TabsTrigger value="sympathetic" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
                  <Heart size={16} /> 2 - SYMPATHETIC DOWN-REGULATION
                </TabsTrigger>
                <TabsTrigger value="pathway" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
                  <TrendingUp size={16} /> 3 - PATHWAY ASSESSMENT(S)
                </TabsTrigger>
                <TabsTrigger value="calibration" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
                  <CheckCircle2 size={16} /> 4 - CALIBRATION/ CORRECTION
                </TabsTrigger>
                <TabsTrigger value="reassessment" className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg h-10 text-xs">
                  <Zap size={16} /> 5 - RE-ASSESSMENT
                </TabsTrigger>
              </TabsList>

              <TabsContent value="baseline" className="mt-6 space-y-6">
                <BoltTestSection
                  appointmentId={appointment.id}
                  initialBoltScore={appointment.bolt_score}
                  onUpdate={fetchAppointmentData}
                />

                <CoherenceAssessment
                  appointmentId={appointment.id}
                  initialHeartRate={appointment.heart_rate}
                  initialBreathRate={appointment.breath_rate}
                  initialCoherenceScore={appointment.coherence_score}
                  onUpdate={fetchAppointmentData}
                />

                <CogsAssessment
                  appointmentId={appointment.id}
                  initialSagittalNotes={appointment.sagittal_plane_notes}
                  initialFrontalNotes={appointment.frontal_plane_notes}
                  initialTransverseNotes={appointment.transverse_plane_notes}
                  onUpdate={fetchAppointmentData}
                />
                
                <NeurologicalAssessments
                  appointmentId={appointment.id}
                  initialFakudaNotes={appointment.fakuda_notes}
                  initialRhombergsNotes={appointment.sharpened_rhombergs_notes}
                  initialFrontalLobeNotes={appointment.frontal_lobe_notes}
                  onUpdate={fetchAppointmentData}
                />
              </TabsContent>

              <TabsContent value="sympathetic" className="mt-6 space-y-6">
                <Card className="border-2 border-red-200 shadow-none rounded-2xl bg-red-50/50 p-6">
                  <h3 className="text-xl font-bold text-red-900 mb-2">Sympathetic Down-Regulation</h3>
                  <p className="text-red-800">Content for Sympathetic Down-Regulation goes here. This tab focuses on techniques to calm the nervous system.</p>
                </Card>
                <EditableField
                  key={`notes-sympathetic-${appointment.id}`}
                  field="additional_notes" // Reusing a generic field for now
                  label="Down-Regulation Notes"
                  value={appointment.additional_notes}
                  multiline
                  placeholder="Document techniques used (e.g., ESR, Nociceptive Threat Assessment, Vagus Nerve stimulation)..."
                  onSave={saveField}
                />
              </TabsContent>

              <TabsContent value="pathway" className="mt-6 space-y-6">
                <Card className="border-2 border-amber-200 shadow-none rounded-2xl bg-amber-50/50 p-6">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Pathway Assessment(s)</h3>
                  <p className="text-amber-800">Content for Pathway Assessment(s) goes here. This tab is for detailed pathway testing and analysis.</p>
                </Card>
                <EditableField
                  key={`notes-pathway-${appointment.id}`}
                  field="priority_pattern" // Reusing a generic field for now
                  label="Pathway Assessment Notes"
                  value={appointment.priority_pattern}
                  multiline
                  placeholder="Document specific pathways tested and findings..."
                  onSave={saveField}
                />
              </TabsContent>

              <TabsContent value="calibration" className="mt-6 space-y-6">
                <Card className="border-2 border-emerald-200 shadow-none rounded-2xl bg-emerald-50/50 p-6">
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">Calibration/Correction</h3>
                  <p className="text-emerald-800">Content for Calibration/Correction goes here. This tab is for logging primary corrections and balancing techniques.</p>
                </Card>
                <EditableField
                  key={`notes-calibration-${appointment.id}`}
                  field="modes_balances" // Reusing a generic field for now
                  label="Calibration & Correction Notes"
                  value={appointment.modes_balances}
                  multiline
                  placeholder="Document specific corrections, modes, and balances used..."
                  onSave={saveField}
                />
              </TabsContent>

              <TabsContent value="reassessment" className="mt-6 space-y-6">
                <Card className="border-2 border-indigo-200 shadow-none rounded-2xl bg-indigo-50/50 p-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Re-Assessment & Home Reinforcement</h3>
                  <p className="text-indigo-800">Content for Re-Assessment goes here. This tab is for final checks and prescribing home reinforcement.</p>
                <EditableField
                  key={`notes-reassessment-${appointment.id}`}
                  field="session_north_star" // Reusing a generic field for now
                  label="Re-Assessment & Home Reinforcement Notes"
                  value={appointment.session_north_star}
                  multiline
                  placeholder="Document re-test results and client homework/reinforcement exercises..."
                  onSave={saveField}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </AppLayout>
    </>
  );
};

export default AppointmentDetailPage;