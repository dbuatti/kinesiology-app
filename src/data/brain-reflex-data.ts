"use client";

import { CRANIAL_NERVES } from "./cranial-nerve-data";

export type BrainRegionCategory = 'Cortical' | 'Subcortical' | 'Cranial Nerve';

export interface BrainReflexPoint {
  id: string;
  name: string;
  category: BrainRegionCategory;
  location: string; 
  stimulus?: string; 
  clinicalNote?: string;
  technique?: string;
  lateralization: 'Contralateral' | 'Ipsilateral' | 'Bilateral' | 'Mixed';
  acupoint?: string;
  pearl?: string;
  functions?: string[];
  nuclei?: 'Cortex' | 'Midbrain' | 'Pons' | 'Medulla';
  toneEffect?: 'Flexors' | 'Extensors' | 'None';
  videoUrl?: string;
  pageUrl?: string;
}

const CORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'pfc',
    name: 'Pre-Frontal Cortex',
    category: 'Cortical',
    location: 'Hand placement over anterolateral frontal skull — the large teal zone at the forehead',
    stimulus: 'Complex decision making or executive function task.',
    lateralization: 'Contralateral',
    functions: [
      'Executive function and decision-making',
      'Working memory and sustained attention',
      'Emotional regulation and impulse control'
    ],
    pearl: 'The CEO of the brain. Essential for intentional change.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4"
  },
  {
    id: 'pmc',
    name: 'Pre-Motor Cortex',
    category: 'Cortical',
    location: 'Hand placement over superior frontal skull, posterior to PFC — the blue zone',
    stimulus: 'Planning a movement without executing it.',
    lateralization: 'Contralateral',
    functions: [
      'Planning and sequencing of voluntary movement',
      'Coordination of complex motor tasks',
      'Integration of sensory input for movement preparation'
    ],
    pearl: 'The architect of movement. Active during visualization.'
  },
  {
    id: 'm1',
    name: 'Motor Cortex M1',
    category: 'Cortical',
    location: 'Hand placement along the central coronal strip — the dark blue zone running ear to ear over the crown',
    stimulus: 'Active voluntary movement of the associated body part.',
    lateralization: 'Contralateral',
    functions: [
      'Direct control of voluntary movement',
      'Somatotopic motor map (homunculus)',
      'Fine motor control of hands, face, and speech'
    ],
    pearl: 'The executioner of movement. Follows strict contralateral logic.'
  },
  {
    id: 's1',
    name: 'Sensory Cortex S1–S2',
    category: 'Cortical',
    location: 'Hand placement over parietal skull, posterior to the motor strip — the orange zone',
    stimulus: 'Light touch or proprioceptive input.',
    lateralization: 'Contralateral',
    functions: [
      'Processing of touch, pressure, and proprioception',
      'Somatosensory map of the body (sensory homunculus)',
      'Pain and temperature perception'
    ],
    pearl: 'The sensory map. "Smudging" here leads to chronic pain.'
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Direct light stimulation into the eye (not a scalp contact) — occipital lobe processing',
    stimulus: 'Shine light or track a visual target.',
    lateralization: 'Contralateral',
    functions: [
      'Processing of visual information from the retina',
      'Colour, shape, and motion perception',
      'Visual field mapping'
    ],
    pearl: 'Primary visual processing. Essential for spatial orientation.'
  },
  {
    id: 'auditory',
    name: 'Auditory Cortex',
    category: 'Cortical',
    location: 'Single point inside the ear canal opening — bilateral, assessed separately',
    stimulus: 'Sound stimulus near the ear.',
    lateralization: 'Contralateral',
    functions: [
      'Processing of sound frequency, pitch, and rhythm',
      'Speech and language comprehension',
      'Auditory localisation and spatial hearing'
    ],
    pearl: 'Processing of sound. Deeply linked to language and rhythm.'
  },
  {
    id: 'insula',
    name: 'Insula',
    category: 'Cortical',
    location: 'Line along eyebrow from lateral to medial — directional stimulation pointing inward toward the nose',
    stimulus: 'Interoceptive challenge (focus on heart beat).',
    lateralization: 'Contralateral',
    functions: [
      'Interoception — sensing the internal state of the body',
      'Processing of pain, temperature, and visceral sensations',
      'Emotional awareness and empathy'
    ],
    pearl: 'The bridge between body and emotion. Key for empathy.'
  }
];

const SUBCORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    category: 'Subcortical',
    location: 'GV16 — Suboccipital hollow just below the external occipital protuberance, on the midline',
    stimulus: 'Complex coordination task or balance challenge.',
    acupoint: 'GV16',
    lateralization: 'Ipsilateral',
    functions: [
      'Motor coordination, balance, and posture',
      'Timing and rhythm of movement',
      'Cerebellar-cortical communication loops'
    ],
    pearl: 'The "Little Brain". Processes 85% of unconscious input.'
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'GV17 — External occipital protuberance itself, on the midline at the back of the skull',
    stimulus: 'Deep inhalation or extensor tone challenge.',
    acupoint: 'GV17',
    lateralization: 'Ipsilateral',
    functions: [
      'Relay station between cerebrum and cerebellum',
      'Regulation of breathing rhythm (pneumotaxic centre)',
      'Sleep and arousal regulation (REM sleep)'
    ],
    pearl: 'The bridge. Controls extensor tone and REM sleep.'
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'GB12 — Depression posterior and inferior to the mastoid process, bilateral',
    stimulus: 'Forced exhalation or swallowing challenge.',
    acupoint: 'GB12',
    lateralization: 'Ipsilateral',
    functions: [
      'Control of vital autonomic functions: heart rate, blood pressure, breathing',
      'Vomiting and swallowing reflexes',
      'Relay of sensory and motor signals between brain and spinal cord'
    ],
    pearl: 'The vital center. Controls flexor tone and autonomic life support.'
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    category: 'Subcortical',
    location: 'Bilateral horizontal oval: front edge at lateral orbital rim, extending back along temporal bone to sphenoid wing',
    stimulus: 'Memory recall or spatial navigation task.',
    lateralization: 'Ipsilateral',
    functions: [
      'Memory consolidation — encoding short-term to long-term memory',
      'Spatial navigation and cognitive mapping',
      'Stress response regulation and cortisol modulation'
    ],
    pearl: 'The librarian. Essential for learning and stress regulation.'
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'BL9 — Bilateral, close to midline, high on posterior occiput near the lambda',
    stimulus: 'Multi-sensory integration challenge.',
    acupoint: 'BL9',
    lateralization: 'Contralateral',
    functions: [
      'Primary sensory relay station — all sensory input except olfaction',
      'Gating and filtering of sensory information to cortex',
      'Regulation of consciousness, sleep, and alertness'
    ],
    pearl: 'The grand relay station. Filters the world for the cortex.'
  },
  {
    id: 'basal_ganglia',
    name: 'Basal Ganglia',
    category: 'Subcortical',
    location: 'GB9 — Bilateral, lateral parietal skull above the ears (superior to the ear)',
    stimulus: 'Initiation or cessation of movement.',
    acupoint: 'GB9',
    lateralization: 'Contralateral',
    functions: [
      'Motor control — initiation and inhibition of movement',
      'Habit formation and procedural learning',
      'Reward processing and motivation'
    ],
    pearl: 'The gatekeeper of movement and habits.'
  },
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Bilateral crescent arc wrapping posterior-inferior around the ear, ending at the mastoid tip',
    stimulus: 'Emotional memory recall or threat visualization.',
    lateralization: 'Ipsilateral',
    functions: [
      'Emotional processing and memory',
      'Fear and threat response (amygdala)',
      'Motivation and reward (nucleus accumbens)'
    ],
    pearl: 'The emotional brain. Drives survival and connection.'
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'GV26 — Philtrum, the midline groove between the base of the nose and the upper lip',
    stimulus: 'Convergence eye movement.',
    acupoint: 'GV26',
    lateralization: 'Ipsilateral',
    functions: [
      'Visual and auditory reflex coordination',
      'Dopamine production (substantia nigra)',
      'Pain modulation (periaqueductal grey)'
    ],
    pearl: 'The top of the brainstem. Controls flexor tone and eye reflexes.'
  },
  {
    id: 'ofc',
    name: 'Orbitofrontal Cortex (OFC)',
    category: 'Subcortical',
    location: 'BL1 — Inner canthus of the eye, bilateral contact point (NOT light stimulation)',
    stimulus: 'Integration of emotional and sensory information.',
    acupoint: 'BL1',
    lateralization: 'Contralateral',
    functions: [
      'Integration of emotional and sensory information',
      'Decision-making based on reward and punishment',
      'Olfactory processing and integration'
    ],
    pearl: 'The emotional-sensory bridge.'
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    category: 'Subcortical',
    location: 'Primary: Tip of tongue to hard palate. Secondary: GV20 — crown of the skull',
    stimulus: 'Temperature or autonomic challenge.',
    acupoint: 'GV20',
    lateralization: 'Bilateral',
    functions: [
      'Master regulator of the autonomic nervous system',
      'Hormonal control via the hypothalamic-pituitary axis (HPA axis)',
      'Body temperature regulation (thermoregulation)'
    ],
    pearl: 'The master regulator of survival physiology.'
  },
  {
    id: 'acc',
    name: 'Anterior Cingulate Cortex (ACC)',
    category: 'Subcortical',
    location: 'Auricular reflex point — ear-based stimulation. Associated muscle: Occipitalis',
    stimulus: 'Conflict monitoring or error detection task.',
    lateralization: 'Mixed',
    functions: [
      'Regulation of emotional and cognitive processes',
      'Conflict monitoring and error detection',
      'Pain processing and modulation'
    ],
    pearl: 'The error detector. Key for emotional regulation.'
  }
];

const MAPPED_CRANIAL_NERVES: BrainReflexPoint[] = CRANIAL_NERVES.map(nerve => ({
  id: `cn${nerve.id}`,
  name: `${nerve.name}: ${nerve.latinName}`,
  category: 'Cranial Nerve',
  location: nerve.reflexPoint,
  stimulus: nerve.stimulus,
  lateralization: nerve.id === 2 ? 'Contralateral' : 'Ipsilateral',
  pearl: nerve.clinicalPearl,
  nuclei: nerve.nuclei,
  toneEffect: nerve.toneEffect,
  videoUrl: nerve.videoUrl,
  pageUrl: nerve.pageUrl
}));

export const BRAIN_REFLEX_POINTS: BrainReflexPoint[] = [
  ...CORTICAL_POINTS,
  ...SUBCORTICAL_POINTS,
  ...MAPPED_CRANIAL_NERVES
];