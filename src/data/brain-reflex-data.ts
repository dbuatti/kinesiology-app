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
    location: 'Hand placement over anterolateral frontal skull',
    stimulus: 'Complex decision making or executive function task.',
    lateralization: 'Contralateral',
    pearl: 'Executive function and decision-making.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127509/posts/2167205372"
  },
  {
    id: 'pmc',
    name: 'Pre-Motor Cortex',
    category: 'Cortical',
    location: 'Hand placement over superior frontal skull, posterior to PFC',
    stimulus: 'Planning a movement without executing it.',
    lateralization: 'Contralateral',
    pearl: 'Planning and sequencing of voluntary movement.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4"
  },
  {
    id: 'm1',
    name: 'Motor Cortex M1',
    category: 'Cortical',
    location: 'Hand placement along the central coronal strip',
    stimulus: 'Active voluntary movement of the associated body part.',
    lateralization: 'Contralateral',
    pearl: 'Direct control of voluntary movement.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4"
  },
  {
    id: 's1',
    name: 'Sensory Cortex S1–S2',
    category: 'Cortical',
    location: 'Hand placement over parietal skull, posterior to the motor strip',
    stimulus: 'Light touch or proprioceptive input.',
    lateralization: 'Contralateral',
    pearl: 'Processing of touch, pressure, and proprioception.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4"
  },
  {
    id: 'visual',
    name: 'Visual Cortex',
    category: 'Cortical',
    location: 'Direct light stimulation into the eye',
    stimulus: 'Shine light or track a visual target.',
    lateralization: 'Contralateral',
    pearl: 'Processing of visual information from the retina.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/b874823f0dc614160512b66bcb5b516f50f9eb2d.mp4"
  },
  {
    id: 'auditory',
    name: 'Auditory Cortex',
    category: 'Cortical',
    location: 'Single point inside the ear canal opening',
    stimulus: 'Sound stimulus near the ear.',
    lateralization: 'Contralateral',
    pearl: 'Processing of sound frequency, pitch, and rhythm.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/465c56ed15ec74012154656cd87ff84d9307a40c.mp4"
  },
  {
    id: 'insula',
    name: 'Insula',
    category: 'Cortical',
    location: 'Line along eyebrow from lateral to medial',
    stimulus: 'Interoceptive challenge (focus on heart beat).',
    lateralization: 'Contralateral',
    pearl: 'Interoception — sensing the internal state of the body.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4"
  },
  {
    id: 'corpus_callosum',
    name: 'Corpus Callosum',
    category: 'Cortical',
    location: 'Midline of the skull, superior to the motor strip',
    stimulus: 'Cross-lateral movement or bilateral coordination.',
    lateralization: 'Bilateral',
    pearl: 'The bridge between hemispheres. Essential for integration.',
  }
];

const SUBCORTICAL_POINTS: BrainReflexPoint[] = [
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    category: 'Subcortical',
    location: 'GV16 — Suboccipital hollow',
    stimulus: 'Complex coordination task or balance challenge.',
    acupoint: 'GV16',
    lateralization: 'Ipsilateral',
    pearl: 'Motor coordination, balance, and posture.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/710dba831b6b97eb558e3e4f1ad866800076dd0b.mp4"
  },
  {
    id: 'pons',
    name: 'Pons',
    category: 'Subcortical',
    location: 'GV17 — External occipital protuberance',
    stimulus: 'Deep inhalation or extensor tone challenge.',
    acupoint: 'GV17',
    lateralization: 'Ipsilateral',
    pearl: 'Relay station between cerebrum and cerebellum.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/10de3ccab10de3ccab1d8595c4c3e451aea5b91c84cf6213f.mp4"
  },
  {
    id: 'medulla',
    name: 'Medulla',
    category: 'Subcortical',
    location: 'GB12 — Depression posterior to mastoid',
    stimulus: 'Forced exhalation or swallowing challenge.',
    acupoint: 'GB12',
    lateralization: 'Ipsilateral',
    pearl: 'Control of vital autonomic functions.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/fde31242dde2c7536f59b7c3a46f6070.mp4"
  },
  {
    id: 'limbic',
    name: 'Limbic System',
    category: 'Subcortical',
    location: 'Bilateral crescent arc wrapping around the ear',
    stimulus: 'Emotional memory recall or threat visualization.',
    lateralization: 'Ipsilateral',
    pearl: 'Emotional processing and memory.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aca41508634a068fbda3d10c96f150a9.mp4"
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    category: 'Subcortical',
    location: 'GV26 — Philtrum',
    stimulus: 'Convergence eye movement.',
    acupoint: 'GV26',
    lateralization: 'Ipsilateral',
    pearl: 'Visual and auditory reflex coordination.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e469a668620604adbb0a0c69a192e7af50579078.mp4"
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    category: 'Subcortical',
    location: 'Deep central skull (TL via vertex)',
    stimulus: 'Multi-sensory integration challenge.',
    lateralization: 'Contralateral',
    pearl: 'The grand relay station. Almost all sensory data passes here.',
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    category: 'Subcortical',
    location: 'Tongue to the roof of the mouth',
    stimulus: 'Temperature or autonomic challenge.',
    lateralization: 'Bilateral',
    pearl: 'Master of the Autonomic Nervous System and Endocrine system.',
  },
  {
    id: 'basal_ganglia',
    name: 'Basal Ganglia',
    category: 'Subcortical',
    location: 'Deep lateral skull, superior to the ear',
    stimulus: 'Initiation or cessation of movement.',
    lateralization: 'Contralateral',
    pearl: 'Movement gating and habit formation.',
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    category: 'Subcortical',
    location: 'Deep temporal lobe (anterior to ear)',
    stimulus: 'Immediate threat or fear response.',
    lateralization: 'Ipsilateral',
    pearl: 'The emotional smoke detector. Processes fear and threat.',
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    category: 'Subcortical',
    location: 'Deep temporal lobe (posterior to amygdala)',
    stimulus: 'Spatial memory or navigation task.',
    lateralization: 'Ipsilateral',
    pearl: 'Consolidation of information from short-term to long-term memory.',
  },
  {
    id: 'pineal',
    name: 'Pineal Gland',
    category: 'Subcortical',
    location: 'Tongue to the soft palate',
    stimulus: 'Light/Dark cycle visualization.',
    lateralization: 'Bilateral',
    pearl: 'Regulates circadian rhythms and melatonin.',
  },
  {
    id: 'pituitary',
    name: 'Pituitary Gland',
    category: 'Subcortical',
    location: 'Sphenoid bone / Sella Turcica area',
    stimulus: 'Endocrine/Hormonal challenge.',
    lateralization: 'Bilateral',
    pearl: 'The master gland of the endocrine system.',
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