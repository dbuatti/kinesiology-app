"use client";

export interface PrimitiveReflex {
  id: string;
  name: string;
  category: 'Foundational' | 'Postural' | 'Tactile';
  stimulus: string;
  inhibitionPattern: string;
  description?: string;
  pearl?: string;
  hierarchyLevel?: number;
}

export const PRIMITIVE_REFLEXES: PrimitiveReflex[] = [
  {
    id: 'fear-paralysis',
    name: 'Fear Paralysis',
    category: 'Foundational',
    hierarchyLevel: 1,
    stimulus: 'Unexpected loud sound or sudden motion (client must not be expecting it).',
    inhibitionPattern: 'Global inhibition (all muscles momentarily weak) or a withdrawal response.',
    description: 'The "Master Reflex" and foundational OS. Linked to the Dorsal Vagus (Freeze) response. Precedes the Moro reflex.',
    pearl: 'If this is on, many other reflexes will be active. It drives chronic adrenal issues, PTSD, and "freeze" states. Clearing this often cascades through the entire hierarchy.'
  },
  {
    id: 'moro',
    name: 'Moro Reflex',
    category: 'Foundational',
    hierarchyLevel: 2,
    stimulus: 'Quick drop of the head back into extension (Vestibular challenge).',
    inhibitionPattern: 'Upper body flexors (Pec Major Clavicular) and lower body extensors (Glutes) inhibit.',
    description: 'The "Fight or Flight" reflex. Activated during the first breath. Mutually exclusive with the Startle reflex.',
    pearl: 'Stage 1 is extension/inhale; Stage 2 is flexion/ball. Retained Moro keeps the system in a high neural load, making life "harder" and requiring constant compensation.'
  },
  {
    id: 'startle',
    name: 'Startle Reflex',
    category: 'Foundational',
    hierarchyLevel: 3,
    stimulus: 'Quick drop of the head back into extension.',
    inhibitionPattern: 'Upper body extensors and lower body flexors (Hamstrings) inhibit.',
    description: 'The "Closing" reflex. Emerges from an integrated Fear Paralysis. Cannot be active simultaneously with Moro.',
    pearl: 'While Moro is about "opening," Startle is about "closing." High correlation with chronic defensive posturing and shoulder tension.'
  },
  {
    id: 'tlr',
    name: 'TLR (Tonic Labyrinthine)',
    category: 'Foundational',
    stimulus: 'Supine: Head into extension (Flexors inhibit) or Head into flexion (Extensors inhibit).',
    inhibitionPattern: 'Extension: Upper/Lower flexors inhibit. Flexion: Upper/Lower extensors inhibit.',
    description: 'Head position in space affects overall muscle tone via the vestibular system (inner ear).',
    pearl: 'Essential for sensory mapping of the neck. Retained TLR often manifests as sleep issues (triggering when head tilts back) or "somersaulting" sensations when lying down.'
  },
  {
    id: 'atnr',
    name: 'ATNR (Asymmetric Tonic Neck)',
    category: 'Postural',
    stimulus: 'Tilt head back slightly and turn to one side.',
    inhibitionPattern: 'Ipsilateral (same side) flexors inhibit; Contralateral (opposite side) extensors (Glutes) inhibit.',
    description: 'The "Fencing" reflex. Integrates eyes, hands, and environment. Crucial for crossing the midline.',
    pearl: 'Huge impact on gait and vision. A classic clinical sign is getting tired quickly when reading. If the brain can\'t integrate left/right, it affects the ability to withstand stress.'
  },
  {
    id: 'stnr',
    name: 'STNR (Symmetrical Tonic Neck)',
    category: 'Postural',
    stimulus: 'Seated: Head forward (Neck/arm extensors & leg flexors inhibit) or Head back (Upper flexors & Quads inhibit).',
    inhibitionPattern: 'Flexion: Extensors inhibit. Extension: Flexors inhibit.',
    description: 'The "Crawling" reflex. Differentiated from TLR by being assessed in a seated position.',
    pearl: 'The "cat" reflex. Essential for learning to crawl. Retained STNR is a major factor in poor desk posture and "W-sitting".'
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Galant',
    category: 'Postural',
    stimulus: 'Prone: Stroke along one side of lumbar spine in a "C" curve (towards spine and out).',
    inhibitionPattern: 'Same side Glute inhibits; Opposite side QL (Quadratus Lumborum) inhibits.',
    description: 'Lateral trunk flexion in response to lumbar stimulation. Related to the lumbar plexus.',
    pearl: 'Linked to bedwetting and concentration issues in children. In adults, it manifests as functional scoliosis or chronic one-sided low back pain.'
  },
  {
    id: 'babinski',
    name: 'Babinski',
    category: 'Tactile',
    stimulus: 'Stroke sole of foot from lateral heel upwards and across the metatarsal arch.',
    inhibitionPattern: 'Toe flexors inhibit (toes may visibly fan into extension).',
    description: 'Foundational for gait and grounding. Affects how the foot hits the floor.',
    pearl: 'If active in adults, it "screws up" gait integration and can cause chronic ankle instability or "flat feet" sensations.'
  },
  {
    id: 'rooting',
    name: 'Rooting Reflex',
    category: 'Tactile',
    stimulus: 'Stroke the side of the cheek.',
    inhibitionPattern: 'Same side SCM (Sternocleidomastoid) inhibits.',
    description: 'Directs the newborn towards the nipple. Initiates head rotation.',
    pearl: 'Massive effect on neck/shoulder stability. Often shows up in cases of torticollis, cervical dystonia, or chronic TMJ tension. Correction is often bottom-up (vestibular).'
  },
  {
    id: 'palmar',
    name: 'Palmar Reflex',
    category: 'Tactile',
    stimulus: 'Apply pressure/stroke straight down the center of the palm.',
    inhibitionPattern: 'Finger extensors inhibit (facilitates finger flexors).',
    description: 'Involuntary hand grasp. Part of the gait integration chain.',
    pearl: 'Affects manual dexterity and handwriting. Because the palms are part of gait, this reflex can disrupt overall locomotion integration.'
  },
  {
    id: 'sucking',
    name: 'Sucking Reflex',
    category: 'Tactile',
    stimulus: 'Touch the roof of the mouth (hard palate).',
    inhibitionPattern: 'Jaw and deep neck flexors inhibit.',
    description: 'Essential for early nutrition and oral-motor development.',
    pearl: 'Often tied to the Rooting and Palmar reflexes in a fractal cluster. Can manifest as speech impediments or chronic jaw tension.'
  }
];