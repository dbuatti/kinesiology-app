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
    stimulus: "Hold Yin Tang as the reflex point. Stimulus: smell an essential oil in the nostril.",
    clinicalPearl: "The only sense that bypasses the thalamus. Essential for deep emotional memory work.",
    color: "bg-purple-50",
    isLateralized: true,
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
    reflexPoint: "Bladder 2 (BL2) acupoint — inner end of eyebrow",
    functions: ["Vision and visual processing", "Depth perception and spatial awareness"],
    stimulus: "Hold BL2 as the reflex point. Stimulus: shine light into the eye from specific quadrants (Superior, Inferior, Nasal, Temporal) to isolate visual field deficits.",
    clinicalPearl: "Right eye projects to left occipital cortex. Use directional light to isolate specific visual field deficits. Nasal field of one eye and temporal of the other map to the same hemisphere.",
    color: "bg-purple-600",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/b874823f0dc614160512b66bcb5b516f50f9eb2d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167779783"
  },
  {
    id: 3,
    name: "CN III",
    latinName: "Oculomotor",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Lightly touch the eye lids",
    functions: ["Eye movement: up, down, and medial gaze", "Pupil constriction"],
    stimulus: "Lightly touch the eye lids. Stimulus: move eyes up, down, medial.",
    clinicalPearl: "Shares midbrain housing with CN IV. Midbrain nuclei control flexor tone.",
    color: "bg-amber-500",
    isLateralized: true,
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
    functions: ["Downward and inward eye movement", "Stabilises eye during head tilt"],
    stimulus: "Lightly touch the eyes. Stimulus: move eyes towards the tip of the nose.",
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
    reflexPoint: "Hand across the mandible (cheek)",
    functions: ["Facial sensation", "Jaw movement and mastication"],
    stimulus: "Place hand across the mandible. Stimulate three sensory branches: V1 (Forehead/Eyes), V2 (Cheeks/Upper Lip), and V3 (Jaw/Lower Lip) using light touch or brushing.",
    clinicalPearl: "The 'negative antidote' to the Vagus nerve. Heavily tied to the sympathetic nervous system.",
    color: "bg-indigo-500",
    isLateralized: true,
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
    stimulus: "Lightly touch the eyes. Stimulus: move eyes laterally (look far left/right).",
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
    reflexPoint: "Hand along the temporal / TMJ area",
    functions: ["Facial expression (motor)", "Taste — anterior 2/3 of tongue"],
    stimulus: "Place hand along temporal area. Stimulus: squeeze eye shut, facial expressions.",
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
    reflexPoint: "Fingertip at the edge of the ear canal (do not insert fully)",
    functions: ["Hearing (Cochlear)", "Balance and spatial orientation (Vestibular)"],
    stimulus: "Delineate: 1. Cochlear (Auditory click/snap). 2. Vestibular (Head movements: Up, Down, Rotate L/R, Tilt L/R).",
    delineationGuide: "1. Hold reflex point (fingertip at ear edge). 2. Test Cochlear: Perform an auditory click/snap near the ear. 3. Test Vestibular: Move head into 6 positions (Up, Down, Rotate L/R, Tilt L/R). Multiple positions may be active.",
    clinicalPearl: "Arises from the pontomedullary area (Pons/Medulla). Highly powerful nerve. Frequently involved in head injuries, anxiety, and gut dysfunction. Always delineate between auditory and balance portions.",
    color: "bg-indigo-800",
    isLateralized: true,
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
    reflexPoint: "GB21 acupoint — top of shoulder, midpoint between neck and shoulder tip",
    functions: [
      "Taste — posterior 1/3 of tongue", 
      "Swallowing — pharyngeal phase (nucleus ambiguus)",
      "Carotid body/sinus monitoring (blood pressure and O2 levels)",
      "Parotid gland salivation"
    ],
    stimulus: "Hold GB21 (top of shoulder, midpoint between neck and shoulder tip) as the reflex point. Stimulus: humming. Test indicator muscle before and after humming to assess CN IX function.",
    clinicalPearl: "CN IX and CN X share medullary nuclei (nucleus ambiguus and nucleus solitarius). GB12 is the primary medulla stim point for the CN IX–XII group. Carotid sinus hypersensitivity (CN IX) can present as unexplained syncope or dizziness with neck pressure. Always assess CN IX and X together.",
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
    reflexPoint: "Hand along the Occiput-Atlas joint",
    functions: ["Autonomic control (heart, lungs, gut)", "Swallowing, voice"],
    stimulus: "Place hand along Occiput-Atlas. Stimulus: humming, swallowing, 'Aaah'.",
    clinicalPearl: "The 'King' of the parasympathetic nervous system. Arises from the medulla.",
    color: "bg-rose-600",
    isLateralized: true,
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
    stimulus: "Hold posterior ramus of jaw. Stimulus: shoulder shrug (Upper Trapezius) + head rotation (SCM).",
    delineationGuide: "To delineate: 1. Hold reflex point (jaw). 2. Test shoulder shrug only (Trapezius) -> if IM inhibits, it's a Trapezius priority. 3. Test head rotation only (SCM) -> if IM inhibits, it's an SCM priority.",
    clinicalPearl: "Key player in head, neck, shoulder, and visual issues. Often involved in 'carrying the weight of the world' stress patterns.",
    color: "bg-rose-700",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
  {
    id: 12,
    name: "CN XII",
    latinName: "Hypoglossal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Sulcus under chin — anterior mandible",
    functions: ["Primary control of tongue movement", "Midline stability", "Part of the Medial Longitudinal Fasciculus (MLF) balance system"],
    stimulus: "Hold sulcus under chin. Stimulus: push tongue straight out, then move it to the right, left, up, and down to identify the specific dysfunctional direction.",
    clinicalPearl: "The tongue is a vital component of the Medial Longitudinal Fasciculus (MLF) alongside the eyes, jaw, and inner ear. It is essential for balance and midline stability. Dysfunction here strongly points to Medullary involvement.",
    color: "bg-rose-800",
    isLateralized: true,
    videoUrl: "https://embed-ssl.wistia.com/deliveries/c951c07cedadced7e1d2291c60a8dc22d90ac90a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167780916"
  }
];