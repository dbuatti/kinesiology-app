import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmBooking, dropBooking, PROPOSALS_CHANGED } from "@/lib/booking-proposals";

export type ProposalStatus = "suggested" | "proposed" | "confirmed" | "dropped";

export interface BookingProposal {
  id: string;
  user_id: string;
  client_id: string | null;
  student_name: string | null;
  student_email: string | null;
  kind: "fnh" | "voice";
  event_type_id: string | null;
  slot_start: string;
  slot_end: string;
  status: ProposalStatus;
  calcom_booking_id: string | null;
  appointment_id: string | null;
  reason: string | null;
  // Lesson proposals only: voice or piano (supabase_booking_proposals_discipline.sql).
  discipline?: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
}

/**
 * Some legacy/assistant-created voice proposals lost one of the two details
 * (name or email), which made Confirm fail with "Missing student details for
 * voice proposal". Before giving up, backfill the missing side from the only
 * other places the pairing exists: voice_bookings history and sibling proposal
 * rows for the same student.
 */
async function resolveMissingVoiceDetails(
  name: string,
  email: string
): Promise<{ name: string | null; email: string | null }> {
  let resolvedName = name || null;
  let resolvedEmail = email || null;
  try {
    if (resolvedName && !resolvedEmail) {
      const { data: byName } = await supabase
        .from("voice_bookings")
        .select("student_name, student_email")
        .not("student_email", "is", null)
        .ilike("student_name", resolvedName)
        .limit(1);
      if (byName?.[0]?.student_email) resolvedEmail = byName[0].student_email;

      if (!resolvedEmail) {
        const { data: bySibling } = await supabase
          .from("booking_proposals")
          .select("student_name, student_email")
          .eq("kind", "voice")
          .eq("student_name", resolvedName)
          .not("student_email", "is", null)
          .limit(1);
        if (bySibling?.[0]?.student_email) resolvedEmail = bySibling[0].student_email;
      }
    } else if (resolvedEmail && !resolvedName) {
      const { data } = await supabase
        .from("voice_bookings")
        .select("student_name, student_email")
        .eq("student_email", resolvedEmail)
        .limit(1);
      if (data?.[0]?.student_name) resolvedName = data[0].student_name;
    }
  } catch {
    // Leave as-is; confirm will throw a clear error below.
  }
  return { name: resolvedName, email: resolvedEmail };
}

/**
 * Loads booking proposals in the given [start, end] window and exposes
 * create + confirm + drop actions. Phase 2 is manual: we create directly
 * as 'proposed' (pencil-in), then 'confirm' books it in Cal.com via
 * `confirmBooking` (src/lib/booking-proposals.ts) and marks it confirmed.
 */
export function useBookingProposals(startISO: string, endISO: string) {
  const [proposals, setProposals] = useState<BookingProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `quiet` refreshes without the loading state (so the Timetable doesn't blank
  // when a proposal is confirmed somewhere else).
  const fetchProposals = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("booking_proposals")
        .select("*")
        .neq("status", "dropped")
        .order("slot_start", { ascending: true });

      if (fetchError) throw fetchError;
      setProposals((data || []) as BookingProposal[]);
    } catch (err) {
      console.error("Failed to load booking proposals:", err);
      setError(err instanceof Error ? err.message : "Failed to load proposals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
    // Confirmed or dropped from the Assistant or the Pending bookings panel.
    const onChanged = () => fetchProposals(true);
    window.addEventListener(PROPOSALS_CHANGED, onChanged);
    return () => window.removeEventListener(PROPOSALS_CHANGED, onChanged);
  }, [fetchProposals]);

  const createProposal = useCallback(
    async (input: {
      kind: "fnh" | "voice";
      clientId?: string | null;
      studentName?: string | null;
      studentEmail?: string | null;
      eventTypeId?: string | null;
      slotStart: string;
      slotEnd: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error: insertError } = await supabase
        .from("booking_proposals")
        .insert({
          user_id: userData?.user?.id,
          kind: input.kind,
          client_id: input.kind === "fnh" ? input.clientId : null,
          // Store the display name for BOTH kinds so the calendar shows who it is
          // (FNH proposals only carry a client_id otherwise → "FNH" with no name).
          student_name: input.studentName ?? null,
          student_email: input.kind === "voice" ? input.studentEmail : null,
          event_type_id: input.eventTypeId,
          slot_start: input.slotStart,
          slot_end: input.slotEnd,
          status: "proposed",
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }
      setProposals((prev) => [...prev, data as BookingProposal]);
      return data as BookingProposal;
    },
    []
  );

  const confirmProposal = useCallback(
    async (proposal: BookingProposal) => {
      let studentName = proposal.student_name?.trim() || null;
      let studentEmail = proposal.student_email?.trim() || null;
      if (proposal.kind === "voice" && (!studentName || !studentEmail)) {
        const resolved = await resolveMissingVoiceDetails(studentName ?? "", studentEmail ?? "");
        studentName = resolved.name;
        studentEmail = resolved.email;
        if (studentName && studentEmail) {
          await supabase
            .from("booking_proposals")
            .update({
              student_name: studentName,
              student_email: studentEmail,
              updated_at: new Date().toISOString(),
            })
            .eq("id", proposal.id);
        }
      }

      // Shared with the Assistant's cards and the Pending bookings panel.
      await confirmBooking({
        proposalId: proposal.id,
        kind: proposal.kind,
        clientId: proposal.client_id,
        name: studentName || "",
        email: studentEmail,
        startISO: proposal.slot_start,
        eventTypeId: proposal.event_type_id,
        discipline: proposal.discipline,
      });

      const { data: updated, error: fetchError } = await supabase
        .from("booking_proposals")
        .select("*")
        .eq("id", proposal.id)
        .single();
      if (fetchError) throw fetchError;
      setProposals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)) as BookingProposal[]);
      return updated as BookingProposal;
    },
    []
  );

  const dropProposal = useCallback(async (id: string) => {
    await dropBooking(id);
    setProposals((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const proposalsInWindow = proposals.filter((p) => {
    const t = new Date(p.slot_start).getTime();
    return t >= new Date(startISO).getTime() && t <= new Date(endISO).getTime();
  });

  return {
    proposals,
    proposalsInWindow,
    loading,
    error,
    refetch: fetchProposals,
    createProposal,
    confirmProposal,
    dropProposal,
  };
}
