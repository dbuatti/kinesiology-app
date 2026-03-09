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
    pearl: 'The most foundational reflex. If not integrated, other reflexes are harder to clear. Sets the baseline for safety in the nervous system.'
  },
  {
    id: 'moro',
    name: 'Moro Reflex',
    category: 'Foundational',
    stimulus: 'Gently but suddenly lower head.',
    inhibitionPattern: 'PMC (Pectoralis Major Clavicular) and neck extensors inhibit.',
    description: 'The "fight or flight" reflex. A primitive response to a sudden change in sensory input.',
    pearl: 'If retained, the client may be in a constant state of high SNS arousal, affecting emotional and cognitive development.'
  },
  {
    id: 'startle',
    name: 'Startle Reflex',
    category: 'Foundational',
    stimulus: 'Gently but suddenly lower head.',
    inhibitionPattern: 'Lats, posterior delt and neck flexors inhibit.',
    description: 'Often confused with Moro, but involves different muscle inhibition patterns.',
    pearl: 'Check both Moro and Startle if the client is easily overwhelmed by sensory input or has chronic shoulder/neck tension.'
  },
  {
    id: 'stnr',
    name: 'STNR (Symmetrical Tonic Neck Righting)',
    category: 'Postural',
    stimulus: '1. Neck forward from seated. 2. Tip neck backward from seated.',
    inhibitionPattern: 'Stim 1: Neck extensors, arm extensors and leg flexors inhibit. Stim 2: Neck flexors, arm flexors and leg extensors inhibit.',
    description: 'Head position triggers symmetrical limb responses.',
    pearl: 'Retained STNR often affects posture and the ability to sit comfortably at a desk. Key for upper/lower body coordination.'
  },
  {
    id: 'atnr',
    name: 'ATNR (Asymmetric Tonic Neck Righting)',
    category: 'Postural',
    stimulus: 'Turn head and eyes to one side in one movement with head in slight extension.',
    inhibitionPattern: 'Inhibition of ipsilateral arm and leg flexors, contralateral arm and leg extensors.',
    description: 'The "fencing" reflex. Head rotation triggers limb extension on the face side.',
    pearl: 'Retained ATNR can interfere with hand-eye coordination, crossing the midline, and reading/writing fluency.'
  },
  {
    id: 'tlr',
    name: 'TLR (Tonic Labyrinthine)',
    category: 'Foundational',
    stimulus: 'With patient in supine, ask patient to actively flex or extend BOTH head and lumbar spine.',
    inhibitionPattern: 'Flexion: All upper and lower body extensors inhibit. Extension: All upper and lower body flexors inhibit.',
    description: 'Head position in space affects overall muscle tone.',
    pearl: 'Foundational for balance and spatial orientation. Retained TLR can cause "slumping" or chronic toe-walking.'
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Gallant',
    category: 'Postural',
    stimulus: 'Stroke along one side of spine from inferior angle of scapula to sacrum.',
    inhibitionPattern: 'Ipsilateral hip curves up and outwards; inhibition of ipsilateral internal rotators of hip, adductors, hip extensors, and contralateral oblique and QL.',
    description: 'Lateral trunk flexion in response to stimulation of the lumbar region.',
    pearl: 'Often linked to "fidgety" behavior, bedwetting, and difficulty sitting still. Affects the development of the lumbar curve.'
  },
  {
    id: 'babinski',
    name: 'Babinski',
    category: 'Tactile',
    stimulus: 'Stroke from lateral heel upwards and across towards ball of foot.',
    inhibitionPattern: 'Toes fan up and out and big toe turns downward; inhibition of toe flexors.',
    description: 'Toe extension in response to stimulation of the sole of the foot.',
    pearl: 'Retained Babinski affects gait, balance, and the ability to ground through the feet. Often seen in chronic ankle instability.'
  },
  {
    id: 'rooting',
    name: 'Rooting Reflex',
    category: 'Tactile',
    stimulus: 'Stroke side of cheek.',
    inhibitionPattern: 'Head turns towards stimulus; inhibits ipsilateral SCM, contralateral scalenes, etc.',
    description: 'Head rotation in response to touch on the cheek.',
    pearl: 'Can affect speech, swallowing, and jaw tension (TMJ). Often linked to hypersensitivity around the mouth.'
  },
  {
    id: 'palmar',
    name: 'Palmar Reflex',
    category: 'Tactile',
    stimulus: 'Apply pressure to the palm.',
    inhibitionPattern: 'Involuntary hand grasp; inhibition of finger extensors.',
    description: 'Involuntary hand grasp in response to pressure on the palm.',
    pearl: 'Retained Palmar reflex can affect handwriting, manual dexterity, and even speech (due to the hand-mouth connection).'
  }
];