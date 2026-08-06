import { supabase } from "@/integrations/supabase/client";

export interface VoiceConvertTarget {
  studentEmail?: string | null;
  studentName?: string | null;
  title?: string | null;
  datetime?: string | null;
  date?: string;
  amount?: number | null;
  paid?: boolean;
}

export interface VoiceConvertResult {
  clientId: string;
  appointmentId: string;
}

// Turn a voice lesson/booking into an FNH appointment. Reuses an existing
// client by email when one exists, otherwise creates a client, then inserts a
// Scheduled kinesiology appointment carrying the voice payment state.
export async function convertVoiceToAppointment(
  target: VoiceConvertTarget,
  userId: string
): Promise<VoiceConvertResult> {
  const email = (target.studentEmail || "").trim().toLowerCase();
  if (!email) throw new Error("No student email on this lesson — can't link a client.");

  const studentName = target.studentName?.trim() || target.title?.trim() || "Voice Student";

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let clientId = existing?.id ?? null;
  if (!clientId) {
    const { data: created, error: createErr } = await supabase
      .from("clients")
      .insert({ user_id: userId, name: studentName, email })
      .select("id")
      .single();
    if (createErr) throw createErr;
    clientId = created.id;
  }

  let iso: string;
  if (target.datetime && target.datetime.includes("T")) {
    iso = target.datetime;
  } else if (target.date) {
    iso = `${target.date}T12:00:00`;
  } else {
    throw new Error("Missing lesson date.");
  }

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      user_id: userId,
      client_id: clientId,
      date: iso,
      tag: "Kinesiology",
      status: "Scheduled",
      is_paid: target.paid === true,
      price_amount: target.amount && target.amount > 0 ? target.amount : null,
      price_currency: "AUD",
      name: `${studentName} — FNH Neuro-Health Assessment`,
    })
    .select("id")
    .single();
  if (apptErr) throw apptErr;

  return { clientId, appointmentId: appt.id };
}
