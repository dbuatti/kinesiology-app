export interface MuscleInfo {
  name: string;
  meridian: string;
  organ: string;
  testingPosition: string;
  neurolymphatic: string;
  neurovascular: string;
  nutrition?: string;
}

export const MUSCLE_INFO_DETAILS: Record<string, MuscleInfo> = {
  'Supraspinatus': {
    name: 'Supraspinatus',
    meridian: 'Conception Vessel (CV)',
    organ: 'Brain',
    testingPosition: 'Arm at 45° to the body, thumb pointing towards the hip. Pressure is applied downwards on the forearm.',
    neurolymphatic: 'K27 (below clavicle) and CV24 (chin).',
    neurovascular: 'Bregma (top of head).',
    nutrition: 'RNA/DNA, Water.'
  },
  'Psoas': {
    name: 'Psoas',
    meridian: 'Kidney',
    organ: 'Kidney',
    testingPosition: 'Leg lifted to 45°, turned out 45°. Pressure is applied against the ankle, pushing the leg down and out.',
    neurolymphatic: '1 inch above and 1 inch lateral to the navel.',
    neurovascular: 'On the jaw, just in front of the ear.',
    nutrition: 'Vitamin A, Water.'
  },
  'Subscapularis': {
    name: 'Subscapularis',
    meridian: 'Heart',
    organ: 'Heart',
    testingPosition: 'Arm at side, elbow bent 90°. Pressure is applied to the wrist, pulling the arm away from the body (external rotation).',
    neurolymphatic: '2nd intercostal space, next to the sternum.',
    neurovascular: 'Frontal eminences (forehead).',
    nutrition: 'Vitamin B, Vitamin G.'
  },
  'Quadriceps Group': {
    name: 'Quadriceps Group',
    meridian: 'Small Intestine',
    organ: 'Small Intestine',
    testingPosition: 'Leg straight, lifted 45°. Pressure is applied to the thigh, pushing downwards.',
    neurolymphatic: 'Along the lower border of the rib cage.',
    neurovascular: 'Behind the ear on the mastoid process.',
    nutrition: 'Vitamin D, Calcium.'
  },
  'Gluteus Medius': {
    name: 'Gluteus Medius',
    meridian: 'Circulation/Sex (Pericardium)',
    organ: 'Reproductive Organs',
    testingPosition: 'Leg lifted 45° and moved out to the side. Pressure is applied to the ankle, pushing the leg back towards the midline.',
    neurolymphatic: 'Along the outer edge of the pubic bone.',
    neurovascular: 'On the side of the head, above the ear.',
    nutrition: 'Vitamin E, Zinc.'
  },
  // Fallback for muscles not yet detailed
};

export const getMuscleInfo = (name: string): MuscleInfo => {
  return MUSCLE_INFO_DETAILS[name] || {
    name,
    meridian: 'General',
    organ: 'General',
    testingPosition: 'Standard muscle testing protocol applies.',
    neurolymphatic: 'Check standard charts for this muscle.',
    neurovascular: 'Check standard charts for this muscle.',
  };
};