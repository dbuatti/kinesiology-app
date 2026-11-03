import { describe, it, expect } from "vitest";
import { generateSessionSummaryEmail } from "@/utils/session-summary-email";
import { renderSessionSummaryEmailHtml } from "@/utils/session-summary-email-html";
import { scanForbiddenTerms } from "@/lib/session-summary-forbidden";

describe("session summary email", () => {
  it("contains no forbidden clinical terms", () => {
    const appt: any = {
      clients: { name: "Reuben Douglas", email: "reuben@example.com" },
      date: new Date("2026-11-02T23:30:00Z"),
      status: "Completed",
      homework_given: "Keep noticing how stress shows up\nDrink plenty of water",
      personal_note: "You did really well today.",
      bolt_score: 34,
      priority_pattern: { primitiveReflexes: { ATNR: "Active" } },
      harmonic_rocking_notes: "x",
      lymphatic_priority_zone: "zone 3",
    };
    const draft = generateSessionSummaryEmail({ appointment: appt, boltHistory: [28, 34] });
    expect(scanForbiddenTerms(draft)).toEqual([]);
  });

  it("omits BOLT trend with a single reading", () => {
    const appt: any = {
      clients: { name: "Sonia", email: "s@example.com" },
      date: new Date("2026-11-01T01:00:00Z"),
      status: "Completed",
      bolt_score: 30,
    };
    const draft = generateSessionSummaryEmail({ appointment: appt, boltHistory: [30] });
    expect(draft.toLowerCase()).not.toContain("breath-hold");
  });

  it("joins 1, 2 and 3+ techniques cleanly under one stem", () => {
    const base: any = { clients: { name: "Reuben" }, date: new Date(), status: "Completed" };
    const one = generateSessionSummaryEmail({ appointment: { ...base, priority_pattern: { a: 1 } } });
    expect(one).toContain("We checked how your nervous system is running.");
    const two = generateSessionSummaryEmail({ appointment: { ...base, priority_pattern: { a: 1 }, harmonic_rocking_notes: "x" } });
    expect(two).toContain("We checked how your nervous system is running, and helped your system settle and down-regulate.");
    const three = generateSessionSummaryEmail({ appointment: { ...base, priority_pattern: { a: 1 }, harmonic_rocking_notes: "x", bolt_score: 30 } });
    expect(three).toContain("We checked how your nervous system is running, helped your system settle and down-regulate, and looked at your breathing.");
  });
  it("treats placeholder homework/personal_note as missing", () => {
    const appt: any = {
      clients: { name: "Reuben" },
      date: new Date(),
      status: "Completed",
      homework_given: "N/A",
      personal_note: "  -  ",
    };
    const draft = generateSessionSummaryEmail({ appointment: appt });
    expect(draft).not.toContain("Your homework:");
    expect(draft).not.toContain("N/A");
  });

  it("detects the four Recorded SNS protocols (metadata.sns_resets)", () => {
    const appt: any = {
      clients: { name: "Reuben" },
      date: new Date("2026-11-03T00:00:00Z"),
      status: "Completed",
      metadata: { sns_resets: { lymphatic: true, t1: true, diaphragm: true, harmonic: true } },
    };
    const draft = generateSessionSummaryEmail({ appointment: appt });
    expect(draft).toContain("helped your system settle and down-regulate");
    expect(draft).toContain("did some gentle lymphatic work to help your body clear and reset");
  });

  it("combines PEACE records with assessment/BOLT sources (Reuben regression)", () => {
    const appt: any = {
      clients: { name: "Reuben" },
      date: new Date("2026-11-03T00:00:00Z"),
      status: "Completed",
      bolt_score: 23,
      priority_pattern: { primitiveReflexes: { ATNR: "Active" } },
      metadata: { sns_resets: { lymphatic: true, t1: true, diaphragm: true, harmonic: true } },
    };
    const draft = generateSessionSummaryEmail({ appointment: appt, boltHistory: [23] });
    expect(draft).toContain("checked how your nervous system is running");
    expect(draft).toContain("helped your system settle and down-regulate");
    expect(draft).toContain("did some gentle lymphatic work to help your body clear and reset");
    expect(draft).toContain("looked at your breathing");
  });

  it("preview HTML equals sent HTML for the same draft", () => {
    const input = {
      from: "Daniele Buatti <info@danielebuatti.com>",
      to: "reuben@example.com",
      subject: "Your session today – 3 November",
      body: "Hi Reuben,\n\nThanks for coming in.\n\nAll the best,\nDaniele",
      date: "Monday 3 November",
    };
    const preview = renderSessionSummaryEmailHtml(input);
    const sent = renderSessionSummaryEmailHtml(input);
    expect(preview).toBe(sent);
    expect(preview).toContain("Hi Reuben,");
    expect(preview).toContain("Thanks for coming in.");
  });

  it("degrades gracefully with missing fields", () => {
    const appt: any = {
      clients: { name: "Elizabeth", email: "e@example.com" },
      date: new Date("2026-10-29T06:15:00Z"),
      status: "Completed",
    };
    const draft = generateSessionSummaryEmail({ appointment: appt });
    expect(draft).toContain("Hi Elizabeth,");
    expect(draft).not.toContain("undefined");
    expect(draft).not.toContain("- \n");
  });
});
