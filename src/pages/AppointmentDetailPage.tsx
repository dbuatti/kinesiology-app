import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Calendar, Clock, Target, Zap, 
  ExternalLink, Loader2, Trash2, User, Check
} from "lucide-react";
import { format } from "date-fns";
import { Appointment } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import BoltTestSection from "@/components/crm/BoltTestSection";
import CoherenceAssessment from "@/components/crm/CoherenceAssessment";
import CogsAssessment from "@/components/crm/CogsAssessment";

interface AppointmentWithClient extends Appointment {
  clients: { name: string; id: string };
  sagittal_plane_notes?: string | null;
  frontal_plane_notes?: string | null;
  transverse_plane_notes?: string | null;
}

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states for each field
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

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

      console.log("[AppointmentDetail] Fetched appointment data:", data);

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

  const saveField = async (field: string, value: string) => {
    if (!id) return;
    
    setSavingField(field);

    try {
      const updateData: Record<string, any> = {
        [field]: value || null
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state WITHOUT re-fetching to prevent focus loss
      if (appointment) {
        setAppointment({
          ...appointment,
          [field]: value || null
        });
      }

      // Show saved indicator
      setSavedField(field);
      setTimeout(() => setSavedField(null), 2000);
      
    } catch (err: any) {
      showError(err.message || "Failed to save");
    } finally {
      setSavingField(null);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditValues({ ...editValues, [field]: value });
    
    // Clear existing timeout for this field
    if (saveTimeoutRef.current[field]) {
      clearTimeout(saveTimeoutRef.current[field]);
    }
    
    // Set new timeout to auto-save after 1 second of no typing
    saveTimeoutRef.current[field] = setTimeout(() => {
      saveField(field, value);
    }, 1000);
  };

  const handleFieldBlur = (field: string) => {
    // Clear timeout and save immediately on blur
    if (saveTimeoutRef.current[field]) {
      clearTimeout(saveTimeoutRef.current[field]);
    }
    
    const value = editValues[field];
    if (value !== undefined) {
      saveField(field, value);
    }
    
    setEditingField(null);
  };

  const handleFieldFocus = (field: string, currentValue: string | null | undefined) => {
    setEditingField(field);
    if (editValues[field] === undefined) {
      setEditValues({ ...editValues, [field]: currentValue || '' });
    }
  };

  useEffect(() => {
    fetchAppointmentData();
    
    // Cleanup timeouts on unmount
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!appointment) return <div className="p-12 text-center">Appointment not found</div>;

  const clientLink = `/clients/${appointment.clients.id}`;

  const EditableField = ({ 
    field, 
    label, 
    value, 
    multiline = false,
    className = "",
    placeholder = "Click to add..."
  }: { 
    field: string; 
    label: string; 
    value: string | null | undefined; 
    multiline?: boolean;
    className?: string;
    placeholder?: string;
  }) => {
    const isEditing = editingField === field;
    const isSaving = savingField === field;
    const isSaved = savedField === field;
    const currentValue = editValues[field] !== undefined ? editValues[field] : (value || '');
    const isEmpty = !currentValue;

    return (
      <div className={cn("group relative", className)}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{label}</p>
          {isSaving && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Saving...
            </span>
          )}
          {isSaved && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
              <Check size={10} />
              Saved
            </span>
          )}
        </div>
        
        {multiline ? (
          <Textarea
            value={currentValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            onFocus={() => handleFieldFocus(field, value)}
            onBlur={() => handleFieldBlur(field)}
            placeholder={placeholder}
            className={cn(
              "min-h-[100px] resize-none transition-all",
              isEmpty && !isEditing && "text-slate-400 italic",
              isEditing && "ring-2 ring-indigo-500 border-indigo-500"
            )}
          />
        ) : (
          <Input
            value={currentValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            onFocus={() => handleFieldFocus(field, value)}
            onBlur={() => handleFieldBlur(field)}
            placeholder={placeholder}
            className={cn(
              "transition-all",
              isEmpty && !isEditing && "text-slate-400 italic",
              isEditing && "ring-2 ring-indigo-500 border-indigo-500"
            )}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/appointments">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back to Schedule
          </Button>
        </Link>
        <div className="flex gap-2">
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
                <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    appointment.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {appointment.status}
                </span>
              </div>
              <CardTitle className="text-3xl font-extrabold text-slate-900 pt-2">
                {appointment.name || "Kinesiology Session"}
              </CardTitle>
            </div>
            <div className="text-right">
              <Link to={clientLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <User size={16} /> {appointment.clients.name}
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
                field="goal"
                label="Goal"
                value={appointment.goal}
                placeholder="What's the goal?"
              />
            </div>
            <div className="space-y-1">
              <EditableField
                field="issue"
                label="Issue"
                value={appointment.issue}
                placeholder="Main concern?"
              />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Target size={16} className="text-indigo-500" /> Session Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <EditableField
                  field="session_north_star"
                  label="Session North Star"
                  value={appointment.session_north_star}
                  multiline
                  placeholder="What's the guiding focus for this session?"
                />
                <EditableField
                  field="priority_pattern"
                  label="Priority Pattern"
                  value={appointment.priority_pattern}
                  multiline
                  placeholder="What patterns are we addressing?"
                />
                <EditableField
                  field="modes_balances"
                  label="Modes & Balances"
                  value={appointment.modes_balances}
                  multiline
                  placeholder="Which modes and balances were used?"
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Zap size={16} className="text-indigo-500" /> Acupoints & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <EditableField
                  field="acupoints"
                  label="Acupoints"
                  value={appointment.acupoints}
                  placeholder="Which acupoints were used?"
                />
                <EditableField
                  field="notes"
                  label="Session Notes"
                  value={appointment.notes}
                  multiline
                  placeholder="Session observations and notes..."
                />
                <EditableField
                  field="additional_notes"
                  label="Additional Notes"
                  value={appointment.additional_notes}
                  multiline
                  placeholder="Any additional observations..."
                />
                <EditableField
                  field="journal"
                  label="Journal Entry"
                  value={appointment.journal}
                  multiline
                  className="bg-amber-50/50 p-3 rounded-xl border border-amber-100"
                  placeholder="Personal reflections and insights..."
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
          </div>
        </CardContent>
      </Card>

      {/* BOLT Test - Always show */}
      <BoltTestSection
        appointmentId={appointment.id}
        initialBoltScore={appointment.bolt_score}
        onUpdate={fetchAppointmentData}
      />

      {/* Coherence Assessment - Always show */}
      <CoherenceAssessment
        appointmentId={appointment.id}
        initialHeartRate={appointment.heart_rate}
        initialBreathRate={appointment.breath_rate}
        initialCoherenceScore={appointment.coherence_score}
        onUpdate={fetchAppointmentData}
      />

      {/* Cogs Assessment - Always show */}
      <CogsAssessment
        appointmentId={appointment.id}
        initialSagittalNotes={appointment.sagittal_plane_notes}
        initialFrontalNotes={appointment.frontal_plane_notes}
        initialTransverseNotes={appointment.transverse_plane_notes}
        onUpdate={fetchAppointmentData}
      />
    </div>
  );
};

export default AppointmentDetailPage;