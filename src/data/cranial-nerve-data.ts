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
    stimulus: "Move eye into the midline (bridge of nose), look up, or look down.",
    clinicalPearl: "Midbrain nuclei control flexor tone. Eye movement issues here often correlate with systemic flexor dominance. Shares a reflex point with CN 4 and 6.",
    color: "bg-amber-500"
  },
  {
    id: 4,
    name: "CN IV",
    latinName: "Trochlear",
    nuclei: "Midbrain",
    toneEffect: "Flexors",
    reflexPoint: "Light touch to eyelids",
    functions: ["Downward and inward eye movement"],
    stimulus: "Look at the tip of the nose.",
    clinicalPearl: "Specific for superior oblique muscle control. Shares a reflex point with CN 3 and 6.",
    color: "bg-amber-600"
  },
  {
    id: 5,
    name: "CN V",
    latinName: "Trigeminal",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Hand along the jawline (bilateral)",
    functions: ["Face sensation (3 divisions)", "Chewing", "Soft sound (Tensor Tympani)"],
    stimulus: "1. Rub through sensory divisions: Ophthalmic (forehead), Maxillary (cheek), Mandibular (jaw). 2. Soft sound stimulus.",
    clinicalPearl: "The 'negative antidote' to the Vagus nerve. Heavily tied to the sympathetic nervous system and systemic pain neurology. Flaring often leads to increased head and body pain.",
    color: "bg-indigo-500"
  },
  {
    id: 6,
    name: "CN VI",
    latinName: "Abducens",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Light touch to eyelids",
    functions: ["Lateral eye movement"],
    stimulus: "Look laterally (away from the nose) with the eye corresponding to the eyelid reflex.",
    clinicalPearl: "Shares a reflex point (eyelids) with CN 3 and 4. If the eyelid reflex indicates, isolate CN 6 by testing lateral eye movement. Unlike CN 3 and 4 (Midbrain), the Abducens nuclei are located in the Pons.",
    color: "bg-indigo-600"
  },
  {
    id: 7,
    name: "CN VII",
    latinName: "Facial",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Temporal line / Sphenoid area",
    functions: ["Facial expression", "Taste (anterior tongue)", "Motor response to sound"],
    stimulus: "1. Squeeze eye shut on the side of the reflex. 2. Loud sound challenge (observe for facial contortion/startle).",
    clinicalPearl: "Motor control of the face. High relationship to loud sounds; a contorted face is a protective reflex. Stress often leads to low facial nerve tone. Relevant for Bell's Palsy cases. Differentiate from Trigeminal (sensory) and Startle reflex.",
    color: "bg-indigo-700"
  },
  {
    id: 8,
    name: "CN VIII",
    latinName: "Vestibulocochlear",
    nuclei: "Pons",
    toneEffect: "Extensors",
    reflexPoint: "Edge of the ear canal (light touch)",
    functions: ["Hearing (Cochlear)", "Balance/Head Position (Vestibular)"],
    stimulus: "1. Test reflex point at edge of ear canal. 2. If inhibited, delineate: Cochlear (click fingers near ear) vs. Vestibular (Head Up, Down, Rotate L/R, Tilt L/R).",
    clinicalPearl: "Arises from the pontomedullary junction. A highly powerful nerve frequently involved in head injuries, anxiety, and gut dysfunction. It is common for multiple head positions to show up during the vestibular assessment.",
    color: "bg-indigo-800"
  },
  {
    id: 9,
    name: "CN IX",
    latinName: "Glossopharyngeal",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Middle of the tongue (client's thumb/finger)",
    functions: ["Swallowing", "Taste (posterior tongue)"],
    stimulus: "Perform a swallow or hum.",
    clinicalPearl: "The first cranial nerve directly related to the Medulla. Works in a tight neurological cluster with CN 10 (Vagus) and CN 11 (Accessory); dysfunction in one often crosses over to the others.",
    color: "bg-rose-500"
  },
  {
    id: 10,
    name: "CN X",
    latinName: "Vagus",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "Occiput (Vagal reflex)",
    functions: ["Autonomic control", "Heart rate", "Digestion", "Ventral/Dorsal Vagal states"],
    stimulus: "1. Test Vagal reflex point at the occiput. 2. If inhibited, touch skin at occiput to lateralize (L/R). 3. Perform swallowing, humming, or 'Aaah' sound.",
    clinicalPearl: "The 'King' of the parasympathetic nervous system. Arises from the dorsal motor nucleus and nucleus tractus solitarius in the medulla. Includes the myelinated Ventral Vagus and unmyelinated Dorsal Vagus. Often addressed in initial SNS reset protocols.",
    color: "bg-rose-600"
  },
  {
    id: 11,
    name: "CN XI",
    latinName: "Accessory",
    nuclei: "Medulla",
    toneEffect: "Flexors",
    reflexPoint: "SCM and Upper Trapezius muscle bellies",
    functions: ["SCM and Trapezius control"],
    stimulus: "1. Tap SCM and contralateral Upper Trapezius bellies simultaneously and test IM. 2. Alternatively, activate both muscles (shrug + head rotation) and test. Logic: L Accessory = L SCM + R Trap; R Accessory = R SCM + L Trap.",
    clinicalPearl: "Closely linked with CN 9 and 10 in the Medulla. SCM and Trapezius have dual innervation (Accessory + C2/C3). Key player in head, neck, shoulder, visual, and even pelvic issues.",
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