import { useMemo } from "react";
import { differenceInDays, addDays, format } from "date-fns";
import { BookingProposal } from "./useBookingProposals";

export type SuggestionSource = "pattern" | "voice-pattern" | "availability" | "overdue" | "voice-overdue";

export interface Suggestion {
  clientId: string;
  clientName: string;
  predictedDate: Date;
  gapDays: number;
  confidence: number;
  availableSlots: { start: string; time: string }[];
  source: SuggestionSource;
  reason: string;
}

const RECENT_WINDOW = 6; // look at last N sessions for pattern detection
const CLUSTER_TOLERANCE = 2; // gaps within ±2 days of each other count as matching
const MIN_CONFIDENCE = 0.4; // 2 out of 5 matching = suggestion
const OVERDUE_MULTIPLIER = 1.5; // if gap since last session > avg gap × this → overdue

function detectPattern(
  pastDates: Date[],
  todayMs: number
): { gapDays: number; confidence: number; lastDate: Date } | null {
  if (pastDates.length < 2) return null;

  // Rolling window: only look at the most recent RECENT_WINDOW sessions
  const recent = pastDates.slice(-RECENT_WINDOW);
  if (recent.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    gaps.push(differenceInDays(recent[i], recent[i - 1]));
  }

  // Cluster gaps within ±CLUSTER_TOLERANCE days of each other
  const gapCounts = new Map<number, number>();
  gaps.forEach((g) => {
    // Find an existing cluster key within tolerance
    let matched = false;
    gapCounts.forEach((count, key) => {
      if (!matched && Math.abs(g - key) <= CLUSTER_TOLERANCE) {
        gapCounts.set(key, count + 1);
        matched = true;
      }
    });
    if (!matched) {
      gapCounts.set(g, 1);
    }
  });

  let modeGap = 0;
  let modeCount = 0;
  gapCounts.forEach((count, gap) => {
    if (count > modeCount) {
      modeCount = count;
      modeGap = gap;
    }
  });

  if (modeGap < 3 || modeGap > 120) return null;

  const confidence = modeCount / gaps.length;
  if (confidence < MIN_CONFIDENCE) return null;

  return { gapDays: modeGap, confidence, lastDate: recent[recent.length - 1] };
}

function computeAverageGap(pastDates: Date[]): number {
  if (pastDates.length < 2) return 0;
  const gaps: number[] = [];
  for (let i = 1; i < pastDates.length; i++) {
    gaps.push(differenceInDays(pastDates[i], pastDates[i - 1]));
  }
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
}

function advancePastToday(date: Date, gapDays: number, todayMs: number): Date | null {
  let d = date;
  let safety = 0;
  while (d.getTime() < todayMs && safety < 20) {
    d = addDays(d, gapDays);
    safety++;
  }
  return d.getTime() >= todayMs ? d : null;
}

/**
 * Detects recurring scheduling patterns per client from past session dates
 * (both FNH appointments and voice bookings), generates availability-based
 * suggestions from client availability notes, and surfaces overdue clients
 * who haven't been seen in a while.
 */
export function useSuggestionEngine({
  appointmentsData,
  voiceBookingsData,
  enrichedClients,
  enrichedVoiceStudents,
  slots,
  proposals,
  calcomBookings,
}: {
  appointmentsData: { client_id: string; date: string; status: string | null }[];
  voiceBookingsData: { student_email: string | null; lesson_date: string; status: string | null }[];
  enrichedClients: { id: string; name: string | null; availability_notes?: string | null }[];
  enrichedVoiceStudents: { id: string; name: string | null; email: string | null; availability_notes?: string | null }[];
  slots: Record<string, { start: string; time: string }[]>;
  proposals: BookingProposal[];
  calcomBookings: Record<string, { uid?: string; attendeeName?: string }[]>;
}) {
  const suggestions = useMemo<Suggestion[]>(() => {
    const today = new Date();
    const todayMs = today.getTime();
    const results: Suggestion[] = [];

    // Set of client IDs that already have an active proposal in the future.
    const clientsWithUpcomingProposal = new Set(
      proposals
        .filter((p) => {
          const t = new Date(p.slot_start).getTime();
          return t >= todayMs && p.status !== "dropped";
        })
        .map((p) => p.client_id)
    );

    // Student emails that already have an active voice proposal.
    const emailsWithUpcomingProposal = new Set(
      proposals
        .filter((p) => {
          const t = new Date(p.slot_start).getTime();
          return t >= todayMs && p.status !== "dropped" && p.kind === "voice";
        })
        .map((p) => p.student_email?.toLowerCase())
    );

    // ── 1. FNH pattern detection (rolling window) ─────────────────
    enrichedClients.forEach((client) => {
      if (clientsWithUpcomingProposal.has(client.id)) return;

      const pastDates = appointmentsData
        .filter((a) => a.client_id === client.id && a.status !== "Cancelled")
        .map((a) => new Date(a.date))
        .filter((d) => d.getTime() < todayMs)
        .sort((a, b) => a.getTime() - b.getTime());

      const pattern = detectPattern(pastDates, todayMs);
      if (pattern) {
        const predictedDate = advancePastToday(pattern.lastDate, pattern.gapDays, todayMs);
        if (predictedDate) {
          const dateKey = format(predictedDate, "yyyy-MM-dd");
          const daySlots = slots[dateKey] || [];
          if (daySlots.length > 0) {
            results.push({
              clientId: client.id,
              clientName: client.name || "Unknown",
              predictedDate,
              gapDays: pattern.gapDays,
              confidence: pattern.confidence,
              availableSlots: daySlots,
              source: "pattern",
              reason: `Every ~${pattern.gapDays}d (${Math.round(pattern.confidence * 100)}% consistent)`,
            });
          }
        }
      }
    });

    // ── 2. Voice pattern detection (rolling window) ───────────────
    enrichedVoiceStudents.forEach((student) => {
      if (!student.email) return;
      if (emailsWithUpcomingProposal.has(student.email.toLowerCase())) return;

      const pastDates = voiceBookingsData
        .filter(
          (b) =>
            b.student_email?.toLowerCase() === student.email!.toLowerCase() &&
            b.status !== "cancelled"
        )
        .map((b) => new Date(b.lesson_date))
        .filter((d) => d.getTime() < todayMs)
        .sort((a, b) => a.getTime() - b.getTime());

      const pattern = detectPattern(pastDates, todayMs);
      if (pattern) {
        const predictedDate = advancePastToday(pattern.lastDate, pattern.gapDays, todayMs);
        if (predictedDate) {
          const dateKey = format(predictedDate, "yyyy-MM-dd");
          const daySlots = slots[dateKey] || [];
          if (daySlots.length > 0) {
            results.push({
              clientId: student.id,
              clientName: student.name || student.email || "Unknown",
              predictedDate,
              gapDays: pattern.gapDays,
              confidence: pattern.confidence,
              availableSlots: daySlots,
              source: "voice-pattern",
              reason: `Voice every ~${pattern.gapDays}d (${Math.round(pattern.confidence * 100)}%)`,
            });
          }
        }
      }
    });

    // ── 3. Overdue FNH clients ────────────────────────────────────
    // Clients with 2+ past sessions, no upcoming proposal, and whose
    // last session was significantly past their average interval.
    const suggestedClientIds = new Set(results.map((r) => r.clientId));

    enrichedClients.forEach((client) => {
      if (clientsWithUpcomingProposal.has(client.id)) return;
      if (suggestedClientIds.has(client.id)) return;

      const pastDates = appointmentsData
        .filter((a) => a.client_id === client.id && a.status !== "Cancelled")
        .map((a) => new Date(a.date))
        .filter((d) => d.getTime() < todayMs)
        .sort((a, b) => a.getTime() - b.getTime());

      if (pastDates.length < 2) return;

      const avgGap = computeAverageGap(pastDates);
      if (avgGap < 3 || avgGap > 120) return;

      const lastSession = pastDates[pastDates.length - 1];
      const daysSinceLast = differenceInDays(today, lastSession);

      if (daysSinceLast < avgGap * OVERDUE_MULTIPLIER) return;

      // Suggest booking on the next available day with slots
      for (let offset = 1; offset <= 14; offset++) {
        const candidateDate = addDays(today, offset);
        const dateKey = format(candidateDate, "yyyy-MM-dd");
        const daySlots = slots[dateKey] || [];
        if (daySlots.length === 0) continue;

        results.push({
          clientId: client.id,
          clientName: client.name || "Unknown",
          predictedDate: candidateDate,
          gapDays: Math.round(avgGap),
          confidence: 0.6,
          availableSlots: daySlots,
          source: "overdue",
          reason: `Last session ${daysSinceLast}d ago (avg every ~${Math.round(avgGap)}d)`,
        });
        break;
      }
    });

    // ── 4. Overdue voice students ──────────────────────────────────
    enrichedVoiceStudents.forEach((student) => {
      if (!student.email) return;
      if (emailsWithUpcomingProposal.has(student.email.toLowerCase())) return;
      if (suggestedClientIds.has(student.id)) return;

      const pastDates = voiceBookingsData
        .filter(
          (b) =>
            b.student_email?.toLowerCase() === student.email!.toLowerCase() &&
            b.status !== "cancelled"
        )
        .map((b) => new Date(b.lesson_date))
        .filter((d) => d.getTime() < todayMs)
        .sort((a, b) => a.getTime() - b.getTime());

      if (pastDates.length < 2) return;

      const avgGap = computeAverageGap(pastDates);
      if (avgGap < 3 || avgGap > 180) return;

      const lastSession = pastDates[pastDates.length - 1];
      const daysSinceLast = differenceInDays(today, lastSession);

      if (daysSinceLast < avgGap * OVERDUE_MULTIPLIER) return;

      for (let offset = 1; offset <= 14; offset++) {
        const candidateDate = addDays(today, offset);
        const dateKey = format(candidateDate, "yyyy-MM-dd");
        const daySlots = slots[dateKey] || [];
        if (daySlots.length === 0) continue;

        results.push({
          clientId: student.id,
          clientName: student.name || student.email || "Unknown",
          predictedDate: candidateDate,
          gapDays: Math.round(avgGap),
          confidence: 0.6,
          availableSlots: daySlots,
          source: "voice-overdue",
          reason: `Last lesson ${daysSinceLast}d ago (avg every ~${Math.round(avgGap)}d)`,
        });
        break;
      }
    });

    // ── 5. Availability-based suggestions ──────────────────────────
    enrichedClients.forEach((client) => {
      if (clientsWithUpcomingProposal.has(client.id)) return;
      if (suggestedClientIds.has(client.id)) return;
      if (!client.availability_notes) return;

      const dayMap: Record<string, number> = {
        sunday: 0, sun: 0, sundays: 0,
        monday: 1, mon: 1, mondays: 1,
        tuesday: 2, tue: 2, tuesdays: 2,
        wednesday: 3, wed: 3, wednesdays: 3,
        thursday: 4, thu: 4, thursdays: 4,
        friday: 5, fri: 5, fridays: 5,
        saturday: 6, sat: 6, saturdays: 6,
      };

      const notesLower = client.availability_notes.toLowerCase();
      const preferredDays: number[] = [];

      if (notesLower.includes("weekday") || notesLower.includes("mon-fri") || notesLower.includes("monday to friday")) {
        preferredDays.push(1, 2, 3, 4, 5);
      }

      if (notesLower.includes("weekend")) {
        preferredDays.push(0, 6);
      }

      Object.entries(dayMap).forEach(([word, dayNum]) => {
        if (notesLower.includes(word) && !preferredDays.includes(dayNum)) {
          preferredDays.push(dayNum);
        }
      });

      if (preferredDays.length === 0) return;

      for (let offset = 1; offset <= 14; offset++) {
        const candidateDate = addDays(today, offset);
        const dayOfWeek = candidateDate.getDay();

        if (!preferredDays.includes(dayOfWeek)) continue;

        const dateKey = format(candidateDate, "yyyy-MM-dd");
        const daySlots = slots[dateKey] || [];
        if (daySlots.length === 0) continue;

        results.push({
          clientId: client.id,
          clientName: client.name || "Unknown",
          predictedDate: candidateDate,
          gapDays: 0,
          confidence: 0.5,
          availableSlots: daySlots,
          source: "availability",
          reason: `Available on ${format(candidateDate, "EEEE")}s (per notes)`,
        });
        break;
      }
    });

    // Sort: pattern/voice-pattern first, then overdue, then availability.
    results.sort((a, b) => {
      const order: Record<SuggestionSource, number> = {
        "pattern": 0, "voice-pattern": 1, "overdue": 2, "voice-overdue": 3, "availability": 4,
      };
      const oa = order[a.source] ?? 5;
      const ob = order[b.source] ?? 5;
      if (oa !== ob) return oa - ob;
      return a.predictedDate.getTime() - b.predictedDate.getTime();
    });

    return results;
  }, [appointmentsData, voiceBookingsData, enrichedClients, enrichedVoiceStudents, slots, proposals, calcomBookings]);

  return { suggestions };
}
