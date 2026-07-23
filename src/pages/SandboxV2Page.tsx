import { useState, useMemo, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import PeaceWizard from "@/components/crm/v2/PeaceWizard";
import AppointmentV2DocView from "@/components/crm/v2/AppointmentV2DocView";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppointmentWithClient } from "@/types/crm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { safeParse, safeStringify } from "@/utils/safe-json";
import {
  ArrowLeft, Activity, FileText, Maximize2, Minimize2, Zap, Save
} from "lucide-react";

const EMPTY_CLIENT: AppointmentWithClient["clients"] = {
  id: "sandbox",
  user_id: "",
  name: "Practice Session",
  pronouns: "",
  born: null,
  suburbs: [],
  email: null,
  phone: null,
};

const SandboxV2Page = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id || "sandbox";

  const [viewMode, setViewMode] = useState<'peace' | 'doc'>(() =>
    window.location.pathname.endsWith('/doc') ? 'doc' : 'peace'
  );
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [useNewClient, setUseNewClient] = useState(false);

  const [appointmentData, setAppointmentData] = useState<AppointmentWithClient>(() => ({
    id: `ffffffff-ffff-ffff-ffff-${Date.now().toString(16).padStart(12, '0')}`,
    user_id: userId,
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
    clients: { ...EMPTY_CLIENT, user_id: userId },
  }));

  const saveField = useCallback(async (field: string, value: any) => {
    console.log(`[sandbox] ${field} =`, value);
    setAppointmentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePriorityPattern = useCallback(async (_category: string, _itemName: string, _status: any, _side?: string) => {
    setAppointmentData(prev => {
      const current = safeParse(prev.priority_pattern, {});
      if (!current[_category]) current[_category] = {};
      const finalName = _side ? `${_itemName} (${_side})` : _itemName;
      // Never delete — "Clear"/null becomes "Inhibited_Cleared" to preserve findings
      const preservedStatus = _status === null || _status === 'Clear' ? 'Inhibited_Cleared' : _status;
      current[_category][finalName] = preservedStatus;
      return { ...prev, priority_pattern: safeStringify(current) };
    });
  }, []);

  const searchClients = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("clients")
      .select("id, name, email")
      .ilike("name", `%${q}%`)
      .limit(8);
    setSearchResults(data || []);
  };

  const handleSave = async () => {
    if (!session) return;
    setSaveLoading(true);
    try {
      let clientId = selectedClientId;

      if (useNewClient) {
        if (!newClientName.trim()) {
          showError("Enter a client name");
          setSaveLoading(false);
          return;
        }
        const { data: newClient, error: ce } = await supabase
          .from("clients")
          .insert({ user_id: userId, name: newClientName.trim() })
          .select("id")
          .single();
        if (ce) throw ce;
        clientId = newClient.id;
      }

      if (!clientId) {
        showError("Select or create a client");
        setSaveLoading(false);
        return;
      }

      const payload: Record<string, any> = {};
      const fields: (keyof AppointmentWithClient)[] = [
        "goal", "issue", "bolt_score", "heart_rate", "breath_rate", "coherence_score",
        "sagittal_plane_notes", "frontal_plane_notes", "transverse_plane_notes",
        "fakuda_notes", "sharpened_rhombergs_notes", "frontal_lobe_notes", "righting_reflex_notes",
        "lymphatic_notes", "harmonic_rocking_notes", "t1_reset_notes", "diaphragm_reset_notes", "vagus_nerve_notes",
        "emotion_primary_selection", "emotion_secondary_selection", "emotion_notes",
        "modes_balances", "acupoints", "session_north_star", "next_session_note",
        "journal", "intrinsic_muscle_findings", "priority_pattern", "notes", "additional_notes",
      ];
      for (const f of fields) {
        const v = appointmentData[f];
        if (v != null && v !== "" && v !== "{}") {
          payload[f] = v;
        }
      }

      const { data: appt, error: ae } = await supabase
        .from("appointments")
        .insert({
          user_id: userId,
          client_id: clientId,
          date: new Date().toISOString(),
          tag: "Kinesiology",
          status: "OPEN",
          ...payload,
        })
        .select("id")
        .single();

      if (ae) throw ae;

      showSuccess("Session saved");
      setSaveOpen(false);
      navigate(`/appointments/${appt.id}/v2`);
    } catch (err: any) {
      console.error("Save failed:", err);
      showError("Failed to save session");
    } finally {
      setSaveLoading(false);
    }
  };

  const MODE_TABS = [
    { id: 'peace' as const, label: 'PEACE', icon: Activity },
    { id: 'doc' as const, label: 'DOC', icon: FileText },
  ];

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className={cn("min-h-screen bg-background", isFullScreen && "fixed inset-0 z-50 overflow-y-auto")}>
      {/* Compact sandbox header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border print:hidden">
        <div className="px-4 md:px-8 h-11 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/practice/clinical-hub')}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="h-4 w-px bg-border/60" />
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Sandbox</span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">No data saved</span>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 mr-2 border-r border-border/60 pr-2">
              {MODE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewMode(tab.id)}
                    className={cn(
                      "flex items-center gap-1 px-2 h-7 text-[9px] font-bold uppercase tracking-wider transition-colors rounded-md",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon size={12} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setSaveOpen(true)}
              className="flex items-center gap-1 px-2.5 h-7 text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-md"
            >
              <Save size={12} /> Save
            </button>
            <div className="w-px h-5 bg-border/60 mx-1" />
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center gap-1 px-2 h-7 text-[9px] font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
            >
              {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'peace' && (
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
          <PeaceWizard
            appointment={appointmentData}
            history={[]}
            onUpdate={() => {}}
            saveField={saveField}
            updatePriorityPattern={updatePriorityPattern}
            onJumpToPhase={() => {}}
            onFinalise={() => setSaveOpen(true)}
          />
        </div>
      )}

      {viewMode === 'doc' && (
        <AppointmentV2DocView
          appointment={appointmentData}
          history={[]}
          onBack={() => navigate('/practice/clinical-hub')}
          saveField={saveField}
          updatePriorityPattern={updatePriorityPattern}
          hideToolbar
          editable
        />
      )}

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Save Sandbox Session</DialogTitle>
            <DialogDescription className="text-xs">
              Save all data to a new or existing client. A new appointment will be created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setUseNewClient(false); setNewClientName(""); }}
                className={cn(
                  "flex-1 h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors",
                  !useNewClient
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Existing Client
              </button>
              <button
                onClick={() => { setUseNewClient(true); setSelectedClientId(null); setClientSearch(""); setSearchResults([]); }}
                className={cn(
                  "flex-1 h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors",
                  useNewClient
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                New Client
              </button>
            </div>

            {useNewClient ? (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Client Name</p>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter client name..."
                  className="h-9 text-sm rounded-lg"
                />
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Search Client</p>
                <Input
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); searchClients(e.target.value); }}
                  placeholder="Type name to search..."
                  className="h-9 text-sm rounded-lg"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClientId(c.id); setClientSearch(c.name); setSearchResults([]); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedClientId === c.id
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.email && <span className="text-muted-foreground text-[10px] ml-2">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!useNewClient && !selectedClientId && clientSearch && searchResults.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">No clients found. Try a different name or switch to "New Client".</p>
            )}
          </div>

          {/* Data preview */}
          {(() => {
            const filled: string[] = [];
            if (appointmentData.goal) filled.push("Goal");
            if (appointmentData.issue) filled.push("Issue");
            if (appointmentData.bolt_score != null) filled.push("Vitals");
            if (appointmentData.sagittal_plane_notes || appointmentData.frontal_plane_notes || appointmentData.transverse_plane_notes) filled.push("COGS");
            if (appointmentData.fakuda_notes || appointmentData.sharpened_rhombergs_notes || appointmentData.frontal_lobe_notes || appointmentData.righting_reflex_notes) filled.push("Neuro");
            if (appointmentData.lymphatic_notes || appointmentData.harmonic_rocking_notes || appointmentData.t1_reset_notes || appointmentData.diaphragm_reset_notes || appointmentData.vagus_nerve_notes) filled.push("Ease");
            if (appointmentData.emotion_primary_selection || appointmentData.emotion_notes) filled.push("Emotion");
            if (appointmentData.modes_balances || appointmentData.acupoints) filled.push("Corrections");
            if (appointmentData.session_north_star || appointmentData.next_session_note) filled.push("Embed");
            if (appointmentData.intrinsic_muscle_findings) filled.push("Muscles");
            if (appointmentData.journal) filled.push("Journal");
            if (filled.length === 0) return null;
            return (
              <div className="px-0">
                <div className="h-px bg-border/40 -mx-6 mb-4" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Data to save</p>
                <div className="flex flex-wrap gap-1">
                  {filled.map(s => (
                    <span key={s} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaveOpen(false)} className="rounded-lg h-9 text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveLoading || (useNewClient ? !newClientName.trim() : !selectedClientId)}
              className="rounded-lg h-9 text-xs gap-1.5"
            >
              {saveLoading ? "Saving..." : <><Save size={13} /> Save Session</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SandboxV2Page;
