"use client";

export type BrainstemNuclei = 'Cortex' | 'Midbrain' | 'Pons' | 'Medulla';
export type MotorToneEffect = 'Flexors' | 'Extensors' | 'None';

export interface CranialNerve {
  id: number;
  name: string;
  latinName: string;
  nuclei: BrainstemNuclei;
  toneEffect: MotorToneEffect;
  reflexPoint: string;
  functions: string[];
  stimulus: string;
  clinicalPearl: string;
  color: string;
  acupoint?: string;
}

export const BRAINSTEM_KEYS: Record<BrainstemNuclei, { description: string; stim: string }> = {
  'Cortex': {
    description: "Project to cortex (olfactory & visual). Not housed in brainstem.",
    stim: "Direct sensory input (Smell/Light)"
  },
  'Midbrain': {
    description: "Eye movement nuclei. Controls flexor tone.",
    stim: "GV26 + Clavicle + Ear Cupping"
  },
  'Pons': {
    description: "Facial sensation, eye movement, facial motor, hearing/balance. Controls extensor tone.",
    stim: "GV17 (EOP)"
  },
  'Medulla': {
    description: "Swallowing, Vagus, Accessory, Tongue. Controls flexor tone.",
    stim: "GB12"
  }
};

export const CRANIAL_NERVES: CranialNerve[] = [
  {
    id: 1,
    name: "CN I",
    latinName: "Olfactory",
    nuclei: "Cortex",
    toneEffect: "None",
    acupoint: "Yin Tang",
    reflexPoint: "Yin Tang acupoint — between and just above the eyebrows",
    functions: ["Sense of smell (olfaction)", "Olfactory memory and emotional memory recall"],
    stimulus: "Hold Yin Tang as the reflex point. Stimulus: smell an essential oil in the nostril. CN I bypasses the thalamus entirely and projects directly to the olfactory cortex and limbic system.",
    clinicalPearl: "The only sense that bypasses the thalamus. Essential for deep emotional memory work.",
    color: "bg-purple-500"
  },
  {
    id: 2,
    name: "CN II",
    latinName: "Optic",
    nuclei: "Cortex",
    toneEffect: "None",
    acupoint: "BL2",
    reflexPoint: "Bladder 2 (BL2) acupoint — inner end of eyebrow, above inner canthus",
    functions: ["Vision and visual processing", "Depth perception and spatial awareness"],
    stimulus: "Hold BL2 as the reflex point. Stimulus: shine light into the eye in any possible direction — direct, from above, from below, from the sides. Input crosses over at the optic chiasm.",
    clinicalPearl: "Right eye projects to left occipital cortex. Use directional light to isolate specific visual field deficits.",
    color: "bg-purple-600"
  },
  {
    id: 3,
    name: "CN III",
    latinName: "Oculomotor",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch the eye lids",
    functions: ["Eye movement: up, down, and medial gaze", "Pupil constriction (parasympathetic)"],
    stimulus: "Lightly touch the eye lids as the reflex point. Stimulus: move eyes up, down, medial towards bridge of nose, up and left, down and left, open eyelid slowly.",
    clinicalPearl: "Shares midbrain housing with CN IV. Midbrain nuclei control flexor tone.",
    color: "bg-amber-500"
  },
  {
    id: 4,
    name: "CN IV",
    latinName: "Trochlear",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch the eyes",
    functions: ["Downward and inward eye movement (superior oblique)", "Stabilises eye during head tilt"],
    stimulus: "Lightly touch the eyes as the reflex point. Stimulus: move eyes towards the tip of the nose (downward and inward convergence).",
    clinicalPearl: "The only cranial nerve that exits dorsally from the brainstem. Critical for reading and downward gaze.",
    color: "bg-amber-600"
  },
  {
    id: 5,
    name: "CN V",
    latinName: "Trigeminal",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand across the mandible (cheek)",
    functions: ["Facial sensation (V1, V2, V3)", "Jaw movement and mastication (motor)"],
    stimulus: "Place hand across the mandible (cheek) as the reflex point. Stimulate three sensory branches: V1 ophthalmic (forehead), V2 maxillary (cheek), V3 mandibular (jaw).",
    clinicalPearl: "The 'negative antidote' to the Vagus nerve. Heavily tied to the sympathetic nervous system and systemic pain neurology.",
    color: "bg-indigo-500"
  },
  {
    id: 6,
    name: "CN VI",
    latinName: "Abducens",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Lightly touch the eyes",
    functions: ["Lateral eye movement — abduction", "Coordinates with CN III for conjugate gaze"],
    stimulus: "Lightly touch the eyes as the reflex point. Stimulus: move eyes laterally — look as far left as possible, then as far right as possible.",
    clinicalPearl: "Tests the lateral rectus muscle. Essential for horizontal scanning and peripheral awareness.",
    color: "bg-indigo-600"
  },
  {
    id: 7,
    name: "CN VII",
    latinName: "Facial",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand along the temporal / TMJ area",
    functions: ["Facial expression (motor)", "Taste — anterior 2/3 of tongue"],
    stimulus: "Place hand along the temporal/TMJ area as the reflex point. Stimulus: squeeze eye shut, produce different facial expressions, loud sound stimulus (stapedius branch).",
    clinicalPearl: "Test facial symmetry and expression quality. High relationship to loud sounds and protective startle responses.",
    color: "bg-indigo-700"
  },
  {
    id: 8,
    name: "CN VIII",
    latinName: "Vestibulocochlear",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Finger in the ear canal",
    functions: ["Hearing — cochlear division", "Balance and spatial orientation — vestibular division"],
    stimulus: "Place finger in the ear canal as the reflex point. Delineate: Cochlear (click fingers near ear) vs. Vestibular (Head Up, Down, Rotate L/R, Tilt L/R).",
    clinicalPearl: "A highly powerful nerve frequently involved in head injuries, anxiety, and gut dysfunction.",
    color: "bg-indigo-800"
  },
  {
    id: 9,
    name: "CN IX",
    latinName: "Glossopharyngeal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    acupoint: "GB21",
    reflexPoint: "GB21 acupoint — top of shoulder, midpoint between neck and shoulder tip",
    functions: ["Taste — posterior 1/3 of tongue", "Swallowing — pharyngeal phase"],
    stimulus: "Hold GB21 as the reflex point. Stimulus: humming. Test indicator muscle before and after humming to assess function.",
    clinicalPearl: "Works in a tight neurological cluster with CN 10 and CN 11; dysfunction in one often crosses over.",
    color: "bg-rose-500"
  },
  {
    id: 10,
    name: "CN X",
    latinName: "Vagus",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Hand along the Occiput-Atlas joint (base of skull / C1 junction)",
    functions: ["Autonomic control (heart, lungs, gut)", "Swallowing, voice, and gag reflex"],
    stimulus: "Place hand along the Occiput-Atlas joint as the reflex point. Stimulus: Cymba Conchae (ear bowl), humming, swallowing, 'Aaah', tongue to roof of mouth, slow breathing.",
    clinicalPearl: "The 'King' of the parasympathetic nervous system. Arises from the medulla. Often addressed in initial SNS reset protocols.",
    color: "bg-rose-600"
  },
  {
    id: 11,
    name: "CN XI",
    latinName: "Accessory",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Bilateral Posterior Ramus of Jaw (both sides simultaneously)",
    functions: ["Motor to SCM — head rotation", "Motor to upper trapezius — shoulder elevation"],
    stimulus: "Hold the bilateral posterior ramus of the jaw as the reflex point. Stimulus: ipsilateral SCM contraction + contralateral upper trapezius contraction.",
    clinicalPearl: "Key player in head, neck, shoulder, visual, and even pelvic issues. Dual innervation with C2/C3.",
    color: "bg-rose-700"
  },
  {
    id: 12,
    name: "CN XII",
    latinName: "Hypoglossal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Sulcus under chin — anterior mandible (groove between chin and lower lip)",
    functions: ["Tongue movement — all intrinsic muscles", "Speech articulation"],
    stimulus: "Hold the sulcus under the chin as the reflex point. Stimulus: tongue movement — forwards, right, left, up, and any other direction.",
    clinicalPearl: "Vital for midline stability. Deviation on protrusion indicates weakness in the contralateral medulla.",
    color: "bg-rose-800"
  }
];