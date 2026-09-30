import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Pencilled bookings (`booking_proposals`) are confirmed from three places —
// the Assistant's cards, the Pending bookings panel and the Timetable — so the
// Cal.com write lives here once. Every confirm/drop fires this event so the
// other views refresh instead of offering a Confirm that would double-book.
export const PROPOSALS_CHANGED = "rk:proposals-changed";

export function notifyProposalsChanged() {
  window.dispatchEvent(new CustomEvent(PROPOSALS_CHANGED));
}

export type LessonDiscipline = "voice" | "piano";

export interface ConfirmBookingInput {
  proposalId?: string | null;
  kind: "fnh" | "voice";
  clientId?: string | null;
  name: string;
  email?: string | null;
  startISO: string;
  eventTypeId?: string | number | null;
  notes?: string | null;
  discipline?: string | null;
  /** Cal.com uid of an existing booking this pencil moves (reschedule, not a new booking). */
  rescheduleUid?: string | null;
}

export interface ConfirmBookingResult {
  uid: string;
  alreadyBooked: boolean;
  rescheduled: boolean;
}

function normDiscipline(d: unknown): LessonDiscipline | null {
  const v = String(d || "").toLowerCase().trim();
  return v === "piano" || v === "voice" ? v : null;
}

/** Books one pencilled slot in Cal.com and marks its proposal confirmed. */
export async function confirmBooking(input: ConfirmBookingInput): Promise<ConfirmBookingResult> {
  let discipline = normDiscipline(input.discipline);
  let rescheduleUid = input.rescheduleUid || null;

  // Re-read the row first: it may have been confirmed or dropped elsewhere
  // (Timetable, another tab) since this card was drawn.
  if (input.proposalId) {
    const { data: row } = await supabase
      .from("booking_proposals")
      .select("*")
      .eq("id", input.proposalId)
      .maybeSingle();
    if (row?.status === "confirmed") {
      notifyProposalsChanged();
      return { uid: String(row.calcom_booking_id || ""), alreadyBooked: true, rescheduled: false };
    }
    if (row?.status === "dropped") throw new Error(`${input.name}'s pencil for this time was dropped — nothing booked.`);
    discipline = discipline || normDiscipline((row as { discipline?: string | null } | null)?.discipline);
    // Set by supabase_booking_proposals_reschedule.sql — a pencil that moves
    // an existing booking, whichever screen it's confirmed from.
    rescheduleUid = rescheduleUid || (row as { reschedule_uid?: string | null } | null)?.reschedule_uid || null;
  }

  let uid: string | null = null;
  if (input.kind === "fnh") {
    if (!input.clientId) throw new Error("Missing client for this kinesiology booking.");
    const { data, error } = await supabase.functions.invoke("create-calcom-booking", {
      body: {
        clientId: input.clientId,
        startTime: input.startISO,
        eventTypeId: input.eventTypeId || undefined,
        title: `${input.name} - Kinesiology`,
        notes: input.notes || undefined,
        bookingUid: rescheduleUid || undefined,
      },
    });
    if (error || !data?.success) throw new Error(data?.error || error?.message || "Cal.com booking failed.");
    uid = data.uid;
    // Same as the Calendar's Reschedule: keep the session row on the new
    // Cal.com uid and time so it isn't left on the old date.
    if (rescheduleUid && uid) {
      const start = new Date(input.startISO);
      await supabase.from("appointments")
        .update({ calcom_booking_id: uid, date: start.toISOString(), time: format(start, "h:mm a") })
        .eq("calcom_booking_id", rescheduleUid);
    }
  } else {
    if (!input.name || !input.email) {
      throw new Error("Missing student details for this lesson — it has no email, so it can't be booked to Cal.com. Drop it and pencil it in again with the student's email.");
    }
    const lesson = discipline || "voice";
    const { data, error } = await supabase.functions.invoke("voice-create-booking", {
      body: {
        studentName: input.name,
        studentEmail: input.email,
        startTime: input.startISO,
        eventTypeId: input.eventTypeId || undefined,
        notes: input.notes || undefined,
        title: lesson === "piano" ? "Piano Lesson" : "Voice Lesson",
        discipline: lesson,
        bookingUid: rescheduleUid || undefined,
      },
    });
    if (error || data?.error) throw new Error(data?.error || error?.message || "Lesson booking failed.");
    uid = data?.uid || data?.data?.data?.id || data?.booking?.uid || (typeof data === "string" ? data : null);
    if (!uid) throw new Error("Lesson booking failed (no booking id came back).");
  }

  if (input.proposalId) {
    const { error } = await supabase.from("booking_proposals").update({
      status: "confirmed",
      calcom_booking_id: String(uid),
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", input.proposalId);
    if (error) throw error;
  }
  notifyProposalsChanged();
  return { uid: String(uid), alreadyBooked: false, rescheduled: !!rescheduleUid };
}

export async function dropBooking(proposalId: string) {
  const { error } = await supabase
    .from("booking_proposals")
    .update({ status: "dropped", updated_at: new Date().toISOString() })
    .eq("id", proposalId);
  if (error) throw error;
  notifyProposalsChanged();
}
