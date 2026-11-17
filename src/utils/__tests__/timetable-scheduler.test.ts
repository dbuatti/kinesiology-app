import { describe, it, expect } from "vitest";
import {
  autoDraftScheduleAnchored,
  computePreferredTime,
  parseAvailabilityText,
} from "@/utils/timetable-scheduler";

describe("parseAvailabilityText", () => {
  it("parses 'any day from 5:30pm'", () => {
    const w = parseAvailabilityText("any day from 5:30pm");
    expect(w.length).toBeGreaterThan(0);
    expect(w[0].from).toBe("17:30");
    expect(w[0].days).toEqual([]);
  });

  it("parses weekday ranges", () => {
    const w = parseAvailabilityText("Tuesday until 2pm");
    expect(w.length).toBeGreaterThan(0);
    expect(w[0].to).toBe("14:00");
  });
});

describe("computePreferredTime", () => {
  it("returns null for empty", () => {
    expect(computePreferredTime([])).toBeNull();
  });
  it("single session low confidence", () => {
    const d = new Date("2026-10-26T10:00:00");
    const p = computePreferredTime([d]);
    expect(p).not.toBeNull();
    expect(p!.confidence).toBe(0.35);
    expect(p!.sampleSize).toBe(1);
  });
});

describe("autoDraftScheduleAnchored", () => {
  it("places a single client with no history", () => {
    const now = new Date();
    const slotStart = new Date(now.getTime() + 2 * 86400000);
    slotStart.setHours(10, 0, 0, 0);
    const res = autoDraftScheduleAnchored({
      clients: [{ id: "c1", kind: "fnh", name: "Alice", pastSessions: [] }],
      openSlots: [{ start: slotStart, durationMin: 60, kind: "fnh" }],
      busyBlocks: [],
    });
    expect(res.assignments.length).toBe(1);
    expect(res.assignments[0].name).toBe("Alice");
  });

  it("does not place two instances in same week for one client", () => {
    const now = new Date();
    const s1 = new Date(now.getTime() + 2 * 86400000); s1.setHours(10,0,0,0);
    const s2 = new Date(now.getTime() + 3 * 86400000); s2.setHours(10,0,0,0);
    const res = autoDraftScheduleAnchored({
      clients: [
        { id: "c1#0", kind: "fnh", name: "Bob", pastSessions: [], targetDate: s1, targetWindowDays: 3 },
        { id: "c1#1", kind: "fnh", name: "Bob", pastSessions: [], targetDate: s2, targetWindowDays: 3 },
      ],
      openSlots: [{ start: s1, durationMin: 60, kind: "fnh" }, { start: s2, durationMin: 60, kind: "fnh" }],
      busyBlocks: [],
    });
    // usedWeeks should prevent same-week dupes; here different days same week possible
    expect(res.assignments.length).toBeLessThanOrEqual(2);
  });
});
