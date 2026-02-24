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
  'Neck Extensors': {
    name: 'Neck Extensors',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Stomach, Sinus',
    meridian: 'Stomach',
  },
  'Scalenes': {
    name: 'Scalenes',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Stomach',
  },
  'Biceps': {
    name: 'Biceps',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Pericardium',
  },
  'Supraspinatus': {
    name: 'Supraspinatus',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Thyroid, Brain',
    spinalFixation: 'C7-T11',
    meridian: 'Central',
  },
  'Rhomboids': {
    name: 'Rhomboids',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Liver',
    spinalFixation: 'T3-T8',
    meridian: 'Liver',
  },
  'Triceps': {
    name: 'Triceps',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Spleen/Pancreas',
    meridian: 'Small Intestine',
  },
  'Upper Trapezius': {
    name: 'Upper Trapezius',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Kidneys',
    meridian: 'Lung',
  },
  'Teres Major': {
    name: 'Teres Major',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Spine',
    meridian: 'Governing',
  },
  'Sternocleidomastoid (SCM)': {
    name: 'SCM',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Stomach',
  },
  'Anterior Deltoid': {
    name: 'Anterior Deltoid',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Gall Bladder',
    meridian: 'Lung',
  },
  'Lower Trapezius': {
    name: 'Lower Trapezius',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Spleen',
    meridian: 'Spleen',
  },
  'Middle Deltoid': {
    name: 'Middle Deltoid',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Heart',
    meridian: 'Large Intestine',
  },
  'Infraspinatus': {
    name: 'Infraspinatus',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Thymus',
    meridian: 'Small Intestine, San Jiao',
  },
  'Deep Neck Flexors': {
    name: 'Deep Neck Flexors',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach, Sinus',
    meridian: 'Stomach',
  },
  'Pectoralis Major (Sternal)': {
    name: 'Pec Major Sternal',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Liver',
    spinalFixation: 'T8-T3',
    meridian: 'Pericardium',
  },
  'Subscapularis': {
    name: 'Subscapularis',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Hypothalamus, Heart',
    spinalFixation: 'C4-L2',
    meridian: '',
  },
  'Pectoralis Major (Clavicular)': {
    name: 'Pec Major Clavicular',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    spinalFixation: 'T6-T5',
    meridian: 'Lung',
  },
  'Posterior Deltoid': {
    name: 'Posterior Deltoid',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Lungs',
    meridian: 'San Jiao',
  },
  'Pec Minor': {
    name: 'Pec Minor',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Parotid Gland',
    meridian: 'Lung',
  },
  'Levator Scapula': {
    name: 'Levator Scapula',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Parathyroid',
    meridian: 'Small Intestine',
  },
  'Teres Minor': {
    name: 'Teres Minor',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Thyroid',
    meridian: '',
  },
  'Latissimus Dorsi': {
    name: 'Latissimus Dorsi',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Pancreas',
    spinalFixation: 'T4-T7',
    meridian: 'Spleen',
  },
  'Middle Trapezius': {
    name: 'Middle Trapezius',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Spleen',
    meridian: '',
  },
  'Sacrospinalis': {
    name: 'Sacrospinalis',
    brainstemControl: 'Pons, Cerebellum',
    meridian: 'Bladder',
    description: 'Part of the erector spinae group, essential for maintaining upright posture and spinal extension.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Multifidi': {
    name: 'Multifidi',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Kidney',
    meridian: 'Bladder',
    description: 'Deep spinal muscles that provide segmental stability and control of the vertebrae.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Pelvic Floor (Anterior)': {
    name: 'Anterior PF',
    organGland: 'Bladder',
    meridian: 'Bladder',
    description: 'A group of muscles that support the pelvic organs and contribute to core stability and continence.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Erector Spinae': {
    name: 'Erector Spinae',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Bladder',
    spinalFixation: 'L1-C5',
    meridian: 'Bladder',
    description: 'A set of muscles that straighten and rotate the back.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Diaphragm': {
    name: 'Diaphragm',
    brainstemControl: 'Medulla, Pons',
    organGland: 'Stomach',
    spinalFixation: 'C3-L3',
    meridian: 'Pericardium',
    description: 'The primary muscle of respiration, also playing a critical role in core stability and intra-abdominal pressure regulation.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Pelvic Floor (Posterior)': {
    name: 'Posterior PF',
    organGland: 'Bladder',
    meridian: 'Bladder',
    description: 'The posterior portion of the pelvic floor muscles, providing support and stability.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Internal Obs': {
    name: 'Internal Obliques',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Stomach',
    description: 'Abdominal muscles that assist in forced respiration and trunk rotation.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Serratus Anterior': {
    name: 'Serratus Anterior',
    brainstemControl: 'Medulla, Midbrain',
    meridian: 'Pericardium',
    description: 'Muscle that pulls the scapula forward around the thorax.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'External Obs': {
    name: 'External Obliques',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Stomach',
    description: 'The largest and outermost of the three flat abdominal muscles.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Transverse Abdominals': {
    name: 'TVA',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Stomach',
    description: 'The deepest of the abdominal muscles, acting as a natural corset to provide stability to the spine and pelvis.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  'Rectus Abdominals': {
    name: 'Rectus Abdominals',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Stomach',
    meridian: 'Stomach, Kidney',
  },
  'Quadratus Lumborum': {
    name: 'QL',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Large Intestine',
    spinalFixation: 'T12-C6',
    meridian: 'Kidney',
  },
  'Flexor Digitorum Longus': {
    name: 'FDL',
    brainstemControl: 'Medulla, Midbrain',
  },
  'Hamstrings': {
    name: 'Hamstrings',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Large Intestine',
    spinalFixation: 'L5-C1',
    meridian: 'Bladder',
  },
  'Popliteus': {
    name: 'Popliteus',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Gall Bladder',
    meridian: 'Bladder',
  },
  'Adductors': {
    name: 'Adductors',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Reproductive',
    meridian: 'Kidney, Pericardium',
  },
  'Soleus': {
    name: 'Soleus',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Adrenals',
    meridian: 'Bladder, San Jiao',
  },
  'Gracilis': {
    name: 'Gracilis',
    organGland: 'Rectum',
    meridian: 'Liver',
  },
  'Psoas': {
    name: 'Psoas',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Kidneys',
    spinalFixation: 'T10-T1',
    meridian: 'Kidney, Liver',
  },
  'Quadriceps Group': {
    name: 'Quads',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Small Intestine',
    meridian: 'Stomach',
  },
  'Tibialis Anterior': {
    name: 'Tibialis Anterior',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Bladder',
    spinalFixation: 'L4-C2',
    meridian: 'Stomach, Bladder',
  },
  'Gastrocnemius': {
    name: 'Gastrocnemius',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Adrenals',
    meridian: 'Bladder, San Jiao',
  },
  'Tensor Fasciae Latae (TFL)': {
    name: 'TFL',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Large Intestine (Sigmoid Colon)',
    spinalFixation: 'L2-C4',
    meridian: 'Gall Bladder',
  },
  'Flexor Hallucis Longus': {
    name: 'FHL',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Adrenal Cortex',
    spinalFixation: 'T11-C7',
    meridian: 'San Jiao',
  },
  'Sartorius': {
    name: 'Sartorius',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Adrenal Cortex',
    meridian: 'Spleen, San Jiao',
  },
  'Rec Fem': {
    name: 'Rec Fem',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Small Intestine',
    meridian: 'Stomach',
  },
  'Vastus Lateralis': {
    name: 'Vastus Lateralis',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Heart',
    spinalFixation: 'T2-T9',
    meridian: 'Heart',
  },
  'Piriformis': {
    name: 'Piriformis',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Adrenal Medulla',
    spinalFixation: 'T9-T2',
    meridian: 'Gall Bladder, Pericardium',
  },
  'Gluteus Maximus': {
    name: 'Glute Max',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Ascending Colon',
    spinalFixation: 'L3-C3',
    meridian: 'Bladder',
  },
  'Gluteus Minimus': {
    name: 'Glute Minimus',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Adrenal Medulla',
    meridian: 'Pericardium',
  },
  'Tibialis Posterior': {
    name: 'Tibialis Posterior',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Adrenals',
    meridian: 'Gall Bladder, San Jiao',
  },
  'Fibularis Longus': {
    name: 'Fibularis Longus',
    organGland: 'Bladder',
    meridian: 'Bladder',
  },
  'VMO': {
    name: 'VMO',
    brainstemControl: 'Medulla, Midbrain',
    organGland: 'Small Intestine',
    meridian: 'Stomach',
  },
  'Gluteus Medius': {
    name: 'Glute Med',
    brainstemControl: 'Pons, Cerebellum',
    organGland: 'Reproductive',
    meridian: 'Pericardium',
  },
};

export const getMuscleInfo = (name: string): MuscleInfo => {
  return MUSCLE_INFO_DETAILS[name] || {
    name,
    meridian: 'General',
    organGland: 'General',
    testingPosition: 'Standard muscle testing protocol applies.',
    neurolymphatic: 'Check standard charts for this muscle.',
    neurovascular: 'Check standard charts for this muscle.',
  };
};