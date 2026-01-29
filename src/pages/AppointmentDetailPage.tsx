import { useState, useEffect, useRef } from "react";
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
  
  // State for visual feedback
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const savingFieldsRef = useRef<Set<string>>(new Set());
  
  // Removed currentlyEditingFieldRef

  const fetchAppointmentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      console.log(`[fetchAppointmentData] Fetching appointment data for ID: ${id}`);
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

      console.log(`[fetchAppointmentData] Data fetched successfully:`, data);
      setAppointment({
        ...data,
        date: new Date(data.date),
      } as unknown as AppointmentWithClient);

    } catch (err) {
      console.error("[fetchAppointmentData] Error fetching appointment details:", err);
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

  const saveField = async (field: string, value: string | boolean) => {
    if (!id) return;
    
    console.log(`[saveField:${field}] ========== SAVE INITIATED ==========`);
    console.log(`[saveField:${field}] Value to save:`, value);
    console.log(`[saveField:${field}] Currently saving fields:`, Array.from(savingFieldsRef.current));
    
    savingFieldsRef.current.add(field);
    setSavingField(field);

    try {
      const updateData: Record<string, any> = {
        [field]: value === '' ? null : value
      };

      console.log(`[saveField:${field}] Sending update to Supabase:`, updateData);
      const { error, data: updatedData } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      console.log(`[saveField:${field}] ✅ Save successful. Response:`, updatedData);

      // Update local state immediately after successful save
      setAppointment(prev => {
        if (!prev) {
          console.log(`[saveField:${field}] ⚠️ No previous appointment state to update`);
          return prev;
        }
        console.log(`[saveField:${field}] Updating local state. Old value:`, prev[field as keyof AppointmentWithClient]);
        console.log(`[saveField:${field}] Updating local state. New value:`, value === '' ? null : value);
        return {
          ...prev,
          [field]: value === '' ? null : value
        };
      });

      // Show saved indicator
      setSavedField(field);
      setTimeout(() => {
        setSavedField(null);
      }, 2000);
      
    } catch (err: any) {
      console.error(`[saveField:${field}] ❌ Error saving field:`, err);
      showError(err.message || "Failed to save");
    } finally {
      savingFieldsRef.current.delete(field);
      setSavingField(null);
      console.log(`[saveField:${field}] ========== SAVE COMPLETED ==========`);
      console.log(`[saveField:${field}] Remaining saving fields:`, Array.from(savingFieldsRef.current));
    }
  };

  const handleHydrationToggle = async (checked: boolean) => {
    await saveField('hydrated', checked);
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
    // Use a ref to track if this is the initial mount
    const isInitialMount = useRef(true);
    const lastPropValue = useRef(value);
    
    // Initialize with prop value, but this will be controlled by the sync logic below
    const [localValue, setLocalValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const pendingSaveValueRef = useRef<string | null>(null);

    // Sync with prop value ONLY when:
    // 1. Not focused
    // 2. Not saving
    // 3. No pending save
    // 4. The prop value has actually changed (not just a re-render)
    useEffect(() => {
      const isSaving = savingFieldsRef.current.has(field);
      const hasPendingSave = pendingSaveValueRef.current !== null;
      const propValueChanged = lastPropValue.current !== value;
      
      console.log(`[EditableField:${field}] 🔄 Effect triggered. Checking if should sync...`);
      console.log(`[EditableField:${field}]   - Prop value:`, value);
      console.log(`[EditableField:${field}]   - Last prop value:`, lastPropValue.current);
      console.log(`[EditableField:${field}]   - Local value:`, localValue);
      console.log(`[EditableField:${field}]   - isFocused:`, isFocused);
      console.log(`[EditableField:${field}]   - isSaving:`, isSaving);
      console.log(`[EditableField:${field}]   - hasPendingSave:`, hasPendingSave);
      console.log(`[EditableField:${field}]   - propValueChanged:`, propValueChanged);
      console.log(`[EditableField:${field}]   - isInitialMount:`, isInitialMount.current);
      
      // Update the last prop value tracker
      lastPropValue.current = value;
      
      // On initial mount, always sync
      if (isInitialMount.current) {
        isInitialMount.current = false;
        const newValue = value || '';
        console.log(`[EditableField:${field}] ✅ Initial mount - syncing to:`, newValue);
        setLocalValue(newValue);
        return;
      }
      
      // For subsequent updates, only sync if conditions are met AND prop actually changed
      if (!isFocused && !isSaving && !hasPendingSave && propValueChanged) {
        const newValue = value || '';
        if (localValue !== newValue) {
          console.log(`[EditableField:${field}] ✅ Syncing prop value to local state. New value:`, newValue);
          setLocalValue(newValue);
        } else {
          console.log(`[EditableField:${field}] ⏭️ Skipping sync - values already match`);
        }
      } else {
        console.log(`[EditableField:${field}] ⛔ Skipping sync - conditions not met`);
      }
    }, [value, isFocused, field, localValue]);

    // Debounce logic for auto-save while typing
    useEffect(() => {
      if (!isFocused) return;

      console.log(`[EditableField:${field}] ⌨️ Typing detected. Local value:`, localValue);
      console.log(`[EditableField:${field}] Clearing previous debounce timer.`);
      
      // Clear existing timeout for this field
      if (saveTimeoutRef.current[field]) {
        clearTimeout(saveTimeoutRef.current[field]);
      }
      
      // Set new timeout to auto-save after 1 second of no typing
      saveTimeoutRef.current[field] = setTimeout(() => {
        // Only save if the local value differs from the prop value
        if (localValue !== (value || '')) {
          console.log(`[EditableField:${field}] ⏰ Debounce timer fired. Initiating auto-save.`);
          console.log(`[EditableField:${field}]   - Local value:`, localValue);
          console.log(`[EditableField:${field}]   - Prop value:`, value);
          pendingSaveValueRef.current = localValue;
          saveField(field, localValue).finally(() => {
            console.log(`[EditableField:${field}] Auto-save completed. Clearing pending save.`);
            pendingSaveValueRef.current = null;
          });
        } else {
          console.log(`[EditableField:${field}] ⏰ Debounce timer fired, but value unchanged. Skipping save.`);
        }
      }, 1000);

      return () => {
        if (saveTimeoutRef.current[field]) {
          console.log(`[EditableField:${field}] 🧹 Cleanup: Clearing debounce timer.`);
          clearTimeout(saveTimeoutRef.current[field]);
        }
      };
    }, [localValue, isFocused, field, value]);

    const handleBlur = () => {
      console.log(`[EditableField:${field}] 👋 Blur event triggered.`);
      console.log(`[EditableField:${field}]   - Local value at blur:`, localValue);
      console.log(`[EditableField:${field}]   - Prop value at blur:`, value);
      
      // Clear debounce timeout
      if (saveTimeoutRef.current[field]) {
        console.log(`[EditableField:${field}] Clearing debounce timeout on blur.`);
        clearTimeout(saveTimeoutRef.current[field]);
      }
      
      // Fire off save in background (non-blocking)
      if (localValue !== (value || '')) {
        console.log(`[EditableField:${field}] 💾 Blur save initiated. Value:`, localValue);
        pendingSaveValueRef.current = localValue;
        saveField(field, localValue).finally(() => {
          console.log(`[EditableField:${field}] Blur save completed. Clearing pending save.`);
          pendingSaveValueRef.current = null;
        });
      } else {
        console.log(`[EditableField:${field}] ⏭️ Blur save skipped: value unchanged.`);
      }
      
      // Immediately unfocus so user can click into next field
      console.log(`[EditableField:${field}] Setting isFocused to false.`);
      setIsFocused(false);
    };

    const handleFocus = () => {
      console.log(`[EditableField:${field}] 👆 Focus event triggered.`);
      console.log(`[EditableField:${field}]   - Local value at focus:`, localValue);
      console.log(`[EditableField:${field}]   - Prop value at focus:`, value);
      setIsFocused(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      console.log(`[EditableField:${field}] ✏️ Change event. New value length: ${newValue.length}`);
      console.log(`[EditableField:${field}]   - New value:`, newValue);
      setLocalValue(newValue);
    };

    const isFieldSaving = savingField === field;
    const isFieldSaved = savedField === field;
    const isEmpty = !localValue && !isFocused;

    const InputComponent = multiline ? Textarea : Input;

    return (
      <div className={cn("group relative", className)}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{label}</p>
          {isFieldSaving && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Saving...
            </span>
          )}
          {isFieldSaved && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
              <Check size={10} />
              Saved
            </span>
          )}
        </div>
        
        <InputComponent
          ref={inputRef as any}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            multiline ? "min-h-[100px] resize-none" : "",
            "transition-all",
            isEmpty && !isFocused && "text-slate-400 italic",
            isFocused && "ring-2 ring-indigo-500 border-indigo-500"
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