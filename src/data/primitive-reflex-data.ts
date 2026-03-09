"use client";

export interface PrimitiveReflex {
  id: string;
  name: string;
  category: 'Foundational' | 'Postural' | 'Tactile';
  stimulus: string;
  inhibitionPattern: string;
  description?: string;
  pearl?: string;
}

export const PRIMITIVE_REFLEXES: PrimitiveReflex[] = [
  {
    id: 'fear-paralysis',
    name: 'Fear Paralysis',
    category: 'Foundational',
    stimulus: 'Any unexpected stimulus (sound, motion, tap etc).',
    inhibitionPattern: 'Withdrawal from stimulus or Global inhibition.',
    description: 'A withdrawal reflex that precedes the Moro reflex. Foundational for all other integration.',
    pearl: 'The most foundational reflex. If not integrated, the system remains in a state of high "threat," making other corrections temporary. Essential for anxiety and PTSD cases.'
  },
  {
    id: 'moro',
    name: 'Moro Reflex',
    category: 'Foundational',
    stimulus: 'Gently but suddenly lower head.',
    inhibitionPattern: 'PMC (Pectoralis Major Clavicular) and neck extensors inhibit.',
    description: 'The "fight or flight" reflex. A primitive response to a sudden change in sensory input.',
    pearl: 'Retained Moro keeps the adrenal glands on high alert. Often seen in clients with sensory processing issues, allergies, and poor emotional regulation.'
  },
  {
    id: 'startle',
    name: 'Startle Reflex',
    category: 'Foundational',
    stimulus: 'Gently but suddenly lower head.',
    inhibitionPattern: 'Lats, posterior delt and neck flexors inhibit.',
    description: 'Often confused with Moro, but involves different muscle inhibition patterns.',
    pearl: 'While Moro is about "opening," Startle is about "closing." High correlation with chronic shoulder tension and defensive posturing.'
  },
  {
    id: 'tlr',
    name: 'TLR (Tonic Labyrinthine)',
    category: 'Foundational',
    stimulus: 'Supine: actively flex or extend BOTH head and lumbar spine.',
    inhibitionPattern: 'Flexion: All extensors inhibit. Extension: All flexors inhibit.',
    description: 'Head position in space affects overall muscle tone via the vestibular system.',
    pearl: 'The foundation for balance and spatial orientation. Retained TLR often manifests as "slumping" posture or walking on toes.'
  },
  {
    id: 'landau',
    name: 'Landau Reflex',
    category: 'Postural',
    stimulus: 'Suspension in prone (or imagining being suspended).',
    inhibitionPattern: 'Neck, back, and hip extensors inhibit.',
    description: 'The "superman" reflex. Emerges at 3 months to help integrate TLR.',
    pearl: 'Critical for developing spinal extension. If weak, the client may struggle with "core" stability and have a flat lumbar curve.'
  },
  {
    id: 'stnr',
    name: 'STNR (Symmetrical Tonic Neck)',
    category: 'Postural',
    stimulus: '1. Neck forward from seated. 2. Tip neck backward from seated.',
    inhibitionPattern: 'Stim 1: Neck/arm extensors and leg flexors inhibit. Stim 2: Neck/arm flexors and leg extensors inhibit.',
    description: 'Head position triggers symmetrical limb responses.',
    pearl: 'The "cat" reflex. Essential for learning to crawl. Retained STNR is a major factor in poor posture at desks and "W-sitting" in children.'
  },
  {
    id: 'atnr',
    name: 'ATNR (Asymmetric Tonic Neck)',
    category: 'Postural',
    stimulus: 'Turn head and eyes to one side with head in slight extension.',
    inhibitionPattern: 'Inhibition of ipsilateral flexors and contralateral extensors.',
    description: 'The "fencing" reflex. Head rotation triggers limb extension on the face side.',
    pearl: 'Crucial for hand-eye coordination and crossing the midline. Retained ATNR often correlates with dyslexia and poor lateral tracking.'
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Galant',
    category: 'Postural',
    stimulus: 'Stroke along one side of spine from scapula to sacrum.',
    inhibitionPattern: 'Ipsilateral hip curves up; inhibition of ipsilateral hip extensors and contralateral QL.',
    description: 'Lateral trunk flexion in response to lumbar stimulation.',
    pearl: 'Highly linked to "fidgety" behavior and bedwetting. In adults, it can cause chronic one-sided lower back pain.'
  },
  {
    id: 'perez',
    name: 'Perez Reflex',
    category: 'Postural',
    stimulus: 'Stroke from sacrum to neck along the spine.',
    inhibitionPattern: 'Global inhibition or specific spinal extensor collapse.',
    description: 'A whole-body response to spinal stimulation.',
    pearl: 'Closely related to the Spinal Galant. Essential for spinal cord drainage and neurological "flow."'
  },
  {
    id: 'babinski',
    name: 'Babinski',
    category: 'Tactile',
    stimulus: 'Stroke from lateral heel upwards towards ball of foot.',
    inhibitionPattern: 'Toes fan up and out; inhibition of toe flexors.',
    description: 'Toe extension in response to stimulation of the sole of the foot.',
    pearl: 'Affects grounding and gait. Retained Babinski is often found in clients with chronic ankle instability or "flat feet."'
  },
  {
    id: 'rooting',
    name: 'Rooting Reflex',
    category: 'Tactile',
    stimulus: 'Stroke side of cheek.',
    inhibitionPattern: 'Head turns towards stimulus; inhibits ipsilateral SCM.',
    description: 'Head rotation in response to touch on the cheek.',
    pearl: 'Can cause chronic jaw tension (TMJ) and speech difficulties. Often linked to hypersensitivity to touch around the face.'
  },
  {
    id: 'sucking',
    name: 'Sucking Reflex',
    category: 'Tactile',
    stimulus: 'Touch the roof of the mouth (hard palate).',
    inhibitionPattern: 'Inhibition of jaw and deep neck flexors.',
    description: 'Automatic sucking response to oral stimulation.',
    pearl: 'Essential for early nutrition. In adults, a retained sucking reflex can manifest as involuntary tongue movements or speech impediments.'
  },
  {
    id: 'palmar',
    name: 'Palmar Reflex',
    category: 'Tactile',
    stimulus: 'Apply pressure to the palm.',
    inhibitionPattern: 'Involuntary hand grasp; inhibition of finger extensors.',
    description: 'Involuntary hand grasp in response to pressure on the palm.',
    pearl: 'Retained Palmar reflex affects manual dexterity and handwriting. There is a strong neurological link between hand movements and speech.'
  }
];