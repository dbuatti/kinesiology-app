import { describe, it, expect } from "vitest";
import {
  CLAUDE_PROJECT_INSTRUCTIONS,
  buildSessionContext,
  parseSessionDraft,
} from "@/lib/session-draft";
import type { AppointmentWithClient } from "@/types/crm";

describe("parseSessionDraft", () => {
  it("parses the canonical SESSION DRAFT block", () => {
    const result = parseSessionDraft(`SESSION DRAFT

**GOAL:** Sore right shoulder after travel.

KEY FINDINGS: Right cervical restriction; low BOLT.

NOTES: We worked on the shoulder. Client reported a stressful week.

HOMEWORK:
- BOLT daily
- Gentle neck work

NEXT SESSION: Re-test the shoulder first.

ACTION ITEMS:
- add to client record: new diagnosis
- resend payment link`);

    expect(result).not.toBeNull();
    expect(result!.values.goal).toBe("Sore right shoulder after travel.");
    expect(result!.values.notes).toContain("stressful week");
    expect(result!.values.homework).toContain("BOLT daily");
    expect(result!.values.nextSession).toContain("Re-test the shoulder");
    expect(result!.actionItems).toEqual(["add to client record: new diagnosis", "resend payment link"]);
  });

  it("accepts the catalog-style headings Claude falls back to", () => {
    const result = parseSessionDraft(`Clinical Catalog — Susan Lord | Session Date: 11-06-26

STRUCTURED FINDINGS
[BOLT Score] Control Pause Test | Bilateral | Measured
Left vestibular drift on Fukuda testing.

SUMMARY (Clinical Notes)
Presented after a high-stress weekend. Neck tightness on palpation.

PATTERN ANALYSIS
Gallbladder / Liver channel leads.

PRIORITY FOCUS — Next Session (1 July)
Reassess vestibular drift.

CLIENT HOMEWORK
5:15 breathing, 3x daily.`);

    expect(result).not.toBeNull();
    expect(result!.values.keyFindings).toContain("Left vestibular drift");
    expect(result!.values.notes).toContain("high-stress weekend");
    expect(result!.values.notes).toContain("Gallbladder / Liver channel leads.");
    expect(result!.values.nextSession).toBe("Reassess vestibular drift.");
    expect(result!.values.homework).toContain("5:15 breathing");
  });

  it("ignores an echoed context block when a SESSION DRAFT marker is present", () => {
    const result = parseSessionDraft(`=== SESSION RECORD ===
Findings & statuses:
  - Quadratus Lumborum (L) — Inhibited

SESSION DRAFT
GOAL: Left flank discomfort.
NOTES: Worked on the QL.`);

    expect(result!.values.goal).toBe("Left flank discomfort.");
    expect(result!.values.keyFindings).toBeUndefined();
  });

  it("returns null when there are no draft headings", () => {
    expect(parseSessionDraft("Just a chat about the weather.")).toBeNull();
  });
});

describe("buildSessionContext", () => {
  it("marks the date authoritative and carries the reply contract", () => {
    const appointment = {
      id: "app-1",
      date: new Date("2026-11-25T10:00:00"),
      bolt_score: 27,
      clients: { name: "Susan Lord" },
    } as unknown as AppointmentWithClient;

    const context = buildSessionContext(appointment);
    expect(context).toContain("authoritative — do not reinterpret dates");
    expect(context).toContain("Do not update Notion or any other system");
    expect(context).toContain("Ignore Project knowledge files, uploads, memory and earlier sessions");
    expect(context).toContain("never re-draft the recorded BOLT");
    expect(context).toContain("=== TRANSCRIPT ===");
  });
});

describe("CLAUDE_PROJECT_INSTRUCTIONS", () => {
  it("forbids cross-session leakage and direct Notion writes", () => {
    expect(CLAUDE_PROJECT_INSTRUCTIONS).toContain("use ONLY the pasted SESSION RECORD and TRANSCRIPT");
    expect(CLAUDE_PROJECT_INSTRUCTIONS).toContain("Ignore Project knowledge files, uploads, memory and every earlier session");
    expect(CLAUDE_PROJECT_INSTRUCTIONS).toContain("must not be written directly");
  });
});
