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
    const current = getCorrections(category, name, side);
    const key = itemCorrectionKey(category, name, side);
    const nextItemCorrections = { ...itemCorrections, [key]: [...current, correction] };
    const currentMeta = safeParse<Record<string, any>>(appointment.metadata, {});
    const corrections = Array.isArray(currentMeta.corrections) ? currentMeta.corrections : [];
    const protocolLogs = { ...((currentMeta.protocol_logs as Record<string, any>) ?? {}) };
    const detailSummary = correction.details
      ? Object.entries(correction.details)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
          .join('; ')
      : '';
    const processId = `quick:${correction.id}`;
    protocolLogs[processId] = {
      ...(protocolLogs[processId] ?? {}),
      processId,
      process: correction.pathway,
      finding: side ? `${name} (${side})` : name,
      category,
      direction: correction.direction,
      details: correction.details ?? {},
      status: correction.holding ? 'holding' : 'pending',
      updatedAt: correction.createdAt,
      source: 'quick-correction',
    };
    const metaEntry = {
      id: correction.id,
      processId,
      finding: side ? `${name} (${side})` : name,
      pathway: correction.pathway,
      direction: correction.direction,
      summary: detailSummary || correction.pathway,
      timestamp: correction.createdAt,
      status: correction.holding ? 'holding' : 'pending',
      source: 'quick-correction',
      category,
      details: correction.details,
    };
    await patch({ itemCorrections: nextItemCorrections }, { corrections: [...corrections, metaEntry], protocol_logs: protocolLogs });
  }, [getCorrections, itemCorrections, patch, appointment.metadata]);

  const toggleHolding = useCallback(async (category: string, name: string, correctionId: string, side?: "L" | "R") => {
    const current = getCorrections(category, name, side);
    const next = current.map(c => c.id === correctionId ? { ...c, holding: !c.holding, updatedAt: new Date().toISOString() } : c);
    const key = itemCorrectionKey(category, name, side);
    const currentMeta = safeParse<Record<string, any>>(appointment.metadata, {});
    const corrections = Array.isArray(currentMeta.corrections) ? currentMeta.corrections : [];
    const holding = next.find(n => n.id === correctionId)?.holding;
    const updatedMetaCorrections = corrections.map((c: any) => c?.id === correctionId ? { ...c, status: holding ? 'holding' : 'pending' } : c);
    const protocolLogs = { ...((currentMeta.protocol_logs as Record<string, any>) ?? {}) };
    const pid = `quick:${correctionId}`;
    if (protocolLogs[pid]) protocolLogs[pid] = { ...protocolLogs[pid], status: holding ? 'holding' : 'pending', updatedAt: new Date().toISOString() };
    await patch({ itemCorrections: { ...itemCorrections, [key]: next } }, { corrections: updatedMetaCorrections, protocol_logs: protocolLogs });
  }, [getCorrections, itemCorrections, patch, appointment.metadata]);

  const removeCorrection = useCallback(async (category: string, name: string, correctionId: string, side?: "L" | "R") => {
    const current = getCorrections(category, name, side);
    const next = current.filter(c => c.id !== correctionId);
    const key = itemCorrectionKey(category, name, side);
    const currentMeta = safeParse<Record<string, any>>(appointment.metadata, {});
    const corrections = Array.isArray(currentMeta.corrections) ? currentMeta.corrections : [];
    const protocolLogs = { ...((currentMeta.protocol_logs as Record<string, any>) ?? {}) };
    delete protocolLogs[`quick:${correctionId}`];
    await patch({ itemCorrections: { ...itemCorrections, [key]: next } }, { corrections: corrections.filter((c: any) => c?.id !== correctionId), protocol_logs: protocolLogs });
  }, [getCorrections, itemCorrections, patch, appointment.metadata]);

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
    toggleHolding,
    removeCorrection,
    togglePriority,
    patchPriorityPattern: patch,
  };
}
