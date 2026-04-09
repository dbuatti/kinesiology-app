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
    pearl: 'Executive function and decision-making • Working memory and sustained attention • Emotional regulation and impulse control',
  },
  {
    id: 'pmc',
    name: 'Pre-Motor Cortex',
    category: 'Cortical',
    location: 'Hand placement over superior frontal skull, posterior to PFC — the blue zone',
    stimulus: 'Planning a movement without executing it.',
    lateralization: 'Contralateral',
    pearl: 'Planning and sequencing of voluntary movement • Coordination of complex motor tasks • Integration of sensory input for movement preparation',
  },
  {
    id: 'm1',
    name: 'Motor Cortex M1',
    category: 'Cortical',
    location: 'Hand placement along the central coronal strip — the dark blue zone running ear to ear over the crown',
    stimulus: 'Active voluntary movement of the associated body part.',
    lateralization: 'Contralateral',
    pearl: 'Direct control of voluntary movement • Somatotopic motor map (homunculus) • Fine motor control of hands, face, and speech',
  },
  {
    id: 's1',
    name: 'Sensory Cortex S1–S2',
    category: 'Cortical',
    location: 'Hand placement over parietal skull, posterior to the motor strip — the orange zone',
    stimulus: 'Light touch or proprioceptive input to the associated body part.',
    lateralization: 'Contralateral',
    pearl: 'Processing of touch, pressure, and proprioception • Somatosensory map of the body (sensory homunculus) • Pain and temperature perception',
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Direct light stimulation into the eye (not a scalp contact) — occipital lobe processing',
    stimulus: 'Shine light or track a visual target.',
    lateralization: 'Contralateral',
    pearl: 'Processing of visual information from the retina • Colour, shape, and motion perception • Visual field mapping',
  },
  {
    id: 'auditory',
    name: 'Auditory Cortex',
    category: 'Cortical',
    location: 'Single point inside the ear canal opening — bilateral, assessed separately',
    stimulus: 'Sound stimulus (click fingers or use 128Hz tuning fork) near the ear.',
    lateralization: 'Contralateral',
    pearl: 'Processing of sound frequency, pitch, and rhythm • Speech and language comprehension • Auditory localisation and spatial hearing',
  },
  {
    id: 'insula',
    name: 'Insula',
    category: 'Cortical',
    location: 'Line along eyebrow from lateral to medial — directional stimulation pointing inward toward the nose',
    stimulus: 'Interoceptive challenge (focus on heart beat or internal visceral sensation).',
    lateralization: 'Contralateral',
    pearl: 'Interoception — sensing the internal state of the body • Processing of pain, temperature, and visceral sensations • Emotional awareness and empathy',
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
    pearl: 'Motor coordination, balance, and posture • Timing and rhythm of movement • Cerebellar-cortical communication loops',
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'GV17 — External occipital protuberance itself, on the midline at the back of the skull',
    stimulus: 'Deep inhalation or extensor tone challenge.',
    acupoint: 'GV17',
    lateralization: 'Ipsilateral',
    pearl: 'Relay station between cerebrum and cerebellum • Regulation of breathing rhythm (pneumotaxic centre) • Sleep and arousal regulation (REM sleep)',
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'GB12 (Head-Wangu) — Depression posterior and inferior to the mastoid process, bilateral',
    stimulus: 'Forced exhalation or swallowing challenge.',
    acupoint: 'GB12',
    lateralization: 'Ipsilateral',
    pearl: 'Control of vital autonomic functions: heart rate, blood pressure, breathing • Vomiting and swallowing reflexes • Relay of sensory and motor signals between brain and spinal cord',
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    category: 'Subcortical',
    location: 'Bilateral horizontal oval: front edge at lateral orbital rim (outer eye corner), extending back along temporal bone to sphenoid wing',
    stimulus: 'Spatial memory recall or navigating a mental map.',
    lateralization: 'Ipsilateral',
    pearl: 'Memory consolidation — encoding short-term to long-term memory • Spatial navigation and cognitive mapping • Stress response regulation and cortisol modulation',
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'BL9 — Bilateral, close to midline, high on posterior occiput near the lambda',
    stimulus: 'Multi-sensory integration challenge.',
    acupoint: 'BL9',
    lateralization: 'Mixed',
    pearl: 'Primary sensory relay station — all sensory input except olfaction • Gating and filtering of sensory information to cortex • Regulation of consciousness, sleep, and alertness',
  },
  {
    id: 'basal-ganglia',
    name: 'Basal Ganglia (Nuclei)',
    category: 'Subcortical',
    location: 'GB9 — Bilateral, lateral parietal skull above the ears (superior to the ear, on the temporal-parietal region)',
    stimulus: 'Initiation or inhibition of a rapid motor task.',
    acupoint: 'GB9',
    lateralization: 'Bilateral',
    pearl: 'Motor control — initiation and inhibition of movement • Habit formation and procedural learning • Reward processing and motivation',
  },
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Bilateral crescent arc wrapping posterior-inferior around the ear, ending at the mastoid tip where GB12 begins',
    stimulus: 'Emotional memory recall or threat visualization.',
    lateralization: 'Ipsilateral',
    pearl: 'Emotional processing and memory • Fear and threat response (amygdala) • Motivation and reward (nucleus accumbens)',
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'GV26 — Philtrum, the midline groove between the base of the nose and the upper lip',
    stimulus: 'Convergence eye movement or pupillary light reflex.',
    acupoint: 'GV26',
    lateralization: 'Ipsilateral',
    pearl: 'Visual and auditory reflex coordination • Dopamine production (substantia nigra) • Pain modulation (periaqueductal grey)',
  },
  {
    id: 'ofc',
    name: 'Orbitofrontal Cortex (OFC)',
    category: 'Subcortical',
    location: 'BL1 — Inner canthus of the eye, bilateral contact point (NOT light stimulation — contact only)',
    stimulus: 'Smell stimulus or value-based decision challenge.',
    acupoint: 'BL1',
    lateralization: 'Ipsilateral',
    pearl: 'Integration of emotional and sensory information • Decision-making based on reward and punishment • Olfactory processing and integration',
  },
  {
    id: 'acc',
    name: 'Anterior Cingulate Cortex (ACC)',
    category: 'Subcortical',
    location: 'Auricular reflex point — ear-based stimulation. Associated muscle: Occipitalis',
    stimulus: 'Conflict monitoring or error detection task.',
    lateralization: 'Ipsilateral',
    pearl: 'Regulation of emotional and cognitive processes • Conflict monitoring and error detection • Pain processing and modulation',
  }
];

// Map the central Cranial Nerve data to the BrainReflexPoint interface
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