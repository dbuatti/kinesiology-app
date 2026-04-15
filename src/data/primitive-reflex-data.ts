"use client";

export interface PrimitiveReflex {
  id: string;
  name: string;
  category: 'Foundational' | 'Postural' | 'Tactile';
  stimulus: string;
  inhibitionPattern: string;
  howTo: string;
  description?: string;
  pearl?: string;
  hierarchyLevel?: number;
  fractalPartners?: string[];
  clinicalSigns?: string[];
  developmentalWindow?: string;
  videoUrl?: string;
  pageUrl?: string;
}

export const PRIMITIVE_REFLEXES: PrimitiveReflex[] = [
  {
    id: 'fear-paralysis',
    name: 'Fear Paralysis',
    category: 'Foundational',
    hierarchyLevel: 1,
    developmentalWindow: "Pre-birth to 2 months",
    stimulus: 'Unexpected loud sound or sudden motion.',
    inhibitionPattern: 'Global inhibition (all muscles weak) or withdrawal response.',
    howTo: 'While working on the client (unexpectedly), make a loud sound above their head. Test a clear indicator muscle immediately.',
    description: 'The foundational OS. Linked to the Dorsal Vagus (Freeze) response. Precedes the Moro reflex.',
    pearl: 'The "Master Reflex". If this is on, many others will be active. Drives chronic adrenal issues and PTSD states.',
    clinicalSigns: ['High anxiety', 'PTSD/Trauma history', 'Immune issues', 'Sensory hypersensitivity', 'Freeze response'],
    fractalPartners: ['Moro', 'Startle'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/7d40f82dbdf33d51bdc9195adec04a9d0e8b5c7f.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167094242"
  },
  {
    id: 'moro',
    name: 'Moro Reflex',
    category: 'Foundational',
    hierarchyLevel: 2,
    developmentalWindow: "Birth to 4 months",
    stimulus: 'Quick drop of the head back into extension.',
    inhibitionPattern: 'Upper body flexors (Pec Major Clavicular) and lower body extensors (Glutes) inhibit.',
    howTo: 'With the client supine, support the head and perform a quick (but safe) drop into extension. Re-test Pec Major Clavicular.',
    description: 'The "Fight or Flight" reflex. Activated during the first breath. Mutually exclusive with the Startle reflex.',
    pearl: 'Stage 1 is extension/inhale; Stage 2 is flexion/ball. Retained Moro creates a massive constant neural load.',
    clinicalSigns: ['Adrenal fatigue', 'Poor stress tolerance', 'Emotional volatility', 'Sleep issues', 'Vestibular sensitivity'],
    fractalPartners: ['TLR', 'ATNR', 'STNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/7bee9c3cc03da234cda80dfd2f796c3a80b55414.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502429"
  },
  {
    id: 'startle',
    name: 'Startle Reflex',
    category: 'Foundational',
    hierarchyLevel: 3,
    developmentalWindow: "Emerges after Moro integration",
    stimulus: 'Quick drop of the head back into extension.',
    inhibitionPattern: 'Upper body extensors and lower body flexors (Hamstrings) inhibit.',
    howTo: 'Same stimulus as Moro. Test upper body extensors or Hamstrings. Note: Cannot be active simultaneously with Moro.',
    description: 'The "Closing" reflex. Emerges from an integrated Fear Paralysis.',
    pearl: 'Moro is about "opening," Startle is about "closing." High correlation with chronic defensive posturing.',
    clinicalSigns: ['Chronic defensive posture', 'Flexor dominance', 'Anxiety', 'Hyper-vigilance'],
    fractalPartners: ['Fear Paralysis', 'Moro'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/7bee9c3cc03da234cda80dfd2f796c3a80b55414.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502429"
  },
  {
    id: 'tlr',
    name: 'TLR (Tonic Labyrinthine)',
    category: 'Foundational',
    developmentalWindow: "Birth to 4 months",
    stimulus: 'Head into extension or flexion (Supine).',
    inhibitionPattern: 'Extension: Upper/Lower flexors inhibit. Flexion: Upper/Lower extensors inhibit.',
    howTo: 'Client supine. Move head into extension (test flexors) then flexion (test extensors). Bilateral testing is required.',
    description: 'Vestibular-driven tone regulation.',
    pearl: 'Essential for sensory mapping of the neck. Retained TLR often manifests as sleep issues or "somersaulting" sensations.',
    clinicalSigns: ['Sleep issues', 'Somersaulting sensation', 'Poor posture', 'Dizziness/Vertigo', 'Neck instability'],
    fractalPartners: ['Moro', 'ATNR', 'STNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/e408efa2796ae592f7a4e66f18c5fc3f6072865e.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502436"
  },
  {
    id: 'atnr',
    name: 'ATNR (Asymmetric Tonic Neck)',
    category: 'Postural',
    developmentalWindow: "Birth to 6 months",
    stimulus: 'Tilt head back slightly and turn to one side.',
    inhibitionPattern: 'Ipsilateral flexors inhibit; Contralateral extensors (Glutes) inhibit.',
    howTo: 'Client tilts head back and rotates to one side. Test same-side flexors (Anterior Deltoid) and opposite-side Glutes.',
    description: 'The "Fencing" reflex. Integrates eyes, hands, and environment.',
    pearl: 'Huge impact on gait and vision. A classic clinical sign is getting tired quickly when reading.',
    clinicalSigns: ['Tired when reading', 'Poor handwriting', 'Midline crossing issues', 'Uncoordinated gait', 'Functional scoliosis'],
    fractalPartners: ['Moro', 'TLR', 'STNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/896c250c771ff9c61de1176371bcaa86882f7685.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502432"
  },
  {
    id: 'stnr',
    name: 'STNR (Symmetrical Tonic Neck)',
    category: 'Postural',
    developmentalWindow: "6 to 9 months",
    stimulus: 'Head forward or back (Seated).',
    inhibitionPattern: 'Flexion: Extensors inhibit. Extension: Flexors inhibit.',
    howTo: 'Best tested SEATED. Head forward: test neck/arm extensors and hamstrings. Head back: test upper flexors and quads.',
    description: 'The "Crawling" reflex. Differentiated from TLR by being assessed in a seated position.',
    pearl: 'The "cat" reflex. Retained STNR is a major factor in poor desk posture and "W-sitting".',
    clinicalSigns: ['Poor desk posture', 'W-sitting', 'Slumping', 'Difficulty with swimming/crawling'],
    fractalPartners: ['Moro', 'TLR', 'ATNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/aabf70381b505e23b702daababd25c1cd36e94e1.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502433"
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Galant',
    category: 'Postural',
    developmentalWindow: "Birth to 9 months",
    stimulus: 'Stroke along one side of lumbar spine.',
    inhibitionPattern: 'Same side Glute inhibits; Opposite side QL inhibits.',
    howTo: 'Client prone. Stroke skin in a "C" curve from the spine outwards along the lumbar erectors. Test same-side Glute and opposite-side QL.',
    description: 'Lateral trunk flexion in response to lumbar stimulation.',
    pearl: 'Linked to bedwetting and concentration issues. In adults, manifests as functional scoliosis.',
    clinicalSigns: ['Bedwetting', 'Concentration issues', 'Functional scoliosis', 'Lower back pain', 'Fidgeting in chairs'],
    fractalPartners: ['ATNR'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/f2469cc91db04dd15d9f35717be09af96691be5d.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502438"
  },
  {
    id: 'babinski',
    name: 'Babinski',
    category: 'Tactile',
    developmentalWindow: "Birth to 2 years",
    stimulus: 'Stroke sole of foot from lateral heel upwards and across.',
    inhibitionPattern: 'Toe flexors inhibit (toes may fan into extension).',
    howTo: 'Stroke the sole starting at the lateral heel, wrapping up the edge and across the metatarsal arch. Test toe flexors.',
    description: 'Foundational for gait and grounding.',
    pearl: 'If active in adults, it "screws up" gait integration and can cause chronic ankle instability.',
    clinicalSigns: ['Ankle instability', 'Poor grounding', 'Gait dysfunction', 'Flat feet'],
    fractalPartners: ['Palmar'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/18739c5ea2d71bafc1e674974e51ad0408c2bae2.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2167502394"
  },
  {
    id: 'rooting',
    name: 'Rooting Reflex',
    category: 'Tactile',
    developmentalWindow: "Birth to 4 months",
    stimulus: 'Stroke the side of the cheek.',
    inhibitionPattern: 'Same side SCM (Sternocleidomastoid) inhibits.',
    howTo: 'Stroke the cheek near the mouth. Test the SCM on the SAME side (lift head and rotate towards the stimulus).',
    description: 'Directs the newborn towards the nipple.',
    pearl: 'Massive effect on neck/shoulder stability. Often shows up in cases of torticollis or chronic TMJ tension.',
    clinicalSigns: ['TMJ tension', 'Neck instability', 'Torticollis', 'Shoulder pain', 'Speech issues'],
    fractalPartners: ['Sucking', 'Palmar'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/41602c6f9a8558cd636f09d1f791a90095949ddc.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2170115837"
  },
  {
    id: 'palmar',
    name: 'Palmar Reflex',
    category: 'Tactile',
    developmentalWindow: "Birth to 6 months",
    stimulus: 'Pressure/stroke straight down the center of the palm.',
    inhibitionPattern: 'Finger extensors inhibit.',
    howTo: 'Apply a firm stroke straight down the center of the palm. Test the finger extensors (should inhibit if active).',
    description: 'Involuntary hand grasp. Part of the gait integration chain.',
    pearl: 'Affects manual dexterity and handwriting. The palms are part of the gait integration circuit.',
    clinicalSigns: ['Poor handwriting', 'Weak grip', 'Gait integration issues', 'Manual dexterity issues'],
    fractalPartners: ['Rooting', 'Sucking', 'Babinski'],
    videoUrl: "https://embed-ssl.wistia.com/deliveries/47c826247d5f8aa9592a5a681c8dff91feb137d3.mp4",
    pageUrl: "https://functional-neuro-health.mykajabi.com/products/functional-neuro-approach-foundations/categories/2152127437/posts/2190363557"
  },
  {
    id: 'sucking',
    name: 'Sucking Reflex',
    category: 'Tactile',
    developmentalWindow: "Birth to 4 months",
    stimulus: 'Touch the roof of the mouth (hard palate).',
    inhibitionPattern: 'Jaw and deep neck flexors inhibit.',
    howTo: 'Client (or practitioner with glove) touches the roof of the hard palate. Test jaw/neck flexors.',
    description: 'Essential for early nutrition and oral-motor development.',
    pearl: 'Often tied to the Rooting and Palmar reflexes in a fractal cluster.',
    clinicalSigns: ['TMJ issues', 'Speech difficulties', 'Swallowing issues', 'Neck tension'],
    fractalPartners: ['Rooting', 'Palmar']
  }
];