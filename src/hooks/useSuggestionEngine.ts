import { useMemo } from "react";
import { differenceInDays, addDays, format } from "date-fns";
import { BookingProposal } from "./useBookingProposals";

export type SuggestionSource = "pattern" | "voice-pattern" | "availability";

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

/**
 * Detects recurring scheduling patterns per client from past session dates
 * (both FNH appointments and voice bookings), and generates availability-based
 * suggestions from client availability notes.
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

    // ── Helper: detect pattern from a list of dates ──────────────────
    function detectPattern(
      dates: Date[],
      minSessions: number
    ): { gapDays: number; confidence: number; lastDate: Date } | null {
      const pastDates = dates.filter((d) => d.getTime() < todayMs);
      if (pastDates.length < minSessions) return null;

      const gaps: number[] = [];
      for (let i = 1; i < pastDates.length; i++) {
        gaps.push(differenceInDays(pastDates[i], pastDates[i - 1]));
      }

      const gapCounts = new Map<number, number>();
      gaps.forEach((g) => gapCounts.set(g, (gapCounts.get(g) || 0) + 1));

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
      if (confidence < 0.5) return null; // lowered from 0.6

      return { gapDays: modeGap, confidence, lastDate: pastDates[pastDates.length - 1] };
    }

    // ── Helper: advance a date past today if needed ──────────────────
    function advancePastToday(date: Date, gapDays: number): Date | null {
      let d = date;
      let safety = 0;
      while (d.getTime() < todayMs && safety < 20) {
        d = addDays(d, gapDays);
        safety++;
      }
      return d.getTime() >= todayMs ? d : null;
    }

    // ── 1. FNH pattern detection ─────────────────────────────────────
    enrichedClients.forEach((client) => {
      if (clientsWithUpcomingProposal.has(client.id)) return;

      const clientAppts = appointmentsData
        .filter((a) => a.client_id === client.id && a.status !== "Cancelled")
        .map((a) => new Date(a.date))
        .sort((a, b) => a.getTime() - b.getTime());

      const pattern = detectPattern(clientAppts, 2);
      if (!pattern) return;

      const predictedDate = advancePastToday(pattern.lastDate, pattern.gapDays);
      if (!predictedDate) return;

      const dateKey = format(predictedDate, "yyyy-MM-dd");
      const daySlots = slots[dateKey] || [];
      if (daySlots.length === 0) return;

      results.push({
        clientId: client.id,
        clientName: client.name || "Unknown",
        predictedDate,
        gapDays: pattern.gapDays,
        confidence: pattern.confidence,
        availableSlots: daySlots,
        source: "pattern",
        reason: `Every ${pattern.gapDays} days (${Math.round(pattern.confidence * 100)}% consistent)`,
      });
    });

    // ── 2. Voice pattern detection ───────────────────────────────────
    enrichedVoiceStudents.forEach((student) => {
      if (!student.email) return;
      if (emailsWithUpcomingProposal.has(student.email.toLowerCase())) return;

      const studentBookings = voiceBookingsData
        .filter(
          (b) =>
            b.student_email?.toLowerCase() === student.email!.toLowerCase() &&
            b.status !== "cancelled"
        )
        .map((b) => new Date(b.lesson_date))
        .sort((a, b) => a.getTime() - b.getTime());

      const pattern = detectPattern(studentBookings, 2);
      if (!pattern) return;

      const predictedDate = advancePastToday(pattern.lastDate, pattern.gapDays);
      if (!predictedDate) return;

      const dateKey = format(predictedDate, "yyyy-MM-dd");
      const daySlots = slots[dateKey] || [];
      if (daySlots.length === 0) return;

      results.push({
        clientId: student.id,
        clientName: student.name || student.email || "Unknown",
        predictedDate,
        gapDays: pattern.gapDays,
        confidence: pattern.confidence,
        availableSlots: daySlots,
        source: "voice-pattern",
        reason: `Voice lesson every ${pattern.gapDays}d (${Math.round(pattern.confidence * 100)}%)`,
      });
    });

    // ── 3. Availability-based suggestions ────────────────────────────
    // For clients with availability_notes who have NO upcoming proposal
    // and NO existing pattern suggestion, suggest based on their stated preferences.
    const suggestedClientIds = new Set(results.map((r) => r.clientId));

    enrichedClients.forEach((client) => {
      if (clientsWithUpcomingProposal.has(client.id)) return;
      if (suggestedClientIds.has(client.id)) return;
      if (!client.availability_notes) return;

      // Parse simple day-of-week preferences from the notes.
      // Matches patterns like "Monday", "Mon", "Monday and Tuesday", "Mon-Fri", "weekdays"
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

      // Check for "weekdays" / "weekdays"
      if (notesLower.includes("weekday") || notesLower.includes("mon-fri") || notesLower.includes("monday to friday")) {
        preferredDays.push(1, 2, 3, 4, 5);
      }

      // Check for "weekend"
      if (notesLower.includes("weekend")) {
        preferredDays.push(0, 6);
      }

      // Check individual day names
      Object.entries(dayMap).forEach(([word, dayNum]) => {
        if (notesLower.includes(word) && !preferredDays.includes(dayNum)) {
          preferredDays.push(dayNum);
        }
      });

      if (preferredDays.length === 0) return;

      // Find the next matching day within the next 14 days that has slots.
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
        break; // only suggest the next matching day
      }
    });

    // Sort: pattern-based first (by date), then availability-based.
    results.sort((a, b) => {
      if (a.source === "pattern" && b.source !== "pattern") return -1;
      if (a.source !== "pattern" && b.source === "pattern") return 1;
      return a.predictedDate.getTime() - b.predictedDate.getTime();
    });

    return results;
  }, [appointmentsData, voiceBookingsData, enrichedClients, enrichedVoiceStudents, slots, proposals, calcomBookings]);

  return { suggestions };
}
