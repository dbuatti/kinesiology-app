// src/lib/session-summary-techniques.ts
//
// Client-facing wording for the session summary email (Embed stage).
//
// The appointment stores clinical detail (muscle names, reflex findings,
// meridians, …). The client-facing email must NEVER echo that. This file is
// the single place where a technique/protocol is translated into plain
// language, so the practitioner can edit the wording without touching code.
//
// Each phrase is a VERB PHRASE (no leading "we") so the builder can join them
// with commas and a final "and" under one stem: "We checked..., did..., and
// looked at...".

export interface TechniqueCategory {
  key: string;
  phrase: string;
}

export const TECHNIQUE_CATEGORIES: TechniqueCategory[] = [
  { key: "nervous_system_check", phrase: "checked how your nervous system is running" },
  { key: "settle", phrase: "helped your system settle and down-regulate" },
  { key: "lymphatic", phrase: "did some gentle lymphatic work to help your body clear and reset" },
  { key: "breathing", phrase: "looked at your breathing" },
  { key: "emotional", phrase: "worked with some of what's been coming up for you" },
];

/**
 * Map of PEACE protocol ids → category key.
 *
 * Primary source of "what was recorded" is the PEACE workflow itself:
 *   - Ease stage: metadata.sns_resets (keys: lymphatic, t1, diaphragm, harmonic, vagus, other)
 *   - Correct/Align/Preliminary/Embed: metadata.protocol_logs (process ids)
 *   - Heart Wall: metadata.cleared_muscle_status / hw-* protocols
 *
 * Add a new protocol here when it is introduced, otherwise it is logged as
 * unmapped (see explainTechniqueDetection) and surfaced in the dialog.
 */
export const PROTOCOL_CATEGORY_MAP: Record<string, string> = {
  // Ease — SNS down-regulation
  lymphatic: "lymphatic",
  t1: "settle",
  diaphragm: "settle",
  harmonic: "settle",
  vagus: "settle",
  other: "settle",
  // Correct / Align — testing & correction protocols
  mechanoreceptor: "nervous_system_check",
  nociceptive: "nervous_system_check",
  physiological: "nervous_system_check",
  cortical: "nervous_system_check",
  subcortical: "nervous_system_check",
  emotional: "emotional",
  // Embed — heart wall & belief work
  "hw-screen": "emotional",
  "hw-assessment": "emotional",
  "hw-correction": "emotional",
  "hw-recheck": "emotional",
  "hw-hidden": "emotional",
  "lb-process": "emotional",
};

export interface TechniqueDetection {
  categories: TechniqueCategory[];
  /** Protocol ids detected as recorded (primary source). */
  recordedProtocols: string[];
  /** Protocol ids that were recorded but have no mapping (need attention). */
  unmapped: string[];
  /** Source fields read from the appointment, and whether each was populated. */
  fields: Record<string, boolean>;
}

const SOURCE_FIELDS = [
  "priority_pattern", "modes_balances",
  "fakuda_notes", "sharpened_rhombergs_notes", "frontal_lobe_notes",
  "righting_reflex_notes", "sagittal_plane_notes", "frontal_plane_notes",
  "transverse_plane_notes", "gait_notes",
  "harmonic_rocking_notes", "t1_reset_notes", "diaphragm_reset_notes", "vagus_nerve_notes",
  "lymphatic_priority_zone", "lymphatic_notes", "lymphatic_suture_side",
  "bolt_score", "coherence_score",
  "emotion_primary_selection", "emotion_notes", "luscher_color_1",
];

function normalizeMetadata(m: any): any {
  if (!m) return {};
  if (typeof m === "string") {
    try { return JSON.parse(m); } catch { return {}; }
  }
  return typeof m === "object" ? m : {};
}

/** Protocol ids recorded in the PEACE workflow (primary source). */
function recordedProtocolIds(appointment: any): string[] {
  const a = appointment || {};
  const md = normalizeMetadata(a.metadata);
  const ids = new Set<string>();

  // Ease — SNS down-regulation toggles.
  const sns = md.sns_resets || {};
  for (const key of Object.keys(sns)) {
    if (sns[key]) ids.add(key);
  }

  // Correct / Align / Embed / Heart Wall — protocol logs with saved values.
  const logs = md.protocol_logs || {};
  for (const pid of Object.keys(logs)) {
    const log = logs[pid] || {};
    const hasEntries = Array.isArray(log.entries) && log.entries.length > 0;
    const hasValues = log.values && Object.keys(log.values).length > 0;
    const hasSteps = Array.isArray(log.steps) && log.steps.length > 0;
    if (hasEntries || hasValues || hasSteps) ids.add(pid);
  }

  // Heart wall: cleared muscle status.
  const cleared = md.cleared_muscle_status || {};
  if (Object.keys(cleared).length > 0) ids.add("hw-correction");

  return [...ids];
}

export function detectTechniqueCategories(appointment: any): TechniqueCategory[] {
  return explainTechniqueDetection(appointment).categories;
}

export function explainTechniqueDetection(appointment: any): TechniqueDetection {
  const a = appointment || {};
  const fields: Record<string, boolean> = {};
  for (const f of SOURCE_FIELDS) fields[f] = a[f] != null && String(a[f]).trim() !== "";

  const recorded = recordedProtocolIds(a);

  // Map recorded protocols → categories.
  const keys = new Set<string>();
  const unmapped: string[] = [];
  for (const pid of recorded) {
    const cat = PROTOCOL_CATEGORY_MAP[pid];
    if (cat) keys.add(cat);
    else unmapped.push(pid);
  }

  // Fallback: old notes fields (sessions recorded before the V3 toggles existed).
  const hasTesting =
    !!a.priority_pattern || !!a.modes_balances ||
    !!a.fakuda_notes || !!a.sharpened_rhombergs_notes || !!a.frontal_lobe_notes ||
    !!a.righting_reflex_notes || !!a.sagittal_plane_notes || !!a.frontal_plane_notes ||
    !!a.transverse_plane_notes || !!a.gait_notes;
  const hasDownRegNotes =
    !!a.harmonic_rocking_notes || !!a.t1_reset_notes ||
    !!a.diaphragm_reset_notes || !!a.vagus_nerve_notes;
  const hasLymphNotes =
    !!a.lymphatic_priority_zone || !!a.lymphatic_notes || !!a.lymphatic_suture_side;
  const hasBreath = a.bolt_score != null || a.coherence_score != null;
  const hasEmotion =
    !!a.emotion_primary_selection || !!a.emotion_notes || !!a.luscher_color_1;

  // Only apply fallbacks when the primary source produced nothing for that
  // category, so a recorded protocol always wins.
  if (recorded.length === 0) {
    if (hasTesting) keys.add("nervous_system_check");
    if (hasDownRegNotes) keys.add("settle");
    if (hasLymphNotes) keys.add("lymphatic");
    if (hasBreath) keys.add("breathing");
    if (hasEmotion) keys.add("emotional");
  } else {
    // Fill gaps from notes only for categories not already covered.
    if (hasTesting && !keys.has("nervous_system_check")) keys.add("nervous_system_check");
    if (hasDownRegNotes && !keys.has("settle")) keys.add("settle");
    if (hasLymphNotes && !keys.has("lymphatic")) keys.add("lymphatic");
    if (hasBreath && !keys.has("breathing")) keys.add("breathing");
    if (hasEmotion && !keys.has("emotional")) keys.add("emotional");
  }

  if (typeof console !== "undefined" && (import.meta as any)?.env?.DEV) {
    const present = Object.entries(fields).filter(([, v]) => v).map(([k]) => k);
    console.info("[session-summary] recorded protocols:", recorded.join(", ") || "(none)");
    console.info("[session-summary] categories:", [...keys].join(", ") || "(none)");
    console.info("[session-summary] source fields present:", present.join(", ") || "(none)");
  }
  if (unmapped.length && typeof console !== "undefined") {
    console.warn("[session-summary] UNMAPPED protocols (add to PROTOCOL_CATEGORY_MAP):", unmapped.join(", "));
  }

  return {
    categories: TECHNIQUE_CATEGORIES.filter((c) => keys.has(c.key)),
    recordedProtocols: recorded,
    unmapped,
    fields,
  };
}
