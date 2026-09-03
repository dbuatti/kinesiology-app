import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
}

/**
 * Loads booking proposals in the given [start, end] window and exposes
 * create + confirm + drop actions. Phase 2 is manual: we create directly
 * as 'proposed' (pencil-in), then 'confirm' calls the appropriate cal.com
 * edge function and marks the proposal confirmed.
 */
export function useBookingProposals(startISO: string, endISO: string) {
  const [proposals, setProposals] = useState<BookingProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("booking_proposals")
        .select("*")
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
          student_name: input.kind === "voice" ? input.studentName : null,
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
      if (proposal.kind === "fnh") {
        if (!proposal.client_id) throw new Error("Missing client for FNH proposal.");

        const { data, error: invokeError } = await supabase.functions.invoke(
          "create-calcom-booking",
          {
            body: {
              clientId: proposal.client_id,
              startTime: proposal.slot_start,
              eventTypeId: proposal.event_type_id || undefined,
            },
          }
        );

        if (invokeError) throw invokeError;
        if (!data?.success) throw new Error(data?.error || "Cal.com booking failed.");

        const { data: updated, error: updateError } = await supabase
          .from("booking_proposals")
          .update({
            status: "confirmed",
            calcom_booking_id: data.uid,
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", proposal.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setProposals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)) as BookingProposal[]);
        return updated as BookingProposal;
      }

      // voice path
      if (!proposal.student_name || !proposal.student_email) {
        throw new Error("Missing student details for voice proposal.");
      }

      const { data, error: invokeError } = await supabase.functions.invoke(
        "voice-create-booking",
        {
          body: {
            studentName: proposal.student_name,
            studentEmail: proposal.student_email,
            startTime: proposal.slot_start,
            eventTypeId: proposal.event_type_id || undefined,
          },
        }
      );

      if (invokeError) throw invokeError;
      const uid =
        data?.uid || data?.data?.data?.id || data?.booking?.uid || (typeof data === "string" ? data : null);
      if (!uid) throw new Error(data?.error || "Voice booking failed (no uid).");

      const { data: updated, error: updateError } = await supabase
        .from("booking_proposals")
        .update({
          status: "confirmed",
          calcom_booking_id: String(uid),
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setProposals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)) as BookingProposal[]);
      return updated as BookingProposal;
    },
    []
  );

  const dropProposal = useCallback(async (id: string) => {
    const { error: updateError } = await supabase
      .from("booking_proposals")
      .update({ status: "dropped", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) throw updateError;
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
