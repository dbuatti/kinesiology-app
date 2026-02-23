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
    pearl: 'The threat reflex switch (Amygdala). Left = long-term historical issues/trauma. Right = current emotional processing.',
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    category: 'Subcortical',
    location: 'Internal (Tongue to roof of mouth).',
    technique: 'Direct client to push tongue to the roof of the hard palate.',
    lateralization: 'Bilateral',
    pearl: 'Master regulator of homeostasis, hormones, and sleep. Triggered during every threat response.',
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    category: 'Subcortical',
    location: 'Suboccipital region.',
    acupoint: 'GV16 / BL10 / GB20',
    technique: 'GV16 (Medial/Vestibular), BL10 (Paravomus/Spine), GB20 (Lateral/Extremities).',
    lateralization: 'Ipsilateral',
    pearl: 'Controls rate, rhythm, and accuracy. Holds 60-70% of total neurons. Constantly correcting movement errors.',
  },
  {
    id: 'basal-ganglia',
    name: 'Basal Ganglia',
    category: 'Subcortical',
    location: 'Midline forehead.',
    acupoint: 'GV24',
    technique: 'Touch GV24 or use a metronome to regulate hyperkinetic loops.',
    lateralization: 'Bilateral',
    pearl: 'The "Accelerator and Brakes" of the brain. Controls tone of the nervous system. Often stuck in ADHD/Autism due to hidden infections.',
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'Occipitalis muscles.',
    technique: 'Touch the small muscles at the back of the head where they wrap over the skull.',
    lateralization: 'Mixed',
    pearl: 'The "Central Station". Filters and relays all sensory information (except smell) to the rest of the brain.',
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'Below the eyes.',
    acupoint: 'ST2',
    technique: 'Touch ST2. Stimulate via breath-holding or moving eyes toward the nose.',
    lateralization: 'Ipsilateral',
    pearl: 'Top of brainstem. Houses CN 3 & 4. Key for reflexive threat behaviors and gait control.',
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'External occipital protuberance.',
    acupoint: 'GV17',
    technique: 'Touch GV17. Houses CN 5, 6, 7, and 8.',
    lateralization: 'Ipsilateral',
    pearl: 'Middle brainstem. Controls extensor tone and vestibular nuclei. Highly involved in movement-related efferent corrections.',
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'Ramus of the jaw.',
    technique: 'Touch bilateral ramus of the jaw or the visual cortex reflex point.',
    lateralization: 'Ipsilateral',
    pearl: 'Bottom of brainstem. Houses CN 9-12 and the Vagal nuclei. Controls heart rate, respiration, and blood pressure.',
  },

  // CRANIAL NERVES
  {
    id: 'cn1',
    name: 'CN I: Olfactory',
    category: 'Cranial Nerve',
    location: 'Between the eyebrows (Third Eye).',
    acupoint: 'Yin Tang',
    lateralization: 'Bilateral',
    pearl: 'The only sense that bypasses the thalamus. Directly linked to the limbic system.',
  },
  {
    id: 'cn10',
    name: 'CN X: Vagus',
    category: 'Cranial Nerve',
    location: 'Occiput / Ear.',
    technique: 'Hand along the occiput or deep ear pressure.',
    lateralization: 'Ipsilateral',
    pearl: 'The primary parasympathetic nerve. Nuclei located in the Medulla.',
  },
];