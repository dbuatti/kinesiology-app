"use client";

import { 
  Activity, 
  Eye, 
  Droplets, 
  Brain, 
  Zap, 
  Heart 
} from 'lucide-react';

export type DirectionType = 'Afferent (Bottom-Up)' | 'Efferent (Top-Down)';

export type SpecificCorrectionType = 
  | 'Mechanoreceptor' 
  | 'Vestibular/Ocular' 
  | 'Physiological'
  | 'Cortical' 
  | 'Subcortical' 
  | 'Emotional';

export interface PathwayOption {
  id: SpecificCorrectionType;
  label: string;
  direction: DirectionType;
  icon: any;
  color: string;
  description: string;
  protocols: string[];
  confirmationTest?: string;
}

export const AFFERENT_PATHWAYS: PathwayOption[] = [
  {
    id: 'Mechanoreceptor',
    label: 'Mechanoreceptor (Joint/Muscle)',
    direction: 'Afferent (Bottom-Up)',
    icon: Activity,
    color: 'text-blue-500',
    description: 'Physical input from joints, muscles, and skin receptors. 15% conscious (DCML to S1), 85% unconscious (Spinocerebellar to Cerebellum).',
    confirmationTest: 'X-pattern facilitates → Mechanoreceptive confirmed',
    protocols: [
      'CONSCIOUS: TL opposing sensory cortex → Isometric contraction (30-40%, 3-5s) + Nasal breathing',
      'UNCONSCIOUS: Hold GV16 → Locate ligament → Stretch + Tuning fork on cranium (3-5s)',
      'Re-test original pathway after each layer'
    ]
  },
  {
    id: 'Vestibular/Ocular',
    label: 'Vestibular / Ocular',
    direction: 'Afferent (Bottom-Up)',
    icon: Eye,
    color: 'text-cyan-500',
    description: 'Balance and visual system inputs to the cerebellum. Critical for spatial orientation and postural control.',
    protocols: [
      'Perform VOR (Vestibulo-Ocular Reflex) or saccadic eye movements',
      'Use head rotations or balance challenges',
      'Integrate with specific eye positions',
      'Hold correction with nasal breathing'
    ]
  },
  {
    id: 'Physiological',
    label: 'Physiological',
    direction: 'Afferent (Bottom-Up)',
    icon: Droplets,
    color: 'text-emerald-500',
    description: 'Biochemical, nutritional, and organ-based signals. Addresses systemic imbalances.',
    protocols: [
      'Address biochemical or organ-specific reflexes',
      'Check for nutritional or hydration priorities',
      'Use specific neurolymphatic or neurovascular points',
      'Consider meridian-based corrections'
    ]
  }
];

export const EFFERENT_PATHWAYS: PathwayOption[] = [
  {
    id: 'Cortical',
    label: 'Cortical (Top-Down)',
    direction: 'Efferent (Top-Down)',
    icon: Brain,
    color: 'text-purple-500',
    description: 'Intentional, cognitive, and motor planning processes. Contralateral logic: right cortex controls left body.',
    protocols: [
      'Identify primary cortical zone (PFC, M1, S1, etc.) and lateralize',
      'Identify secondary zone (cortical or subcortical)',
      'Apply correction: Tapping (3-5s), Holding + Intention (until pulse), or Tuning Fork',
      'Include pathway name during intention: "Left Psoas, Right PFC, Left Limbic"'
    ]
  },
  {
    id: 'Subcortical',
    label: 'Subcortical (Autonomic)',
    direction: 'Efferent (Top-Down)',
    icon: Zap,
    color: 'text-amber-500',
    description: 'Automatic, reflexive, and autonomic regulation. Ipsilateral logic: left cerebellum controls left body.',
    protocols: [
      'Identify subcortical zone (Limbic, Cerebellum, Hypothalamus, etc.)',
      'Lateralize response (Left = historical trauma, Right = current processing)',
      'Use rhythmic movements or breathing patterns',
      'Apply correction method: Tapping, Holding + Intention, or Tuning Fork'
    ]
  },
  {
    id: 'Emotional',
    label: 'Emotional',
    direction: 'Efferent (Top-Down)',
    icon: Heart,
    color: 'text-rose-500',
    description: 'Limbic system and emotional processing. Final check if afferent and efferent are clear.',
    protocols: [
      'Apply ESR (Emotional Stress Release) points',
      'Acknowledge and release associated stressors',
      'Use specific meridian-based emotional balancing',
      'Complete full emotional process before re-assessing'
    ]
  }
];

export const ALL_PATHWAYS = [...AFFERENT_PATHWAYS, ...EFFERENT_PATHWAYS];

export const getPathwayById = (id: SpecificCorrectionType) => 
  ALL_PATHWAYS.find(p => p.id === id);

export const CORRECTION_METHODS = [
  {
    id: 'tapping',
    name: 'Simultaneous Tapping',
    description: 'Quick tap both zones for 3-5 seconds',
    bestFor: 'Fast corrections, postural fixes, children',
    icon: Zap
  },
  {
    id: 'holding',
    name: 'Holding + Intention',
    description: 'Hold points and mentally repeat zone names until therapeutic pulse',
    bestFor: 'Deep issues, primitive reflexes, complex patterns',
    icon: Brain
  },
  {
    id: 'tuning_fork',
    name: 'Tuning Fork',
    description: 'TL both points, strike fork, place on cranium',
    bestFor: 'Multiple corrections, vibrational reset',
    icon: Activity
  }
];

export const CLINICAL_PEARLS = {
  lateralization: {
    cortical: "Contralateral logic: Right cortex controls left body. If left side dysfunctional, check right cortex.",
    subcortical: "Ipsilateral logic: Left cerebellum controls left body. If left side dysfunctional, check left cerebellum.",
    limbic: "Left limbic = historical/past trauma. Right limbic = current emotional processing."
  },
  mechanoreceptive: {
    conscious: "15% of afferent input. DCML pathway to contralateral sensory cortex (S1). Use isometric contractions.",
    unconscious: "85% of afferent input. Spinocerebellar tracts to cerebellum. Target ligaments/tendons with stretch.",
    rule: "The joint may not be related to the symptom site—it's where the brain needs proprioceptive input to reduce threat."
  },
  general: {
    layers: "Expect 5-15+ layers in complex cases. Each layer reveals deeper compensation patterns.",
    reassessment: "Always re-test the original stimulus. If still inhibited, there's a deeper layer.",
    accuracy: "2 years experience ≈ 65% accuracy. 5+ years ≈ 95% clinical mastery.",
    bias: "Never suggest memories or emotions. Let the nervous system guide you."
  }
};