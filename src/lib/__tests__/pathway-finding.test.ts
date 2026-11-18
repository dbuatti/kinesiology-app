import { describe, it, expect } from "vitest";
import {
  findingNameFromPathway,
  isCorrectionProcessName,
} from "@/lib/pathway-finding";

describe("findingNameFromPathway", () => {
  it("recovers the finding name from an Align label", () => {
    expect(findingNameFromPathway("Right Ankle (R) — Inhibited · Muscles")).toBe(
      "Right Ankle (R)",
    );
  });

  it("strips just the category when there is no status", () => {
    expect(findingNameFromPathway("Right Ankle · Muscles")).toBe("Right Ankle");
  });

  it("keeps a plain custom pathway", () => {
    expect(findingNameFromPathway("Right Ankle")).toBe("Right Ankle");
  });

  it("returns null for CUSTOM or an empty value", () => {
    expect(findingNameFromPathway("CUSTOM")).toBeNull();
    expect(findingNameFromPathway("")).toBeNull();
    expect(findingNameFromPathway(null)).toBeNull();
    expect(findingNameFromPathway(undefined)).toBeNull();
  });
});

describe("isCorrectionProcessName", () => {
  it("recognises correction processes and their variants", () => {
    expect(isCorrectionProcessName("Mechanoreceptor (Unconscious)")).toBe(true);
    expect(isCorrectionProcessName("Nociceptive (Threat Detection)")).toBe(true);
    expect(isCorrectionProcessName("Emotional (Pulse Point)")).toBe(true);
  });

  it("does not treat real findings as processes", () => {
    expect(isCorrectionProcessName("Right Ankle")).toBe(false);
    expect(isCorrectionProcessName("Psoas (R)")).toBe(false);
    expect(isCorrectionProcessName("Startle Reflex")).toBe(false);
  });
});