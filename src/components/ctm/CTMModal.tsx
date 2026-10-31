import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle, ArrowRight, Brain, Activity, Zap, Heart, Hand, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Content from the user's CTM guide                                   */
/* ------------------------------------------------------------------ */

const CTM_CONTENT = {
  intro: `Cellular Tissue Memory (CTM) — The full process. 2024 foundations amalgamated with the 2026 Immersion revision.\n\nCTM runs a screen — left limbic + inhalation + insula — that asks the body to surface a stored pattern holding a dysfunction in place. If the screen inhibits a strong indicator, there is a CTM stack to work. You find the primary memory node (where the file lives), then the three systems connected to it, then correct the whole stack together and calibrate with rocking or a tuning fork. Work inside the 5–10 second indicator lag.`,
  screen: `The screen is three things held together simultaneously. If it inhibits a strong indicator, there is a CTM stack to work. The screen can be run in the clear (no reference point — body surfaces its highest priority) or targeted (TL a specific area first, then run the screen to find what is holding it in place).`,
  nodeIntro: `A memory node is a "server" — a housing where the file is stored. Once the screen is open, circuit-locate or thought-localise each node within the 5–10 second window. Find one primary node. Have the client hold it with their hand so every system you find next reads off that node.`,
  nodes: [
    { label: "Cerebellum", key: "cerebellum", loc: "GV16 / Head", desc: "Motor memory and coordination. All motor control pathways processed here. Most commonly found in structural and movement-based presentations." },
    { label: "Sphenoid", key: "sphenoid", loc: "Temple (R or L) / Head", desc: "Sits against the pituitary gland. Tilt associated with mood dysregulation and hormonal patterns. Lateralise to find R or L." },
    { label: "Thalamus", key: "thalamus", loc: "Occipitalis (posterior skull) / Head", desc: "Sensory relay centre. All sensory info routes through. Nociceptive pathways and central sensitisation patterns housed here." },
    { label: "CN1 / Olfactory", key: "cn1", loc: "Between the eyebrows / Head", desc: "Plugs directly into limbic system without thalamic relay. A smell during trauma becomes part of the neuro tag. Avoid strong essential oils in clinic." },
    { label: "Thymus", key: "thymus", loc: "Below clavicles, sternum / Body", desc: "Boss of the immune system. Immune memory and immune-mediated inflammatory patterns. Relevant in autoimmune, allergic, chronic inflammatory presentations." },
    { label: "Left Thoracic Duct / Cisterna Chyli", key: "thoracic-duct", loc: "Middle lymphatic zone, below sternum / Body", desc: "Drains left brain and rest of body. Main lymphatic reservoir. Stagnation and immune-lymphatic patterns stored here." },
    { label: "Umbilicus", key: "umbilicus", loc: "Navel / Body", desc: "Related to stem cells and body's original developmental blueprint. Holds earliest cellular memory. Deep constitutional and longstanding chronic presentations." },
  ],
  systemsIntro: `With the node held, scan the connected systems — and take the top three only. The 2026 revision expanded the menu from 5 to 7 systems by adding Fascia and Meridians.`,
  systems: [
    { label: "Heart-Wall Emotions", key: "heart-wall", desc: "Screen by having client focus on heart while imagining receiving love. If indicator inhibits, obtain permission, identify priority primary emotion, check relevant organ-muscle pair. Correct by holding left-arm heart reflex zone with associated organ pulse point and/or muscle while stimulating relevant efferent zones." },
    { label: "Brain Zones / Cranial Nerves", key: "brain-zones", desc: "Circuit locate across cortical zones (PFC, Motor, Sensory, Visual, Auditory, Insula) and sub-cortical zones (Cerebellum, Pons, Medulla, Thalamus, Limbic, Basal Nuclei, Midbrain, Hippocampus). Also scan CN I–XII." },
    { label: "Organs / Glands", key: "organs", desc: "Use pulse points (wrist pulse positions) to identify the organ. Scan left and right wrist, deep and light pressure." },
    { label: "Joints (Axial & Appendicular)", key: "joints", desc: "Test spine first: cervical, thoracic, lumbar, sacral, SIJ. Then peripheral: shoulder, elbow, wrist, hip, knee, ankle. Lateralise (L/R) and localise spinal level." },
    { label: "Cranial Sutures", key: "cranial-sutures", desc: "Scan major sutures: sagittal, coronal, lambdoidal, temporal-parietal (squamous). Also check frontozygomatic, maxillary, zygomatic, temporozygomatic." },
    { label: "Fascia", key: "fascia", desc: "NEW 2026. Swipe bilaterally from PSIS to ASIS — a posterior-to-anterior sweep across the iliac crest on both sides simultaneously. Flags the whole fascial network as a system." },
    { label: "Meridians", key: "meridians", desc: "NEW 2026. Use Yuan (source) points or alarm (Mu) points to identify the meridian. Alarm points: LU-1, ST-25, CV-12, LR-13, CV-14, CV-4, CV-3, GB-25, CV-17, CV-5, GB-24, LR-14." },
  ],
  correctionIntro: `You have now built a stack: the screen, one node, three systems. The correction re-activates all of it together, then calibrates the system down.`,
  correctionSteps: [
    "Re-activate the screen (Limbic + Inhale + Insula) + the primary node (client holds it) + the 3 systems — all together.",
    "Deliberately raise the charge (\"show what's wrong\").",
    "Calibrate down into parasympathetic — that is where healing lands.",
    "Use rocking, tapping, or tuning fork for calibration.",
    "After each correction, re-screen off the same pathway. Deep patterns often need two or three passes.",
  ],
  clinicalNote: `Hold the premise honestly. The neurotag and interoception science is well-established (Moseley & Butler; van der Kolk). The broader claim that memory is distributed through the body's tissues is a powerful clinical model, not settled science. Use it for the results it gets — don't oversell the mechanism to clients.`,
};

export interface CTMPhase {
  id: string;
  label: string;
}

export const CTM_PHASES: CTMPhase[] = [
  { id: "screen", label: "1 — The Screen" },
  { id: "node", label: "2 — Find Node" },
  { id: "systems", label: "3 — Find 3 Systems" },
  { id: "correction", label: "4 — The Correction" },
];

/* ------------------------------------------------------------------ */
/*  Sub-modal for a single system                                      */
/* ------------------------------------------------------------------ */
function SystemDetailModal({
  system,
  onClose,
}: {
  system: (typeof CTM_CONTENT.systems)[0];
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">{system.label}</h3>
        <Button size="sm" variant="outline" onClick={onClose} className="rounded-full px-3 h-8">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
      <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{system.desc}</div>
      <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
        System key: <span className="font-mono font-medium">{system.key}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CTM modal                                                      */
/* ------------------------------------------------------------------ */
export interface CTMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inhibitionState?: Record<string, any>;
  onSelectPathway?: (pathway: string) => void;
}

export function CTMModal({ open, onOpenChange, inhibitionState = {}, onSelectPathway }: CTMModalProps) {
  const [step, setStep] = useState(0);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<(typeof CTM_CONTENT.systems)[0] | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, CTM_PHASES.length - 1)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const goToStep = useCallback((i: number) => setStep(i), []);

  // Derive pathway list from inhibition state keys
  const pathways = Object.keys(inhibitionState).filter((k) => {
    const val = inhibitionState[k];
    return val === true || val === "Inhibited" || val === "Inhibition" || val === false || val === "Clear";
  });

  const toggleSystem = useCallback((key: string) => {
    setSelectedSystems((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return prev.length < 3 ? [...prev, key] : prev;
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-background border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-card to-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-chart-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-chart-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground leading-tight">Cellular Tissue Memory</h2>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">CTM — FNH Mastery</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8 p-0 hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-2 overflow-x-auto">
          {CTM_PHASES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goToStep(i)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all",
                i === step ? "bg-chart-primary text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className={cn("w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold", i === step ? "bg-white/20" : "bg-muted-foreground/20")}>{i + 1}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ----- STEP 1: SCREEN ----- */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-2">The Screen</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{CTM_CONTENT.screen}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Left Limbic", desc: "Past-threat memory. Where injuries & threat events are recorded.", icon: Brain },
                  { label: "Inhalation", desc: "SNS response. The in-breath couples with the stress response.", icon: Zap },
                  { label: "Insula", desc: "Homeostatic centre. Interoception — the brain watching the body's state.", icon: Activity },
                ].map((item) => (
                  <div key={item.label} className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-chart-primary/10 flex items-center justify-center"><item.icon className="w-3.5 h-3.5 text-chart-primary" /></div>
                      <h4 className="text-xs font-bold text-foreground">{item.label}</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Work inside the 5–10 second lag.</strong> Muscle testing has a 5–10 second indicator lag between stimulus and change. Once the screen opens the file, move immediately: find the node and the systems inside that window. If thirty seconds pass, the file has closed — re-activate and re-open.
                </p>
              </div>

              {/* Dropdown pathway list */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inhibition / Pathway State (from session)</label>
                <div className="flex flex-wrap gap-2">
                  {pathways.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No pathway state saved for this demo session.</span>
                  ) : (
                    pathways.map((key) => (
                      <button
                        key={key}
                        onClick={() => onSelectPathway?.(key)}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted transition-colors text-foreground/80"
                      >
                        {key}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ----- STEP 2: FIND NODE ----- */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-2">Find the Primary Memory Node</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{CTM_CONTENT.nodeIntro}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CTM_CONTENT.nodes.map((node) => (
                  <button
                    key={node.key}
                    onClick={() => setSelectedNode(node.key)}
                    className={cn(
                      "text-left bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow transition-all",
                      selectedNode === node.key && "ring-2 ring-chart-primary/30 bg-chart-primary/5 border-chart-primary/40"
                    )}
                  >
                    <h4 className="text-sm font-bold text-foreground">{node.label}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium">{node.loc}</p>
                    <p className="text-[11px] text-foreground/70 leading-snug mt-1.5">{node.desc}</p>
                  </button>
                ))}
              </div>
              {selectedNode && (
                <div className="bg-chart-primary/5 border border-chart-primary/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <h4 className="text-sm font-bold text-foreground mb-1">Selected node</h4>
                  <p className="text-xs text-foreground/70">{CTM_CONTENT.nodes.find((n) => n.key === selectedNode)?.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Client holds this node with their hand so every system reads off it.</p>
                </div>
              )}
            </div>
          )}

          {/* ----- STEP 3: FIND 3 SYSTEMS ----- */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-2">Find 3 System Connections</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{CTM_CONTENT.systemsIntro}</p>
                <p className="text-xs text-foreground/50 mt-1">The 2026 revision expanded from 5 to 7 systems by adding Fascia and Meridians.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Selected ({selectedSystems.length}/3):</span>
                {selectedSystems.map((key) => (
                  <span key={key} className="font-medium text-foreground bg-chart-primary/10 px-1.5 py-0.5 rounded-md">{key}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CTM_CONTENT.systems.map((sys) => (
                  <button
                    key={sys.key}
                    onClick={() => {
                      toggleSystem(sys.key);
                      setSelectedSystem(sys);
                    }}
                    className={cn(
                      "text-left bg-card border rounded-xl p-3 shadow-sm hover:shadow transition-all",
                      selectedSystems.includes(sys.key) ? "border-chart-primary/50 ring-1 ring-chart-primary/20 bg-chart-primary/5" : "border-border"
                    )}
                  >
                    <h4 className="text-sm font-bold text-foreground">{sys.label}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">{sys.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ----- STEP 4: CORRECTION ----- */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-2">The Correction</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{CTM_CONTENT.correctionIntro}</p>
              </div>
              <div className="bg-gradient-to-r from-chart-primary/5 to-chart-secondary/5 border border-chart-primary/20 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-foreground mb-3">The Stack — activate all together</h4>
                <ul className="space-y-2.5">
                  {CTM_CONTENT.correctionSteps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-foreground/80 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-chart-primary/10 text-chart-primary flex items-center justify-center text-[9px] font-extrabold shrink-0">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">{CTM_CONTENT.clinicalNote}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20">
          <Button variant="outline" size="sm" onClick={goBack} disabled={step === 0} className="rounded-full h-8 px-3">
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Back
          </Button>
          <span className="text-[10px] text-muted-foreground font-medium">Phase {step + 1} / {CTM_PHASES.length}</span>
          <Button size="sm" onClick={goNext} disabled={step === CTM_PHASES.length - 1} className="rounded-full h-8 px-3 bg-chart-primary hover:bg-chart-primary/90 text-white">
            Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Sub-modal overlay for a selected system */}
      {selectedSystem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedSystem(null)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <SystemDetailModal system={selectedSystem} onClose={() => setSelectedSystem(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
