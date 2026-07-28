import { Zap, Dumbbell, Baby, Brain } from "lucide-react";

export const CATEGORY_LABELS: Record<string, string> = {
  primitiveReflexes: 'Primitive Reflex',
  cranialNerves: 'Cranial Nerve',
  muscles: 'Muscle',
  brainZones: 'Brain Zone',
};

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  primitiveReflexes: Baby,
  cranialNerves: Zap,
  muscles: Dumbbell,
  brainZones: Brain,
};
