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
    description: 'Muscle or nervous system is confused. Firing in opposites. Neurological confusion.',
    icon: HelpCircle,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    value: 'Dysfunctional',
    label: 'Dysfunctional',
    description: 'Appears strong but inhibits when tested again with IM. It is compensating.',
    icon: CircleSlash,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
];

export const MUSCLE_GROUPS: Record<string, string[]> = {
  'Intrinsic Stabilisation System': [
    'Transverse Abdominals',
    'Diaphragm',
    'Pelvic Floor',
    'Multifidi',
    'Sacrospinalis',
  ],
  'Upper Body': [
    'Deltoids (Anterior)',
    'Deltoids (Middle)',
    'Deltoids (Posterior)',
    'Mid Trapezius',
    'Lower Trapezius',
    'Pectoralis Major (Clavicular)',
    'Pectoralis Major (Sternal)',
    'Serratus Anterior',
    'Biceps',
    'Triceps',
    'Upper Trapezius',
    'Sternocleidomastoid (SCM)',
  ],
  'Lower Body': [
    'Quadriceps Group',
    'Hamstrings',
    'Tensor Fasciae Latae (TFL)',
    'Gluteus Medius',
    'Gluteus Maximus',
  ],
};

export const MUSCLE_TEST_ASSISTANCE = {
  title: "What to do if an indicator muscle doesn't unlock...",
  steps: [
    {
      title: "Harmonic Rocking, TL Emotion Reflex point, Check Hydration, previous injury or do Cross Crawls",
      details: "General techniques to clear neurological confusion or stress."
    },
    {
      title: "Emotion",
      details: "Hold Emotion Reflex Point and think of current stress and tap on Cranium or Ki27's."
    },
    {
      title: "Hydration",
      details: "Pull hair, have Water with a little salt and rub Large Intestine Reflex."
    },
    {
      title: "Previous Injury",
      details: "Rub over injury site, client thinks of injury & suffering and you tap on the head."
    },
    {
      title: "Re-assess muscle for Normal Tone",
      details: "After intervention, re-test the muscle to confirm normal tone."
    }
  ],
  process: [
    "Test muscle in the clear.",
    "Check if muscle inhibits normally (Spindles, II Lines, Gait Reflexes).",
    "If it doesn't, find out why or find another indicator muscle."
  ]
};