import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from "@/data/muscle-data";

export type MuscleGridState = "Hypotonic" | "Inhibited" | "Hypertonic";

export interface IntrinsicGridMuscle {
  name: string;
  midline: boolean;
  group: string;
}

// Muscles shown in the grid's "Intrinsic Muscles" tab — the Intrinsic
// Stabilisation group, matching the Preliminary assessment. Mirrors
// MUSCLE_GROUPS['Intrinsic Stabilisation'] so both views stay in sync.
export const INTRINSIC_GRID_MUSCLES: IntrinsicGridMuscle[] = (
  MUSCLE_GROUPS["Intrinsic Stabilisation"] ?? []
).map((name) => ({
  name,
  midline: MIDLINE_MUSCLES.includes(name),
  group: "Intrinsic Stabilisation",
}));

export const muscleMidlineKey = (name: string): string => `mus-${name}`;

export const muscleSideKey = (name: string, side: "L" | "R"): string => `mus-${name}-${side}`;

export const muscleKey = (name: string, side?: "L" | "R"): string =>
  side ? muscleSideKey(name, side) : muscleMidlineKey(name);

export const parseMuscleKey = (key: string): { name: string; side?: "L" | "R" } => {
  const rest = key.slice("mus-".length);
  if (rest.endsWith("-L")) return { name: rest.slice(0, -2), side: "L" };
  if (rest.endsWith("-R")) return { name: rest.slice(0, -2), side: "R" };
  return { name: rest };
};

// Cycle: empty (Normotonic) -> Hypotonic -> Inhibited -> clear.
// Legacy Hypertonic entries clear in a single tap.
export const nextMuscleState = (current: MuscleGridState | undefined): MuscleGridState | undefined => {
  if (!current) return "Hypotonic";
  if (current === "Hypotonic") return "Inhibited";
  return undefined;
};

const normalizeStatus = (status: string): MuscleGridState | undefined => {
  if (status.endsWith("_Cleared")) return undefined;
  if (status === "Hypotonic") return "Hypotonic";
  if (status === "Inhibited" || status === "Inhibition") return "Inhibited";
  if (status === "Hypertonic") return "Hypertonic";
  return undefined;
};

export const seedMuscleState = (pattern: Record<string, Record<string, string>> | undefined): Record<string, MuscleGridState> => {
  const musclePattern = pattern?.muscles ?? {};
  const map: Record<string, MuscleGridState> = {};
  INTRINSIC_GRID_MUSCLES.forEach(({ name, midline }) => {
    if (midline) {
      const status = normalizeStatus(musclePattern[name] ?? "");
      if (status) map[muscleMidlineKey(name)] = status;
    } else {
      (["L", "R"] as const).forEach((side) => {
        const status = normalizeStatus(musclePattern[`${name} (${side})`] ?? musclePattern[name] ?? "");
        if (status) map[muscleSideKey(name, side)] = status;
      });
    }
  });
  return map;
};

export const muscleMatches = (muscle: IntrinsicGridMuscle, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return muscle.name.toLowerCase().includes(q) || muscle.group.toLowerCase().includes(q);
};

export interface MuscleGridChip {
  label: string;
  side?: "L" | "R";
  status: MuscleGridState;
}

export const muscleSummaryItems = (
  muscleState: Record<string, MuscleGridState>
): { muscle: IntrinsicGridMuscle; chips: MuscleGridChip[] }[] =>
  INTRINSIC_GRID_MUSCLES.map((muscle) => {
    const chips: MuscleGridChip[] = [];
    if (muscle.midline) {
      const status = muscleState[muscleMidlineKey(muscle.name)];
      if (status) chips.push({ label: muscle.name, status });
    } else {
      (["L", "R"] as const).forEach((side) => {
        const status = muscleState[muscleSideKey(muscle.name, side)];
        if (status) chips.push({ label: muscle.name, side, status });
      });
    }
    return { muscle, chips };
  }).filter((x) => x.chips.length > 0);
