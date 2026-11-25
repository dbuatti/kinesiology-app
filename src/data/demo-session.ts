import type { AppointmentWithClient } from "@/types/crm";

/**
 * Public, read-mostly demo of a live session.
 *
 * The real page (`/appointments/:id`) is auth-gated and loads from Supabase.
 * This fixture lets the same page render at `/appointments/demo` with a
 * realistic mid-session state so the layout can be reviewed on any device
 * without touching a client record. Saves stay in memory (see useAppointment).
 */
export const DEMO_APPOINTMENT_ID = "demo";

const at = (daysAgo: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

/** Live session clock: started 47 minutes ago */
const startedMinutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

export const demoAppointment = (): AppointmentWithClient => ({
  id: DEMO_APPOINTMENT_ID,
  user_id: "demo-user",
  client_id: "demo-client",
  date: startedMinutesAgo(47),
  tag: "Kinesiology",
  status: "In Progress",
  notes: "Demo data — nothing on this page is written to a client record.",
  goal: "Sleep through the night without waking at 3am.",
  issue: "Right sacroiliac ache after long sitting; worse since moving house.",
  acupoints: "",

  // Preliminary — baseline
  bolt_score: 41,
  heart_rate: 68,
  breath_rate: 14,
  coherence_score: 55,
  hydrated: true,
  hydration_notes: "1.5 L so far; electrolytes at 9am.",
  sagittal_plane_notes: "Forward head; right hip sits forward.",
  frontal_plane_notes: "Left shoulder high; weight shifted right.",
  transverse_plane_notes: "Right pelvis rotated forward.",
  emotion_mode: "Emotion Code",
  emotion_primary_selection: "Fear",
  emotion_secondary_selection: ["Overwhelm"],
  emotion_notes: "Fear of not coping after the move.",
  fakuda_notes: "Right cerebellar drift; clears on the second pass.",
  sharpened_rhombergs_notes: "Steady with eyes closed.",
  frontal_lobe_notes: "Right OFC inhibited with thumb.",
  righting_reflex_notes: "Righting reflex intact.",
  luscher_color_1: "Blue",
  luscher_color_2: "Green",
  gait_notes: "Right arm swing reduced.",

  // Ease — SNS down-regulation in progress (5 of 6)
  lymphatic_notes: "Cisterna chyli — three pumps, clear.",
  harmonic_rocking_notes: "2 minutes; settled.",
  t1_reset_notes: "T1 reset, left.",
  diaphragm_reset_notes: "Four rounds, six breaths.",
  vagus_nerve_notes: "Vagus reset — 3 rounds, HRV up.",

  // Align / Correct
    priority_pattern: JSON.stringify({
    muscles: {
      "Psoas (R)": "Inhibited",
      "Glute Max (L)": "Inhibited",
      "Upper Trapezius (R)": "Hypertonic",
      "Sartorius (R)": "Hypertonic",
      "Diaphragm": "Inhibited",
    },
    primitiveReflexes: {
      "Fear Paralysis Reflex": "Inhibited",
      "Moro Reflex": "Inhibited",
    },
    cranialNerves: {
      "CN III: Oculomotor (R)": "Inhibited",
    },
    brainZones: {
      "Cerebellum (R)": "Inhibited",
    },
    priorities: {
      "priority:muscles:Psoas (R)": "primary",
      "priority:muscles:Glute Max (L)": "priority",
      "priority:primitiveReflexes:Moro Reflex": "priority",
    },
    itemCorrections: {
      "muscles:Psoas (R)": [
        { id: "demo-corr-aff-mech", pathway: "mechanoreceptor", direction: "afferent", holding: true, note: "GV16 hold + stretch", details: { finding: "Psoas (R)", direction: "afferent", method: "Hold + intention", retest: "Clears", correctionTimerMinutes: 3, correctionTimerRemainingSeconds: 0, correctionTimerCompleted: true }, createdAt: iso(18), updatedAt: iso(18) },
        { id: "demo-corr-aff-nocio", pathway: "nociceptive", direction: "afferent", holding: true, note: "Mechanical pressure on PSIS", details: { finding: "Psoas (R)", direction: "afferent", method: "Tap 3–5s", retest: "No longer inhibits" }, createdAt: iso(17), updatedAt: iso(17) },
        { id: "demo-corr-aff-phys", pathway: "physiological", direction: "afferent", holding: false, note: "Spindle cell activation", details: { finding: "Psoas (R)", direction: "afferent", method: "TL + tuning fork", retest: "Still inhibits" }, createdAt: iso(16), updatedAt: iso(16) },
        { id: "demo-corr-eff-cort", pathway: "cortical", direction: "efferent", holding: true, details: { finding: "Psoas (R)", direction: "efferent", zone1: { category: "Cortical", name: "Pre-Frontal Cortex", side: "R" }, zone2: { category: "Subcortical", name: "Cerebellum", side: "" }, method: "Tap 3–5s", pathway: "Muscle → zone 1 → zone 2", retest: "Clears" }, createdAt: iso(15), updatedAt: iso(15) },
        { id: "demo-corr-eff-sub", pathway: "subcortical", direction: "efferent", holding: true, details: { finding: "Psoas (R)", direction: "efferent", zone1: { category: "Subcortical", name: "Cerebellum", side: "" }, zone2: { category: "Cortical", name: "Motor Cortex M1", side: "R" }, method: "Hold + intention", retest: "Clears", correctionTimerMinutes: 6, correctionTimerRemainingSeconds: 0, correctionTimerCompleted: true }, createdAt: iso(14), updatedAt: iso(14) },
        { id: "demo-corr-eff-emo", pathway: "emotional", direction: "efferent", holding: true, details: { finding: "Psoas (R)", direction: "efferent", emotion: "Fear", organ: "Kidney", method: "3 min", correctionTimerMinutes: 3, correctionTimerRemainingSeconds: 0, correctionTimerCompleted: true, retest: "Clears" }, createdAt: iso(13), updatedAt: iso(13) },
      ],
      "muscles:Glute Max (L)": [
        { id: "demo-corr-glute-nocio", pathway: "nociceptive", direction: "afferent", holding: true, note: "Cleared on retest", details: { finding: "Glute Max (L)", direction: "afferent", method: "Tap 3–5s", retest: "No longer inhibits" }, createdAt: iso(11), updatedAt: iso(11) }
      ],
      "cranialNerves:CN III: Oculomotor (R)": [
        { id: "demo-corr-cn3-mech", pathway: "mechanoreceptor", direction: "afferent", holding: true, details: { finding: "CN III: Oculomotor (R)", direction: "afferent", method: "Hold + intention", retest: "Clears" }, createdAt: iso(10), updatedAt: iso(10) }
      ],
      "brainZones:Cerebellum (R)": [
        { id: "demo-corr-cereb-sub", pathway: "subcortical", direction: "efferent", holding: false, details: { finding: "Cerebellum (R)", direction: "efferent", zone1: { category: "Subcortical", name: "Cerebellum", side: "R" }, zone2: { category: "Cortical", name: "Motor Cortex M1", side: "R" }, method: "TL + tuning fork", retest: "Still inhibits" }, createdAt: iso(9), updatedAt: iso(9) }
      ],
      "primitiveReflexes:Moro Reflex": [
        { id: "demo-corr-moro-cort", pathway: "cortical", direction: "efferent", holding: true, details: { finding: "Moro Reflex", direction: "efferent", zone1: { category: "Cortical", name: "Pre-Frontal Cortex", side: "R" }, zone2: { category: "Subcortical", name: "Cerebellum", side: "" }, method: "Tap 3–5s", retest: "Clears" }, createdAt: iso(12), updatedAt: iso(12) }
      ]
    },
  }),
  modes_balances: "Psoas (R) — GV16 hold + stretch + fork, re-test strong.\nGlute Max (L) — Neurolymphatic + spindle, re-test strong.\nFear Paralysis — ESR + temporal tap, re-test clear.",

  // Embed
  session_north_star: "Sleep through the night; wake rested.",
  next_session_note: "Re-check psoas and vagus; add Heart Wall if there is time.",
  homework_given: "Diaphragm breathing for five minutes before bed; daily walk.",

  clients: {
    id: "demo-client",
    user_id: "demo-user",
    name: "Demo Client",
    pronouns: "she/her",
    born: new Date(1988, 3, 12),
    suburbs: ["Brunswick"],
    email: "demo@example.com",
    phone: "0400 000 000",
    standard_rate: 120,
    is_practitioner: false,
    journal: "Responds well to short sessions; likes the why before the what.",
    medical_history: "No medications. Prior low-back episode in 2023.",
  },

  metadata: {
    sns_resets: {
      lymphatic: true,
      harmonic: true,
      t1: true,
      diaphragm: true,
      vagus: true,
    },
    priority_pathway: "Mechanoreceptor (Unconscious)",
    corrections: [
      { pathway: "Mechanoreceptor (Unconscious)", summary: "Psoas (R) — GV16 hold + stretch + fork, re-test strong.", timestamp: iso(18) },
      { pathway: "Mechanoreceptor (Unconscious)", summary: "Glute Max (L) — Neurolymphatic + spindle, re-test strong.", timestamp: iso(14) },
      { pathway: "Nociceptive (Physiological)", summary: "Fear Paralysis — ESR + temporal tap, re-test clear.", timestamp: iso(7) },
    ],
    cleared_findings: ["muscles-Glute Max (L)", "reflexes-Fear Paralysis Reflex"],
    protocol_logs: {
      mechanoreceptor: {
        steps: [1, 2, 3, 4, 5],
        values: {
          confirmation: "Afferent facilitates",
          region: "Right sacroiliac",
          ligament: "Long posterior sacroiliac",
          stretch: "Hip flexion + internal rotation",
          nociceptive: "Mechanical pressure on PSIS",
          physiological: "Spindle cell activation",
          corrected: true,
          retest: "Locks",
        },
        entries: [
          {
            id: "demo-entry-mechano-1",
            values: {
              confirmation: "Afferent facilitates",
              region: "Left ankle",
              ligament: "Anterior talofibular",
              stretch: "Plantarflexion + inversion",
              nociceptive: "Mechanical pressure on ATFL",
              physiological: "GTO activation",
              corrected: true,
              retest: "Locks",
            },
            steps: [1, 2, 3, 4, 5],
            savedAt: iso(23),
          },
          {
            id: "demo-entry-mechano-2",
            values: {
              confirmation: "Afferent facilitates",
              region: "Right sacroiliac",
              ligament: "Long posterior sacroiliac",
              stretch: "Hip flexion + internal rotation",
              nociceptive: "Mechanical pressure on PSIS",
              physiological: "Spindle cell activation",
              corrected: true,
              retest: "Locks",
            },
            steps: [1, 2, 3, 4, 5],
            savedAt: iso(16),
          },
          {
            id: "demo-entry-mechano-3",
            values: {
              confirmation: "Afferent facilitates",
              region: "Right shoulder",
              ligament: "Coracohumeral",
              stretch: "Extension + external rotation",
              nociceptive: "Mechanical pressure on CHL",
              physiological: "GTO activation",
              corrected: true,
              retest: "Locks",
            },
            steps: [1, 2, 3, 4, 5],
            savedAt: iso(11),
          },
        ],
        updatedAt: iso(8),
      },
      nociceptive: {
        steps: [1, 2, 3, 4, 5],
        values: {
          confirmation: "Pain referral pattern",
          region: "Frontal lobe",
          ligament: "N/A — cranial suture",
          stretch: "Temporal tap + ESR",
          nociceptive: "Emotional trigger: overwhelm",
          physiological: "Temporal suture release",
          corrected: true,
          retest: "Locks",
        },
        entries: [
          {
            id: "demo-entry-nocio-1",
            values: {
              confirmation: "Pain referral pattern",
              region: "Frontal lobe",
              ligament: "N/A — cranial suture",
              stretch: "Temporal tap + ESR",
              nociceptive: "Emotional trigger: overwhelm",
              physiological: "Temporal suture release",
              corrected: true,
              retest: "Locks",
            },
            steps: [1, 2, 3, 4, 5],
            savedAt: iso(7),
          },
        ],
        updatedAt: iso(7),
      },
    },
  },
});

/** Two prior sessions so the Preliminary recheck tab and history notes render. */
export const demoHistory = () =>
  [
    {
      id: "demo-prior-1",
      client_id: "demo-client",
      date: at(7),
      status: "Completed",
      goal: "Settle the 3am waking.",
      notes: "Cranial nerve work; slept through three nights.",
      priority_pattern: JSON.stringify({ muscles: { "Psoas (R)": "Inhibited" } }),
    },
    {
      id: "demo-prior-2",
      client_id: "demo-client",
      date: at(21),
      status: "Completed",
      goal: "First pass at sleep and low back.",
      notes: "Baseline only; BOLT 38.",
      priority_pattern: "{}",
    },
  ] as unknown as AppointmentWithClient[];