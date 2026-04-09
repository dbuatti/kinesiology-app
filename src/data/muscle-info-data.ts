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
  pageUrl?: string;
  pearl?: string;
}

export const MUSCLE_INFO_DETAILS: Record<string, MuscleInfo> = {
  'Sternocleidomastoid (SCM)': {
    name: 'Sternocleidomastoid (SCM)',
    brainstemControl: 'Medulla (CN XI)',
    clinicalIndications: 'Neck pain, headaches, torticollis, balance issues, visual tracking difficulties.',
    function: 'Flexes the neck, rotates head to opposite side, tilts head to same side.',
    meridian: 'Stomach',
    myotome: 'C2, C3',
    nerveSupply: 'Accessory Nerve (CN XI) and C2-C3 spinal nerves',
    organGland: 'Sinuses / Stomach',
    spinalFixation: 'C2-C3',
    testingPosition: 'Client supine. Drop the head down (flexion) and rotate the head away from the side being tested. Practitioner applies pressure to the temporal area, pushing the head back towards the table and into rotation.',
    pearl: 'After testing, "squeeze through here" (the muscle belly and associated NL points) to check for immediate neurological shift or tenderness.',
    description: 'A key muscle for head orientation and a major player in the Medulla-driven flexor tone chain.'
  },
  'Upper Trapezius': {
    name: 'Upper Trapezius',
    brainstemControl: 'Medulla (CN XI)',
    clinicalIndications: 'Shoulder tension, "carrying the weight of the world", shallow breathing, neck stiffness.',
    function: 'Elevates the scapula, rotates the head to the opposite side.',
    meridian: 'Lung',
    myotome: 'C3, C4',
    nerveSupply: 'Accessory Nerve (CN XI) and C3-C4 spinal nerves',
    organGland: 'Lung / Eyes',
    spinalFixation: 'C3-C4',
    testingPosition: 'Primary: Shrug shoulder up, rotate head away, bring them together; practitioner pulls apart. Alternate: Lift the shoulder girdle vertically and test for lock.',
    pearl: 'The alternate vertical lift method allows you to test the Upper Trapezius "like an indicator" to check general system integrity.',
    description: 'The primary "stress" muscle. Closely linked to the Lung meridian and the body\'s ability to take in Qi and release grief.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/8dc68372fa942300d450b03ec8487454cacb02c7.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166647725"
  },
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
  },
  'Transverse Abdominals': {
    name: 'Transverse Abdominals',
    meridian: 'Stomach',
    testingPosition: 'Client supine, knees bent. Lift head and shoulders slightly. Practitioner applies pressure to the abdomen.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/06654b19dfccfcb0bf7333a032825f4a.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166239953"
  },
  'Diaphragm': {
    name: 'Diaphragm',
    meridian: 'Pericardium',
    testingPosition: 'Assessment of breathing mechanics and ribcage expansion.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/9813e62a13a7ef09e17f7a16e5ca810b096b5ed2.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833384"
  },
  'Multifidi': {
    name: 'Multifidi',
    meridian: 'Bladder',
    testingPosition: 'Client prone, lifting opposite arm and leg.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/2630882e5679cf0ec3b82ea50047b8490aeebf16.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167418078"
  },
  'Sacrospinalis': {
    name: 'Sacrospinalis',
    meridian: 'Bladder',
    testingPosition: 'Client prone, lifting upper body.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/67f55210add07eaec9dbcde9a093d5e8589d3a37.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167833389"
  },
  'Quadriceps Group': {
    name: 'Quadriceps Group',
    meridian: 'Stomach',
    testingPosition: 'Client supine, leg extended. Practitioner applies pressure into flexion.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e3568b13d3b8ecaa2e2c7e363a064435.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2166288733"
  },
  'Biceps': {
    name: 'Biceps',
    meridian: 'Stomach',
    testingPosition: 'Elbow flexion with supination.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/006270ae8c685161a8a2c55053ee0fd5ecf69b18.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167503394"
  },
  'Triceps': {
    name: 'Triceps',
    meridian: 'Small Intestine',
    testingPosition: 'Elbow extension.',
    videoUrl: "https://embed-ssl.wistia.com/deliveries/006270ae8c685161a8a2c55053ee0fd5ecf69b18.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152591139/posts/2167503394"
  }
};

export const getMuscleInfo = (name: string): MuscleInfo => {
  const baseName = name.replace(/ \([LR]\)$/, '');
  if (MUSCLE_INFO_DETAILS[baseName]) return MUSCLE_INFO_DETAILS[baseName];
  const foundKey = Object.keys(MUSCLE_INFO_DETAILS).find(k => k.includes(baseName) || baseName.includes(k));
  return foundKey ? MUSCLE_INFO_DETAILS[foundKey] : {
    name: baseName,
    meridian: 'General',
    organGland: 'General',
    testingPosition: 'Standard muscle testing protocol applies.',
    description: 'Clinical details for this muscle are being updated.'
  };
};