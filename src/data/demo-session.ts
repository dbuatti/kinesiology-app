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

/** Live session clock: started 62 minutes ago, so the timer reads mid-session
    instead of hours into overtime (the demo is a review surface, not a test
    of the overtime state). */
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
  vagus_nerve_notes: null,

  // Align / Correct
  priority_pattern: JSON.stringify({
    muscles: {
      "Psoas (R)": "Inhibited",
      "Diaphragm": "Inhibited",
      "Transverse abdominis (L)": "Inhibited",
    },
    primitiveReflexes: {
      "Fear Paralysis Reflex": "Inhibited",
      "Babinski": "Inhibited",
    },
    brainZones: {
      "Cerebellum (R)": "Inhibited",
    },
    priorities: {
      "muscles|Psoas (R)": "primary",
      "muscles|Glute Max (L)": "priority",
    },
  }),
  modes_balances: "Psoas (R) — GV16 hold + stretch + fork, re-test strong.",

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
      vagus: false,
    },
    priority_pathway: "Mechanoreceptor (Unconscious)",
    corrections: [
      {
        pathway: "Mechanoreceptor (Unconscious)",
        summary: "Psoas (R) — GV16 hold + stretch + fork, re-test strong.",
        timestamp: iso(18),
      },
    ],
    cleared_findings: ["muscles-Glute Max (L)"],
    protocol_logs: {
      mechanoreceptor: {
        steps: [1, 2, 3, 4],
        values: {
          confirmation: "Afferent facilitates",
          region: "Right sacroiliac",
          ligament: "Long posterior sacroiliac",
          stretch: "Hip flexion + internal rotation",
          corrected: true,
          retest: "Locks",
        },
        // One archived correction so the manual's "logged this session" and
        // the multi-entry list have something real to show.
        entries: [
          {
            id: "demo-entry-mechano-1",
            values: {
              confirmation: "Afferent facilitates",
              region: "Left ankle",
              ligament: "Anterior talofibular",
              stretch: "Plantarflexion + inversion",
              corrected: true,
              retest: "Locks",
            },
            steps: [1, 2, 3, 4, 5],
            savedAt: iso(23),
          },
        ],
        updatedAt: iso(14),
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
