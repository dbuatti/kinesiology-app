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

/** Display order for mixed finding lists: assessment flow, not alphabet. */
export const CATEGORY_ORDER = ['primitiveReflexes', 'cranialNerves', 'muscles', 'brainZones'];

export interface CategoryTone {
  /** Icon tile / soft surface. */
  tile: string;
  /** Category chip, including its hairline border. */
  chip: string;
  /** Icon or category-label text on a tinted surface. */
  text: string;
  /** Tint only, for wrappers that supply their own text colour. */
  soft: string;
}

/**
 * Category identity, not clinical status. Rose/amber/indigo remain reserved
 * for inhibited/hypertonic/clear so a category colour can never be read as a
 * finding state. See DESIGN.md §2.
 */
export const CATEGORY_TONES: Record<string, CategoryTone> = {
  muscles: {
    tile: 'bg-primary/10 text-primary-strong',
    chip: 'bg-primary/10 text-primary-strong border-primary/20',
    text: 'text-primary-strong',
    soft: 'bg-primary/10',
  },
  primitiveReflexes: {
    tile: 'bg-chart-amber/10 text-warning-strong',
    chip: 'bg-chart-amber/10 text-warning-strong border-chart-amber/20',
    text: 'text-warning-strong',
    soft: 'bg-chart-amber/10',
  },
  cranialNerves: {
    tile: 'bg-chart-purple/10 text-efferent-strong',
    chip: 'bg-chart-purple/10 text-efferent-strong border-chart-purple/20',
    text: 'text-efferent-strong',
    soft: 'bg-chart-purple/10',
  },
  brainZones: {
    tile: 'bg-muted/60 text-muted-foreground',
    chip: 'bg-muted/60 text-muted-foreground border-border',
    text: 'text-muted-foreground',
    soft: 'bg-muted/60',
  },
};

const NEUTRAL_TONE: CategoryTone = {
  tile: 'bg-muted/60 text-muted-foreground',
  chip: 'bg-muted/60 text-muted-foreground border-border',
  text: 'text-muted-foreground',
  soft: 'bg-muted/60',
};

/** Resolve a pattern key, category label or display string to its tone. */
export const categoryTone = (category: string): CategoryTone => {
  const direct = CATEGORY_TONES[category];
  if (direct) return direct;
  const key = category.toLowerCase();
  if (key.includes('reflex')) return CATEGORY_TONES.primitiveReflexes;
  if (key.includes('nerve')) return CATEGORY_TONES.cranialNerves;
  if (key.includes('muscle')) return CATEGORY_TONES.muscles;
  if (key.includes('brain') || key.includes('zone')) return CATEGORY_TONES.brainZones;
  return NEUTRAL_TONE;
};
