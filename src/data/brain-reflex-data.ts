"use client";

export type BrainRegionCategory = 'Cortical' | 'Subcortical' | 'Cranial Nerve';

export interface BrainReflexPoint {
  id: string;
  name: string;
  category: BrainRegionCategory;
  location: string;
  clinicalNote?: string;
  technique?: string;
  lateralization: 'Contralateral' | 'Ipsilateral' | 'Bilateral' | 'Mixed';
  acupoint?: string;
}

export const BRAIN_REFLEX_POINTS: BrainReflexPoint[] = [
  // CORTICAL
  {
    id: 'pfc',
    name: 'Prefrontal Cortex',
    category: 'Cortical',
    location: 'Front of the forehead (anterior frontal bone).',
    technique: 'Light touch or focus on the very front of the cranium.',
    lateralization: 'Contralateral',
  },
  {
    id: 'pmc',
    name: 'Premotor Cortex',
    category: 'Cortical',
    location: 'Just posterior to the Prefrontal Cortex.',
    technique: 'Zone between PFC and the Motor Strip.',
    lateralization: 'Contralateral',
  },
  {
    id: 'm1',
    name: 'Motor Cortex (M1)',
    category: 'Cortical',
    location: 'The motor strip running coronally.',
    technique: 'Place palm on forehead, middle finger down the midline; M1 is lateral to the finger tip.',
    lateralization: 'Contralateral',
  },
  {
    id: 's1',
    name: 'Sensory Cortex (S1)',
    category: 'Cortical',
    location: 'Just posterior to the Motor Cortex.',
    technique: 'Coronal strip behind M1.',
    lateralization: 'Contralateral',
  },
  {
    id: 'acc',
    name: 'Anterior Cingulate Cortex (ACC)',
    category: 'Cortical',
    location: 'Auricular point on the ear.',
    technique: 'The "corner bit" or specific green point on the ear model.',
    clinicalNote: 'Key area related to the perception of suffering.',
    lateralization: 'Contralateral',
  },
  {
    id: 'insular',
    name: 'Insular Cortex',
    category: 'Cortical',
    location: 'Eyebrows.',
    technique: 'Rub along the eyebrow hairs "against the grain" (backwards).',
    clinicalNote: 'Stimulating one side affects the opposing cortex.',
    lateralization: 'Contralateral',
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Occipital pole or via light stimulus.',
    technique: 'Shine light into the eye or touch the specific occipital reflex point.',
    clinicalNote: 'Crosses at the optic chiasm.',
    lateralization: 'Contralateral',
  },

  // SUBCORTICAL
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Behind the ear, above the mastoid process.',
    technique: 'Use whole fingers to cover the zone behind the ear.',
    clinicalNote: 'Left = Past traumas (physical/emotional). Right = Current emotional processing.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    category: 'Subcortical',
    location: 'Midline, just below the occiput.',
    acupoint: 'GV16',
    technique: 'Suboccipital midline, approx. two thumb widths up.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'Midline of the occiput.',
    acupoint: 'GV17',
    clinicalNote: 'Controls extensor muscles; holds vestibular nucleus and nuclei for CN 5 & 7.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'Occipitalis muscle area.',
    technique: 'Circle the area where the occipitalis muscle wraps over the head.',
    clinicalNote: 'The bridge between cortical and subcortical. Works with same-side cortex and opposite brainstem.',
    lateralization: 'Mixed',
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'Mandible area.',
    technique: 'Reflex point around the jaw/mandible.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'Below the eyes.',
    acupoint: 'ST2',
    technique: 'Touch the ST2 acupoint area.',
    lateralization: 'Ipsilateral',
  },

  // CRANIAL NERVES
  {
    id: 'cn1',
    name: 'CN I: Olfactory',
    category: 'Cranial Nerve',
    location: 'Between the eyebrows (Third Eye).',
    acupoint: 'Yin Tang',
    clinicalNote: 'Linked with the limbic system.',
    lateralization: 'Bilateral',
  },
  {
    id: 'cn2',
    name: 'CN II: Optic',
    category: 'Cranial Nerve',
    location: 'Lateral to the bridge of the nose.',
    acupoint: 'BL2',
    technique: 'Test point or shine light in eyes for 100% correlation.',
    lateralization: 'Contralateral',
  },
  {
    id: 'cn346',
    name: 'CN III, IV, VI: Eye Movement',
    category: 'Cranial Nerve',
    location: 'The eyes.',
    technique: 'Lightly touch the eyes. CN3: Up/Down/Across. CN4: Down to nose tip. CN6: Lateral.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cn5',
    name: 'CN V: Trigeminal',
    category: 'Cranial Nerve',
    location: 'Face / Mandible.',
    technique: 'Place hand along the jaw/face.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cn7',
    name: 'CN VII: Facial',
    category: 'Cranial Nerve',
    location: 'Face.',
    technique: 'Place hand along the face.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cn8',
    name: 'CN VIII: Vestibulocochlear',
    category: 'Cranial Nerve',
    location: 'The ear.',
    technique: 'Finger lightly in the ear. (Deep pressure stims CN X).',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cn9',
    name: 'CN IX: Glossopharyngeal',
    category: 'Cranial Nerve',
    location: 'Levator Scapulae belly.',
    technique: 'Humming or holding the belly of the levator scapulae.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cn10',
    name: 'CN X: Vagus',
    category: 'Cranial Nerve',
    location: 'Occiput / Ear.',
    technique: 'Hand along the occiput, below the cerebellum point, or deep ear pressure.',
    lateralization: 'Ipsilateral',
  },
  {
    id: 'cn11',
    name: 'CN XI: Accessory',
    category: 'Cranial Nerve',
    location: 'SCM and Trapezius.',
    technique: 'Tap ipsilateral SCM and contralateral Upper Trap.',
    lateralization: 'Mixed',
  },
  {
    id: 'cn12',
    name: 'CN XII: Hypoglossal',
    category: 'Cranial Nerve',
    location: 'Under the chin.',
    technique: 'Touch the area directly underneath the chin.',
    lateralization: 'Ipsilateral',
  },
];