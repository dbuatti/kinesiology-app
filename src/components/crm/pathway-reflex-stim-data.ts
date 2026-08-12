import { CRANIAL_NERVES, CranialNerve } from "@/data/cranial-nerve-data";

export interface PrimitiveGridReflex {
  id: string;
  short: string;
  name: string;
  stimulus: string;
  inhibition: string;
  lateralized?: boolean;
  stims?: string[];
}

export interface PrimitiveTrack {
  title: string;
  color: string;
  reflexes: PrimitiveGridReflex[];
}

export const PRIMITIVE_TRACKS: PrimitiveTrack[] = [
  {
    title: "Track 1 — Sagittal / Brainstem",
    color: "bg-chart-primary",
    reflexes: [
      {
        id: "fear-paralysis",
        short: "FPR",
        name: "Fear Paralysis Reflex",
        stimulus: "Any unexpected stimulus (sound, motion, tap etc.)",
        inhibition: "Global inhibition — multiple muscles shut down simultaneously",
      },
      {
        id: "moro",
        short: "Moro",
        name: "Moro Reflex",
        stimulus: "Gently but suddenly lower the head",
        inhibition: "Pecs + neck extensors inhibit — arms fly out from midline",
      },
      {
        id: "startle",
        short: "Startle",
        name: "Startle Reflex",
        stimulus: "Gently but suddenly lower the head",
        inhibition: "Shoulder extensors inhibit — arms flex in towards midline (reverse of Moro)",
      },
      {
        id: "tlr",
        short: "TLR",
        name: "Tonic Labyrinthine Reflex",
        stimulus: "Supine: patient actively flexes OR extends BOTH head + lumbar simultaneously",
        stims: [
          "Flexion — actively flex head + lumbar simultaneously",
          "Extension — actively extend head + lumbar simultaneously",
        ],
        inhibition:
          "Flexion → all extensors inhibit (erectors, glutes, hamstrings, triceps). Extension → all flexors inhibit (hip flexors, biceps, abs)",
      },
      {
        id: "stnr",
        short: "STNR",
        name: "Symmetric Tonic Neck Reflex",
        stimulus: "Seated: tip neck into flexion, then extension",
        stims: [
          "Flexion — tip neck into flexion",
          "Extension — tip neck into extension",
        ],
        inhibition:
          "Neck flexion → neck extensors + triceps + hamstrings inhibit. Neck extension → neck flexors + biceps + glutes inhibit",
      },
    ],
  },
  {
    title: "Track 2 — Unilateral / Gait-Based",
    color: "bg-chart-destructive",
    reflexes: [
      {
        id: "atnr",
        short: "ATNR",
        name: "Asymmetric Tonic Neck Reflex",
        stimulus: "Turn head + eyes to one side with slight neck extension (supine, seated or standing)",
        inhibition: "Ipsilateral anterior deltoid + quads inhibit; contralateral arm + glute max inhibit",
        lateralized: true,
      },
      {
        id: "spinal-galant",
        short: "Galant",
        name: "Spinal Galant Reflex",
        stimulus: "Stroke one side of spine from inferior scapula angle to sacrum",
        inhibition: "Ipsilateral hip curves up/out; ipsilateral glutes + contralateral oblique + QL inhibit",
        lateralized: true,
      },
      {
        id: "rooting",
        short: "Rooting",
        name: "Rooting Reflex",
        stimulus: "Stroke the side of the cheek",
        inhibition: "Head turns toward stimulus; ipsilateral SCM inhibits",
        lateralized: true,
      },
      {
        id: "palmar",
        short: "Palmar",
        name: "Palmar Grasp Reflex",
        stimulus: "Stroke the palm of the hand",
        inhibition: "Finger extensors inhibit",
        lateralized: true,
      },
      {
        id: "babinski",
        short: "Babinski",
        name: "Babinski Reflex",
        stimulus: "Stroke from lateral heel upward and across toward ball of foot",
        inhibition: "Normal (−): toe flexors inhibit, toes fan up. Positive in adults = CST dysfunction",
        lateralized: true,
      },
    ],
  },
  {
    title: "Track 3 — Tendon Guard — Global Lockout",
    color: "bg-chart-emerald",
    reflexes: [
      {
        id: "tendon-guard",
        short: "TGR",
        name: "Tendon Guard Reflex",
        stimulus: "Stroke from ball of foot (1st MTP) toward heel (opposite to Babinski)",
        inhibition: "Plantarflexion goes hypertonic; Psoas + SCM inhibit. Global co-contraction pattern",
        lateralized: true,
      },
    ],
  },
];

export const NUCLEI_COLORS: Record<string, string> = {
  Cortex: "bg-chart-primary",
  Midbrain: "bg-chart-emerald",
  Pons: "bg-chart-destructive",
  Medulla: "bg-black",
};

export const MULTI_STIMS: Record<number, string[]> = {
  1: ["Smell an essential oil in the nostril."],
  2: [
    "Shine light into the eye — direct",
    "From above",
    "From below",
    "From the lateral side",
    "From the medial side",
  ],
  3: [
    "Move eyes up",
    "Move eyes down",
    "Move eyes towards bridge of nose (medial)",
    "Move eyes up and left",
    "Move eyes down and left",
    "Open eyelid slowly",
  ],
  4: [
    "Eye towards tip of nose",
  ],
  6: [
    "Look as far left as possible",
    "Look as far right as possible",
  ],
  5: [
    "V1 — Ophthalmic: light touch to forehead / supraorbital",
    "V2 — Maxillary: light touch to cheek, lower eyelid, upper lip",
    "V3 — Mandibular: light touch to jaw, lower lip, chin",
    "Motor: jaw clenching (masseter) + lateral jaw movement (pterygoids)",
    "Tensor Tympani: very light sound (soft click / gentle tone)",
  ],
  7: [
    "Squeeze eye shut",
    "Produce different facial expressions",
    "Loud sound stimulus (stapedius branch)",
  ],
  8: [
    "Cochlear: click fingers next to the ear",
    "Vestibular: rotate head left",
    "Vestibular: rotate head right",
    "Vestibular: tilt head left",
    "Vestibular: tilt head right",
    "Vestibular: move head up",
    "Vestibular: move head down",
  ],
  9: ["Humming", "Swallowing"],
  10: [
    "Humming",
    "Swallowing",
    "'Aaah' vocalisation",
    "Clean roof of mouth with tongue",
    "Slow heart-rate breathing (extended exhale)",
    "Cymba Concha auricular point to lateralise (right = right vagus, left = left vagus)",
  ],
  11: ["Ipsilateral SCM contraction", "Contralateral upper trapezius contraction"],
  12: [
    "Move tongue forwards",
    "Move tongue right",
    "Move tongue left",
    "Move tongue up",
    "Move tongue in any other direction",
  ],
};

export const nerveStimLines = (nerve: CranialNerve): string[] =>
  MULTI_STIMS[nerve.id] ?? [nerve.stimulus];

export const LATERAL_STIMS: Record<number, number[]> = {
  1: [0],
  2: [0, 1, 2, 3, 4],
  3: [0, 1, 2, 3, 4, 5],
  4: [0],
  5: [0, 1, 2, 4],
  6: [0, 1],
  7: [0, 1, 2],
  8: [0, 1, 2, 3, 4, 5, 6],
  10: [5],
  11: [0, 1],
};

export const isLateralStim = (nerveId: number, index: number): boolean =>
  (LATERAL_STIMS[nerveId] ?? []).includes(index);

export const NERVE_GROUPS: { label: string; items: CranialNerve[] }[] = (
  ["Cortex", "Midbrain", "Pons", "Medulla"] as const
).map((label) => ({
  label,
  items: CRANIAL_NERVES.filter((n) => n.nuclei === label),
}));

export const nerveGroupRowSpan = (items: CranialNerve[]) =>
  items.reduce((acc, n) => acc + nerveStimLines(n).length, 0);

export const primitiveStimKey = (reflex: PrimitiveGridReflex): string =>
  `prim-${reflex.short}`;

export const primitiveSideKey = (reflex: PrimitiveGridReflex, side: "L" | "R"): string =>
  `prim-${reflex.short}-${side}`;

export const primitiveStimCount = (reflex: PrimitiveGridReflex): number =>
  reflex.stims?.length ?? 1;

export const primitiveStimKeyAt = (reflex: PrimitiveGridReflex, index: number): string =>
  `prim-${reflex.short}-${index}`;

export const cranialStimKey = (nerveId: number, index: number): string =>
  `cn-${nerveId}-${index}`;

export const cranialSideKey = (nerveId: number, index: number, side: "L" | "R"): string =>
  `cn-${nerveId}-${index}-${side}`;

export const cranialNerveInhibKey = (nerveId: number, side?: "L" | "R"): string =>
  side ? `cn-${nerveId}-INHIB-${side}` : `cn-${nerveId}-INHIB`;

export const primitiveReflexMatches = (reflex: PrimitiveGridReflex, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return [reflex.short, reflex.name, reflex.stimulus, reflex.inhibition].some((t) =>
    t.toLowerCase().includes(q)
  );
};

export const cranialLineMatches = (nerve: CranialNerve, line: string, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return [nerve.name, nerve.latinName, line].some((t) => t.toLowerCase().includes(q));
};

export interface MarkedStim {
  label: string;
  side?: "L" | "R";
}

export const findGridReflex = (id: string, name?: string): PrimitiveGridReflex | undefined =>
  PRIMITIVE_TRACKS.flatMap((t) => t.reflexes).find(
    (r) => r.id === id || (name && r.name === name)
  );

export const describePrimitiveStims = (
  reflexId: string,
  reflexName: string,
  stimResults: Record<string, boolean> | undefined | null
): MarkedStim[] => {
  if (!stimResults) return [];
  const reflex = findGridReflex(reflexId, reflexName);
  if (!reflex) return [];
  const entries: MarkedStim[] = [];
  if (reflex.lateralized) {
    (["L", "R"] as const).forEach((side) => {
      const key = primitiveSideKey(reflex, side);
      if (stimResults[key]) entries.push({ label: reflex.stimulus, side });
    });
  } else if (reflex.stims?.length) {
    reflex.stims.forEach((label, i) => {
      const key = primitiveStimKeyAt(reflex, i);
      if (stimResults[key]) entries.push({ label });
    });
  } else {
    const key = primitiveStimKey(reflex);
    if (stimResults[key]) entries.push({ label: reflex.stimulus });
  }
  return entries;
};

export const describeNerveStims = (
  nerve: CranialNerve,
  stimResults: Record<string, boolean> | undefined | null
): MarkedStim[] => {
  if (!stimResults) return [];
  const entries: MarkedStim[] = [];
  nerveStimLines(nerve).forEach((line, i) => {
    if (isLateralStim(nerve.id, i)) {
      (["L", "R"] as const).forEach((side) => {
        const key = cranialSideKey(nerve.id, i, side);
        if (stimResults[key]) entries.push({ label: line, side });
      });
    } else {
      const key = cranialStimKey(nerve.id, i);
      if (stimResults[key]) entries.push({ label: line });
    }
  });
  return entries;
};
