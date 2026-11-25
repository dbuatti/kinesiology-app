/**
 * Clinical reflex order used by Align and Quick Assess.
 *
 * Track 1 runs from the earliest survival response (Moro) down to the global
 * override; Track 2 runs from postural/neck patterns to Babinski/Sucking.
 * Keeping this in one place stops the assessment grid and findings list from
 * drifting into alphabetical order.
 */

export interface ReflexTrack {
  num: number;
  label: string;
  shortLabel: string;
  desc: string;
  /** IDs used by the Quick Assess grid (including split TLR/STNR variants). */
  ids: string[];
  /** Names as stored in `priority_pattern.primitiveReflexes`. */
  names: string[];
}

export const REFLEX_TRACKS: ReflexTrack[] = [
  {
    num: 1,
    label: 'Track 1 — Sagittal / Brainstem',
    shortLabel: 'Track 1',
    desc: 'Moro → Startle → TLR → STNR → FPR',
    ids: ['moro', 'startle', 'tlr-flexion', 'tlr-extension', 'stnr-flexion', 'stnr-extension', 'fear-paralysis'],
    names: [
      'Moro Reflex',
      'Startle Reflex',
      'TLR (Flexion)',
      'TLR (Extension)',
      'STNR (Flexion)',
      'STNR (Extension)',
      'Fear Paralysis Reflex',
    ],
  },
  {
    num: 2,
    label: 'Track 2 — Unilateral / Gait',
    shortLabel: 'Track 2',
    desc: 'ATNR → Spinal Galant → Rooting → Palmar → Babinski → Sucking',
    ids: ['atnr', 'spinal-galant', 'rooting', 'palmar', 'babinski', 'sucking'],
    names: [
      'Asymmetric Tonic Neck Reflex',
      'Spinal Galant Reflex',
      'Rooting Reflex',
      'Palmar Grasp Reflex',
      'Babinski Reflex',
      'Sucking Reflex',
    ],
  },
  {
    num: 3,
    label: 'Track 3 — Global Override',
    shortLabel: 'Track 3',
    desc: 'Tendon Guard',
    ids: ['tendon-guard'],
    names: ['Tendon Guard Reflex'],
  },
];

/** Older records use the long names or short labels without "Reflex". */
const NAME_ALIASES: Record<string, string> = {
  Moro: 'Moro Reflex',
  Startle: 'Startle Reflex',
  TLR: 'TLR (Flexion)',
  'Tonic Labyrinthine Reflex': 'TLR (Flexion)',
  STNR: 'STNR (Flexion)',
  'Symmetric Tonic Neck Reflex': 'STNR (Flexion)',
  ATNR: 'Asymmetric Tonic Neck Reflex',
  Galant: 'Spinal Galant Reflex',
  'Spinal Galant': 'Spinal Galant Reflex',
  Palmar: 'Palmar Grasp Reflex',
  Babinski: 'Babinski Reflex',
  Sucking: 'Sucking Reflex',
  FPR: 'Fear Paralysis Reflex',
  'Tendon Guard': 'Tendon Guard Reflex',
};

const stripSide = (name: string) => name.trim().replace(/ \([LR]\)$/, '');

export interface ReflexDisplayOrder {
  track: number;
  index: number;
}

/** Clinical position of a stored reflex name, or null when unrecognised. */
export const reflexDisplayOrder = (name: string): ReflexDisplayOrder | null => {
  const raw = stripSide(name);
  const canonical = NAME_ALIASES[raw] ?? raw;
  for (const track of REFLEX_TRACKS) {
    const index = track.names.indexOf(canonical);
    if (index !== -1) return { track: track.num, index };
  }
  return null;
};

/** Sort rank for findings; unrecognised reflexes sort after the known tracks. */
export const reflexSortRank = (name: string): ReflexDisplayOrder => {
  return reflexDisplayOrder(name) ?? { track: REFLEX_TRACKS.length + 1, index: 99 };
};
