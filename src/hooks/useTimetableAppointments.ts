import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookingProposal } from "@/hooks/useBookingProposals";

export interface BookingInfo {
  id?: string;
  uid?: string;
  start?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  title?: string;
}

export interface EnrichedBooking extends BookingInfo {
  itemId: string;
  source: "fnh" | "voice";
  calcomUid: string | null;
  clientId: string | null;
  appointmentId: string | null;
  voiceBookingId: string | null;
  proposalId: string | null;
  proposalStatus: string | null;
  eventTypeId: string | null;
  confirmedAt: string | null;
}

/**
 * Enriches the raw cal.com bookings (from get-calcom-slots) with CRM linkages so
 * the timetable can treat FNH/voice sessions as real, clickable appointments.
 *
 * Each cal.com booking uid is cross-referenced against:
 *   - booking_proposals.calcom_booking_id  (confirmed proposals → kind + proposal)
 *   - appointments.calcom_booking_id        (FNH appointment row)
 *   - voice_bookings.calcom_booking_id      (voice booking row)
 *
 * The booking is the authoritative appointment; the linked rows let us cancel
 * or open the full session record.
 */
export function useTimetableAppointments(
  rawBookings: Record<string, BookingInfo[]>,
  proposals: BookingProposal[]
) {
  const [apptByUid, setApptByUid] = useState<Record<string, string | null>>({});
  const [voiceByUid, setVoiceByUid] = useState<Record<string, string | null>>({});
  const [clientByUid, setClientByUid] = useState<Record<string, string | null>>({});
  const [eventTypeByUid, setEventTypeByUid] = useState<Record<string, string | null>>({});

  // Collect all cal.com uids present in the raw bookings.
  const uids = useMemo(() => {
    const set = new Set<string>();
    Object.values(rawBookings).forEach((arr) =>
      (arr || []).forEach((b) => {
        if (b.uid) set.add(b.uid);
      })
    );
    return [...set];
  }, [rawBookings]);

  useEffect(() => {
    if (uids.length === 0) {
      setApptByUid({});
      setVoiceByUid({});
      setClientByUid({});
      setEventTypeByUid({});
      return;
    }

    let cancelled = false;

    (async () => {
      const [apptRes, voiceRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, client_id, calcom_booking_id, calcom_event_type_id")
          .in("calcom_booking_id", uids),
        supabase
          .from("voice_bookings")
          .select("id, calcom_booking_id")
          .in("calcom_booking_id", uids),
      ]);

      const apptMap: Record<string, string | null> = {};
      const clientMap: Record<string, string | null> = {};
      const evtMap: Record<string, string | null> = {};
      (apptRes.data || []).forEach((a: { calcom_booking_id?: string | null; id: string; client_id: string | null; calcom_event_type_id?: number | string | null }) => {
        if (a.calcom_booking_id) {
          apptMap[a.calcom_booking_id] = a.id;
          clientMap[a.calcom_booking_id] = a.client_id;
          evtMap[a.calcom_booking_id] = a.calcom_event_type_id != null ? String(a.calcom_event_type_id) : null;
        }
      });

      const voiceMap: Record<string, string | null> = {};
      (voiceRes.data || []).forEach((v: { calcom_booking_id?: string | null; id: string }) => {
        if (v.calcom_booking_id) voiceMap[v.calcom_booking_id] = v.id;
      });

      if (cancelled) return;
      setApptByUid(apptMap);
      setClientByUid(clientMap);
      setEventTypeByUid(evtMap);
      setVoiceByUid(voiceMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [uids]);

  // proposal lookup by calcom_booking_id
  const proposalByUid = useMemo(() => {
    const map: Record<string, BookingProposal> = {};
    proposals.forEach((p) => {
      if (p.calcom_booking_id) map[p.calcom_booking_id] = p;
    });
    return map;
  }, [proposals]);

  const bookings: EnrichedBooking[] = useMemo(() => {
    const out: EnrichedBooking[] = [];
    Object.keys(rawBookings).forEach((dateKey) => {
      (rawBookings[dateKey] || []).forEach((b, idx) => {
        const uid = b.uid || "";
        const proposal = proposalByUid[uid];
        const source: "fnh" | "voice" =
          proposal?.kind === "voice" ? "voice" : "fnh";
        out.push({
          ...b,
          itemId: `${dateKey}-${uid || idx}`,
          source,
          calcomUid: uid || null,
          clientId: clientByUid[uid] ?? (proposal?.client_id || null),
          appointmentId: apptByUid[uid] ?? null,
          voiceBookingId: voiceByUid[uid] ?? null,
          proposalId: proposal?.id || null,
          proposalStatus: proposal?.status || null,
          eventTypeId: eventTypeByUid[uid] ?? (proposal?.event_type_id || null),
          confirmedAt: proposal?.confirmed_at || null,
        });
      });
    });
    return out;
  }, [rawBookings, proposalByUid, apptByUid, voiceByUid, clientByUid, eventTypeByUid]);

  return { bookings, refetch: () => {} };
}
