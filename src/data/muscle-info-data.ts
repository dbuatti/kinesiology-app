"use client";

export interface MuscleInfo {
  name: string;
  brainstemControl?: string;
  clinicalIndications?: string;
  function?: string;
  kineticChain?: string;
  ligamentsJoints?: string;
  meridian?: string;
  myotome?: string;
  nerveSupply?: string;
  nutrition?: string;
  organGland?: string;
  sedationPoints?: string;
  spinalFixation?: string;
  testingPosition?: string;
  neurolymphatic?: string;
  neurovascular?: string;
  description?: string;
  videoUrl?: string;
}

export const MUSCLE_INFO_DETAILS: Record<string, MuscleInfo> = {
  'Psoas': {
    name: 'Psoas',
    brainstemControl: 'Medulla, Midbrain',
    clinicalIndications: 'Lower back pain, hip instability, shallow breathing, fear/anxiety patterns.',
    function: 'Hip flexion, trunk rotation, stabilizes lumbar spine.',
    meridian: 'Kidney',
    myotome: 'L2, L3',
    nerveSupply: 'Lumbar Plexus (L1-L3)',
    organGland: 'Kidney',
    spinalFixation: 'T10-T1',
    testingPosition: 'Client supine, leg flexed to 45°, abducted and externally rotated. Pressure applied into extension and slight adduction.',
    description: 'The "Muscle of the Soul". Deeply connected to the fight-or-flight response and diaphragmatic breathing.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  'Gluteus Medius': {
    name: 'Gluteus Medius',
    brainstemControl: 'Pons, Cerebellum',
    clinicalIndications: 'Trendelenburg gait, lateral knee pain, pelvic instability.',
    function: 'Hip abduction, stabilizes pelvis during gait.',
    meridian: 'Pericardium',
    myotome: 'L5',
    nerveSupply: 'Superior Gluteal Nerve (L4-S1)',
    organGland: 'Reproductive Organs',
    spinalFixation: 'L5-S1',
    description: 'Primary lateral stabilizer of the pelvis. Essential for efficient walking and running mechanics.'
  },
  'Supraspinatus': {
    name: 'Supraspinatus',
    brainstemControl: 'Pons, Cerebellum',
    clinicalIndications: 'Shoulder impingement, difficulty lifting arm, brain fog, thyroid issues.',
    function: 'Initiates shoulder abduction, stabilizes GH joint.',
    meridian: 'Central',
    myotome: 'C5',
    nerveSupply: 'Suprascapular Nerve (C5-C6)',
    organGland: 'Brain / Thyroid',
    spinalFixation: 'C7-T11',
    description: 'The "Starter" muscle of the shoulder. Often the first muscle to inhibit under general neurological threat.'
  },
  'Latissimus Dorsi': {
    name: 'Latissimus Dorsi',
    brainstemControl: 'Pons, Cerebellum',
    clinicalIndications: 'Mid-back pain, shoulder internal rotation issues, blood sugar swings.',
    function: 'Shoulder extension, adduction, and internal rotation.',
    meridian: 'Spleen',
    myotome: 'C6, C7, C8',
    nerveSupply: 'Thoracodorsal Nerve',
    organGland: 'Pancreas / Spleen',
    spinalFixation: 'T4-T7',
    description: 'The largest muscle of the upper body. Key indicator for metabolic and digestive stress.'
  }
};

export const getMuscleInfo = (name: string): MuscleInfo => {
  return MUSCLE_INFO_DETAILS[name] || {
    name,
    meridian: 'General',
    organGland: 'General',
    testingPosition: 'Standard muscle testing protocol applies.',
    description: 'Clinical details for this muscle are being updated.'
  };
};