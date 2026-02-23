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
}

export const AFFERENT_PATHWAYS: PathwayOption[] = [
  {
    id: 'Mechanoreceptor',
    label: 'Mechanoreceptor (Joint/Muscle)',
    direction: 'Afferent (Bottom-Up)',
    icon: Activity,
    color: 'text-blue-500',
    description: 'Physical input from joints, muscles, and skin receptors.',
    protocols: [
      'Apply specific joint mobilization or soft tissue work.',
      'Maintain contact with the receptor site.',
      'Hold position for 3-5 seconds with 30% contraction.'
    ]
  },
  {
    id: 'Vestibular/Ocular',
    label: 'Vestibular / Ocular',
    direction: 'Afferent (Bottom-Up)',
    icon: Eye,
    color: 'text-cyan-500',
    description: 'Balance and visual system inputs to the cerebellum.',
    protocols: [
      'Perform VOR (Vestibulo-Ocular Reflex) or saccadic eye movements.',
      'Use head rotations or balance challenges.',
      'Integrate with specific eye positions.'
    ]
  },
  {
    id: 'Physiological',
    label: 'Physiological',
    direction: 'Afferent (Bottom-Up)',
    icon: Droplets,
    color: 'text-emerald-500',
    description: 'Biochemical, nutritional, and organ-based signals.',
    protocols: [
      'Address biochemical or organ-specific reflexes.',
      'Check for nutritional or hydration priorities.',
      'Use specific neurolymphatic or neurovascular points.'
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
    description: 'Intentional, cognitive, and motor planning processes.',
    protocols: [
      'Engage cognitive tasks or visualization.',
      'Focus on intentional movement patterns.',
      'Use specific motor imagery techniques.'
    ]
  },
  {
    id: 'Subcortical',
    label: 'Subcortical (Autonomic)',
    direction: 'Efferent (Top-Down)',
    icon: Zap,
    color: 'text-amber-500',
    description: 'Automatic, reflexive, and autonomic regulation.',
    protocols: [
      'Use rhythmic movements or breathing patterns.',
      'Focus on autonomic regulation (SNS/PNS balance).',
      'Apply brainstem-specific stimulation.'
    ]
  },
  {
    id: 'Emotional',
    label: 'Emotional',
    direction: 'Efferent (Top-Down)',
    icon: Heart,
    color: 'text-rose-500',
    description: 'Limbic system and emotional processing.',
    protocols: [
      'Apply ESR (Emotional Stress Release) points.',
      'Acknowledge and release associated stressors.',
      'Use specific meridian-based emotional balancing.'
    ]
  }
];

export const ALL_PATHWAYS = [...AFFERENT_PATHWAYS, ...EFFERENT_PATHWAYS];

export const getPathwayById = (id: SpecificCorrectionType) => 
  ALL_PATHWAYS.find(p => p.id === id);