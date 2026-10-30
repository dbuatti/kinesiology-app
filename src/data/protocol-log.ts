import type { BrainRegionCategory } from "@/data/brain-reflex-data";

/**
 * Loggable fields for every correction protocol.
 *
 * The manual is a reference first, but in a session the practitioner needs to
 * write down what the test showed. Each process declares the fields it needs
 * here; `ProtocolLogSheet` renders them and the log is persisted on the
 * appointment under `metadata.protocol_logs[processId]`.
 */

export type BrainCategory = Extract<BrainRegionCategory, "Cortical" | "Subcortical">;

export interface ZoneValue {
  category: BrainCategory;
  name: string;
  side: "L" | "R" | null;
}

export interface ProtocolLog {
  /** Indices of the instruction steps already performed. */
  steps?: number[];
  values?: Record<string, unknown>;
  updatedAt?: string;
  /**
   * Corrections already completed for this process, newest last.
   *
   * The sheet always edits one live entry (`values`/`steps`). "Add another"
   * moves that entry in here and clears the form, so a session that corrects
   * three ligaments keeps all three instead of only the last.
   */
  entries?: ProtocolEntry[];
}

export interface ProtocolEntry {
  id: string;
  values: Record<string, unknown>;
  steps?: number[];
  savedAt: string;
}

/** A write is either a plain patch or a function of the freshest log. */
export type ProtocolLogPatch =
  | Partial<ProtocolLog>
  | ((previous: ProtocolLog) => Partial<ProtocolLog>);

/**
 * Progressive disclosure: a field only appears once the one before it has an
 * answer. Keeps the emotional log to 3–4 decisions at a time instead of 13.
 */
export interface ShowWhen {
  field: string;
  /** Render when the parent equals one of these values. */
  equals?: string[];
  /** Render when the parent has any truthy value. */
  truthy?: boolean;
}

interface FieldBase {
  id: string;
  label: string;
  hint?: string;
  showWhen?: ShowWhen;
}

export type ProtocolField = FieldBase &
  (
    | {
        kind: "chips";
        options: string[];
        /** Show a caption under the chips for the selected option. */
        optionNotes?: Record<string, string>;
        /** Only offer the options that belong to another field's value. */
        dependsOn?: string;
        optionsByValue?: Record<string, string[]>;
        emptyHint?: string;
        /** Store several answers (e.g. every therapeutic shift observed). */
        multiple?: boolean;
        /** Large pills with a filled, ticked selected state. */
        emphasis?: boolean;
      }
    | {
        kind: "zone";
        /** Locked when the process itself decides the category (cortical/subcortical). */
        lockedCategory?: BrainCategory;
      }
    | { kind: "text"; placeholder?: string }
    | { kind: "number"; min?: number; max?: number; suffix?: string }
    | { kind: "longtext"; placeholder?: string; rows?: number }
    | {
        kind: "toggle";
        /** Big checkbox row with a success beat when it is ticked. */
        emphasis?: boolean;
      }
    | {
        kind: "organ";
        /** Organ pair comes from this field (usually `emotion`). */
        dependsOn?: string;
      }
    | { kind: "eye" }
    | { kind: "polarity" }
    | {
        kind: "status";
        options: Array<{ value: string; tone: "success" | "warning" | "danger" }>;
      }
  );

export type ChipsField = Extract<ProtocolField, { kind: "chips" }>;
export type OrganField = Extract<ProtocolField, { kind: "organ" }>;
export type StatusField = Extract<ProtocolField, { kind: "status" }>;

export const EMOTIONS = ["Anger", "Hurt", "Worry", "Sadness", "Fear"] as const;

export type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export interface OrganOption {
  id: string;
  name: string;
  element: Element;
  /** Wrist position — the Yin/Yang pair shares it. */
  pulse: string;
  depth: "Yin (deep)" | "Yang (superficial)";
  /** Short clinical cue, shown once the organ is selected. */
  note: string;
}

/**
 * Every organ is its own choice: the Liver and the Gallbladder are different
 * surrogates even though they share a pulse position and element. Defaulting
 * to the Yin organ first keeps the common case one tap away.
 */
export const EMOTION_ORGANS: Record<string, OrganOption[]> = {
  Anger: [
    {
      id: "liver",
      name: "Liver",
      element: "Wood",
      pulse: "Left guan",
      depth: "Yin (deep)",
      note: "Planning · decisions. Anger held in rather than expressed.",
    },
    {
      id: "gallbladder",
      name: "Gallbladder",
      element: "Wood",
      pulse: "Left guan",
      depth: "Yang (superficial)",
      note: "Resentment · decisions not taken. Bitterness held outward.",
    },
  ],
  Hurt: [
    {
      id: "heart",
      name: "Heart",
      element: "Fire",
      pulse: "Left cun",
      depth: "Yin (deep)",
      note: "Joy · hurt · feeling unseen or unlovable.",
    },
    {
      id: "small-intestine",
      name: "Small Intestine",
      element: "Fire",
      pulse: "Left cun",
      depth: "Yang (superficial)",
      note: "Discernment · taking things personally.",
    },
  ],
  Worry: [
    {
      id: "spleen",
      name: "Spleen",
      element: "Earth",
      pulse: "Right guan",
      depth: "Yin (deep)",
      note: "Overthinking · worry · nourishment and support.",
    },
    {
      id: "stomach",
      name: "Stomach",
      element: "Earth",
      pulse: "Right guan",
      depth: "Yang (superficial)",
      note: "Swallowed resentment · digesting an experience.",
    },
  ],
  Sadness: [
    {
      id: "lung",
      name: "Lung",
      element: "Metal",
      pulse: "Right cun",
      depth: "Yin (deep)",
      note: "Grief · sadness · letting go.",
    },
    {
      id: "large-intestine",
      name: "Large Intestine",
      element: "Metal",
      pulse: "Right cun",
      depth: "Yang (superficial)",
      note: "Holding on · releasing what is finished.",
    },
  ],
  Fear: [
    {
      id: "kidney",
      name: "Kidney",
      element: "Water",
      pulse: "Left chi",
      depth: "Yin (deep)",
      note: "Fear · safety · will and reserves.",
    },
    {
      id: "bladder",
      name: "Bladder",
      element: "Water",
      pulse: "Left chi",
      depth: "Yang (superficial)",
      note: "Anxiety · old fear that will not clear.",
    },
  ],
};

const EMOTION_NOTES: Record<string, string> = Object.fromEntries(
  EMOTIONS.map((emotion) => {
    const organs = EMOTION_ORGANS[emotion];
    return [
      emotion,
      `${organs[0].element} · ${organs.map((o) => o.name).join(" / ")} · ${organs[0].pulse}`,
    ];
  })
);

const organNames = (emotion: unknown) =>
  (EMOTION_ORGANS[String(emotion)] ?? []).map((o) => o.name);

export const SHIFT_SIGNS = ["Yawn", "Sigh", "Swallow", "Gurgle", "Deep breath"];

export interface EyePosition {
  /** Stored value — also the chip label. */
  label: string;
  full: string;
  cue: string;
  desc: string;
  /** Pupil offset on the diagram: -1, 0 or 1. */
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
}

export const EYE_POSITIONS: EyePosition[] = [
  {
    label: "Up & L",
    full: "Up & Left",
    cue: "Visual memory",
    desc: "Seeing a scene from the past.",
    dx: -1,
    dy: -1,
  },
  {
    label: "Up & R",
    full: "Up & Right",
    cue: "Visual constructed",
    desc: "Imagining something not yet seen.",
    dx: 1,
    dy: -1,
  },
  {
    label: "Horiz L",
    full: "Horizontal Left",
    cue: "Auditory memory",
    desc: "Hearing sounds or words from the past.",
    dx: -1,
    dy: 0,
  },
  {
    label: "Horiz R",
    full: "Horizontal Right",
    cue: "Auditory constructed",
    desc: "Hearing sounds not yet heard.",
    dx: 1,
    dy: 0,
  },
  {
    label: "Down & L",
    full: "Down & Left",
    cue: "Internal monologue",
    desc: "Talking to yourself — the belief in words.",
    dx: -1,
    dy: 1,
  },
  {
    label: "Down & R",
    full: "Down & Right",
    cue: "Kinesthetic",
    desc: "Physical sensation or felt sense.",
    dx: 1,
    dy: 1,
  },
];

const METHOD = ["Tap 3–5s", "Hold + intention", "TL + tuning fork"];

export const BRAIN_ZONES: Record<BrainCategory, string[]> = {
  Cortical: [
    "Pre-Frontal Cortex",
    "Pre-Motor Cortex",
    "Motor Cortex M1",
    "Sensory Cortex S1–S2",
    "Visual Cortex",
    "Auditory Cortex",
    "Insula",
    "Orbitofrontal Cortex (OFC)",
    "Anterior Cingulate Cortex (ACC)",
  ],
  Subcortical: [
    "Cerebellum",
    "Pons",
    "Medulla",
    "Hippocampus",
    "Thalamus",
    "Basal Ganglia (Nuclei)",
    "Limbic System",
    "Midbrain",
    "Hypothalamus",
  ],
};

/**
 * Zones whose reflex point sits on the midline, so a correction there has no
 * side to choose.
 *
 * The test is the point, not the anatomy: a zone is lateralised exactly when
 * the points used to check it are bilateral.
 *
 *   Cerebellum   GV16  — suboccipital hollow, midline
 *   Pons         GV17  — external occipital protuberance, midline
 *   Midbrain     GV26  — philtrum, midline
 *   Hypothalamus Bregma / GV20 — crown, midline
 *
 * Everything else is checked bilaterally and therefore logs a side —
 * Medulla (GB12, bilateral), Thalamus (BL9, bilateral), Basal Ganglia (GB9,
 * bilateral), Hippocampus and the Limbic crescent (bilateral hand placement).
 */
export const MIDLINE_BRAIN_ZONES: readonly string[] = [
  "Cerebellum",
  "Pons",
  "Midbrain",
  "Hypothalamus",
];

export const isMidlineZone = (name?: string | null): boolean =>
  !!name && MIDLINE_BRAIN_ZONES.includes(name);


/** One brain zone is never enough: every pathway carries a second zone. */
const brainZoneFields = (primary: BrainCategory): ProtocolField[] => [
  { kind: "zone", id: "zone1", label: "Brain zone 1", lockedCategory: primary },
  {
    kind: "zone",
    id: "zone2",
    label: "Brain zone 2",
    hint: "Always two — cortical or subcortical",
  },
  { kind: "chips", id: "method", label: "Correction", options: METHOD },
  {
    kind: "text",
    id: "pathway",
    label: "Pathway",
    placeholder: "Muscle → zone 1 → zone 2",
  },
  {
    kind: "status",
    id: "retest",
    label: "Re-test",
    options: [
      { value: "Clears", tone: "success" },
      { value: "Still inhibits", tone: "danger" },
    ],
  },
];

/** Shared by the ESR / pulse point sheet and the Heart Wall assessment. */
const emotionOrganFields: ProtocolField[] = [
  {
    kind: "chips",
    id: "emotion",
    label: "Primary emotion",
    options: [...EMOTIONS],
    optionNotes: EMOTION_NOTES,
  },
  {
    kind: "organ",
    id: "organ",
    label: "Priority organ",
    dependsOn: "emotion",
    hint: "Yin first · tap to select",
  },
];

export const PROTOCOL_FIELDS: Record<string, ProtocolField[]> = {
  mechanoreceptor: [
    {
      kind: "chips",
      id: "confirmation",
      label: "Confirmation",
      options: ["Afferent facilitates", "X card facilitates", "GV16 TL facilitates"],
    },
    { kind: "text", id: "region", label: "Region / joint", placeholder: "e.g. left knee" },
    { kind: "text", id: "ligament", label: "Ligament", placeholder: "e.g. LCL" },
    {
      kind: "text",
      id: "stretch",
      label: "Stretch direction",
      placeholder: "e.g. internal rotation",
    },
    { kind: "toggle", id: "corrected", label: "GV16 + stretch + fork applied" },
    {
      kind: "status",
      id: "retest",
      label: "Re-test",
      options: [
        { value: "Locks", tone: "success" },
        { value: "Still inhibits", tone: "danger" },
      ],
    },
  ],
  nociceptive: [
    { kind: "text", id: "site", label: "Threat site", placeholder: "e.g. right ankle" },
    {
      kind: "chips",
      id: "stimulus",
      label: "Aggravating stimulus",
      options: ["Light touch", "Joint impact", "Pinch", "Other"],
    },
    { kind: "toggle", id: "thalamus", label: "Thalamus held (Bl9)" },
    { kind: "toggle", id: "stacked", label: "Collateral inputs stacked" },
    { kind: "toggle", id: "integrated", label: "Tuning fork + rocking" },
    {
      kind: "status",
      id: "retest",
      label: "Re-test",
      options: [
        { value: "No longer inhibits", tone: "success" },
        { value: "Still inhibits", tone: "danger" },
      ],
    },
  ],
  physiological: [
    { kind: "text", id: "organ", label: "Organ" },
    {
      kind: "chips",
      id: "driver",
      label: "Driver",
      options: ["Nutrition", "Hydration", "Neurolymphatic", "Neurovascular", "Meridian"],
    },
    { kind: "text", id: "points", label: "Points used" },
    {
      kind: "status",
      id: "retest",
      label: "Re-test",
      options: [
        { value: "Holds", tone: "success" },
        { value: "Still inhibits", tone: "danger" },
      ],
    },
  ],
  cortical: brainZoneFields("Cortical"),
  subcortical: brainZoneFields("Subcortical"),
  emotional: [
    {
      kind: "chips",
      id: "esr",
      label: "ESR check",
      options: ["Weakens with stressor", "Locks (no stress)"],
      optionNotes: {
        "Weakens with stressor": "Stressor is live — continue the protocol.",
        "Locks (no stress)": "Nothing to clear yet — revisit the stressor.",
      },
    },
    {
      kind: "chips",
      id: "permission",
      label: "Permission",
      options: ["Granted", "Denied"],
      optionNotes: {
        Granted: "Proceed with the protocol.",
        Denied: "Run Harmonic Rocking first, then re-ask.",
      },
    },
    {
      kind: "chips",
      id: "timeline",
      label: "Timeline",
      options: ["Current", "Historic"],
      optionNotes: {
        Current: "Stay with the present charge.",
        Historic: "Narrow to a specific age / month.",
      },
    },
    {
      kind: "text",
      id: "timelineDetail",
      label: "Age / month",
      placeholder: "e.g. 7 yrs, March",
      showWhen: { field: "timeline", equals: ["Historic"] },
    },
    ...emotionOrganFields,
    { kind: "polarity", id: "polarity", label: "Energy polarity", hint: "Usually OUT" },
    { kind: "eye", id: "eye", label: "Eye position", hint: "Tap a direction" },
    {
      kind: "chips",
      id: "shift",
      label: "Therapeutic shift",
      options: SHIFT_SIGNS,
      multiple: true,
      emphasis: true,
      hint: "Tap all that occurred",
    },
    {
      kind: "toggle",
      id: "uploaded",
      label: "Positive state uploaded",
      emphasis: true,
    },
    {
      kind: "status",
      id: "retest",
      label: "Re-test",
      options: [
        { value: "Locks", tone: "success" },
        { value: "Still weak", tone: "warning" },
      ],
      showWhen: { field: "uploaded", truthy: true },
    },
    { kind: "longtext", id: "notes", label: "Notes", rows: 2 },
  ],
  "hw-screen": [
    {
      kind: "text",
      id: "receiving",
      label: "Receiving statement",
      placeholder: "love, money, acceptance…",
    },
    {
      kind: "status",
      id: "present",
      label: "Result",
      options: [
        { value: "Heart Wall present", tone: "warning" },
        { value: "No Heart Wall", tone: "success" },
      ],
    },
  ],
  "hw-assessment": [
    {
      kind: "chips",
      id: "permission",
      label: "Permission",
      options: ["Granted", "Denied"],
      optionNotes: { Denied: "Harmonic Rocking first." },
    },
    { kind: "number", id: "layers", label: "Layers", min: 1, max: 40 },
    ...emotionOrganFields,
    { kind: "text", id: "muscles", label: "Related muscles" },
    { kind: "zone", id: "zone1", label: "Brain zone 1" },
    {
      kind: "zone",
      id: "zone2",
      label: "Brain zone 2",
      hint: "Always two — cortical or subcortical",
    },
    {
      kind: "text",
      id: "context",
      label: "Context",
      placeholder: "age · event · absorbed / inherited",
    },
  ],
  "hw-correction": [
    { kind: "chips", id: "permission", label: "Permission", options: ["Granted", "Denied"] },
    { kind: "text", id: "organ", label: "Organ" },
    { kind: "chips", id: "inherited", label: "Inherited", options: ["No", "Mom", "Dad"] },
    { kind: "number", id: "minutes", label: "Minutes held", min: 1, max: 10 },
    { kind: "number", id: "taps", label: "Taps", min: 3, max: 20 },
    {
      kind: "chips",
      id: "shift",
      label: "Shift",
      options: SHIFT_SIGNS,
      multiple: true,
      emphasis: true,
    },
    { kind: "longtext", id: "notes", label: "Notes", rows: 2 },
  ],
  "hw-recheck": [
    {
      kind: "chips",
      id: "shift",
      label: "Parasympathetic shift",
      options: SHIFT_SIGNS,
      multiple: true,
      emphasis: true,
    },
    {
      kind: "status",
      id: "muscles",
      label: "Related muscles",
      options: [
        { value: "Now lock", tone: "success" },
        { value: "Still inhibit", tone: "danger" },
      ],
    },
    { kind: "number", id: "layersLeft", label: "Layers remaining", min: 0, max: 40 },
    { kind: "longtext", id: "notes", label: "Notes", rows: 2 },
  ],
  "hw-hidden": [
    {
      kind: "status",
      id: "present",
      label: "Result",
      options: [
        { value: "Hidden Heart Wall present", tone: "warning" },
        { value: "Clear", tone: "success" },
      ],
    },
    { kind: "longtext", id: "notes", label: "Notes", rows: 2 },
  ],
  "lb-process": [
    { kind: "text", id: "belief", label: "Belief", placeholder: "e.g. I am not safe" },
    { kind: "longtext", id: "a", label: "A — Feel it in the body", rows: 2 },
    { kind: "longtext", id: "b", label: "B — Follow the sensation", rows: 2 },
    { kind: "text", id: "c", label: "C — Desired state" },
    { kind: "longtext", id: "d", label: "D — Embody it", rows: 2 },
    { kind: "longtext", id: "e", label: "E — Deepen it", rows: 2 },
    {
      kind: "chips",
      id: "f",
      label: "F — Still feels true?",
      options: ["Yes", "No"],
    },
    {
      kind: "chips",
      id: "g",
      label: "G — Believe it in the future?",
      options: ["Yes", "No"],
    },
    { kind: "chips", id: "h", label: "H — Any scenario left?", options: ["Yes", "No"] },
  ],
};

/**
 * Which instruction step each log field belongs to (1-based). Unlisted fields
 * (e.g. notes) render after the steps. This is what lets the record live
 * inside the instructions instead of in a separate block at the bottom.
 */
export const PROTOCOL_STEP_MAP: Record<string, Record<string, number>> = {
  mechanoreceptor: {
    confirmation: 1,
    region: 2,
    ligament: 2,
    stretch: 3,
    corrected: 4,
    retest: 5,
  },
  nociceptive: {
    site: 1,
    thalamus: 2,
    stimulus: 3,
    stacked: 4,
    integrated: 5,
    retest: 6,
  },
  physiological: { organ: 1, driver: 2, points: 3, retest: 5 },
  cortical: { zone1: 1, zone2: 3, method: 4, pathway: 4, retest: 5 },
  subcortical: { zone1: 1, zone2: 3, method: 4, pathway: 4, retest: 5 },
  emotional: {
    esr: 1,
    permission: 2,
    timeline: 3,
    timelineDetail: 3,
    emotion: 4,
    organ: 5,
    polarity: 6,
    eye: 7,
    shift: 8,
    uploaded: 9,
    retest: 10,
  },
  "hw-screen": { receiving: 2, present: 3 },
  "hw-assessment": {
    permission: 1,
    layers: 2,
    organ: 3,
    emotion: 4,
    muscles: 5,
    zone1: 6,
    zone2: 6,
    context: 7,
  },
  "hw-correction": {
    permission: 1,
    organ: 3,
    inherited: 3,
    minutes: 3,
    taps: 6,
    shift: 6,
  },
  "hw-recheck": { shift: 1, muscles: 2, layersLeft: 4 },
  "hw-hidden": { present: 3 },
};

/** Every field assigned to a step in a process? Used to pick the inline layout. */
export const hasStepFields = (processId: string) =>
  Object.keys(PROTOCOL_STEP_MAP[processId] ?? {}).length > 0;

/** Values that belong to a field, used to invalidate children when a parent changes. */
export const allowedValuesFor = (field: ProtocolField, parentValue: unknown): string[] => {
  if (field.kind === "organ") return organNames(parentValue);
  if (field.kind === "chips" && field.optionsByValue) {
    return field.optionsByValue[String(parentValue)] ?? [];
  }
  return [];
};

export const organPairFor = (emotion: unknown): OrganOption[] =>
  EMOTION_ORGANS[String(emotion)] ?? [];

export const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";

/**
 * One line per answered field, in the order the practitioner works through
 * them. Used by the log bar and by the list of saved corrections, so both
 * always describe the same data the same way.
 */
export const summariseValues = (
  processId: string,
  values: Record<string, unknown> = {}
): string[] => {
  const fields = PROTOCOL_FIELDS[processId] ?? [];
  const parts: string[] = [];

  for (const field of fields) {
    const value = values[field.id];
    if (!hasValue(value)) continue;

    if (field.kind === "toggle") {
      parts.push(field.label);
      continue;
    }
    if (field.kind === "zone") {
      const zone = formatZone(isZoneValue(value) ? value : null);
      if (zone) parts.push(zone);
      continue;
    }
    if (Array.isArray(value)) {
      parts.push(value.map(String).join(" / "));
      continue;
    }
    if (typeof value === "boolean") {
      if (value) parts.push(field.label);
      continue;
    }
    parts.push(String(value));
  }

  return parts;
};

/** Human-readable one-liner for a logged zone, e.g. "R · Limbic System". */
export const formatZone = (zone?: ZoneValue | null) => {
  if (!zone?.name) return null;
  // Midline structures never carry a side — including older logs written
  // before the picker knew better.
  const side = isMidlineZone(zone.name)
    ? ""
    : zone.side === "R"
      ? "R"
      : zone.side === "L"
        ? "L"
        : "";
  return `${side ? `${side} · ` : ""}${zone.name}`;
};

/** "L PFC → R Limbic" — used as the sheet's spine when two zones are logged. */
export const formatZonePair = (one?: ZoneValue | null, two?: ZoneValue | null) => {
  const a = formatZone(one);
  const b = formatZone(two);
  if (!a && !b) return null;
  return [a ?? "—", b ?? "—"].join("  →  ");
};

export const isZoneValue = (value: unknown): value is ZoneValue => {
  const v = value as ZoneValue | null;
  return !!v && typeof v === "object" && typeof v.name === "string" && "category" in v;
};
