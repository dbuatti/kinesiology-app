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
  videoUrl?: string;
  pageUrl?: string;
  delineationGuide?: string;
  isLateralized?: boolean;
  subStims?: string[]; // Added for worksheet tracking
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
    reflexPoint: "Yin Tang — between eyebrows",
    functions: ["Sense of smell (olfaction)", "Emotional memory recall"],
    stimulus: "Smell essential oil in nostril",
    clinicalPearl: "The only sense that bypasses the thalamus. Essential for deep emotional memory work.",
    color: "bg-purple-50",
    isLateralized: true,
    subStims: ["Left Nostril", "Right Nostril"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/d2a02ad26550033565f709c63fa2d85a18ff2c5d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167205372"
  },
  {
    id: 2,
    name: "CN II",
    latinName: "Optic",
    nuclei: "Cortex",
    toneEffect: "None",
    acupoint: "BL2",
    reflexPoint: "BL2 — inner end of eyebrow",
    functions: ["Vision and visual processing", "Spatial awareness"],
    stimulus: "Shine light into eye from quadrants",
    clinicalPearl: "Right eye projects to left occipital cortex. Use directional light to isolate specific visual field deficits.",
    color: "bg-purple-600",
    isLateralized: true,
    subStims: ["Superior", "Inferior", "Nasal", "Temporal"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/b874823f0dc614160512b66bcb5b516f50f9eb2d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779783"
  },
  {
    id: 3,
    name: "CN III",
    latinName: "Oculomotor",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch eye lids",
    functions: ["Eye movement: up, down, medial", "Pupil constriction"],
    stimulus: "Move eyes Up, Down, Medial",
    clinicalPearl: "Shares midbrain housing with CN IV. Midbrain nuclei control flexor tone.",
    color: "bg-amber-500",
    isLateralized: true,
    subStims: ["Up", "Down", "Medial", "Pupil"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779787"
  },
  {
    id: 4,
    name: "CN IV",
    latinName: "Trochlear",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch the eyes",
    functions: ["Downward and inward eye movement"],
    stimulus: "Move eyes towards tip of nose",
    clinicalPearl: "The only cranial nerve that exits dorsally from the brainstem.",
    color: "bg-amber-600",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779806"
  },
  {
    id: 5,
    name: "CN V",
    latinName: "Trigeminal",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand across the mandible",
    functions: ["Facial sensation", "Jaw movement"],
    stimulus: "Light touch to V1, V2, V3 branches",
    clinicalPearl: "The 'negative antidote' to the Vagus nerve. Heavily tied to the sympathetic nervous system.",
    color: "bg-indigo-500",
    isLateralized: true,
    subStims: ["V1 (Forehead)", "V2 (Cheek)", "V3 (Jaw)", "Motor (Bite)"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/10de3ccab10de3ccab1d8595c4c3e451aea5b91c84cf6213f.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780073"
  },
  {
    id: 6,
    name: "CN VI",
    latinName: "Abducens",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Lightly touch the eyes",
    functions: ["Lateral eye movement — abduction"],
    stimulus: "Move eyes laterally (look far L/R)",
    clinicalPearl: "Tests the lateral rectus muscle. Essential for horizontal scanning.",
    color: "bg-indigo-600",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780077"
  },
  {
    id: 7,
    name: "CN VII",
    latinName: "Facial",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand along temporal / TMJ area",
    functions: ["Facial expression (motor)", "Taste — anterior 2/3"],
    stimulus: "Squeeze eyes shut, facial expressions",
    clinicalPearl: "Test facial symmetry. High relationship to loud sounds and protective startle responses.",
    color: "bg-indigo-700",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e80792dddb73e4f494dd7f56a6cb1958e571e5ae.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780903"
  },
  {
    id: 8,
    name: "CN VIII",
    latinName: "Vestibulocochlear",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Fingertip at ear canal edge",
    functions: ["Hearing (Cochlear)", "Balance (Vestibular)"],
    stimulus: "Auditory click + Head movements",
    clinicalPearl: "Highly powerful nerve. Frequently involved in head injuries, anxiety, and gut dysfunction.",
    color: "bg-indigo-800",
    isLateralized: true,
    subStims: ["Cochlear (Snap)", "Vestibular (Head Move)"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/465c56ed15ec74012154656cd87ff84d9307a40c.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780911"
  },
  {
    id: 9,
    name: "CN IX",
    latinName: "Glossopharyngeal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    acupoint: "GB21",
    reflexPoint: "GB21 — top of shoulder",
    functions: ["Taste — posterior 1/3", "Swallowing", "Carotid body monitoring"],
    stimulus: "Humming",
    clinicalPearl: "Always assess CN IX and X together. GB12 is the primary medulla stim point.",
    color: "bg-rose-50",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/c951c07cedadced7e1d2291c60a8dc22d90ac90a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780916"
  },
  {
    id: 10,
    name: "CN X",
    latinName: "Vagus",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Hand along Occiput-Atlas joint",
    functions: ["Autonomic control", "Swallowing, voice"],
    stimulus: "Humming, swallowing, 'Aaah'",
    clinicalPearl: "The 'King' of the parasympathetic nervous system. Arises from the medulla.",
    color: "bg-rose-600",
    isLateralized: true,
    subStims: ["Humming", "Swallowing", "Say 'Aaah'"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/347fefe7d351b6760c82e9cc68a47d37b0d53906.mp4",
    pageUrl: "https://functional-neuro-health.notion.site/Functional-Neuro-Health-The-PEACE-Method-28beacafb4a88026b9a9ccdefa4e1de9"
  },
  {
    id: 11,
    name: "CN XI",
    latinName: "Accessory",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Bilateral Posterior Ramus of Jaw",
    functions: ["Motor to SCM and upper trapezius"],
    stimulus: "Shoulder shrug + Head rotation",
    clinicalPearl: "Key player in head, neck, shoulder, and visual issues.",
    color: "bg-rose-700",
    isLateralized: true,
    subStims: ["Trapezius (Shrug)", "SCM (Rotate)"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  {
    id: 12,
    name: "CN XII",
    latinName: "Hypoglossal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Sulcus under chin",
    functions: ["Tongue movement", "Midline stability"],
    stimulus: "Tongue movement (L/R/U/D)",
    clinicalPearl: "The tongue is a vital component of the MLF balance system.",
    color: "bg-rose-800",
    isLateralized: true,
    subStims: ["Left", "Right", "Up", "Down"],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/c951c07cedadced7e1d2291c60a8dc22d90ac90a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780916"
  }
];