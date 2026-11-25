import { describe, it, expect } from "vitest";
import { REFLEX_TRACKS, reflexDisplayOrder, reflexSortRank } from "@/lib/reflex-order";

describe("reflex clinical order", () => {
  it("runs Track 1 from Moro to Fear Paralysis", () => {
    expect(REFLEX_TRACKS[0].names[0]).toBe("Moro Reflex");
    expect(REFLEX_TRACKS[0].names.at(-1)).toBe("Fear Paralysis Reflex");
  });

  it("puts Babinski near the end of Track 2", () => {
    const order = reflexDisplayOrder("Babinski Reflex");
    expect(order?.track).toBe(2);
    expect(order!.index).toBeGreaterThan(3);
    expect(REFLEX_TRACKS[1].names.at(-2)).toBe("Babinski Reflex");
  });

  it("resolves legacy long names and side suffixes", () => {
    expect(reflexDisplayOrder("Tonic Labyrinthine Reflex")).toEqual({ track: 1, index: 2 });
    expect(reflexDisplayOrder("ATNR (L)")).toEqual({ track: 2, index: 0 });
  });

  it("sorts unknown reflexes after the known tracks", () => {
    expect(reflexSortRank("Unknown Reflex").track).toBeGreaterThan(REFLEX_TRACKS.length);
  });
});
