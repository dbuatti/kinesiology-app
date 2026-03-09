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
}

export const CRANIAL_NERVES: CranialNerve[] = [
  {
    id: 1,
    name: "CN I",
    latinName: "Olfactory",
    nuclei: "Cortex",
    toneEffect: "None",
    reflexPoint: "Yin Tang (Third Eye / between eyebrows)",
    functions: ["Smell", "Limbic integration"],
    stimulus: "1. Test Yin Tang reflex point. 2. If inhibited, use an essential oil to isolate side. Block one nostril and sniff; identify which side affects the IM.",
    clinicalPearl: "The only sense that bypasses the thalamus. Only proceed to essential oil testing if the Yin Tang reflex point indicates a priority first.",
    color: "bg-purple-500"
  },
  {
    id: 2,
    name: "CN II",
    latinName: "Optic",
    nuclei: "Cortex",
    toneEffect: "None",
    reflexPoint: "Bladder 2 (inner edge of the eyebrow)",
    functions: ["Vision", "Light reflex"],
    stimulus: "1. Test reflex point at the inner edge of the eyebrow. 2. If inhibited, shine a light into the eye from multiple directions: straight on, superior, inferior, medial, and lateral to identify the priority angle.",
    clinicalPearl: "Only proceed to light testing if the reflex point indicates a priority. This nerve arises from the occipital lobe in the cortex.",
    color: "bg-purple-600"
  },
  {
    id: 3,
    name: "CN III",
    latinName: "Oculomotor",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Light touch to eyelids",
    functions: ["Most eye movements", "Pupil constriction"],
    stimulus: "Move eyes up, down, and medially (except lateral/nose-tip).",
    clinicalPearl: "Midbrain nuclei control flexor tone. Eye movement issues here often correlate with systemic flexor dominance.",
    color: "bg-amber-500"
  },
  {
    id: 4,
    name: "CN IV",
    latinName: "Trochlear",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Light touch to eyes",
    functions: ["Downward and inward eye movement"],
    stimulus: "Move eyes towards the tip of the nose.",
    clinicalPearl: "Specific for superior oblique muscle control.",
    color: "bg-amber-600"
  },
  {
    id: 5,
    name: "CN V",
    latinName: "Trigeminal",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand across mandible (cheek)",
    functions: ["Face sensation", "Chewing (mastication)"],
    stimulus: "Light touch to face or soft sound stimulus.",
    clinicalPearl: "Pons nuclei control extensor tone. Clearing CN V can help reset systemic extensor inhibition.",
    color: "bg-indigo-500"
  },
  {
    id: 6,
    name: "CN VI",
    latinName: "Abducens",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Light touch to eyes",
    functions: ["Lateral eye movement"],
    stimulus: "Move eyes laterally (away from the nose).",
    clinicalPearl: "Controls the lateral rectus muscle.",
    color: "bg-indigo-600"
  },
  {
    id: 7,
    name: "CN VII",
    latinName: "Facial",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand along temporal / TMJ area",
    functions: ["Facial expression", "Taste (anterior tongue)"],
    stimulus: "Squeeze eyes shut or make exaggerated facial expressions.",
    clinicalPearl: "Essential for social engagement and emotional expression.",
    color: "bg-indigo-700"
  },
  {
    id: 8,
    name: "CN VIII",
    latinName: "Vestibulocochlear",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Finger in ear canal",
    functions: ["Hearing", "Balance"],
    stimulus: "Click fingers near ear or move head in various planes.",
    clinicalPearl: "Located at the ponto-medullary junction. Primary focus for dizziness and vertigo.",
    color: "bg-indigo-800"
  },
  {
    id: 9,
    name: "CN IX",
    latinName: "Glossopharyngeal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "GB21 (top of shoulder)",
    functions: ["Swallowing", "Taste (posterior tongue)"],
    stimulus: "Perform a swallow or hum.",
    clinicalPearl: "Medulla nuclei control flexor tone. Works closely with the Vagus nerve.",
    color: "bg-rose-500"
  },
  {
    id: 10,
    name: "CN X",
    latinName: "Vagus",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Occiput-Atlas joint",
    functions: ["Autonomic control", "Heart rate", "Digestion"],
    stimulus: "Swallowing, humming, or 'Aaah' sound.",
    clinicalPearl: "The 'King' of the parasympathetic nervous system. Essential for complex autoimmune cases.",
    color: "bg-rose-600"
  },
  {
    id: 11,
    name: "CN XI",
    latinName: "Accessory",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Posterior ramus of jaw",
    functions: ["SCM and Trapezius control"],
    stimulus: "Shrug shoulders or rotate head against resistance.",
    clinicalPearl: "Unique as it has both cranial and spinal roots.",
    color: "bg-rose-700"
  },
  {
    id: 12,
    name: "CN XII",
    latinName: "Hypoglossal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Sulcus under chin",
    functions: ["Tongue movement"],
    stimulus: "Move tongue in various directions.",
    clinicalPearl: "Nuclei located deep in the medulla.",
    color: "bg-rose-800"
  }
];