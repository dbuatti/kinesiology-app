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
}

export const MUSCLE_INFO_DETAILS: Record<string, MuscleInfo> = {
  // --- INTRINSIC STABILISATION SYSTEM ---
  'Transverse Abdominals': {
    name: 'Transverse Abdominals (TVA)',
    meridian: '',
    organGland: 'Stomach',
  },
  'Diaphragm': {
    name: 'Diaphragm',
    meridian: 'Pericardium',
    organGland: 'Stomach',
  },
  'Pelvic Floor': {
    name: 'Pelvic Floor',
    meridian: 'Bladder',
    organGland: 'Bladder',
  },
  'Multifidi': {
    name: 'Multifidi',
    meridian: 'Bladder',
    organGland: 'Kidney',
  },
  'Sacrospinalis': {
    name: 'Sacrospinalis',
    meridian: 'Bladder',
  },
  'Psoas': {
    name: 'Psoas',
    meridian: 'Kidney, Liver',
    organGland: 'Kidneys',
  },
  'Quadratus Lumborum': {
    name: 'Quadratus Lumborum',
    meridian: 'Kidney',
    organGland: 'Large Intestine',
  },
  'Erector Spinae': {
    name: 'Erector Spinae',
    meridian: '',
    organGland: 'Bladder',
  },

  // --- 14 PRIMARY MUSCLES (TFH) ---
  'Supraspinatus': {
    name: 'Supraspinatus',
    meridian: 'Central',
    organGland: 'Brain',
  },
  'Teres Major': {
    name: 'Teres Major',
    meridian: 'Governing',
    organGland: 'Spine',
  },
  'Pectoralis Major (Clavicular)': {
    name: 'Pectoralis Major (Clavicular)',
    meridian: 'Lung',
    organGland: 'Stomach',
  },
  'Latissimus Dorsi': {
    name: 'Latissimus Dorsi',
    meridian: '',
    organGland: 'Pancreas / Spleen',
  },
  'Subscapularis': {
    name: 'Subscapularis',
    meridian: '',
    organGland: 'Heart',
  },
  'Quadriceps Group': {
    name: 'Quadriceps Group',
    meridian: 'Stomach',
    organGland: 'Small Intestine',
  },
  'Peroneus Longus': {
    name: 'Peroneus Longus',
    meridian: 'Gall Bladder',
    organGland: 'Bladder',
  },
  'Gluteus Medius': {
    name: 'Gluteus Medius',
    meridian: 'Pericardium',
    organGland: 'Reproductive Organs',
  },
  'Teres Minor': {
    name: 'Teres Minor',
    meridian: '',
    organGland: 'Thyroid',
  },
  'Anterior Deltoid': {
    name: 'Anterior Deltoid',
    meridian: 'Lung',
    organGland: 'Gall Bladder',
  },
  'Pectoralis Major (Sternal)': {
    name: 'Pectoralis Major (Sternal)',
    meridian: 'Pericardium',
    organGland: 'Liver',
  },
  'Serratus Anterior': {
    name: 'Serratus Anterior',
    meridian: 'Pericardium',
    organGland: 'Lungs',
  },
  'Middle Trapezius': {
    name: 'Middle Trapezius',
    meridian: '',
    organGland: 'Spleen',
  },

  // --- FACIAL & CRANIAL ---
  'Buccinator': {
    name: 'Buccinator',
    meridian: '',
    organGland: 'Glucagon/Pancreas',
  },
  'Masseter': {
    name: 'Masseter',
    meridian: '',
    organGland: 'Thymus',
  },
  'External Pterygoid': {
    name: 'External Pterygoid',
    meridian: '',
    organGland: 'Post Pituitary',
  },
  'Orbicularis Oris': {
    name: 'Orbicularis Oris',
    meridian: '',
    organGland: 'Exocrine Pancreas',
  },
  'Occipitalis': {
    name: 'Occipitalis',
    meridian: '',
    organGland: 'Thalamus',
  },

  // --- LOWER BODY ---
  'Vastus Lateralis': {
    name: 'Vastus Lateralis',
    meridian: '',
    organGland: 'Heart',
  },
  'Hamstrings': {
    name: 'Hamstrings',
    meridian: 'Bladder',
    organGland: 'Large Intestine',
  },
  'Tensor Fasciae Latae (TFL)': {
    name: 'Tensor Fasciae Latae (TFL)',
    meridian: 'Gall Bladder',
    organGland: 'Large Intestine (Sigmoid Colon)',
  },
  'Gluteus Maximus': {
    name: 'Gluteus Maximus',
    meridian: 'Bladder',
    organGland: 'Ascending Colon',
  },
  'Piriformis': {
    name: 'Piriformis',
    meridian: 'Gall Bladder, Pericardium',
    organGland: 'Adrenal Medulla',
  },
  'Flexor Hallucis Longus': {
    name: 'Flexor Hallucis Longus',
    meridian: '',
    organGland: 'Adrenal Cortex',
  },
  'Tibialis Anterior': {
    name: 'Tibialis Anterior',
    meridian: 'Stomach',
    organGland: 'Bladder',
  },
  'Sartorius': {
    name: 'Sartorius',
    meridian: 'Spleen',
    organGland: 'Adrenals',
  },
  'Gracilis': {
    name: 'Gracilis',
    meridian: 'Liver',
    organGland: 'Adrenals',
  },
  'Soleus': {
    name: 'Soleus',
    meridian: 'Bladder',
    organGland: 'Adrenals',
  },
  'Gastrocnemius': {
    name: 'Gastrocnemius',
    meridian: 'Bladder',
    organGland: 'Adrenals',
  },
  'Popliteus': {
    name: 'Popliteus',
    meridian: 'Bladder',
    organGland: 'Gall Bladder',
  },
  'Tibialis Posterior': {
    name: 'Tibialis Posterior',
    meridian: 'Gall Bladder',
    organGland: 'Bladder',
  },
  'Infraspinatus': {
    name: 'Infraspinatus',
    meridian: 'Small Intestine, San Jiao',
    organGland: 'Thyroid',
  },
  'Rhomboids': {
    name: 'Rhomboids',
    meridian: '',
    organGland: 'Liver',
  },
  'Levator Scapula': {
    name: 'Levator Scapula',
    meridian: 'Small Intestine',
    organGland: 'Stomach',
  },
  'Upper Trapezius': {
    name: 'Upper Trapezius',
    meridian: 'Lung',
    organGland: 'Kidneys',
  },
  'Lower Trapezius': {
    name: 'Lower Trapezius',
    meridian: '',
    organGland: 'Spleen',
  },
  'Biceps': {
    name: 'Biceps',
    meridian: 'Pericardium',
    organGland: 'Stomach',
  },
  'Triceps': {
    name: 'Triceps',
    meridian: 'Small Intestine',
    organGland: 'Spleen/Pancreas',
  },
  'Middle Deltoid': {
    name: 'Middle Deltoid',
    meridian: 'Large Intestine',
    organGland: 'Heart',
  },
  'SCM': {
    name: 'Sternocleidomastoid (SCM)',
    meridian: '',
    organGland: 'Stomach',
  },
  'Scalenes': {
    name: 'Scalenes',
    meridian: '',
    organGland: 'Stomach',
  },
  'Pec Minor': {
    name: 'Pec Minor',
    meridian: 'Lung',
    organGland: 'Lungs',
  },
  'Rectus Abdominals': {
    name: 'Rectus Abdominals',
    meridian: 'Stomach, Kidney',
    organGland: 'Kidneys',
  },
  'Neck Extensors': {
    name: 'Neck Extensors',
    meridian: '',
    organGland: 'Stomach',
  },
  'Adductors': {
    name: 'Adductors',
    meridian: 'Kidney',
    organGland: 'Adrenals',
  },
  'Gluteus Minimus': {
    name: 'Gluteus Minimus',
    meridian: '',
    organGland: 'Reproductive Organs',
  },
  'Posterior Deltoid': {
    name: 'Posterior Deltoid',
    meridian: 'San Jiao',
    organGland: 'Lung',
  },
  'Rec Fem': {
    name: 'Rec Fem',
    meridian: 'Stomach',
  },
  'VMO': {
    name: 'VMO',
    meridian: 'Stomach',
  }
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