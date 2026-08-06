import { CranialNerve } from "@/data/cranial-nerve-data";
import {
  NERVE_GROUPS,
  NUCLEI_COLORS,
  PRIMITIVE_TRACKS,
  cranialNerveInhibKey,
  cranialSideKey,
  cranialStimKey,
  isLateralStim,
  nerveStimLines,
  primitiveSideKey,
  primitiveStimKey,
  primitiveStimKeyAt,
} from "./pathway-reflex-stim-data";
import type { PrimitiveGridReflex } from "./pathway-reflex-stim-data";

export interface GridSummaryChip {
  label: string;
  side?: "L" | "R";
  inhib?: boolean;
}

export interface GridReflexItem {
  reflex: PrimitiveGridReflex;
  chips: GridSummaryChip[];
}

export interface GridNerveItem {
  nerve: CranialNerve;
  chips: GridSummaryChip[];
}

export interface GridTrackSection {
  title: string;
  color: string;
  items: GridReflexItem[];
  total: number;
}

export interface GridNucleiSection {
  label: string;
  color: string;
  items: GridNerveItem[];
  total: number;
}

const reflexChips = (
  checked: Record<string, boolean>,
  reflex: PrimitiveGridReflex
): GridSummaryChip[] => {
  const chips: GridSummaryChip[] = [];
  if (reflex.lateralized) {
    (["L", "R"] as const).forEach((s) => {
      if (checked[primitiveSideKey(reflex, s)])
        chips.push({ label: reflex.stimulus, side: s });
    });
  } else if (reflex.stims?.length) {
    reflex.stims.forEach((label, i) => {
      if (checked[primitiveStimKeyAt(reflex, i)]) chips.push({ label });
    });
  } else if (checked[primitiveStimKey(reflex)]) {
    chips.push({ label: reflex.stimulus });
  }
  return chips;
};

const nerveChips = (
  checked: Record<string, boolean>,
  nerve: CranialNerve
): GridSummaryChip[] => {
  const chips: GridSummaryChip[] = [];
  if (nerve.isLateralized) {
    (["L", "R"] as const).forEach((s) => {
      if (checked[cranialNerveInhibKey(nerve.id, s)])
        chips.push({ label: "Nerve inhibited", side: s, inhib: true });
    });
  } else if (checked[cranialNerveInhibKey(nerve.id)]) {
    chips.push({ label: "Nerve inhibited", inhib: true });
  }
  nerveStimLines(nerve).forEach((line, i) => {
    if (isLateralStim(nerve.id, i)) {
      (["L", "R"] as const).forEach((s) => {
        if (checked[cranialSideKey(nerve.id, i, s)]) chips.push({ label: line, side: s });
      });
    } else if (checked[cranialStimKey(nerve.id, i)]) {
      chips.push({ label: line });
    }
  });
  return chips;
};

export const gridSummarySections = (checked: Record<string, boolean>) => {
  const tracks: GridTrackSection[] = PRIMITIVE_TRACKS.map((track) => {
    const items = track.reflexes
      .map((reflex) => ({ reflex, chips: reflexChips(checked, reflex) }))
      .filter((x) => x.chips.length > 0);
    const total = items.reduce((acc, x) => acc + x.chips.length, 0);
    return { title: track.title, color: track.color, items, total };
  }).filter((s) => s.total > 0);

  const nuclei: GridNucleiSection[] = NERVE_GROUPS.map((group) => {
    const items = group.items
      .map((nerve) => ({ nerve, chips: nerveChips(checked, nerve) }))
      .filter((x) => x.chips.length > 0);
    const total = items.reduce((acc, x) => acc + x.chips.length, 0);
    return { label: group.label, color: NUCLEI_COLORS[group.label], items, total };
  }).filter((s) => s.total > 0);

  return { tracks, nuclei };
};

export interface GridTrackMetric {
  title: string;
  color: string;
  count: number;
}

export interface GridNucleiMetric {
  label: string;
  color: string;
  count: number;
}

export interface GridSummaryMetrics {
  activeCount: number;
  tracks: GridTrackMetric[];
  nuclei: GridNucleiMetric[];
}

export const gridSummaryMetrics = (checked: Record<string, boolean>): GridSummaryMetrics => {
  const { tracks, nuclei } = gridSummarySections(checked);
  const activeCount = Object.values(checked).filter(Boolean).length;
  return {
    activeCount,
    tracks: tracks.map((t) => ({ title: t.title, color: t.color, count: t.total })),
    nuclei: nuclei.map((n) => ({ label: n.label, color: n.color, count: n.total })),
  };
};
