
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Heart, Shield, Layers, Activity, Dumbbell, Brain, Info,
  Sparkles, Zap, RefreshCw, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, Loader2, SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";
import { useHeartWallSession } from "@/hooks/useHeartWallSession";
import {
  HeartWallSession, HeartWallLayer, HeartWallLayerPhase, HeartWallLayerStatus,
} from "@/types/crm";
import { ROW_DATA, EMOTION_CODE_CHART } from "@/data/emotion-code-data";
import PulsePointPicker from "./PulsePointPicker";

interface HeartWallToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  appointmentId?: string | null;
}

type SessionUIState = "setup" | "working" | "summary";

const ASSESSMENT_STEPS: { phase: HeartWallLayerPhase; label: string; icon: React.ComponentType<{ size?: number }>; color: string }[] = [
  { phase: "screen", label: "Screen", icon: Shield, color: "text-rose-500" },
  { phase: "count", label: "Count", icon: Layers, color: "text-chart-primary" },
  { phase: "find-emotion", label: "Find Emotion", icon: Heart, color: "text-rose-600" },
  { phase: "assess-muscles", label: "Muscles", icon: Dumbbell, color: "text-emerald-600" },
  { phase: "brain-zones", label: "Brain Zones", icon: Brain, color: "text-indigo-600" },
  { phase: "context", label: "Context", icon: Info, color: "text-amber-600" },
  { phase: "confirm", label: "Confirm", icon: Sparkles, color: "text-amber-500" },
];

const CORRECTION_STEPS: { phase: HeartWallLayerPhase; label: string; icon: React.ComponentType<{ size?: number }>; color: string }[] = [
  { phase: "correct-stim", label: "Stim", icon: Activity, color: "text-rose-500" },
  { phase: "correct-hold", label: "Hold Point", icon: Dumbbell, color: "text-chart-primary" },
  { phase: "correct-tap", label: "Tap Zones", icon: Brain, color: "text-indigo-600" },
  { phase: "recheck", label: "Recheck", icon: RefreshCw, color: "text-emerald-600" },
];

const ALL_STEPS = [...ASSESSMENT_STEPS, ...CORRECTION_STEPS];

function uuid() {
  return crypto.randomUUID();
}

export default function HeartWallTool({ open, onOpenChange, clientId, appointmentId }: HeartWallToolProps) {
  const { session, loading, createSession, saveSession, refresh } = useHeartWallSession(clientId, appointmentId);

  const [uiState, setUiState] = useState<SessionUIState>("setup");
  const [stepIndex, setStepIndex] = useState(0);
  const [layerCountInput, setLayerCountInput] = useState("");
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [pendingLayer, setPendingLayer] = useState<Partial<HeartWallLayer>>({});
  const [sessionNotes, setSessionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3>(0);
  const [scanColumn, setScanColumn] = useState<"A" | "B" | null>(null);
  const [scanHalf, setScanHalf] = useState<"top" | "bottom" | null>(null);

  // Derive session state
  const layers = session?.layers || [];
  const clearedCount = layers.filter(l => l.status === "cleared").length;
  const activeLayer = layers.find(l => l.id === activeLayerId) || null;
  const totalLayers = session?.initialLayerCount ?? layers.length;
  const layersRemaining = session?.layersRemaining ?? null;
  const currentStep = ALL_STEPS[stepIndex];

  // Derive organ row from pending layer
  const organRow = pendingLayer.organ
    ? Number(Object.entries(ROW_DATA).find(([, v]) => v.organ === pendingLayer.organ)?.[0]) || null
    : null;

  // Derive narrowed emotions for scanning flow
  const scanEmotions = useMemo(() => {
    if (!organRow) return { columnA: [], columnB: [], all: [] };
    const cell = EMOTION_CODE_CHART[organRow];
    return { columnA: cell.columnA, columnB: cell.columnB, all: [...cell.columnA, ...cell.columnB] };
  }, [organRow]);

  useEffect(() => {
    if (!session) return;
    if (session.status === "complete" || session.status === "abandoned") {
      setUiState("summary");
      setSessionNotes(session.notes || "");
    } else if (session.layers.length > 0) {
      const last = session.layers[session.layers.length - 1];
      if (last.status === "active") {
        setActiveLayerId(last.id);
        setPendingLayer(last);
        const stepIdx = ALL_STEPS.findIndex(s => s.phase === last.phase);
        if (stepIdx >= 0) setStepIndex(stepIdx);
        setUiState("working");
      } else {
        setUiState("working");
        setStepIndex(0);
        setPendingLayer({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Reset scan step when navigating away from find-emotion or starting fresh
  useEffect(() => {
    const step = ALL_STEPS[stepIndex];
    if (step?.phase !== "find-emotion") {
      setScanStep(0);
      setScanColumn(null);
      setScanHalf(null);
    } else if (step?.phase === "find-emotion") {
      // Restore scan progress from pending layer
      if (pendingLayer.organ && pendingLayer.emotion) {
        setScanStep(3);
      } else if (pendingLayer.organ) {
        setScanStep(1);
      } else {
        setScanStep(0);
      }
    }
  }, [stepIndex, pendingLayer.organ, pendingLayer.emotion]);

  // ─── Setup ────────────────────────────────────────
  const handleStart = async () => {
    setSaving(true);
    try {
      const count = parseInt(layerCountInput) || null;
      await createSession(count);
      setUiState("working");
      setStepIndex(0);
    } catch (err) {
      showError((err instanceof Error ? err.message : null) || "Failed to start session");
    } finally {
      setSaving(false);
    }
  };

  // ─── Step Navigation ──────────────────────────────
  const goNext = () => {
    if (stepIndex < ALL_STEPS.length - 1) setStepIndex(stepIndex + 1);
  };
  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  // ─── Layer Management ─────────────────────────────
  const startNewLayer = useCallback(() => {
    const newLayer: HeartWallLayer = {
      id: uuid(),
      order: layers.length + 1,
      emotion: null,
      columnA: false,
      organ: null,
      relatedMuscles: null,
      brainZones: null,
      contextAge: null,
      contextEvent: null,
      contextInherited: false,
      contextParent: null,
      status: "active",
      notes: null,
      phase: "screen",
    };
    setPendingLayer(newLayer);
    setActiveLayerId(newLayer.id);
    setStepIndex(0);
    setUiState("working");
  }, [layers.length]);

  const saveLayerAndContinue = async (override?: Partial<HeartWallLayer>) => {
    if (!session) return;
    setSaving(true);
    try {
      const merged = { ...pendingLayer, ...override } as HeartWallLayer;
      merged.phase = currentStep.phase;
      const existing = layers.findIndex(l => l.id === merged.id);
      const newLayers = [...layers];
      if (existing >= 0) newLayers[existing] = merged;
      else newLayers.push(merged);
      await saveSession({ layers: newLayers as unknown as HeartWallLayer[] });
      setPendingLayer(merged);
    } catch (err) {
      showError((err instanceof Error ? err.message : null) || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const markLayerCleared = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const merged = { ...pendingLayer, status: "cleared" as HeartWallLayerStatus, phase: currentStep.phase } as HeartWallLayer;
      const newLayers = layers.map(l => l.id === merged.id ? merged : l);
      const newRemaining = layersRemaining !== null ? Math.max(0, layersRemaining - 1) : null;
      await saveSession({ layers: newLayers as unknown as HeartWallLayer[], layersRemaining: newRemaining });
      showSuccess(`Layer ${merged.order} cleared`);

      if (newRemaining !== null && newRemaining <= 0) {
        await saveSession({
          status: "complete",
          completedAt: new Date().toISOString(),
          layers: newLayers as unknown as HeartWallLayer[],
          layersRemaining: newRemaining,
        });
        setUiState("summary");
        return;
      }

      setActiveLayerId(null);
      setPendingLayer({});
      setStepIndex(0);
    } catch (err) {
      showError((err instanceof Error ? err.message : null) || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const markLayerSkipped = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const merged = { ...pendingLayer, status: "skipped" as HeartWallLayerStatus, phase: currentStep.phase } as HeartWallLayer;
      const newLayers = layers.map(l => l.id === merged.id ? merged : l);
      await saveSession({ layers: newLayers as unknown as HeartWallLayer[] });
      setActiveLayerId(null);
      setPendingLayer({});
      setStepIndex(0);
    } catch (err) {
      showError((err instanceof Error ? err.message : null) || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await saveSession({
        status: "complete",
        completedAt: new Date().toISOString(),
        notes: sessionNotes || null,
      });
      setUiState("summary");
      showSuccess("Session complete");
    } catch (err) {
      showError((err instanceof Error ? err.message : null) || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAbandonSession = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await saveSession({
        status: "abandoned",
        completedAt: new Date().toISOString(),
        notes: sessionNotes || null,
      });
      setUiState("summary");
    } catch (err) {
      showError((err instanceof Error ? err.message : null) || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg p-8 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[700px] flex flex-col p-0">
        {/* ── Header ─────────────────────────────────── */}
        <DialogHeader className="p-6 pb-4 shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Heart size={20} className="text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {uiState === "setup" && "Heart Wall Procedure"}
                  {uiState === "working" && (
                    <>
                      Layer {activeLayer?.order ?? layers.length + 1}
                      {layersRemaining !== null && (
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                          — {layersRemaining} remaining
                        </span>
                      )}
                    </>
                  )}
                  {uiState === "summary" && "Session Summary"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {uiState === "setup" && "Identify and clear subconscious emotional barriers around the heart"}
                  {uiState === "working" && `${currentStep.label}`}
                  {uiState === "summary" && (
                    session?.status === "complete" ? "All layers processed" : "Session ended"
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Progress chips */}
            {uiState === "working" && (
              <div className="flex items-center gap-2">
                {session?.initialLayerCount && (
                  <Badge variant="outline" className="text-[10px] font-semibold border-rose-200 text-rose-700 bg-rose-50">
                    {clearedCount}/{session.initialLayerCount} cleared
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Step progress bar */}
          {uiState === "working" && (
            <div className="mt-4 flex items-center gap-0.5">
              {ALL_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isCurrent = i === stepIndex;
                const isPast = i < stepIndex;
                return (
                  <button
                    key={step.phase}
                    onClick={() => { setStepIndex(i); }}
                    className={cn(
                      "flex-1 h-8 rounded-lg flex items-center justify-center transition-all",
                      isCurrent && "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20",
                      isPast && "bg-emerald-100 text-emerald-700",
                      !isCurrent && !isPast && "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                    title={step.label}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          )}
        </DialogHeader>

        {/* ── Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">

          {/* ═══ SETUP ═══ */}
          {uiState === "setup" && (
            <div className="space-y-6">
              <div className="p-5 bg-rose-50 rounded-xl border border-rose-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-rose-600" />
                  <p className="text-sm font-semibold text-rose-900">Screen first, then count layers</p>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  The flow: <strong>Screen</strong> (qualify IM → focus on receiving → does it inhibit?) → <strong>Count layers</strong> (baseline) → <strong>Find priority primary</strong> → Correct → Recheck.
                </p>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Challenge: "More than 5? More than 10? More than 15? More than 20? More than 25?"
                  Then narrow: "21? 22? 23?" — until you land on the exact number.
                  Average is 5–25 layers.
                </p>
                <Input
                  value={layerCountInput}
                  onChange={(e) => setLayerCountInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Pre-fill layer count (optional)"
                  className="w-full h-11 rounded-xl bg-white border-rose-200 text-center text-lg font-semibold"
                  type="number"
                  min={1}
                />
              </div>

              <div className="p-5 bg-muted rounded-xl border border-border space-y-3">
                <p className="text-sm font-medium text-foreground">
                  First step: challenge "Do we have permission to assess the Heart Wall?"
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If the system isn't ready, respect the boundary — the wall was built for a reason.
                  Perform Harmonic Rocking first to down-regulate, then re-ask.
                </p>
              </div>

              <Button
                onClick={handleStart}
                disabled={saving}
                className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {saving ? <Loader2 className="mr-2 animate-spin" /> : <Heart className="mr-2" size={18} />}
                Begin Assessment
              </Button>
            </div>
          )}

          {/* ═══ WORKING ═══ */}
          {uiState === "working" && (
            <div className="space-y-6">

              {/* Assessment steps */}
              {stepIndex < ASSESSMENT_STEPS.length && (
                <div className="space-y-4">
                  {/* ─ Screen ─ */}
                  {currentStep.phase === "screen" && (
                    <div className="space-y-4">
                      <div className="p-5 bg-rose-50 rounded-xl border border-rose-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Activity size={16} className="text-rose-600" />
                          <p className="text-sm font-semibold text-rose-900">Screen — Is a Heart Wall present?</p>
                        </div>
                        <ol className="space-y-2 text-xs text-rose-800 leading-relaxed pl-4 list-decimal">
                          <li>Qualify an indicator muscle.</li>
                          <li>Ask the client to focus on their heart and imagine <span className="underline decoration-rose-300 underline-offset-2">receiving</span> — love, money, acceptance, care, or whatever is relevant to their situation.</li>
                          <li>If the muscle inhibits (weakens), the Heart Wall is present.</li>
                        </ol>
                      </div>

                      <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                        <p className="text-xs font-semibold text-foreground">Client explanation (read if needed):</p>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          "You know when you've been through something and you can feel yourself shut down so it doesn't happen again?
                          Those physiological responses take a lot of bandwidth from the nervous system. We can calibrate that so your system doesn't have to compensate."
                        </p>
                      </div>

                      <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100/60 space-y-2">
                        <p className="text-xs font-semibold text-rose-800">Permission to assess</p>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          Challenge: "Do we have permission to assess the Heart Wall?"
                          If no — respect the boundary. The wall was built for a reason. Perform Harmonic Rocking to down-regulate, then re-ask.
                        </p>
                      </div>

                      <Textarea
                        value={pendingLayer.notes || ""}
                        onChange={(e) => setPendingLayer({ ...pendingLayer, notes: e.target.value })}
                        placeholder="Notes on screening..."
                        className="rounded-xl bg-muted/50 text-sm min-h-[80px]"
                      />
                    </div>
                  )}

                  {/* ─ Count ─ */}
                  {currentStep.phase === "count" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-primary" />
                          <p className="text-sm font-semibold text-foreground">Count the layers</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Challenge in sequence: "More than 5? More than 10? More than 15? More than 20? More than 25?"
                          Then narrow: "21? 22? 23?" — until you land on the exact number.
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          This baseline lets you measure progress after each priority primary correction.
                        </p>
                      </div>
                      <Input
                        value={layerCountInput}
                        onChange={(e) => setLayerCountInput(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="How many layers?"
                        className="h-11 rounded-xl text-center text-lg font-semibold"
                        type="number"
                        min={0}
                      />
                    </div>
                  )}

                  {/* ─ Find Emotion ─ */}
                  {currentStep.phase === "find-emotion" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <Heart size={16} className="text-rose-600" />
                          <p className="text-sm font-semibold text-rose-900">Find the priority primary</p>
                        </div>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          This is the highest-impact layer in the stack. One correction on the priority primary can clear 5–10 layers at once.
                          Use pulse points to find the organ, then scan the chart.
                        </p>
                      </div>

                      {/* Scan progress */}
                      <div className="flex items-center gap-1.5">
                        {["Pulse", "Column", "Half", "Emotion"].map((label, i) => (
                          <div key={label} className="flex-1 flex flex-col items-center gap-1">
                            <div className={cn(
                              "w-full h-1.5 rounded-full transition-colors",
                              i <= scanStep ? "bg-rose-500" : "bg-muted",
                            )} />
                            <span className={cn(
                              "text-[9px] font-semibold uppercase tracking-wider",
                              i === scanStep ? "text-rose-700" : "text-muted-foreground/60",
                            )}>{label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Step 0: Pulse Point Picker */}
                      {scanStep === 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            1. Tap the pulse point — which organ lights up?
                          </p>
                          <div className="p-4 bg-card rounded-xl border border-border">
                            <PulsePointPicker
                              selectedRow={organRow}
                              onSelect={(rowNum) => {
                                const organ = ROW_DATA[rowNum]?.organ || null;
                                setPendingLayer({
                                  ...pendingLayer,
                                  organ,
                                  relatedMuscles: ROW_DATA[rowNum]?.muscles || null,
                                });
                                setScanStep(1);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Step 1: Column A or B */}
                      {scanStep === 1 && organRow && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            2. Challenge: "Is it in <span className="text-rose-600">Column A</span> or <span className="text-rose-600">Column B</span>?"
                          </p>
                          <div className="p-4 bg-card rounded-xl border border-border">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              {pendingLayer.organ}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => { setScanColumn("A"); setScanHalf(null); setScanStep(2); }}
                                className="p-4 rounded-xl border-2 border-border hover:border-rose-300 hover:bg-rose-50 transition-all text-left group"
                              >
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Column A</p>
                                <div className="space-y-1">
                                  {scanEmotions.columnA.map(e => (
                                    <p key={e} className="text-xs text-foreground font-medium">{e}</p>
                                  ))}
                                </div>
                              </button>
                              <button
                                onClick={() => { setScanColumn("B"); setScanHalf(null); setScanStep(2); }}
                                className="p-4 rounded-xl border-2 border-border hover:border-rose-300 hover:bg-rose-50 transition-all text-left group"
                              >
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Column B</p>
                                <div className="space-y-1">
                                  {scanEmotions.columnB.map(e => (
                                    <p key={e} className="text-xs text-foreground font-medium">{e}</p>
                                  ))}
                                </div>
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => setScanStep(0)}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                          >
                            ← Change organ
                          </button>
                        </div>
                      )}

                      {/* Step 2: Top or Bottom half */}
                      {scanStep === 2 && scanColumn && organRow && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            3. Challenge: "Top half or bottom half?"
                          </p>
                          <div className="p-4 bg-card rounded-xl border border-border">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              {pendingLayer.organ} — Column {scanColumn}
                            </p>
                            {(() => {
                              const colEmotions = scanColumn === "A" ? scanEmotions.columnA : scanEmotions.columnB;
                              const mid = Math.ceil(colEmotions.length / 2);
                              const topHalf = colEmotions.slice(0, mid);
                              const bottomHalf = colEmotions.slice(mid);
                              return (
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={() => { setScanHalf("top"); setScanStep(3); }}
                                    className="p-4 rounded-xl border-2 border-border hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                                  >
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Top Half</p>
                                    <div className="space-y-1">
                                      {topHalf.map(e => (
                                        <p key={e} className="text-xs text-foreground font-medium">{e}</p>
                                      ))}
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => { setScanHalf("bottom"); setScanStep(3); }}
                                    className="p-4 rounded-xl border-2 border-border hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                                  >
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Bottom Half</p>
                                    <div className="space-y-1">
                                      {bottomHalf.map(e => (
                                        <p key={e} className="text-xs text-foreground font-medium">{e}</p>
                                      ))}
                                    </div>
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => { setScanHalf(null); setScanStep(1); }}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                          >
                            ← Change column
                          </button>
                        </div>
                      )}

                      {/* Step 3: Pick the specific emotion */}
                      {scanStep === 3 && scanColumn && scanHalf && organRow && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            4. Challenge each one: "Is it this one?"
                          </p>
                          <div className="p-4 bg-card rounded-xl border border-border">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              {pendingLayer.organ} — Column {scanColumn} — {scanHalf === "top" ? "Top" : "Bottom"} Half
                            </p>
                            {(() => {
                              const colEmotions = scanColumn === "A" ? scanEmotions.columnA : scanEmotions.columnB;
                              const mid = Math.ceil(colEmotions.length / 2);
                              const options = scanHalf === "top" ? colEmotions.slice(0, mid) : colEmotions.slice(mid);
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {options.map(emotion => {
                                    const isSelected = pendingLayer.emotion === emotion;
                                    return (
                                      <button
                                        key={emotion}
                                        onClick={() => {
                                          setPendingLayer({
                                            ...pendingLayer,
                                            emotion,
                                            columnA: scanColumn === "A",
                                          });
                                        }}
                                        className={cn(
                                          "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2",
                                          isSelected
                                            ? "bg-rose-600 text-white border-rose-600 shadow-md"
                                            : "bg-white text-foreground border-border hover:border-rose-300 hover:bg-rose-50",
                                        )}
                                      >
                                        {emotion}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => { setScanHalf(null); setScanStep(2); }}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                          >
                            ← Change half
                          </button>
                        </div>
                      )}

                      {/* Selected emotion summary */}
                      {pendingLayer.emotion && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-rose-600 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-rose-900">{pendingLayer.emotion}</p>
                            <p className="text-[10px] text-rose-600">
                              {pendingLayer.organ} — Column {pendingLayer.columnA ? "A" : "B"}
                            </p>
                          </div>
                          <button
                            onClick={() => { setPendingLayer({ ...pendingLayer, emotion: null }); setScanStep(3); }}
                            className="ml-auto text-[10px] text-rose-600 hover:text-rose-800 font-medium"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─ Assess Muscles ─ */}
                  {currentStep.phase === "assess-muscles" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Dumbbell size={16} className="text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-900">Assess related muscles</p>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          Every emotion row has correlated muscles. Test them — they <span className="italic font-semibold">will</span> come up inhibited.
                          This confirms the circuit is active.
                        </p>
                      </div>

                      {pendingLayer.organ && (
                        <div className="p-4 bg-card rounded-xl border border-border">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Muscles to test — {pendingLayer.organ}
                          </p>
                          <p className="text-sm text-foreground font-medium leading-relaxed">
                            {pendingLayer.relatedMuscles}
                          </p>
                        </div>
                      )}

                      <Textarea
                        value={pendingLayer.notes || ""}
                        onChange={(e) => setPendingLayer({ ...pendingLayer, notes: e.target.value })}
                        placeholder="Muscle test findings..."
                        className="rounded-xl bg-muted/50 text-sm min-h-[80px]"
                      />
                    </div>
                  )}

                  {/* ─ Brain Zones ─ */}
                  {currentStep.phase === "brain-zones" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Brain size={16} className="text-indigo-600" />
                          <p className="text-sm font-semibold text-indigo-900">Find efferent brain zones</p>
                        </div>
                        <p className="text-xs text-indigo-800 leading-relaxed">
                          Challenge in sequence: Cortical → Subcortical → Cerebellum → Limbic → Prefrontal Cortex, etc.
                          Find which specific brain zones are involved and write them down.
                        </p>
                        <div className="p-3 bg-white/60 rounded-lg text-[11px] text-indigo-900 space-y-1 font-medium">
                          <p>Examples from the demo:</p>
                          <p>• Cerebellum + Thalamus</p>
                          <p>• Right Prefrontal Cortex + Pons</p>
                          <p>• Cortical → Subcortical → Left Limbic</p>
                        </div>
                      </div>

                      <Input
                        value={pendingLayer.brainZones || ""}
                        onChange={(e) => setPendingLayer({ ...pendingLayer, brainZones: e.target.value })}
                        placeholder="e.g. Right Prefrontal Cortex + Pons"
                        className="rounded-xl bg-muted/50 text-sm"
                      />
                    </div>
                  )}

                  {/* ─ Context ─ */}
                  {currentStep.phase === "context" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-amber-600" />
                          <p className="text-sm font-semibold text-amber-900">Gather context (if needed)</p>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Challenge: "Do we need more context?" If <strong>no</strong>, skip — don't get bogged down.
                          Only go down this pathway if the system indicates more context is needed.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Age / Period</label>
                          <Input
                            value={pendingLayer.contextAge || ""}
                            onChange={(e) => setPendingLayer({ ...pendingLayer, contextAge: e.target.value })}
                            placeholder="e.g. Age 4, first 5 years"
                            className="rounded-xl bg-muted/50 text-sm h-10"
                          />
                          <p className="text-[9px] text-muted-foreground/60">Timeline it: first/last half, decade, specific year</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Life Event</label>
                          <Input
                            value={pendingLayer.contextEvent || ""}
                            onChange={(e) => setPendingLayer({ ...pendingLayer, contextEvent: e.target.value })}
                            placeholder="e.g. Parents separation"
                            className="rounded-xl bg-muted/50 text-sm h-10"
                          />
                          <p className="text-[9px] text-muted-foreground/60">Is there a specific event associated?</p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-xl space-y-3">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pendingLayer.contextInherited}
                              onChange={(e) => setPendingLayer({ ...pendingLayer, contextInherited: e.target.checked })}
                              className="rounded border-border"
                            />
                            Inherited
                          </label>
                          {pendingLayer.contextInherited && (
                            <Input
                              value={pendingLayer.contextParent || ""}
                              onChange={(e) => setPendingLayer({ ...pendingLayer, contextParent: e.target.value })}
                              placeholder="From Mom / Dad"
                              className="h-9 rounded-xl bg-white text-sm w-40"
                            />
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground/60">
                          Was it absorbed from someone else's energy field? From mom or dad?
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─ Confirm ─ */}
                  {currentStep.phase === "confirm" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-amber-600" />
                          <p className="text-sm font-semibold text-amber-900">Priority primary confirmed</p>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          You've gathered the full circuit: emotion, organ, related muscles, brain zones, and context.
                          One correction on this can clear 5–10 layers. That's why thorough assessment matters.
                        </p>
                      </div>

                      <div className="p-4 bg-card rounded-xl border border-border space-y-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Layer summary</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-rose-100 text-rose-800 border-none text-xs">{pendingLayer.organ}</Badge>
                          <span className="text-foreground font-semibold text-sm">{pendingLayer.emotion}</span>
                          {pendingLayer.contextInherited && (
                            <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">Inherited{pendingLayer.contextParent ? ` from ${pendingLayer.contextParent}` : ""}</Badge>
                          )}
                        </div>
                        {pendingLayer.brainZones && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Brain zones:</span> {pendingLayer.brainZones}
                          </p>
                        )}
                        {pendingLayer.relatedMuscles && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Related muscles:</span> {pendingLayer.relatedMuscles}
                          </p>
                        )}
                        {pendingLayer.contextAge && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Age/period:</span> {pendingLayer.contextAge}
                          </p>
                        )}
                        {pendingLayer.contextEvent && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Event:</span> {pendingLayer.contextEvent}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Correction steps */}
              {stepIndex >= ASSESSMENT_STEPS.length && (
                <div className="space-y-4">
                  {/* ─ Stim ─ */}
                  {currentStep.phase === "correct-stim" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-rose-50 rounded-xl border border-rose-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Activity size={16} className="text-rose-600" />
                          <p className="text-sm font-semibold text-rose-900">Stim Heart Visceral Referral Zone</p>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          Lightly rub along the Heart Visceral Referral Zone. This is a parasympathetic stimulus — the brain perceives the heart is being stimulated.
                          <strong> Always do this first</strong> so the brain knows we're working on the Heart Wall.
                        </p>
                        <div className="p-3 bg-white/60 rounded-lg text-[11px] text-rose-900 space-y-1 font-medium">
                          <p>1. Left Chest / Precordium</p>
                          <p className="font-bold">2. → Left Shoulder & Upper Back</p>
                          <p className="font-bold">3. → All the way down the ulnar (pinky) side of the Left Arm</p>
                          <p>4. Jaw / Neck (occasionally)</p>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs font-medium text-indigo-800 leading-relaxed">
                          <strong>Intention cue:</strong> While stimulating, state in your mind:
                          "Heart wall, {pendingLayer.organ || 'organ'}, {pendingLayer.emotion || 'emotion'}{pendingLayer.contextInherited ? `, inherited from ${pendingLayer.contextParent || 'origin'}` : ''}."
                          Keep repeating this over the 3-minute period — it anchors the correction.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─ Hold ─ */}
                  {currentStep.phase === "correct-hold" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Dumbbell size={16} className="text-primary" />
                          <p className="text-sm font-semibold text-foreground">Hold organ pulse point or squeeze muscle</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Touch and hold the organ-specific pulse point identified during assessment (e.g. deep on the left for Liver).
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Alternatively, because the organ and its muscle are on the same circuit, you can squeeze the associated muscle instead.
                        </p>
                        {pendingLayer.relatedMuscles && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Associated muscles</p>
                            <p className="text-xs text-foreground font-medium">{pendingLayer.relatedMuscles}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs font-medium text-amber-800 leading-relaxed">
                          <strong>Client self-help option:</strong> Ask the client to place one hand on their heart, the other on the organ.
                          "Let them be friends again." This creates a self-soothing circuit while you hold or tap.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─ Tap ─ */}
                  {currentStep.phase === "correct-tap" && (
                    <div className="space-y-3">
                      <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <Brain size={16} className="text-indigo-600" />
                          <p className="text-sm font-semibold text-indigo-900">Tap efferent brain zones</p>
                        </div>
                        <p className="text-xs text-indigo-800 leading-relaxed">
                          Tap the identified brain zones <strong>simultaneously</strong> while holding the pulse point.
                          This collapses the whole circuit — the emotion, organ, muscles, and brain zones all at once.
                        </p>
                        {pendingLayer.brainZones && (
                          <div className="p-3 bg-white/60 rounded-lg">
                            <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Identified zones</p>
                            <p className="text-xs font-semibold text-indigo-900">{pendingLayer.brainZones}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="p-3 bg-white/60 rounded-lg">
                            <p className="text-[10px] font-bold text-indigo-700 uppercase">Standard (3 min)</p>
                            <p className="text-xs text-indigo-800 font-medium">Hold points and state the intention for 3 minutes. Keep repeating: "Heart wall, organ, emotion, inherited from…"</p>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-[10px] font-bold text-amber-700 uppercase">If Inherited (10 swipes)</p>
                            <p className="text-xs text-amber-800 font-medium">Tap 10 times if the emotion was inherited from a parent. Extra stimulus clears the lineage pattern.</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-xl border border-border">
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                          <strong>Alternative — Rocking:</strong> Activate the brain circuits ("activate, activate, activate") then do Harmonic Rocking.
                          Rocking embodies the correction and often generates a stronger somatic release.
                          Clients often remark they can feel something "leaving" — an energy moving, or electrical signals changing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ─ Recheck ─ */}
                  {currentStep.phase === "recheck" && (
                    <div className="space-y-4">
                      <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw size={16} className="text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-900">Recheck — did the correction hold?</p>
                        </div>
                        <div className="space-y-2 text-xs text-emerald-800 leading-relaxed">
                          <p><strong>1.</strong> Re-test the associated muscles — they should now <span className="italic font-semibold">lock</span> (strong).</p>
                          <p><strong>2.</strong> Challenge the emotion: state "{pendingLayer.emotion}" again — the indicator should lock.</p>
                          <p><strong>3.</strong> Re-count the heart wall layers: "More than 10? More than 20? 21, 22…?"</p>
                        </div>
                        <p className="text-xs text-emerald-700/70 italic">
                          Wait for a parasympathetic shift before re-testing: sigh, yawn, gurgle, or client reporting "a wave came up" or "I can feel something leaving."
                        </p>
                      </div>

                      <div className="p-4 bg-card rounded-xl border border-border space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layers remaining after correction</p>
                        <Input
                          value={layerCountInput}
                          onChange={(e) => setLayerCountInput(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="e.g. went from 36 to 22"
                          className="h-11 rounded-xl text-center text-lg font-semibold"
                          type="number"
                          min={0}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={markLayerCleared}
                          disabled={saving}
                          className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {saving ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" size={18} />}
                          Layer Cleared
                        </Button>
                        <Button
                          onClick={markLayerSkipped}
                          disabled={saving}
                          variant="outline"
                          className="h-11 rounded-xl font-medium"
                        >
                          <XCircle className="mr-2" size={18} />
                          Skip
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ SUMMARY ═══ */}
          {uiState === "summary" && (
            <div className="space-y-4">
              <div className={cn(
                "p-6 rounded-xl border space-y-3",
                session?.status === "complete"
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-amber-50 border-amber-100",
              )}>
                <div className="flex items-center gap-2">
                  {session?.status === "complete" ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <XCircle size={18} className="text-amber-600" />
                  )}
                  <p className={cn(
                    "font-semibold",
                    session?.status === "complete" ? "text-emerald-900" : "text-amber-900",
                  )}>
                    {session?.status === "complete" ? "Session Complete" : "Session Abandoned"}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white/60 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{session?.initialLayerCount ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Initial</p>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">{clearedCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Cleared</p>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{layersRemaining ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
                  </div>
                </div>
              </div>

              {layers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Layers Processed</p>
                  {layers.map((layer) => (
                    <div key={layer.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        layer.status === "cleared" && "bg-emerald-100 text-emerald-700",
                        layer.status === "skipped" && "bg-amber-100 text-amber-700",
                        layer.status === "active" && "bg-muted text-muted-foreground",
                      )}>
                        {layer.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {layer.emotion || "No emotion selected"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{layer.organ}</p>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] border-none",
                          layer.status === "cleared" && "bg-emerald-100 text-emerald-700",
                          layer.status === "skipped" && "bg-amber-100 text-amber-700",
                          layer.status === "active" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {layer.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {session?.status === "complete" && (
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Session notes (optional)..."
                  className="rounded-xl bg-muted/50 text-sm min-h-[80px]"
                  onBlur={async () => {
                    if (sessionNotes !== (session.notes || "")) {
                      await saveSession({ notes: sessionNotes || null });
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        {uiState === "working" && (
          <DialogFooter className="p-6 pt-4 shrink-0 border-t border-border flex-row gap-3">
            {stepIndex > 0 && (
              <Button
                onClick={goBack}
                variant="outline"
                className="h-11 rounded-xl font-medium"
              >
                <ChevronLeft className="mr-1" size={16} /> Back
              </Button>
            )}

            <div className="flex-1" />

            {/* Save progress at each step */}
            <Button
              onClick={saveLayerAndContinue}
              disabled={saving}
              variant="outline"
              className="h-11 rounded-xl font-medium"
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Save
            </Button>

            {/* Skip context */}
            {currentStep.phase === "context" && (
              <Button
                onClick={() => { saveLayerAndContinue(); goNext(); }}
                disabled={saving}
                variant="ghost"
                className="h-11 rounded-xl font-medium text-muted-foreground"
              >
                <SkipForward className="mr-1" size={16} /> Skip
              </Button>
            )}

            {stepIndex < ALL_STEPS.length - 1 && currentStep.phase !== "recheck" && (
              <Button
                onClick={() => { saveLayerAndContinue(); goNext(); }}
                disabled={saving}
                className="h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold"
              >
                Next <ChevronRight className="ml-1" size={16} />
              </Button>
            )}
          </DialogFooter>
        )}

        {uiState === "setup" && (
          <DialogFooter className="p-6 pt-4 shrink-0" />
        )}

        {uiState === "summary" && (
          <DialogFooter className="p-6 pt-4 shrink-0 border-t border-border flex-row gap-3">
            <Button
              onClick={() => { startNewLayer(); setUiState("working"); }}
              variant="outline"
              className="h-11 rounded-xl font-medium"
            >
              <Heart className="mr-2" size={16} /> New Layer
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handleAbandonSession}
              variant="ghost"
              className="h-11 rounded-xl font-medium text-muted-foreground"
            >
              Abandon
            </Button>
            <Button
              onClick={handleCompleteSession}
              disabled={saving}
              className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={18} />}
              Complete Session
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
