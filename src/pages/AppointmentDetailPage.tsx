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
  ExternalLink, Loader2, Trash2, User, Check, Droplets
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
  hydrated?: boolean | null;
  hydration_notes?: string | null;
}

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithClient | null>(null);
  const [loading, setLoading] = useState(true);

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

  const saveField = async (field: string, value: string | boolean | null) => {
    if (!id || !appointment) return;

    const isStringField = typeof value === 'string' || value === null;
    const normalized = isStringField && typeof value === 'string' 
      ? (value.trim() || null) 
      : value;

    // Optimistic update ONLY for non-string fields (e.g. hydrated toggle)
    if (!isStringField) {
      const original = appointment[field as keyof AppointmentWithClient];
      setAppointment(prev => prev ? { ...prev, [field]: normalized } : null);

      try {
        const { error } = await supabase.from('appointments').update({ [field]: normalized }).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        showError("Could not save change");
        setAppointment(prev => prev ? { ...prev, [field]: original } : null);
        throw err;
      }
      return;
    }

    // For string fields: no optimistic update → EditableField handles local display
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ [field]: normalized })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      showError("Could not save – check your connection");
      throw err;
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

  const EditableField = ({ 
    field, 
    label, 
    value: propValue, 
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
    const [localValue, setLocalValue] = useState(propValue ?? '');
    const [isFocused, setIsFocused] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedValueRef = useRef(propValue ?? '');

    // Sync from prop ONLY when not focused
    useEffect(() => {
      if (isFocused) return;

      const normalized = propValue ?? '';
      if (normalized !== lastSavedValueRef.current) {
        setLocalValue(normalized);
        lastSavedValueRef.current = normalized;
      }
    }, [propValue, isFocused]);

    // Debounced auto-save
    useEffect(() => {
      if (!isFocused || localValue === lastSavedValueRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        performSave(localValue);
      }, 700);

      return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
    }, [localValue, isFocused]);

    const performSave = async (newVal: string) => {
      const trimmed = newVal.trim();
      if (trimmed === lastSavedValueRef.current) return;

      setIsSaving(true);

      try {
        await saveField(field, trimmed);
        lastSavedValueRef.current = trimmed;
        setJustSaved(true);
        savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 1600);
      } catch (err) {
        setLocalValue(lastSavedValueRef.current); // revert on error
      } finally {
        setIsSaving(false);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsFocused(false);
      performSave(localValue);
    };

    // Aggressive focus restoration + cursor position preservation
    useLayoutEffect(() => {
      if (!isFocused || !inputRef.current) return;

      if (document.activeElement !== inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(len, len);
      }
    }, [isFocused, localValue, isSaving]); // re-run when these change

    const isEmpty = !localValue && !isFocused;
    const InputComponent = multiline ? Textarea : Input;

    return (
      <div className={cn("group relative", className)}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{label}</p>
          {isSaving && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Saving…
            </span>
          )}
          {justSaved && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
              <Check size={10} />
              Saved
            </span>
          )}
        </div>

        <InputComponent
          ref={inputRef}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={isSaving}
          className={cn(
            multiline ? "min-h-[100px] resize-none" : "",
            "transition-all duration-150",
            isEmpty && !isFocused && "text-slate-400 italic",
            isFocused && "ring-2 ring-indigo-500/70 border-indigo-400 shadow-sm",
            isSaving && "opacity-75 cursor-wait"
          )}
        />
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
                key={`goal-${appointment.id}`}
                field="goal"
                label="Goal"
                value={appointment.goal}
                placeholder="What's the goal?"
              />
            </div>
            <div className="space-y-1">
              <EditableField
                key={`issue-${appointment.id}`}
                field="issue"
                label="Issue"
                value={appointment.issue}
                placeholder="Main concern?"
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
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-none rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                  <Target size={16} className="text-indigo-500" /> Session Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <EditableField
                  key={`session_north_star-${appointment.id}`}
                  field="session_north_star"
                  label="Session North Star"
                  value={appointment.session_north_star}
                  multiline
                  placeholder="What's the guiding focus for this session?"
                />
                <EditableField
                  key={`priority_pattern-${appointment.id}`}
                  field="priority_pattern"
                  label="Priority Pattern"
                  value={appointment.priority_pattern}
                  multiline
                  placeholder="What patterns are we addressing?"
                />
                <EditableField
                  key={`modes_balances-${appointment.id}`}
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
                  key={`acupoints-${appointment.id}`}
                  field="acupoints"
                  label="Acupoints"
                  value={appointment.acupoints}
                  placeholder="Which acupoints were used?"
                />
                <EditableField
                  key={`notes-${appointment.id}`}
                  field="notes"
                  label="Session Notes"
                  value={appointment.notes}
                  multiline
                  placeholder="Session observations and notes..."
                />
                <EditableField
                  key={`additional_notes-${appointment.id}`}
                  field="additional_notes"
                  label="Additional Notes"
                  value={appointment.additional_notes}
                  multiline
                  placeholder="Any additional observations..."
                />
                <EditableField
                  key={`journal-${appointment.id}`}
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
    </div>
  );
};

export default AppointmentDetailPage;