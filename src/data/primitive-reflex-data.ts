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
    fractalPartners: ['Moro', 'Startle']
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
    fractalPartners: ['TLR', 'ATNR', 'STNR']
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
    fractalPartners: ['Fear Paralysis', 'Moro']
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
    fractalPartners: ['Moro', 'ATNR', 'STNR']
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
    fractalPartners: ['Moro', 'TLR', 'STNR']
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
    fractalPartners: ['Moro', 'TLR', 'ATNR']
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Galant',
    category: 'Postural',
    developmentalWindow: "Birth to 9 months",
    stimulus: 'Stroke along one side of lumbar spine.',
    inhibitionPattern: 'Same side Glute inhibits; Opposite side QL inhibits.',
    howTo: 'Client prone. Stroke skin in a "C" curve from the spine outwards along the lumbar erectors. Test same-side Glute.',
    description: 'Lateral trunk flexion in response to lumbar stimulation.',
    pearl: 'Linked to bedwetting and concentration issues. In adults, manifests as functional scoliosis.',
    clinicalSigns: ['Bedwetting', 'Concentration issues', 'Functional scoliosis', 'Lower back pain', 'Fidgeting in chairs'],
    fractalPartners: ['ATNR']
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
    fractalPartners: ['Palmar']
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
    fractalPartners: ['Sucking', 'Palmar']
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
    fractalPartners: ['Rooting', 'Sucking', 'Babinski']
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