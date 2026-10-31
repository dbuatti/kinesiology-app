import { useState, useCallback, useMemo, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, X, Brain, Activity, Zap, Heart, Hand, Info, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { PRIMARY_EMOTIONS, CHANNEL_EMOTIONS, ELEMENT_EMOTIONS } from "@/data/emotion-data";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { JOINT_ACTION_LIBRARY } from "@/data/joint-action-data";
import { BRAIN_REFLEX_POINTS } from "@/data/brain-reflex-data";
import type { CranialNerve } from "@/data/cranial-nerve-data";
import type { TcmChannel } from "@/data/tcm-channel-data";
import type { JointData } from "@/data/joint-action-data";
import type { PrimaryEmotion } from "@/data/emotion-data";

/* ------------------------------------------------------------------ */
/*  CTM Content (from user's guide)                                   */
/* ------------------------------------------------------------------ */

export interface CTMPhase {
  id: string;
  label: string;
}

export const CTM_PHASES: CTMPhase[] = [
  { id: "screen", label: "The Screen" },
  { id: "node", label: "Find Node" },
  { id: "systems", label: "Find 3 Systems" },
  { id: "correction", label: "The Correction" },
];

export const CTM_SYSTEM_GROUPS = [
  { key: "heart-wall", label: "Heart-Wall Emotions", icon: Heart },
  { key: "brain-zones", label: "Brain Zones / Cranial Nerves", icon: Brain },
  { key: "organs", label: "Organs / Glands", icon: Activity },
  { key: "joints", label: "Joints (Axial & Appendicular)", icon: Hand },
  { key: "cranial-sutures", label: "Cranial Sutures", icon: Activity },
  { key: "fascia", label: "Fascia (NEW 2026)", icon: Zap },
  { key: "meridians", label: "Meridians (NEW 2026)", icon: Activity },
];

/* ------------------------------------------------------------------ */
/*  Selectable brain zones (cortical + subcortical)                    */
/*  Derived from BRAIN_REFLEX_POINTS so this list cannot drift from    */
/*  the clinical reference — it previously hard-coded only 6 cortical  */
/*  zones and silently dropped Pre-Motor, OFC and ACC.                 */
/* ------------------------------------------------------------------ */
const ZONE_LABEL_OVERRIDES: Record<string, string> = {
  pfc: "PFC — Prefrontal Cortex",
  pmc: "Pre-Motor",
  m1: "Motor",
  s1: "Sensory",
  visual: "Visual",
  auditory: "Auditory",
  insula: "Insula",
  ofc: "OFC — Orbitofrontal",
  acc: "ACC — Anterior Cingulate",
  cerebellum: "Cerebellum",
  pons: "Pons",
  medulla: "Medulla",
  hippocampus: "Hippocampus",
  thalamus: "Thalamus",
  basal_ganglia: "Basal Nuclei",
  limbic: "Limbic",
  midbrain: "Midbrain",
  hypothalamus: "Hypothalamus",
};

const BRAIN_ZONES = BRAIN_REFLEX_POINTS.filter(
  (p) => p.category === "Cortical" || p.category === "Subcortical"
).map((p) => ({
  label: ZONE_LABEL_OVERRIDES[p.id] ?? p.name,
  kind: p.category === "Cortical" ? ("cortical" as const) : ("subcortical" as const),
  pearl: p.pearl,
}));

/* ------------------------------------------------------------------ */
/*  Selectable cranial sutures                                         */
/* ------------------------------------------------------------------ */
const CRANIAL_SUTURES = [
  { label: "Sagittal", kind: "major" },
  { label: "Coronal", kind: "major" },
  { label: "Lambdoidal", kind: "major" },
  { label: "Temporal-Parietal (Squamous)", kind: "major" },
  { label: "Frontozygomatic", kind: "minor" },
  { label: "Maxillary", kind: "minor" },
  { label: "Zygomatic", kind: "minor" },
  { label: "Temporozygomatic", kind: "minor" },
];

/* ------------------------------------------------------------------ */
/*  Selectable fascia options                                           */
/* ------------------------------------------------------------------ */
const FASCIA_OPTIONS = [
  { label: "PSIS → ASIS bilateral swipe", desc: "Posterior-to-anterior sweep across iliac crest on both sides simultaneously." },
];

/* ------------------------------------------------------------------ */
/*  Meridian selection (from TCM_CHANNELS)                              */
/* ------------------------------------------------------------------ */
const SELECTABLE_MERIDIANS: Array<{ code: string; name: string; element: string }> = [
  { code: "LU", name: "Lung", element: "Metal" },
  { code: "LI", name: "Large Intestine", element: "Metal" },
  { code: "ST", name: "Stomach", element: "Earth" },
  { code: "SP", name: "Spleen", element: "Earth" },
  { code: "HT", name: "Heart", element: "Fire" },
  { code: "SI", name: "Small Intestine", element: "Fire" },
  { code: "BL", name: "Bladder", element: "Water" },
  { code: "KI", name: "Kidney", element: "Water" },
  { code: "PC", name: "Pericardium", element: "Fire" },
  { code: "TH", name: "Triple Heater", element: "Fire" },
  { code: "GB", name: "Gallbladder", element: "Wood" },
  { code: "LR", name: "Liver", element: "Wood" },
];

/* Sub-modals that need the extra width (dense multi-column content) */
const WIDE_SUBMODALS = ["heart-wall", "brain-zones"];

/* ------------------------------------------------------------------ */
/*  Sub-modal: shared header + close                                   */
/* ------------------------------------------------------------------ */
function SubModalHeader({
  title,
  subtitle,
  onClose,
  imageRefId,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  imageRefId?: string;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-card to-muted/30 px-6 py-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-lg font-bold leading-tight text-foreground">{title}</h3>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Back to CTM"
        className="group flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/70 py-1 pl-1 pr-3.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition-all duration-200 hover:border-chart-primary/40 hover:bg-chart-primary/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-chart-primary/40 active:scale-[0.97]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/80 transition-colors duration-200 group-hover:bg-chart-primary/15">
          <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </span>
        Back
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scrollable body                                                    */
/* ------------------------------------------------------------------ */
function SubModalBody({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6 bg-card">
      <div className={cn("w-full space-y-5", !wide && "mx-auto max-w-xl")}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Selection chip that writes into ctm_state                          */
/* ------------------------------------------------------------------ */
interface UseCTMSelectionReturn {
  selected: Record<string, any>;
  select: (category: string, value: string | any) => void;
  deselect: (category: string) => void;
}

function useCTMSelection(category: string): UseCTMSelectionReturn {
  // NOTE: `selected` must be the *value* for this category, not a map of
  // category -> value. Every call site reads it as `selected?.organ`,
  // `selected?.groupIdx`, etc. Nesting the value under `selected[category]`
  // silently made all of those undefined (nothing ever highlighted or
  // expanded when you clicked a tab).
  const [selected, setSelected] = useState<Record<string, any> | null>(null);
  const select = useCallback(
    (_key: string, value: string | Record<string, any>) => {
      setSelected(
        typeof value === "string"
          ? { [category]: value, selectedAt: new Date().toISOString() }
          : { ...value, selectedAt: new Date().toISOString() }
      );
    },
    [category]
  );
  const deselect = useCallback(() => setSelected(null), []);
  return { selected: selected ?? {}, select, deselect };
}

/* ------------------------------------------------------------------ */
/*  Heart-Wall Emotions sub-modal                                      */
/* ------------------------------------------------------------------ */
function HeartWallSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected: emotionSel, select: selectEmotion } = useCTMSelection("heartWall");
  const { selected: organSel, select: selectOrgan } = useCTMSelection("heartWallOrgan");
  const { selected: muscleSel, select: selectMuscle } = useCTMSelection("heartWallMuscle");

  // Full Heart-Wall organ-emotions reference from FNH Mastery
  const HEART_WALL_GROUPS = [
    {
      element: "Fire",
      organs: ["Heart", "Small Intestine"],
      emotions: [
        "Abandonment", "Betrayal", "Defensiveness", "Forlorn", "Lost",
        "Love unreceived", "Effort unreceived", "Heartache", "Bitterness",
        "Insecurity", "Overjoy", "Vulnerability"
      ],
      muscles: {
        "Heart": ["Vastus lateralis", "Subscapularis"],
        "Small Intestine": ["Quadriceps", "Abdominals"]
      }
    },
    {
      element: "Earth",
      organs: ["Spleen", "Stomach"],
      emotions: [
        "Anxiety", "Despair", "Disgust", "Nervousness", "Worry",
        "Failure", "Helplessness", "Hopelessness", "Lack of control", "Low self-esteem"
      ],
      muscles: {
        "Spleen": ["Triceps", "Mid trapezius", "Lower trapezius"],
        "Stomach": ["Pectoralis major clavicular", "Diaphragm", "Neck flexors"]
      }
    },
    {
      element: "Metal",
      organs: ["Lung", "Colon"],
      emotions: [
        "Crying", "Discouragement", "Sadness", "Sorrow", "Confusion",
        "Grief", "Self-abuse", "Shame", "Unworthy", "Worthless"
      ],
      muscles: {
        "Lung": ["Posterior deltoid"],
        "Colon": ["Tensor fasciae latae", "Gluteus maximus", "Quadratus lumborum"]
      }
    },
    {
      element: "Wood",
      organs: ["Liver", "Gallbladder"],
      emotions: [
        "Anger", "Blaming", "Rejection", "Guilt", "Hatred",
        "Resentment", "Depression", "Frustration", "Indecisiveness",
        "Taken for granted", "Stubbornness"
      ],
      muscles: {
        "Liver": ["Pectoralis major sternal", "Rhomboids"],
        "Gallbladder": ["Anterior deltoid", "Popliteus"]
      }
    },
    {
      element: "Water",
      organs: ["Kidneys", "Bladder"],
      emotions: [
        "Dread", "Fear", "Horror", "Peeved", "Conflict",
        "Insecurity", "Terror", "Panic", "Unsupported", "Wishy-washy"
      ],
      muscles: {
        "Kidneys": ["Psoas", "Upper trapezius"],
        "Bladder": ["Erector spinae"]
      }
    },
    {
      element: "Glands",
      organs: ["Adrenals", "Thyroid", "Reproductive"],
      emotions: [
        "Humiliation", "Jealousy", "Longing", "Lust", "Overwhelm", "Pride", "Shock"
      ],
      muscles: {
        "Adrenals": ["Piriformis", "Flexor hallucis longus"],
        "Thyroid": ["Supraspinatus"],
        "Reproductive": ["Gluteus medius"]
      }
    }
  ];

  return (
    <>
      <SubModalHeader
        title="Heart-Wall Emotions"
        subtitle="Focus heart → imagine receiving love → permission → priority emotion → organ-muscle pair"
        onClose={onClose}
      />
      <SubModalBody wide>
        <div className="text-sm text-foreground/80 leading-relaxed">
          Screen: client focuses on heart while imagining being loved/accepted. If indicator inhibits, obtain permission, identify priority primary Heart-Wall emotion, check the relevant organ-muscle pair, record context (age, event, absorbed).
        </div>

        {/* Selected summary */}
        <div className="bg-chart-primary/5 border border-chart-primary/20 rounded-lg p-3">
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="text-muted-foreground/60">Emotion:</span>
              <span className="ml-1 font-bold text-foreground">{emotionSel?.emotion ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground/60">Organ:</span>
              <span className="ml-1 font-bold text-foreground">{organSel?.organ ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground/60">Muscle:</span>
              <span className="ml-1 font-bold text-foreground">{muscleSel?.muscle ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Element tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {HEART_WALL_GROUPS.map((group, idx) => {
              const isActive = emotionSel?.groupIdx === idx;
              const groupName = group.organs[0];
              return (
                <button
                  key={group.element}
                  type="button"
                  onClick={() => selectEmotion(group.element, { element: group.element, groupIdx: idx })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-[10px] font-semibold border transition-colors",
                    isActive
                      ? "bg-chart-primary text-white border-chart-primary shadow-sm"
                      : "border-border bg-card text-foreground/80 hover:bg-muted"
                  )}
                >
                  {group.element}
                  <span className={cn("ml-1 text-[8px] font-normal", isActive ? "text-white/70" : "text-muted-foreground/60")}>
                    {groupName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current group detail */}
          {emotionSel?.groupIdx != null && HEART_WALL_GROUPS[emotionSel.groupIdx] && (
            <div className="space-y-3">
              {(() => {
                const group = HEART_WALL_GROUPS[emotionSel.groupIdx];
                return (
                  <>
                    <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                      {group.element} Element — {group.organs.join(" / ")}
                    </h4>

                    {/* Emotions grid */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Emotions</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto">
                        {group.emotions.map((emotion) => {
                          const active = emotionSel?.emotion === emotion;
                          return (
                            <button
                              key={emotion}
                              onClick={() => { selectEmotion(emotion, { emotion, element: group.element, groupIdx: emotionSel.groupIdx }); saveSelection({ heartWall: emotion }); }}
                              className={cn(
                                "text-left bg-card border rounded-md px-2 py-1.5 text-[10px] transition-all",
                                active ? "border-chart-primary/50 ring-1 ring-chart-primary/20 bg-chart-primary/5 text-chart-primary font-bold" : "border-border text-foreground/90 hover:bg-muted"
                              )}
                            >
                              {emotion}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Organs + Muscles */}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.organs.map((organ) => (
                        <div key={organ} className="bg-muted/30 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-foreground">{organ}</span>
                            <span className="text-[9px] text-muted-foreground/60">{group.element}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {group.muscles[organ]?.map((muscle) => (
                              <button
                                key={muscle}
                                onClick={() => { selectOrgan(organ, { organ }); selectMuscle(muscle, { muscle }); saveSelection({ heartWallOrgan: organ, heartWallMuscle: muscle }); }}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-medium border transition-colors",
                                  organSel?.organ === organ && muscleSel?.muscle === muscle
                                    ? "bg-chart-emerald text-white border-chart-emerald"
                                    : organSel?.organ === organ
                                      ? "border-chart-emerald/50 bg-chart-emerald/5 text-chart-emerald"
                                      : "border-border bg-card text-foreground/80 hover:bg-muted"
                                )}
                              >
                                {muscle}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Brain Zones sub-modal                                              */
/* ------------------------------------------------------------------ */
function BrainZonesSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected, select, deselect } = useCTMSelection("brainZone");
  const { selected: cnSel, select: selectCN } = useCTMSelection("cranialNerve");

  return (
    <>
      <SubModalHeader
        title="Brain Zones / Cranial Nerves"
        subtitle="Circuit-locate cortical & sub-cortical zones; scan CN I–XII"
        onClose={onClose}
        imageRefId="brain-zones"
      />
      <SubModalBody wide>
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-3">Cortical Zones</p>
            <div className="grid grid-cols-3 gap-2">
              {BRAIN_ZONES.filter((z) => z.kind === "cortical").map((zone) => {
                const active = selected?.brainZone === zone.label;
                return (
                  <button
                    key={zone.label}
                    title={zone.pearl}
                    onClick={() => { select(zone.label, { brainZone: zone.label, kind: "cortical" }); saveSelection({ brainZone: zone.label }); }}
                    className={cn(
                      "text-left bg-card border rounded-lg px-2 py-1.5 text-[11px] font-medium leading-tight transition-all",
                      active ? "border-chart-primary/50 ring-1 ring-chart-primary/20 bg-chart-primary/5 text-chart-primary font-bold" : "border-border text-foreground/90 hover:bg-muted"
                    )}
                  >
                    {zone.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-3">Sub-Cortical Zones</p>
            <div className="grid grid-cols-3 gap-2">
              {BRAIN_ZONES.filter((z) => z.kind === "subcortical").map((zone) => {
                const active = selected?.brainZone === zone.label;
                return (
                  <button
                    key={zone.label}
                    title={zone.pearl}
                    onClick={() => { select(zone.label, { brainZone: zone.label, kind: "subcortical" }); saveSelection({ brainZone: zone.label }); }}
                    className={cn(
                      "text-left bg-card border rounded-lg px-2 py-1.5 text-[11px] font-medium leading-tight transition-all",
                      active ? "border-chart-emerald/50 ring-1 ring-chart-emerald/20 bg-chart-emerald/5 text-chart-emerald font-bold" : "border-border text-foreground/90 hover:bg-muted"
                    )}
                  >
                    {zone.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-3">Cranial Nerves</p>
            <div className="grid grid-cols-3 gap-2">
              {CRANIAL_NERVES.map((nerve) => {
                const active = cnSel?.cranialNerve === nerve.name;
                return (
                  <button
                    key={nerve.id}
                    onClick={() => { selectCN(nerve.name, { nerve: nerve.name, latin: nerve.latinName, nuclei: nerve.nuclei }); saveSelection({ cranialNerve: nerve.name }); }}
                    className={cn(
                      "text-left bg-card border rounded-lg p-2 text-sm transition-all",
                      active ? "border-chart-secondary/50 ring-1 ring-chart-secondary/20 bg-chart-secondary/5 text-chart-secondary font-bold" : "border-border text-foreground/90 hover:bg-muted"
                    )}
                  >
                    <div className="font-bold text-[10px]">{nerve.name}</div>
                    <div className="text-[8px] text-muted-foreground/60">{nerve.latinName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {(selected?.brainZone || cnSel?.cranialNerve) && (
            <div className="bg-chart-primary/5 border border-chart-primary/20 rounded-lg p-3">
              <p className="text-[10px] font-bold text-chart-primary mb-1">Selected</p>
              <p className="text-xs text-foreground/70">{selected?.brainZone ?? cnSel?.cranialNerve}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Organs / Glands sub-modal (pulse points + selection)               */
/* ------------------------------------------------------------------ */
function OrgansSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected, select } = useCTMSelection("organ");
  const [zoom, setZoom] = useState<string | null>(null);

  const ORGANS = [
    { label: "Lung", pair: "Colon", element: "Metal", muscle: "Posterior Deltoid" },
    { label: "Colon", pair: "Lung", element: "Metal", muscle: "TFL / Glute Max / QL" },
    { label: "Stomach", pair: "Spleen", element: "Earth", muscle: "Pec Major Clavicular / Diaphragm / Neck Flexors" },
    { label: "Spleen", pair: "Stomach", element: "Earth", muscle: "Triceps / Mid & Lower Traps" },
    { label: "Heart", pair: "Small Intestine", element: "Fire", muscle: "Vastus Lateralis / Subscapularis" },
    { label: "Small Intestine", pair: "Heart", element: "Fire", muscle: "Quadriceps / Abdominals" },
    { label: "Liver", pair: "Gallbladder", element: "Wood", muscle: "Pec Major Sternal / Rhomboids" },
    { label: "Gallbladder", pair: "Liver", element: "Wood", muscle: "Anterior Deltoid / Popliteus" },
    { label: "Kidney", pair: "Bladder", element: "Water", muscle: "Psoas / Upper Traps" },
    { label: "Bladder", pair: "Kidney", element: "Water", muscle: "Erector Spinae" },
    { label: "Pericardium / Adrenals", pair: "Triple Heater", element: "Fire", muscle: "Piriformis / Supraspinatus / Glute Medius" },
    { label: "Triple Heater", pair: "Pericardium", element: "Fire", muscle: "—" },
  ];

  return (
    <>
      <SubModalHeader
        title="Organs / Glands"
        subtitle="Scan left & right wrist pulse points — deep (Yin) & light (Yang)"
        onClose={onClose}
        imageRefId="pulse-points"
      />
      <SubModalBody>
        <div className="space-y-4">
          {/* Pulse points reference image */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Pulse Point Chart</p>
              <span className="text-[9px] text-muted-foreground/50">Tap to enlarge</span>
            </div>
            <button
              type="button"
              onClick={() => setZoom("/images/pulse-points.png")}
              className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-white cursor-zoom-in hover:ring-2 hover:ring-chart-emerald/40 transition-all"
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/60">
                Pulse point chart unavailable
              </span>
              <img
                src="/images/pulse-points-preview.webp"
                alt="Wrist pulse points"
                className="relative h-full w-full object-contain p-1"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Priority Organ / Gland</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{selected?.organ ?? "—"}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ORGANS.map((organ) => {
              const active = selected?.organ === organ.label;
              return (
                <button
                  key={organ.label}
                  onClick={() => { select(organ.label, { organ: organ.label, pair: organ.pair, element: organ.element, muscle: organ.muscle }); saveSelection({ organ: organ.label }); }}
                  className={cn(
                    "text-left bg-card border rounded-lg p-2 text-sm transition-all",
                    active ? "border-chart-emerald/50 ring-1 ring-chart-emerald/20 bg-chart-emerald/5 text-chart-emerald font-bold" : "border-border text-foreground/90 hover:bg-muted"
                  )}
                >
                  <div className="font-bold">{organ.label}</div>
                  <div className="text-[8px] text-muted-foreground/60">{organ.element} · {organ.muscle}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[10px] font-bold text-amber-800 mb-2">Pulse Point Method</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-amber-700 leading-relaxed">
              <div>
                <span className="font-bold">Right wrist, deep:</span> Lung / Colon
              </div>
              <div>
                <span className="font-bold">Left wrist, deep:</span> Liver / Gallbladder
              </div>
            </div>
          </div>

          {selected?.organ && (
            <div className="bg-chart-emerald/5 border border-chart-emerald/20 rounded-lg p-3">
              <p className="text-[10px] font-bold text-chart-emerald mb-1">Confirmed</p>
              <p className="text-xs text-foreground/70">{selected?.organ} — {selected?.pair} · {selected?.element} · {selected?.muscle}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>

      {zoom && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom}
            alt="Pulse points zoomed"
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoom(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Joints sub-modal (axial + appendicular, select action)             */
/* ------------------------------------------------------------------ */
function JointsSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected, select } = useCTMSelection("joint");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Axial" | "Appendicular">("all");

  const filteredJoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    return JOINT_ACTION_LIBRARY.filter((joint) => {
      if (typeFilter !== "all" && joint.type !== typeFilter) return false;
      if (!q) return true;
      const actionText = Object.values(joint.actions)
        .flat()
        .map((a) => `${a.label} ${a.howTo}`)
        .join(" ");
      return (
        joint.name.toLowerCase().includes(q) ||
        joint.region.toLowerCase().includes(q) ||
        joint.type.toLowerCase().includes(q) ||
        joint.pearl.toLowerCase().includes(q) ||
        actionText.toLowerCase().includes(q)
      );
    });
  }, [query, typeFilter]);

  return (
    <>
      <SubModalHeader
        title="Joints — Axial & Appendicular"
        subtitle="Axial first (spine → SIJ), then peripheral. Lateralise L/R and localise spinal level"
        onClose={onClose}
      />
      <SubModalBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Selected Joint</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{selected?.joint ?? "—"}</span>
          </div>

          {/* Search + type filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search joint, region, action…"
                className="w-full rounded-lg border border-border bg-muted/30 py-1.5 pl-8 pr-7 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-chart-primary/30"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(["all", "Axial", "Appendicular"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[9px] font-semibold transition-colors",
                    typeFilter === t
                      ? "bg-chart-primary/10 text-chart-primary"
                      : "text-muted-foreground/70 hover:bg-muted"
                  )}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
              <span className="ml-auto text-[9px] text-muted-foreground/50">
                {filteredJoints.length} of {JOINT_ACTION_LIBRARY.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[42vh] overflow-y-auto">
            {filteredJoints.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic py-6 text-center">No joints match “{query}”.</p>
            )}
            {filteredJoints.map((joint) => {
              const active = selected?.joint === joint.name;
              const allActions = Object.values(joint.actions).flat();
              const firstAction = allActions[0];
              return (
                <button
                  key={joint.name}
                  onClick={() => { select(joint.name, { joint: joint.name, type: joint.type, region: joint.region, action: firstAction?.label, howTo: firstAction?.howTo }); saveSelection({ joint: joint.name }); }}
                  className={cn(
                    "text-left bg-card border border-l-2 rounded-lg p-2.5 shadow-sm transition-all",
                    active
                      ? "border-chart-primary bg-chart-primary/5 shadow-md"
                      : "border-border/50 hover:border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-foreground">{joint.name}</div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${joint.type === 'Axial' ? 'text-chart-primary bg-chart-primary/10' : 'text-chart-emerald bg-chart-emerald/10'}`}>{joint.type}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground">{joint.region} · {joint.pearl}</div>
                  {firstAction && (
                    <div className="text-[9px] text-muted-foreground/70 mt-1">{firstAction.label}</div>
                  )}
                </button>
              );
            })}
          </div>

          {selected?.joint && (
            <div className="bg-chart-primary/5 border border-chart-primary/20 rounded-lg p-3">
              <p className="text-[10px] font-bold text-chart-primary mb-1">Confirmed</p>
              <p className="text-xs text-foreground/70">{selected?.joint} · {selected?.action} — {selected?.howTo}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Cranial Sutures sub-modal (image + selection)                      */
/* ------------------------------------------------------------------ */
function CranialSuturesSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected, select } = useCTMSelection("suture");
  const [zoom, setZoom] = useState<string | null>(null);

  return (
    <>
      <SubModalHeader
        title="Cranial Sutures"
        subtitle="Sagittal · Coronal · Lambdoidal · Temporal-Parietal (plus minor)"
        onClose={onClose}
        imageRefId="cranial-sutures"
      />
      <SubModalBody>
        <div className="space-y-5">
          {/* Cranial sutures reference image */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Suture Chart</p>
              <span className="text-[9px] text-muted-foreground/50">Tap to enlarge</span>
            </div>
            <button
              type="button"
              onClick={() => setZoom("/images/cranial-sutures.png")}
              className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-white cursor-zoom-in hover:ring-2 hover:ring-chart-secondary/40 transition-all"
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/60">
                Suture chart unavailable
              </span>
              <img
                src="/images/cranial-sutures-preview.webp"
                alt="Cranial sutures diagram"
                className="relative h-full w-full object-contain p-1"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Selected Suture</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{selected?.suture ?? "—"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CRANIAL_SUTURES.map((suture) => {
              const active = selected?.suture === suture.label;
              return (
                <button
                  key={suture.label}
                  onClick={() => { select(suture.label, { suture: suture.label, kind: suture.kind }); saveSelection({ suture: suture.label }); }}
                  className={cn(
                    "text-left bg-card border rounded-lg p-2 text-sm transition-all",
                    active ? "border-chart-secondary/50 ring-1 ring-chart-secondary/20 bg-chart-secondary/5 text-chart-secondary font-bold" : "border-border text-foreground/90 hover:bg-muted"
                  )}
                >
                  <div className="font-bold">{suture.label}</div>
                  <div className="text-[8px] text-muted-foreground/60">{suture.kind}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-chart-secondary/5 border border-chart-secondary/20 rounded-lg p-3">
            <p className="text-[10px] font-bold text-chart-secondary mb-1">Clinical note</p>
            <p className="text-xs text-foreground/70">Sagittal, coronal, and lambdoidal are most common. Suture reflexive links are an FNH clinical model — hold as a working frame.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>

      {zoom && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom}
            alt="Cranial sutures zoomed"
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoom(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Fascia sub-modal (PSIS → ASIS swipe)                               */
/* ------------------------------------------------------------------ */
function FasciaSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected, select } = useCTMSelection("fascia");

  return (
    <>
      <SubModalHeader
        title="Fascia (NEW 2026)"
        subtitle="Bilateral PSIS → ASIS swipe — flags the whole fascial network"
        onClose={onClose}
      />
      <SubModalBody>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Selected</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{selected?.fascia ?? "—"}</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {FASCIA_OPTIONS.map((option) => {
              const active = selected?.fascia === option.label;
              return (
                <button
                  key={option.label}
                  onClick={() => { select(option.label, { fascia: option.label, technique: option.desc }); saveSelection({ fascia: option.label }); }}
                  className={cn(
                    "text-left bg-card border rounded-lg p-3 text-sm transition-all",
                    active ? "border-chart-emerald/50 ring-1 ring-chart-emerald/20 bg-chart-emerald/5 text-chart-emerald font-bold" : "border-border text-foreground/90 hover:bg-muted"
                  )}
                >
                  <div className="font-bold">{option.label}</div>
                  <div className="text-[9px] text-muted-foreground/70 mt-1">{option.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-chart-emerald/5 border border-chart-emerald/20 rounded-lg p-3">
            <p className="text-[10px] font-bold text-chart-emerald mb-1">Technique</p>
            <p className="text-xs text-foreground/70">Swipe bilaterally from PSIS to ASIS — a posterior-to-anterior sweep across the iliac crest on both sides simultaneously. Piezoelectric bioelectrical system distinct from the nervous system.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Meridians sub-modal (TCM_CHANNELS + alarm/Yuan points)             */
/* ------------------------------------------------------------------ */
function MeridiansSubModal({ onClose, saveSelection }: { onClose: () => void; saveSelection: (sel: Record<string, any>) => void }) {
  const { selected, select } = useCTMSelection("meridian");

  const ALARM_POINTS: Record<string, string> = {
    LU: "LU-1", LI: "ST-25", ST: "CV-12", SP: "LR-13", HT: "CV-14", SI: "CV-4",
    BL: "CV-3", KI: "GB-25", PC: "CV-17", TH: "CV-5", GB: "GB-24", LR: "LR-14",
  };

  return (
    <>
      <SubModalHeader
        title="Meridians (NEW 2026)"
        subtitle="Yuan (source) points or alarm (Mu) points · TL Umbilicus + CV24 + CV26"
        onClose={onClose}
      />
      <SubModalBody>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Selected Meridian</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{selected?.meridian ?? "—"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SELECTABLE_MERIDIANS.map((m) => {
              const active = selected?.meridian === m.code;
              return (
                <button
                  key={m.code}
                  onClick={() => { select(m.code, { meridian: m.code, name: m.name, element: m.element, alarmPoint: ALARM_POINTS[m.code] }); saveSelection({ meridian: m.code }); }}
                  className={cn(
                    "text-left bg-card border rounded-lg p-2 text-sm transition-all",
                    active ? "border-chart-primary/50 ring-1 ring-chart-primary/20 bg-chart-primary/5 text-chart-primary font-bold" : "border-border text-foreground/90 hover:bg-muted"
                  )}
                >
                  <div className="font-bold">{m.name}</div>
                  <div className="text-[8px] text-muted-foreground/60">{m.element} · Alarm: {ALARM_POINTS[m.code]}</div>
                </button>
              );
            })}
          </div>

          <div className="bg-chart-primary/5 border border-chart-primary/20 rounded-lg p-3">
            <p className="text-[10px] font-bold text-chart-primary mb-1">Indicator Mode</p>
            <p className="text-xs text-foreground/70">TL Umbilicus + CV24 + CV26 (Physiology). Meridian system is interpretive — hold as a useful clinical frame.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full h-8">
            Done
          </Button>
        </div>
      </SubModalBody>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CTM Modal                                                     */
/* ------------------------------------------------------------------ */
export interface CTMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inhibitionState?: Record<string, any>;
  onSelectPathway?: (pathway: string) => void;
  onSaveCTMState?: (state: Record<string, any>) => void;
}

export function CTMModal({
  open,
  onOpenChange,
  inhibitionState = {},
  onSelectPathway,
  onSaveCTMState,
}: CTMModalProps) {
  const [step, setStep] = useState(0);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [activeSubModal, setActiveSubModal] = useState<CTMPhase["id"] | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [ctmState, setCTMState] = useState<Record<string, any>>({});

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, CTM_PHASES.length - 1)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const goToStep = useCallback((i: number) => setStep(i), []);

  const pathways = useMemo(() =>
    Object.keys(inhibitionState).filter((k) => {
      const val = inhibitionState[k];
      return val === true || val === "Inhibited" || val === "Inhibition" || val === false || val === "Clear";
    }),
    [inhibitionState]
  );

  const toggleSystem = useCallback((key: string) => {
    setSelectedSystems((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return prev.length < 3 ? [...prev, key] : prev;
    });
  }, []);

  const openSubModal = useCallback((systemKey: string) => {
    setActiveSubModal(systemKey as CTMPhase["id"]);
  }, []);

  const closeSubModal = useCallback(() => {
    setActiveSubModal(null);
  }, []);

  const saveSubSelection = useCallback((sel: Record<string, any>) => {
    setCTMState((prev) => ({ ...prev, ...sel }));
    onSaveCTMState?.({ ...ctmState, ...sel });
  }, [ctmState, onSaveCTMState]);

  // Phase navigation shortcuts. Registered only while the CTM modal is open;
  // the page-level handler bails out whenever CTM is open, so the global
  // 1/2/3 timer shortcuts can never fire from inside this modal.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (activeSubModal) closeSubModal();
        else onOpenChange(false);
        return;
      }

      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); goBack(); return; }

      // 1..4 jump straight to a phase
      const phaseIndex = ["1", "2", "3", "4"].indexOf(e.key);
      if (phaseIndex !== -1 && phaseIndex < CTM_PHASES.length) {
        e.preventDefault();
        goToStep(phaseIndex);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, activeSubModal, closeSubModal, goNext, goBack, goToStep, onOpenChange]);

  if (!open) return null;

  // Render the appropriate sub-modal
  const renderSubModal = () => {
    if (!activeSubModal) return null;
    switch (activeSubModal) {
      case "heart-wall": return <HeartWallSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      case "brain-zones": return <BrainZonesSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      case "organs": return <OrgansSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      case "joints": return <JointsSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      case "cranial-sutures": return <CranialSuturesSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      case "fascia": return <FasciaSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      case "meridians": return <MeridiansSubModal onClose={closeSubModal} saveSelection={saveSubSelection} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative flex h-[min(92vh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-card to-muted/30 shrink-0">
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
        <div className="flex items-center gap-1 px-6 pt-4 pb-2 overflow-x-auto shrink-0">
          {CTM_PHASES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goToStep(i)}
              title={`Press ${i + 1}`}
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
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* ----- STEP 1: SCREEN ----- */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-2">The Screen</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  The screen is three things held together simultaneously. If it inhibits a strong indicator, there is a CTM stack to work. The screen can be run in the clear (no reference point — body surfaces its highest priority) or targeted (TL a specific area first, then run the screen to find what is holding it in place).
                </p>
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
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  A memory node is a "server" — a housing where the file is stored. Once the screen is open, circuit-locate or thought-localise each node within the 5–10 second window. Find one primary node. Have the client hold it with their hand so every system you find next reads off that node.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Cerebellum", key: "cerebellum", loc: "GV16 / Head", desc: "Motor memory and coordination. All motor control pathways processed here. Most commonly found in structural and movement-based presentations." },
                  { label: "Sphenoid", key: "sphenoid", loc: "Temple (R or L) / Head", desc: "Sits against the pituitary gland. Tilt associated with mood dysregulation and hormonal patterns. Lateralise to find R or L." },
                  { label: "Thalamus", key: "thalamus", loc: "Occipitalis (posterior skull) / Head", desc: "Sensory relay centre. All sensory info routes through. Nociceptive pathways and central sensitisation patterns housed here." },
                  { label: "CN1 / Olfactory", key: "cn1", loc: "Between the eyebrows / Head", desc: "Plugs directly into limbic system without thalamic relay. A smell during trauma becomes part of the neuro tag. Avoid strong essential oils in clinic." },
                  { label: "Thymus", key: "thymus", loc: "Below clavicles, sternum / Body", desc: "Boss of the immune system. Immune memory and immune-mediated inflammatory patterns. Relevant in autoimmune, allergic, chronic inflammatory presentations." },
                  { label: "Left Thoracic Duct / Cisterna Chyli", key: "thoracic-duct", loc: "Middle lymphatic zone, below sternum / Body", desc: "Drains left brain and rest of body. Main lymphatic reservoir. Stagnation and immune-lymphatic patterns stored here." },
                  { label: "Umbilicus", key: "umbilicus", loc: "Navel / Body", desc: "Related to stem cells and body's original developmental blueprint. Holds earliest cellular memory. Deep constitutional and longstanding chronic presentations." },
                ].map((node) => (
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
                  <p className="text-xs text-foreground/70">{[
                    "cerebellum", "sphenoid", "thalamus", "cn1", "thymus", "thoracic-duct", "umbilicus"
                  ].find((k) => k === selectedNode) && [
                    { key: "cerebellum", label: "Cerebellum" },
                    { key: "sphenoid", label: "Sphenoid" },
                    { key: "thalamus", label: "Thalamus" },
                    { key: "cn1", label: "CN1 / Olfactory" },
                    { key: "thymus", label: "Thymus" },
                    { key: "thoracic-duct", label: "Left Thoracic Duct / Cisterna Chyli" },
                    { key: "umbilicus", label: "Umbilicus" },
                  ].find((n) => n.key === selectedNode)?.label}</p>
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
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  With the node held, scan the connected systems — and take the top three only. The 2026 revision expanded the menu from 5 to 7 systems by adding Fascia and Meridians.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span>Selected ({selectedSystems.length}/3):</span>
                {selectedSystems.map((key) => (
                  <span key={key} className="font-medium text-foreground bg-chart-primary/10 px-1.5 py-0.5 rounded-md">{key}</span>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm grid grid-cols-2 gap-3">
                {CTM_SYSTEM_GROUPS.map((sys) => (
                  <button
                    key={sys.key}
                    onClick={() => {
                      toggleSystem(sys.key);
                      openSubModal(sys.key);
                    }}
                    className={cn(
                      "text-left bg-card border p-3 shadow-sm hover:shadow transition-all",
                      selectedSystems.includes(sys.key) ? "border-chart-primary/50 ring-1 ring-chart-primary/20 bg-chart-primary/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <sys.icon className="w-4 h-4 text-chart-primary" />
                      <h4 className="text-sm font-bold text-foreground">{sys.label}</h4>
                    </div>
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
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  You have now built a stack: the screen, one node, three systems. The correction re-activates all of it together, then calibrates the system down.
                </p>
              </div>
              <div className="bg-gradient-to-r from-chart-primary/5 to-chart-secondary/5 border border-chart-primary/20 rounded-2xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-foreground mb-3">The Stack — activate all together</h4>
                <ul className="space-y-2.5">
                  {[
                    "Re-activate the screen (Limbic + Inhale + Insula) + the primary node (client holds it) + the 3 systems — all together.",
                    "Deliberately raise the charge (\"show what's wrong\").",
                    "Calibrate down into parasympathetic — that is where healing lands.",
                    "Use rocking, tapping, or tuning fork for calibration.",
                    "After each correction, re-screen off the same pathway. Deep patterns often need two or three passes.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-foreground/80 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-chart-primary/10 text-chart-primary flex items-center justify-center text-[9px] font-extrabold shrink-0">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Hold the premise honestly. The neurotag and interoception science is well-established (Moseley & Butler; van der Kolk). The broader claim that memory is distributed through the body's tissues is a powerful clinical model, not settled science. Use it for the results it gets — don't oversell the mechanism to clients.
                </p>
              </div>

              {Object.keys(ctmState).length > 0 && (
                <div className="bg-chart-emerald/5 border border-chart-emerald/20 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-chart-emerald mb-3">CTM Stack Summary</h4>
                  <dl className="space-y-1 text-xs text-foreground/80">
                    {selectedNode && (
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground w-28 shrink-0">Node:</dt>
                        <dd>{selectedNode}</dd>
                      </div>
                    )}
                    {selectedSystems.map((sys, i) => (
                      <div key={i} className="flex gap-2">
                        <dt className="text-muted-foreground w-28 shrink-0">System {i + 1}:</dt>
                        <dd>{sys}</dd>
                      </div>
                    ))}
                    {Object.entries(ctmState).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-muted-foreground w-28 shrink-0">{k}:</dt>
                        <dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Stage 4 — explicit submit. Selections are already merged into
                  ctmState as the practitioner clicks "Done" in each sub-modal;
                  this button is the single point that commits the whole stack
                  back to the session metadata. */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    onSaveCTMState?.({ ...ctmState });
                    if (Object.keys(ctmState).length === 0) {
                      showError("No CTM selections saved yet — pick a system first");
                    } else {
                      showSuccess("CTM stack saved to session");
                    }
                  }}
                  className="rounded-full h-9 px-4 bg-chart-emerald hover:bg-chart-emerald/90 text-white text-[11px] font-semibold shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Submit CTM Stack
                </Button>
                <span className="text-[10px] text-muted-foreground/60 leading-tight">
                  Writes the full stack to session metadata
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20 shrink-0">
          <Button variant="outline" size="sm" onClick={goBack} disabled={step === 0} className="rounded-full h-8 px-3">
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Back
          </Button>
          <span className="text-[10px] text-muted-foreground font-medium">
            Phase {step + 1} / {CTM_PHASES.length}
            <span className="hidden sm:inline text-muted-foreground/50"> · keys 1–4</span>
          </span>
          {step === CTM_PHASES.length - 1 ? (
            <Button
              size="sm"
              onClick={() => { onSaveCTMState?.({ ...ctmState }); onOpenChange(false); }}
              disabled={Object.keys(ctmState).length === 0}
              title={Object.keys(ctmState).length === 0 ? "Select at least one system first" : "Submit and close"}
              className="rounded-full h-8 px-4 bg-chart-emerald hover:bg-chart-emerald/90 text-white text-[11px] font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Submit &amp; Close
            </Button>
          ) : (
            <Button size="sm" onClick={goNext} className="rounded-full h-8 px-3 bg-chart-primary hover:bg-chart-primary/90 text-white">
              Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Sub-modal overlay */}
      {renderSubModal() && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={closeSubModal}>
          <div
            className={cn(
              "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
              activeSubModal && WIDE_SUBMODALS.includes(activeSubModal) ? "max-w-2xl" : "max-w-xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {renderSubModal()}
          </div>
        </div>
      )}
    </div>
  );
}

