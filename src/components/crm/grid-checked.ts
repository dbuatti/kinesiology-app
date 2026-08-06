import { safeParse } from "@/utils/safe-json";
import {
  PRIMITIVE_TRACKS,
  NERVE_GROUPS,
  nerveStimLines,
  primitiveStimKey,
  primitiveStimKeyAt,
  primitiveSideKey,
  cranialStimKey,
  cranialSideKey,
  cranialNerveInhibKey,
  isLateralStim,
} from "./pathway-reflex-stim-data";

interface ReflexTestLike {
  reflex_id: string;
  stim_results?: Record<string, boolean> | null;
}

interface NerveTestLike {
  nerve_id: string;
  stim_results?: Record<string, boolean> | null;
}

export const buildCheckedMap = (args: {
  reflexTests: ReflexTestLike[];
  nerveTests: NerveTestLike[];
  priorityPattern?: string | null;
}): Record<string, boolean> => {
  const { reflexTests, nerveTests, priorityPattern } = args;
  const map: Record<string, boolean> = {};

  PRIMITIVE_TRACKS.forEach((track) =>
    track.reflexes.forEach((reflex) => {
      const test = reflexTests.find((t) => t.reflex_id === reflex.id);
      if (reflex.lateralized) {
        (["L", "R"] as const).forEach((side) => {
          const key = primitiveSideKey(reflex, side);
          if (test?.stim_results?.[key]) map[key] = true;
        });
      } else if (reflex.stims?.length) {
        reflex.stims.forEach((_, i) => {
          const key = primitiveStimKeyAt(reflex, i);
          if (test?.stim_results?.[key]) map[key] = true;
        });
      } else {
        const key = primitiveStimKey(reflex);
        if (test?.stim_results?.[key]) map[key] = true;
      }
    })
  );

  NERVE_GROUPS.forEach((group) =>
    group.items.forEach((nerve) => {
      const test = nerveTests.find((t) => t.nerve_id === nerve.id.toString());
      nerveStimLines(nerve).forEach((_, i) => {
        if (isLateralStim(nerve.id, i)) {
          (["L", "R"] as const).forEach((side) => {
            const key = cranialSideKey(nerve.id, i, side);
            if (test?.stim_results?.[key]) map[key] = true;
          });
        } else {
          const key = cranialStimKey(nerve.id, i);
          if (test?.stim_results?.[key]) map[key] = true;
        }
      });
    })
  );

  const pattern = safeParse(priorityPattern, {});
  const statusOf = (lookup: Record<string, string> | undefined, keys: string[]): string => {
    if (!lookup) return "";
    for (const key of keys) {
      const status = lookup[key] || "";
      if (status) return status;
    }
    return "";
  };

  const nervePattern = pattern.cranialNerves || {};
  NERVE_GROUPS.forEach((group) =>
    group.items.forEach((nerve) => {
      const nerveName = `${nerve.name}: ${nerve.latinName}`;
      if (nerve.isLateralized) {
        (["L", "R"] as const).forEach((side) => {
          const status = statusOf(nervePattern, [`${nerveName} (${side})`, `${nerve.name} (${side})`]);
          if (status.startsWith("Inhibited")) map[cranialNerveInhibKey(nerve.id, side)] = true;
        });
      } else {
        const status = statusOf(nervePattern, [nerveName, nerve.name]);
        if (status.startsWith("Inhibited")) map[cranialNerveInhibKey(nerve.id)] = true;
      }
    })
  );

  // Link primitive reflexes marked "Inhibited" in priority_pattern into the
  // grid (Quick Assess, RE checkboxes). When a reflex has finer-grained
  // stim_results, those take precedence so grid-level marks are never expanded.
  const reflexPattern = pattern.primitiveReflexes || {};
  PRIMITIVE_TRACKS.forEach((track) =>
    track.reflexes.forEach((reflex) => {
      const test = reflexTests.find((t) => t.reflex_id === reflex.id);
      const hasStimData = !!(test?.stim_results && Object.values(test.stim_results).some(Boolean));
      if (hasStimData) return;
      if (reflex.lateralized) {
        (["L", "R"] as const).forEach((side) => {
          const status = statusOf(reflexPattern, [`${reflex.name} (${side})`]);
          if (status.startsWith("Inhibited")) map[primitiveSideKey(reflex, side)] = true;
        });
      } else if (reflex.stims?.length) {
        const status = statusOf(reflexPattern, [reflex.name]);
        if (status.startsWith("Inhibited")) {
          reflex.stims.forEach((_, i) => {
            map[primitiveStimKeyAt(reflex, i)] = true;
          });
        }
      } else {
        const status = statusOf(reflexPattern, [reflex.name]);
        if (status.startsWith("Inhibited")) map[primitiveStimKey(reflex)] = true;
      }
    })
  );

  return map;
};
