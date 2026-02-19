import { ArrowUp, ArrowDown, ChevronsUp, HelpCircle, CircleSlash, LucideIcon } from "lucide-react";

export interface MuscleStatus {
  value: 'Normotonic' | 'Inhibition' | 'Hypertonic' | 'Switching' | 'Dysfunctional';
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const MUSCLE_STATUSES: MuscleStatus[] = [
  {
    value: 'Normotonic',
    label: 'Normotonic',
    description: 'Facilitates and inhibits normally.',
    icon: ArrowUp,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    value: 'Inhibition',
    label: 'Inhibition',
    description: 'Cannot facilitate, is in a state of inhibition in the clear.',
    icon: ArrowDown,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    value: 'Hypertonic',
    label: 'Hypertonic',
    description: 'Too much facilitation, cannot inhibit when challenged.',
    icon: ChevronsUp,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    value: 'Switching',
    label: 'Switching',
    description: 'Muscle or nervous system is confused. Firing in opposites.',
    icon: HelpCircle,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    value: 'Dysfunctional',
    label: 'Dysfunctional',
    description: 'Appears strong but inhibits when tested again with IM.',
    icon: CircleSlash,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
];

export const MUSCLE_GROUPS: Record<string, string[]> = {
  'Intrinsic Stabilisation': [
    'Transverse Abdominals',
    'Diaphragm',
    'Pelvic Floor (Anterior)',
    'Pelvic Floor (Posterior)',
    'Multifidi',
    'Sacrospinalis',
    'Psoas',
    'Quadratus Lumborum',
    'Erector Spinae',
  ],
  'Upper Body & Shoulder': [
    'Supraspinatus',
    'Subscapularis',
    'Teres Major',
    'Teres Minor',
    'Infraspinatus',
    'Latissimus Dorsi',
    'Rhomboids',
    'Deltoids (Anterior)',
    'Deltoids (Middle)',
    'Deltoids (Posterior)',
    'Pectoralis Major (Clavicular)',
    'Pectoralis Major (Sternal)',
    'Pec Minor',
    'Serratus Anterior',
    'Levator Scapula',
    'Upper Trapezius',
    'Middle Trapezius',
    'Lower Trapezius',
  ],
  'Arm & Hand': [
    'Biceps',
    'Triceps',
    'Coracobrachialis',
    'Brachioradialis',
    'Dorsal Interossei',
  ],
  'Head & Neck': [
    'Sternocleidomastoid (SCM)',
    'Buccinator',
    'Masseter',
    'External Pterygoid',
    'Orbicularis Oris',
    'Occipitalis',
    'Neck Extensors',
    'Scalenes',
    'Deep Neck Flexors',
  ],
  'Lower Body': [
    'Quadriceps Group',
    'Vastus Lateralis',
    'Hamstrings',
    'Tensor Fasciae Latae (TFL)',
    'Gluteus Maximus',
    'Gluteus Medius',
    'Gluteus Minimus',
    'Piriformis',
    'Sartorius',
    'Gracilis',
    'Adductors',
  ],
  'Lower Leg & Foot': [
    'Gastrocnemius',
    'Soleus',
    'Popliteus',
    'Tibialis Anterior',
    'Tibialis Posterior',
    'Peroneus Longus',
    'Fibularis Longus',
    'Flexor Hallucis Longus',
    'Extensor Hallucis Longus',
    'Flexor Digitorum Longus',
    'Extensor Digitorum Longus',
  ],
};

export const MUSCLE_TEST_ASSISTANCE = {
  title: "What to do if an indicator muscle doesn't unlock...",
  steps: [
    {
      title: "General Clearing",
      details: "Harmonic Rocking, TL Emotion Reflex point, Check Hydration, or do Cross Crawls."
    },
    {
      title: "Emotional Stress",
      details: "Hold Emotion Reflex Point, think of current stress, and tap on Cranium or Ki27s."
    },
    {
      title: "Hydration Check",
      details: "Pull hair, drink water with a pinch of salt, and rub Large Intestine Reflex."
    },
    {
      title: "Injury Recall",
      details: "Rub over injury site, client recalls the event, and practitioner taps on the head."
    },
  ],
};