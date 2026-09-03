import { useMemo } from "react";
import { differenceInDays, addDays, format } from "date-fns";
import { BookingProposal } from "./useBookingProposals";

export interface Suggestion {
  clientId: string;
  clientName: string;
  predictedDate: Date;
  gapDays: number;
  confidence: number; // 0-1, proportion of gaps matching the mode
  availableSlots: { start: string; time: string }[];
  source: "pattern"; // extensible for future "availability-based" suggestions
}

/**
 * Detects recurring scheduling patterns per client from past appointment dates,
 * then checks which predicted dates have open cal.com slots in the timetable.
 *
 * Returns a list of `Suggestion` objects the practitioner can review → confirm.
 */
export function useSuggestionEngine({
  appointmentsData,
  enrichedClients,
  slots,
  proposals,
  calcomBookings,
}: {
  appointmentsData: { client_id: string; date: string; status: string | null }[];
  enrichedClients: { id: string; name: string | null; availability_notes?: string | null }[];
  slots: Record<string, { start: string; time: string }[]>;
  proposals: BookingProposal[];
  calcomBookings: Record<string, { uid?: string; attendeeName?: string }[]>;
}) {
  const suggestions = useMemo<Suggestion[]>(() => {
    const today = new Date();
    const todayMs = today.getTime();

    // Set of client IDs that already have a proposal in the future (any status).
    const clientsWithUpcomingProposal = new Set(
      proposals
        .filter((p) => {
          const t = new Date(p.slot_start).getTime();
          return t >= todayMs && p.status !== "dropped" && p.client_id;
        })
        .map((p) => p.client_id!)
    );

    // Set of cal.com booking attendee names (for dedup against already-booked slots).
    const bookedNames = new Set<string>();
    Object.values(calcomBookings).forEach((dayBookings) => {
      dayBookings.forEach((b) => {
        if (b.attendeeName) bookedNames.add(b.attendeeName.toLowerCase());
      });
    });

    const results: Suggestion[] = [];

    enrichedClients.forEach((client) => {
      // Need at least 2 past sessions to detect a pattern.
      const clientAppts = appointmentsData
        .filter((a) => a.client_id === client.id && a.status !== "Cancelled")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (clientAppts.length < 2) return;

      // Separate past and future.
      const pastAppts = clientAppts.filter((a) => new Date(a.date).getTime() < todayMs);
      const futureAppts = clientAppts.filter((a) => new Date(a.date).getTime() >= todayMs);

      if (pastAppts.length < 2) return;

      // Compute gaps between consecutive past sessions.
      const gaps: number[] = [];
      for (let i = 1; i < pastAppts.length; i++) {
        gaps.push(differenceInDays(new Date(pastAppts[i].date), new Date(pastAppts[i - 1].date)));
      }

      // Find mode (most common gap).
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

      if (modeGap < 3 || modeGap > 90) return; // too short or too long to be a recurring session

      const confidence = modeCount / gaps.length;
      if (confidence < 0.6) return; // less than 60% consistency

      // Skip if client already has an upcoming proposal.
      if (clientsWithUpcomingProposal.has(client.id)) return;

      // Predict next session: last past session + mode gap.
      const lastPast = pastAppts[pastAppts.length - 1];
      const predictedDate = addDays(new Date(lastPast.date), modeGap);

      // Skip if predicted date is in the past.
      if (predictedDate.getTime() < todayMs) {
        // Try advancing by one more cycle.
        const nextTry = addDays(predictedDate, modeGap);
        if (nextTry.getTime() < todayMs) return;
      }

      // Check if predicted date has available slots.
      const dateKey = format(predictedDate, "yyyy-MM-dd");
      const daySlots = slots[dateKey] || [];

      if (daySlots.length === 0) return;

      results.push({
        clientId: client.id,
        clientName: client.name || "Unknown",
        predictedDate,
        gapDays: modeGap,
        confidence,
        availableSlots: daySlots,
        source: "pattern",
      });
    });

    // Sort by predicted date ascending, then confidence descending.
    results.sort((a, b) => {
      const dateDiff = a.predictedDate.getTime() - b.predictedDate.getTime();
      return dateDiff !== 0 ? dateDiff : b.confidence - a.confidence;
    });

    return results;
  }, [appointmentsData, enrichedClients, slots, proposals, calcomBookings]);

  return { suggestions };
}
