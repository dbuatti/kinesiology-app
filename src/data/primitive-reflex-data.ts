"use client";

export interface PrimitiveReflex {
  id: string;
  name: string;
  description: string;
  assessment: string;
  correction: string;
  videoUrl?: string;
  category: 'Foundational' | 'Postural' | 'Tactile';
  pearl?: string;
}

export const PRIMITIVE_REFLEXES: PrimitiveReflex[] = [
  {
    id: 'moro',
    name: 'Moro Reflex / Startle',
    category: 'Foundational',
    description: 'The "fight or flight" reflex. A primitive response to a sudden change in sensory input.',
    assessment: 'Sudden head drop (supported) or loud noise. Observe for arm abduction and extension followed by adduction and flexion.',
    correction: 'Specific integration exercises involving slow, controlled movements and breath work.',
    pearl: 'If retained, the client may be in a constant state of high SNS arousal.'
  },
  {
    id: 'spinal-galant',
    name: 'Spinal Galant Reflex',
    category: 'Postural',
    description: 'Lateral trunk flexion in response to stimulation of the lumbar region.',
    assessment: 'Stroke the lower back on one side of the spine. Observe for hip rotation or trunk flexion towards the stimulus.',
    correction: 'Snow angels or specific floor-based rotational integration.',
    pearl: 'Often linked to "fidgety" behavior and difficulty sitting still.'
  },
  {
    id: 'atnr',
    name: 'ATNR (Asymmetrical Tonic Neck Reflex)',
    category: 'Postural',
    description: 'The "fencing" reflex. Head rotation triggers limb extension on the face side.',
    assessment: 'Rotate the head to one side. Observe for extension of the arm/leg on that side and flexion on the opposite side.',
    correction: 'Cross-crawl variations and specific head-eye-limb coordination drills.',
    pearl: 'Retained ATNR can interfere with hand-eye coordination and crossing the midline.'
  },
  {
    id: 'stnr',
    name: 'STNR (Symmetrical Tonic Neck Reflex)',
    category: 'Postural',
    description: 'Head flexion/extension triggers symmetrical limb responses.',
    assessment: 'Flex the head (chin to chest) - arms should flex, legs extend. Extend the head - arms should extend, legs flex.',
    correction: 'Cat-cow variations and specific quadruped integration drills.',
    pearl: 'Retained STNR often affects posture and the ability to sit comfortably at a desk.'
  },
  {
    id: 'tlr',
    name: 'TLR (Tonic Labyrinthine Reflex)',
    category: 'Foundational',
    description: 'Head position in space affects overall muscle tone.',
    assessment: 'Tilt head forward (flexion) - observe for total body flexion. Tilt head back (extension) - observe for total body extension.',
    correction: 'Prone and supine "superman" or "ball" holds to integrate vestibular-motor maps.',
    pearl: 'Foundational for balance and spatial orientation.'
  },
  {
    id: 'fear-paralysis',
    name: 'Fear Paralysis Reflex',
    category: 'Foundational',
    description: 'A withdrawal reflex that precedes the Moro reflex.',
    assessment: 'Observe for "freezing" or total body withdrawal in response to unexpected touch or sound.',
    correction: 'Deep pressure, grounding, and rhythmic rocking protocols.',
    pearl: 'The most foundational reflex. If not integrated, other reflexes are harder to clear.'
  },
  {
    id: 'babinski',
    name: 'Babinski Reflex',
    category: 'Tactile',
    description: 'Toe extension in response to stimulation of the sole of the foot.',
    assessment: 'Stroke the lateral aspect of the sole of the foot. Observe for big toe extension and fanning of other toes.',
    correction: 'Specific foot-mapping and toe-flexor activation drills.',
    pearl: 'Retained Babinski affects gait and the ability to ground through the feet.'
  },
  {
    id: 'rooting',
    name: 'Rooting Reflex',
    category: 'Tactile',
    description: 'Head rotation in response to touch on the cheek.',
    assessment: 'Stroke the cheek near the mouth. Observe for the head turning towards the stimulus.',
    correction: 'Specific facial and jaw integration exercises.',
    pearl: 'Can affect speech, swallowing, and jaw tension (TMJ).'
  },
  {
    id: 'palmar',
    name: 'Palmar Reflex',
    category: 'Tactile',
    description: 'Involuntary hand grasp in response to pressure on the palm.',
    assessment: 'Apply pressure to the palm. Observe for involuntary finger flexion/grasp.',
    correction: 'Specific hand-mapping and fine motor integration drills.',
    pearl: 'Retained Palmar reflex can affect handwriting and manual dexterity.'
  }
];