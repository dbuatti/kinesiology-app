"use client";

import { CRANIAL_NERVES } from "./cranial-nerve-data";

export type BrainRegionCategory = 'Cortical' | 'Subcortical' | 'Cranial Nerve';

export interface BrainReflexPoint {
  id: string;
  name: string;
  category: BrainRegionCategory;
  location: string; // This is the Reflex Point
  stimulus?: string; // The specific action to trigger the nerve
  clinicalNote?: string;
  technique?: string;
  lateralization: 'Contralateral' | 'Ipsilateral' | 'Bilateral' | 'Mixed';
  acupoint?: string;
  pearl?: string;
  nuclei?: 'Cortex' | 'Midbrain' | 'Pons' | 'Medulla';
  toneEffect?: 'Flexors' | 'Extensors' | 'None';
}

const CORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'pfc',
    name: 'Prefrontal Cortex',
    category: 'Cortical',
    location: 'Front of the forehead (anterior frontal bone).',
    technique: 'Place hand over the front of the cranium. Test left then right to lateralize.',
    lateralization: 'Contralateral',
    pearl: 'The "CEO" of the brain. Responsible for executive function, planning, and emotional regulation.',
  },
  {
    id: 'pmc',
    name: 'Premotor Cortex',
    category: 'Cortical',
    location: 'Just anterior to the Motor Strip (M1).',
    technique: 'Reflex point anterior to the coronal midline.',
    lateralization: 'Contralateral',
    pearl: 'Involved in planning and execution of movement.',
  },
  {
    id: 'm1',
    name: 'Motor Cortex (M1)',
    category: 'Cortical',
    location: 'The motor strip running coronally.',
    technique: 'Place palm on forehead, middle finger down midline; M1 is lateral to the finger tip.',
    lateralization: 'Contralateral',
    pearl: 'Controls voluntary movement of the opposing side of the body.',
  },
  {
    id: 's1',
    name: 'Sensory Cortex (S1)',
    category: 'Cortical',
    location: 'Parietal lobe, posterior to the Motor Cortex.',
    technique: 'Coronal strip behind M1.',
    lateralization: 'Contralateral',
    pearl: 'Creates the body map. Injuries can "smudge" this map, leading to chronic pain.',
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Occipital lobe, just behind the ear.',
    technique: 'Touch reflex point behind the ear or use light stimulus in the eyes.',
    lateralization: 'Contralateral',
    pearl: 'Receives and reprocesses visual input.',
  },
  {
    id: 'insular',
    name: 'Insular Cortex',
    category: 'Cortical',
    location: 'Eyebrows (Reflex) or Arm Hairs (Stim).',
    technique: 'Run along arm hairs backwards (towards shoulder) or sense own heartbeat.',
    lateralization: 'Contralateral',
    pearl: 'Primary center for Interoception (sensing the internal self).',
  },
  {
    id: 'acc',
    name: 'Anterior Cingulate (ACC)',
    category: 'Cortical',
    location: 'Medial prefrontal cortex / Auricular point.',
    technique: 'Specific point on the ear or medial frontal touch.',
    lateralization: 'Contralateral',
    pearl: 'The "Suffering Center". Often upregulated in chronic pain.',
  },
];

const SUBCORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Behind the ear, above the mastoid process.',
    technique: 'Use whole fingers to cover the zone behind the ear.',
    lateralization: 'Ipsilateral',
    pearl: 'The threat reflex switch. Left = historical trauma. Right = current processing.',
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    category: 'Subcortical',
    location: 'Along the temporal region, just above the ear.',
    technique: 'Touch the area along the temporal bone above the ear.',
    lateralization: 'Ipsilateral',
    pearl: 'Memory consolidation and spatial navigation.',
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    category: 'Subcortical',
    location: 'Internal (Tongue to roof of mouth).',
    technique: 'Direct client to push tongue to the roof of the hard palate.',
    lateralization: 'Bilateral',
    pearl: 'Master regulator of homeostasis, hormones, and sleep.',
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    category: 'Subcortical',
    location: 'Suboccipital region.',
    acupoint: 'GV16 / BL10 / GB20',
    technique: 'GV16 (Medial/Vestibular), BL10 (Paravomus/Spine), GB20 (Lateral/Extremities).',
    lateralization: 'Ipsilateral',
    pearl: 'Controls rate, rhythm, and accuracy.',
  },
  {
    id: 'basal-ganglia',
    name: 'Basal Ganglia',
    category: 'Subcortical',
    location: 'Midline forehead.',
    acupoint: 'GV24',
    technique: 'Touch GV24 or use a metronome to regulate hyperkinetic loops.',
    lateralization: 'Bilateral',
    pearl: 'The "Accelerator and Brakes" of the brain. Controls tone.',
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'Occipitalis muscles.',
    technique: 'Touch the small muscles at the back of the head.',
    lateralization: 'Mixed',
    pearl: 'The "Central Station". Filters and relays all sensory information.',
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'Below the eyes.',
    acupoint: 'ST2',
    technique: 'Touch ST2. Stimulate via breath-holding or moving eyes toward the nose.',
    lateralization: 'Ipsilateral',
    pearl: 'Top of brainstem. Key for reflexive threat behaviors.',
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'External occipital protuberance.',
    acupoint: 'GV17',
    technique: 'Touch GV17. Houses CN 5, 6, 7, and 8.',
    lateralization: 'Ipsilateral',
    pearl: 'Middle brainstem. Controls extensor tone.',
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'Ramus of the jaw.',
    technique: 'Touch bilateral ramus of the jaw.',
    lateralization: 'Ipsilateral',
    pearl: 'Bottom of brainstem. Controls heart rate and respiration.',
  },
];

// Map the central Cranial Nerve data to the BrainReflexPoint interface
const MAPPED_CRANIAL_NERVES: BrainReflexPoint[] = CRANIAL_NERVES.map(nerve => ({
  id: `cn${nerve.id}`,
  name: `${nerve.name}: ${nerve.latinName}`,
  category: 'Cranial Nerve',
  location: nerve.reflexPoint,
  stimulus: nerve.stimulus,
  lateralization: nerve.id === 1 ? 'Bilateral' : nerve.id === 2 ? 'Contralateral' : 'Ipsilateral',
  pearl: nerve.clinicalPearl,
  nuclei: nerve.nuclei,
  toneEffect: nerve.toneEffect
}));

// Export the combined list as the single source of truth for all brain-related points
export const BRAIN_REFLEX_POINTS: BrainReflexPoint[] = [
  ...CORTICAL_POINTS,
  ...SUBCORTICAL_POINTS,
  ...MAPPED_CRANIAL_NERVES
];