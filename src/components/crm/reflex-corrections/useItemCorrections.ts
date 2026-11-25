import { useCallback } from "react";
import { safeParse } from "@/utils/safe-json";
import {
  normalizeFindingPriority,
  type FindingPriority,
} from "@/components/crm/v2/v2-utils";
import {
  itemCorrectionKey,
  itemPriorityKey,
  reflexCorrectionKey,
  reflexPriorityKey,
  type ItemCorrection,
} from "./types";
import { removeQuickCorrectionRecord, upsertQuickCorrectionRecord } from "@/lib/corrections";

type Pattern = Record<string, any>;

export function useItemCorrections(
  appointment: { priority_pattern?: string | null; metadata?: string | null },
  saveField: (field: string, value: any) => Promise<void>,
  onUpdate: () => void,
) {
  const pattern = safeParse<Pattern>(appointment.priority_pattern, {});
  const itemCorrections = (pattern.itemCorrections ?? {}) as Record<string, ItemCorrection[]>;
  const legacyReflexCorrections = (pattern.reflexCorrections ?? {}) as Record<string, ItemCorrection[]>;
  const priorities = (pattern.priorities ?? {}) as Record<string, string | undefined>;

  const patch = useCallback(async (patchObj: Record<string, unknown>, metaPatch?: Record<string, unknown>) => {
    const current = safeParse<Pattern>(appointment.priority_pattern, {});
    await saveField("priority_pattern", JSON.stringify({ ...current, ...patchObj }));
    if (metaPatch) {
      const currentMeta = safeParse<Record<string, any>>(appointment.metadata, {});
      await saveField("metadata", JSON.stringify({ ...currentMeta, ...metaPatch }));
    }
    onUpdate();
  }, [appointment.priority_pattern, appointment.metadata, onUpdate, saveField]);

  const normalizeName = (category: string, name: string) => {
    if (category === "cranialNerves" && name === "CN IX: Glossopharyngeal") return name; // legacy midline handled by side lookup fallback below
    return name;
  };
  const getCorrections = useCallback((category: string, name: string, side?: "L" | "R") => {
    const key = itemCorrectionKey(category, normalizeName(category, name), side);
    if (itemCorrections[key]) return itemCorrections[key];
    if (category === "primitiveReflexes") {
      const legacy = legacyReflexCorrections[reflexCorrectionKey(name, side)];
      if (legacy) return legacy;
    }
    if (category === "cranialNerves" && !side) {
      // legacy midline CN IX
      const legacyMid = itemCorrections[itemCorrectionKey(category, name)];
      if (legacyMid) return legacyMid;
    }
    return [];
  }, [itemCorrections, legacyReflexCorrections]);

  const isPriority = useCallback((category: string, name: string, side?: "L" | "R") => {
    const key = itemPriorityKey(category, name, side);
    if (priorities[key]) return true;
    if (category === "primitiveReflexes") {
      const legacy = priorities[reflexPriorityKey(reflexCorrectionKey(name, side))];
      if (legacy) return true;
    }
    return false;
  }, [priorities]);

  /** Three-state tier used by the right-click menu and priority pills. */
  const getPriorityTier = useCallback((category: string, name: string, side?: "L" | "R"): FindingPriority | null => {
    const direct = normalizeFindingPriority(priorities[itemPriorityKey(category, name, side)]);
    if (direct) return direct;
    if (category === "primitiveReflexes") {
      const legacy = priorities[reflexPriorityKey(reflexCorrectionKey(name, side))];
      return normalizeFindingPriority(legacy);
    }
    return null;
  }, [priorities]);

  const setPriorityTier = useCallback(async (
    category: string,
    name: string,
    side: "L" | "R" | undefined,
    tier: FindingPriority | null,
  ) => {
    const key = itemPriorityKey(category, name, side);
    const legacyKey = category === "primitiveReflexes"
      ? reflexPriorityKey(reflexCorrectionKey(name, side))
      : null;
    const current = {
      ...((safeParse<Pattern>(appointment.priority_pattern, {}).priorities ?? {}) as Record<string, string | undefined>),
    };

    // One primary per session across findings, stims and correction items.
    if (tier === "primary") {
      Object.keys(current).forEach((otherKey) => {
        if (
          otherKey !== key &&
          otherKey !== legacyKey &&
          normalizeFindingPriority(current[otherKey]) === "primary"
        ) {
          current[otherKey] = "priority";
        }
      });
    }

    if (tier) {
      current[key] = tier;
      if (legacyKey) delete current[legacyKey];
    } else {
      delete current[key];
      if (legacyKey) delete current[legacyKey];
    }
    await patch({ priorities: current });
  }, [appointment.priority_pattern, patch]);

  const setCorrections = useCallback(async (category: string, name: string, next: ItemCorrection[], side?: "L" | "R") => {
    const key = itemCorrectionKey(category, name, side);
    const current = { ...((safeParse<Pattern>(appointment.priority_pattern, {}).itemCorrections ?? {}) as Record<string, ItemCorrection[]>) };
    if (next.length) current[key] = next;
    else delete current[key];
    await patch({ itemCorrections: current });
  }, [appointment.priority_pattern, patch]);

  const addCorrection = useCallback(async (category: string, name: string, correction: ItemCorrection, side?: "L" | "R") => {
    const next = upsertQuickCorrectionRecord({ appointment: { priority_pattern: appointment.priority_pattern, metadata: appointment.metadata }, category, name, side, correction });
    await saveField("priority_pattern", JSON.stringify(next.pattern));
    await saveField("metadata", JSON.stringify(next.metadata));
    onUpdate();
  }, [appointment.metadata, appointment.priority_pattern, onUpdate, saveField]);

  const updateCorrection = useCallback(async (category: string, name: string, correction: ItemCorrection, side?: "L" | "R") => {
    const previous = getCorrections(category, name, side).find(c => c.id === correction.id);
    const next = upsertQuickCorrectionRecord({ appointment: { priority_pattern: appointment.priority_pattern, metadata: appointment.metadata }, category, name, side, correction: { ...correction, updatedAt: new Date().toISOString() }, previousPathway: previous?.pathway });
    await saveField("priority_pattern", JSON.stringify(next.pattern));
    await saveField("metadata", JSON.stringify(next.metadata));
    onUpdate();
  }, [appointment.metadata, appointment.priority_pattern, getCorrections, onUpdate, saveField]);

  const toggleHolding = useCallback(async (category: string, name: string, correctionId: string, side?: "L" | "R") => {
    const current = getCorrections(category, name, side).find(c => c.id === correctionId);
    if (!current) return;
    await updateCorrection(category, name, { ...current, holding: !current.holding }, side);
  }, [getCorrections, updateCorrection]);

  const removeCorrection = useCallback(async (category: string, name: string, correctionId: string, side?: "L" | "R") => {
    const next = removeQuickCorrectionRecord({ appointment: { priority_pattern: appointment.priority_pattern, metadata: appointment.metadata }, category, name, side, correctionId });
    await saveField("priority_pattern", JSON.stringify(next.pattern));
    await saveField("metadata", JSON.stringify(next.metadata));
    onUpdate();
  }, [appointment.metadata, appointment.priority_pattern, onUpdate, saveField]);

  /** One patch for lateralised pairs so both sides stay in sync. */
  const setPriorityTierForSides = useCallback(async (
    category: string,
    name: string,
    sides: Array<"L" | "R">,
    tier: FindingPriority | null,
  ) => {
    const keys = sides.map((side) => itemPriorityKey(category, name, side));
    const legacyKeys = category === "primitiveReflexes"
      ? sides.map((side) => reflexPriorityKey(reflexCorrectionKey(name, side)))
      : [];
    const current = {
      ...((safeParse<Pattern>(appointment.priority_pattern, {}).priorities ?? {}) as Record<string, string | undefined>),
    };

    if (tier === "primary") {
      Object.keys(current).forEach((otherKey) => {
        if (
          !keys.includes(otherKey) &&
          !legacyKeys.includes(otherKey) &&
          normalizeFindingPriority(current[otherKey]) === "primary"
        ) {
          current[otherKey] = "priority";
        }
      });
    }

    keys.forEach((key, index) => {
      if (!tier) delete current[key];
      else current[key] = tier === "primary" && index > 0 ? "priority" : tier;
    });
    legacyKeys.forEach((key) => delete current[key]);
    await patch({ priorities: current });
  }, [appointment.priority_pattern, patch]);

  const togglePriority = useCallback(async (category: string, name: string, side?: "L" | "R") => {
    const tier = getPriorityTier(category, name, side);
    await setPriorityTier(category, name, side, tier ? null : "priority");
  }, [getPriorityTier, setPriorityTier]);

  return {
    pattern,
    getCorrections,
    isPriority,
    getPriorityTier,
    setPriorityTier,
    setPriorityTierForSides,
    addCorrection,
    updateCorrection,
    toggleHolding,
    removeCorrection,
    togglePriority,
    patchPriorityPattern: patch,
  };
}
