import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import PeaceWizard from "@/components/crm/v2/PeaceWizard";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";
import { AppointmentWithClient } from "@/types/crm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, FileText, Maximize2, Minimize2, Zap } from "lucide-react";

const SandboxV2Page = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [viewMode, setViewMode] = useState<'peace' | 'doc'>('peace');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const mockAppointment = useMemo((): AppointmentWithClient => ({
    id: `sandbox-${Date.now()}`,
    user_id: session?.user?.id || "sandbox",
    client_id: "sandbox",
    date: new Date(),
    tag: "Kinesiology",
    status: "OPEN",
    notes: "",
    goal: "",
    issue: "",
    acupoints: "",
    priority_pattern: "{}",
    session_north_star: "",
    next_session_note: null,
    modes_balances: "",
    journal: "",
    notion_link: "",
    bolt_score: null,
    heart_rate: null,
    breath_rate: null,
    coherence_score: null,
    sagittal_plane_notes: null,
    frontal_plane_notes: null,
    transverse_plane_notes: null,
    hydrated: null,
    hydration_notes: null,
    emotion_mode: null,
    emotion_primary_selection: null,
    emotion_secondary_selection: null,
    emotion_notes: null,
    fakuda_notes: null,
    sharpened_rhombergs_notes: null,
    frontal_lobe_notes: null,
    righting_reflex_notes: null,
    luscher_color_1: null,
    luscher_color_2: null,
    harmonic_rocking_notes: null,
    t1_reset_notes: null,
    diaphragm_reset_notes: null,
    vagus_nerve_notes: null,
    gait_notes: null,
    lymphatic_suture_side: null,
    lymphatic_priority_zone: null,
    lymphatic_notes: null,
    current_stress_level: null,
    sleep_quality: null,
    digestive_health: null,
    medications_supplements: null,
    send_onboarding: false,
    intrinsic_muscle_findings: "",
    additional_notes: "",
    display_id: undefined,
    is_paid: false,
    payment_received: false,
    payment_link: null,
    payment_method: null,
    notion_page_id: null,
    notion_planner_id: null,
    calcom_booking_id: null,
    price_amount: null,
    price_currency: null,
    metadata: null,
    clients: {
      id: "sandbox",
      user_id: session?.user?.id || "sandbox",
      name: "Practice Session",
      pronouns: "",
      born: null,
      suburbs: [],
      email: null,
      phone: null,
    }
  }), [session]);

  const noopSave = async (_field: string, _value: unknown) => {
    console.log(`[sandbox] save`, _field, _value);
  };

  const noopPriority = async (_category: string, _itemName: string, _status: 'Clear' | 'Inhibited' | 'Hypertonic' | 'Unsure' | null, _side?: string) => {
    console.log(`[sandbox] priority`, _category, _itemName, _status, _side);
  };

  const MODE_TABS = [
    { id: 'peace' as const, label: 'PEACE', icon: Activity },
    { id: 'doc' as const, label: 'DOC', icon: FileText },
  ];

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className={cn("min-h-screen bg-background", isFullScreen && "fixed inset-0 z-50 overflow-y-auto")}>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/practice/clinical-hub')}
              className="rounded-xl text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Practice Session</p>
                <p className="text-[10px] text-muted-foreground font-medium">Sandbox — nothing saved</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5 mr-3 border-r border-border pr-3">
              {MODE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-lg",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-background transition-colors rounded-lg"
            >
              {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 pt-4 max-w-6xl mx-auto">
        <div className="px-4 py-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-400 font-medium">
          Sandbox Mode — No data is saved. All changes are discarded when you leave.
        </div>
      </div>

      {viewMode === 'peace' && (
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
          <PeaceWizard
            appointment={mockAppointment}
            history={[]}
            onUpdate={() => {}}
            saveField={noopSave}
            updatePriorityPattern={noopPriority}
            onJumpToPhase={() => {}}
            onFinalise={() => navigate('/practice/clinical-hub')}
          />
        </div>
      )}

      {viewMode === 'doc' && (
        <AppointmentV2DocView
          appointment={mockAppointment}
          history={[]}
          onBack={() => setViewMode('peace')}
          saveField={noopSave}
          updatePriorityPattern={noopPriority}
        />
      )}
    </div>
  );
};

export default SandboxV2Page;
