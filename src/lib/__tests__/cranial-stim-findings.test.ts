import { describe, it, expect } from "vitest";
import {
  getInhibitedFindings,
} from "@/components/crm/v2/v2-utils";
import {
  splitCranialNervePattern,
} from "@/lib/cranial-stim-findings";

const nerve = "CN II: Optic";

describe("cranial stim findings", () => {
  it("treats stims as information on the parent nerve, not separate findings", () => {
    const pattern = {
      cranialNerves: {
        [`${nerve} (L)`]: "Inhibited",
        [`${nerve} — From below (L)`]: "Inhibited",
        [`${nerve} — From the lateral side (L)`]: "Inhibited",
      },
    };

    const split = splitCranialNervePattern(pattern.cranialNerves);
    expect(Object.keys(split.findings)).toEqual([`${nerve} (L)`]);
    expect(Object.keys(split.stims)).toHaveLength(2);

    const findings = getInhibitedFindings(pattern);
    expect(findings).toHaveLength(1);
    expect(findings[0].fullName).toBe(`${nerve} (L)`);
    expect(findings[0].baseName).toBe(nerve);
    expect(findings[0].side).toBe("L");
  });

  it("infers the parent nerve when only stim rows were recorded", () => {
    const pattern = {
      cranialNerves: {
        [`${nerve} — From below (L)`]: "Inhibited",
      },
    };

    const findings = getInhibitedFindings(pattern);
    expect(findings).toHaveLength(1);
    expect(findings[0].fullName).toBe(`${nerve} (L)`);
  });
});
