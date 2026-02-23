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
  pearl?: string;
}

export const BRAIN_REFLEX_POINTS: BrainReflexPoint[] = [
  // CORTICAL (Contralateral Logic)
  {
    id: 'pfc',
    name: 'Prefrontal Cortex',
    category: 'Cortical',
    location: 'Front of the forehead (anterior frontal bone).',
    technique: 'Place hand over the front of the cranium. Test left then right to lateralize.',
    lateralization: 'Contralateral',
    pearl: 'The "CEO" of the brain. Responsible for executive function, planning, and emotional regulation. Down-regulated by chronic stress or head injuries.',
  },
  {
    id: 'pmc',
    name: 'Premotor Cortex',
    category: 'Cortical',
    location: 'Just anterior to the Motor Strip (M1).',
    technique: 'Reflex point anterior to the coronal midline.',
    lateralization: 'Contralateral',
    pearl: 'Involved in planning and execution of movement. Indicated when clients struggle to execute demonstrated commands.',
  },
  {
    id: 'm1',
    name: 'Motor Cortex (M1)',
    category: 'Cortical',
    location: 'The motor strip running coronally.',
    technique: 'Place palm on forehead, middle finger down midline; M1 is lateral to the finger tip.',
    lateralization: 'Contralateral',
    pearl: 'The "Motor Homunculus". Controls voluntary movement of the opposing side of the body, especially hands and feet.',
  },
  {
    id: 's1',
    name: 'Sensory Cortex (S1)',
    category: 'Cortical',
    location: 'Parietal lobe, posterior to the Motor Cortex.',
    technique: 'Coronal strip behind M1.',
    lateralization: 'Contralateral',
    pearl: 'Creates the body map. Injuries can "smudge" this map, leading to upregulated tone and chronic pain.',
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Occipital lobe, just behind the ear.',
    technique: 'Touch reflex point behind the ear or use light stimulus in the eyes.',
    lateralization: 'Contralateral',
    pearl: 'Receives and reprocesses visual input. Highly susceptible to whiplash or head injuries.',
  },
  {
    id: 'insular',
    name: 'Insular Cortex',
    category: 'Cortical',
    location: 'Eyebrows (Reflex) or Arm Hairs (Stim).',
    technique: 'Run along arm hairs backwards (towards shoulder) or sense own heartbeat.',
    lateralization: 'Contralateral',
    pearl: 'Primary center for Interoception (sensing the internal self). Key for chronic pain, fatigue, and PTSD.',
  },
  {
    id: 'acc',
    name: 'Anterior Cingulate (ACC)',
    category: 'Cortical',
    location: 'Medial prefrontal cortex / Auricular point.',
    technique: 'Specific point on the ear or medial frontal touch.',
    lateralization: 'Contralateral',
    pearl: 'The "Suffering Center". Often upregulated in chronic pain while the PFC is downregulated.',
  },

  // SUBCORTICAL (Ipsilateral Logic)
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Behind the ear, above the mastoid process.',
    technique: 'Use whole fingers to cover the zone behind the ear.',
    lateralization: 'Ipsilateral',
    pearl: 'Left Limbic is often related to long-term historical issues and dormant patterns.',
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    category: 'Subcortical',
    location: 'Internal (Tongue to roof of mouth).',
    technique: 'Direct client to push tongue to the roof of the hard palate.',
    lateralization: 'Bilateral',
    pearl: 'Master gland clock. Regulates temperature, sleep, and the HPA/HPT axes. Triggered in every threat response.',
  },
  {
    id: 'cerebellum_medial',
    name: 'Cerebellum (Medial)',
    category: 'Subcortical',
    location: 'Suboccipital midline.',
    acupoint: 'GV16',
    lateralization: 'Ipsilateral',
    pearl: 'Vestibular system and midline structures (jaw, core, tongue). Controls rate and rhythm.',
  },
  {
    id: 'cerebellum_para',
    name: 'Cerebellum (Paravomus)',
    category: 'Subcortical',
    location: 'Lateral to GV16.',
    acupoint: 'BL10',
    lateralization: 'Ipsilateral',
    pearl: 'Controls the spine and proximal joints (shoulders, hips). Linked to organ coordination.',
  },
  {
    id: 'cerebellum_lateral',
    name: 'Cerebellum (Lateral)',
    category: 'Subcortical',
    location: 'Outer suboccipital area.',
    acupoint: 'GB20',
    lateralization: 'Ipsilateral',
    pearl: 'Controls distal extremities (hands/feet) and smooth thought/emotional regulation.',
  },
  {
    id: 'basal_ganglia',
    name: 'Basal Ganglia',
    category: 'Subcortical',
    location: 'Midline forehead.',
    acupoint: 'GV24',
    technique: 'Touch GV24 or use a metronome to auto-regulate.',
    lateralization: 'Ipsilateral',
    pearl: 'The "Accelerator and Brakes" of the brain. Controls nervous system tone and inhibits unwanted motor programs.',
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'Occipitalis muscle area.',
    technique: 'Touch the small muscles at the very back of the head.',
    lateralization: 'Mixed',
    pearl: 'The "Central Station" for sensory processing. Filters and relays all signals except smell.',
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'Below the eyes.',
    acupoint: 'ST2',
    technique: 'Hold breath or move eyes in towards the nose to stimulate.',
    lateralization: 'Ipsilateral',
    pearl: 'Reflexive threat behaviors and motor control. Houses CN III and IV.',
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'External occipital protuberance.',
    acupoint: 'GV17',
    lateralization: 'Ipsilateral',
    pearl: 'Governs extensor tone and the vestibular nuclei. Highly involved in movement and auditory integration.',
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'Ramus of the jaw.',
    technique: 'Reflex point at the bilateral ramus of the jaw.',
    lateralization: 'Ipsilateral',
    pearl: 'Controls the Autonomic Nervous System (Vagus nuclei). Affected by severe whiplash or head traction.',
  },
];